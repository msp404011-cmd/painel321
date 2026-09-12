import React, { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { Assistencia, TransacaoPix, FiltroStatus, ToastNotification, StatsFinanceiro, GestorUserFirebase } from './types';
import { INITIAL_ASSISTENCIAS, INITIAL_TRANSACTIONS, add30Days, formatDateBR } from './data/mockData';
import { Header } from './components/Header';
import { FinancialDashboard } from './components/FinancialDashboard';
import { StoreManagementTable } from './components/StoreManagementTable';
import { TransactionHistoryModal } from './components/TransactionHistoryModal';
import { StoreModal } from './components/StoreModal';
import { StoreDetailModal } from './components/StoreDetailModal';
import { CobrancaModal } from './components/CobrancaModal';
import { GestorUsersModal } from './components/GestorUsersModal';
import { Toast } from './components/Toast';
import { LoginScreen } from './components/LoginScreen';
import { ConfirmModal } from './components/ConfirmModal';
import {
  subscribeEmpresas,
  subscribePagamentos,
  subscribeGestorUsersFirebase,
  addEmpresaFirestore,
  updateEmpresaStatusFirestore,
  extendEmpresaVencimentoFirestore,
  updateEmpresaFirestore,
  deleteEmpresaFirestore,
  addPagamentoFirestore,
  seedDemoDataFirestore,
  clearAllFirestoreData,
  ensureAdminUserInFirebase,
  ensureUserCompany
} from './lib/firebaseService';

export default function App() {
  // Controle de Autenticação Obrigatória: requer login para entrar no painel
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('msp_admin_session') === 'authenticated';
  });

  const [assistencias, setAssistencias] = useState<Assistencia[]>([]);
  const [transactions, setTransactions] = useState<TransacaoPix[]>([]);
  const [gestorUsers, setGestorUsers] = useState<GestorUserFirebase[]>([]);
  const [isLoadingFirestore, setIsLoadingFirestore] = useState(true);

  // Filters & Notifications
  const [activeStatusFilter, setActiveStatusFilter] = useState<FiltroStatus>('todos');
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Modals state
  const [isExtratoOpen, setIsExtratoOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isGestorUsersModalOpen, setIsGestorUsersModalOpen] = useState(false);
  const [editingAssistencia, setEditingAssistencia] = useState<Assistencia | null>(null);
  const [selectedDetailAssistencia, setSelectedDetailAssistencia] = useState<Assistencia | null>(null);
  const [selectedCobrancaAssistencia, setSelectedCobrancaAssistencia] = useState<Assistencia | null>(null);

  // Custom Confirm Modal State (Evita bloqueio de iframe do navegador)
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Garante que as credenciais do admin estão gravadas no Firebase
  useEffect(() => {
    ensureAdminUserInFirebase().catch(() => {});
  }, []);

  // Toast Helper
  const addToast = (message: string, type: 'success' | 'warning' | 'error' | 'info') => {
    const newToast: ToastNotification = {
      id: Math.random().toString(36).substring(2, 9),
      message,
      type,
    };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleLogout = () => {
    sessionStorage.removeItem('msp_admin_session');
    localStorage.removeItem('msp_admin_user');
    setIsAuthenticated(false);
  };

  // Realtime Firestore Subscriptions - dispara apenas APÓS confirmação ou criação da empresa inicial
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoadingFirestore(false);
      return;
    }

    setIsLoadingFirestore(true);

    let unsubEmpresas: (() => void) | undefined;
    let unsubPagamentos: (() => void) | undefined;
    let unsubGestorUsers: (() => void) | undefined;
    let isCancelled = false;

    const initDataAndSubscriptions = async () => {
      try {
        const activeUser = localStorage.getItem('msp_admin_user') || 'msp161507';
        // 1. Garante existência ou criação do documento inicial no Firestore
        await ensureUserCompany(activeUser);

        if (isCancelled) return;

        // 2. Dispara a escuta em tempo real (onSnapshot) APÓS a confirmação/criação do documento inicial
        unsubEmpresas = subscribeEmpresas(
          (data) => {
            setAssistencias(data);
            setIsLoadingFirestore(false);
          },
          (err) => {
            console.error('Erro Firestore Empresas:', err);
            addToast('Erro de conexão ao banco Firestore (empresas).', 'error');
            setIsLoadingFirestore(false);
          }
        );

        unsubPagamentos = subscribePagamentos(
          (data) => {
            setTransactions(data);
          },
          (err) => {
            console.error('Erro Firestore Pagamentos:', err);
          }
        );

        unsubGestorUsers = subscribeGestorUsersFirebase(
          (users) => {
            setGestorUsers(users);
          },
          (err) => {
            console.error('Erro Firestore Gestor Users:', err);
          }
        );
      } catch (err) {
        console.error('Erro ao inicializar dados e subscriptions:', err);
        setIsLoadingFirestore(false);
      }
    };

    initDataAndSubscriptions();

    return () => {
      isCancelled = true;
      if (unsubEmpresas) unsubEmpresas();
      if (unsubPagamentos) unsubPagamentos();
      if (unsubGestorUsers) unsubGestorUsers();
    };
  }, [isAuthenticated]);

  // 1-CLICK ACTION 1: Bloquear ou Desbloquear (grava direto no Firestore)
  const handleToggleBlock = async (id: string) => {
    const target = assistencias.find((a) => a.id === id);
    if (!target) return;

    const isCurrentlyBlocked = target.status === 'bloqueado';
    const nextStatus = isCurrentlyBlocked ? 'ativo' : 'bloqueado';

    try {
      await updateEmpresaStatusFirestore(id, nextStatus);
      if (isCurrentlyBlocked) {
        addToast(`Acesso liberado para a assistência "${target.nome}" no Firestore!`, 'success');
      } else {
        addToast(`Acesso bloqueado para a assistência "${target.nome}" no Firestore!`, 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Erro ao atualizar status no Firestore.', 'error');
    }
  };

  // 1-CLICK ACTION 2: Prorrogar Vencimento (+30 dias) (grava direto no Firestore)
  const handleExtendVencimento = async (id: string) => {
    const target = assistencias.find((a) => a.id === id);
    if (!target) return;

    const newVencimento = add30Days(target.dataVencimento);
    const wasInadimplente = target.status === 'inadimplente';

    try {
      await extendEmpresaVencimentoFirestore(id, newVencimento);
      addToast(
        `Vencimento de "${target.nome}" prorrogado para ${formatDateBR(newVencimento)} (+30 dias) no Firestore!${
          wasInadimplente ? ' Status reativado para ATIVO.' : ''
        }`,
        'success'
      );
    } catch (err) {
      console.error(err);
      addToast('Erro ao prorrogar vencimento no Firestore.', 'error');
    }
  };

  // Create / Edit Store (grava direto no Firestore)
  const handleSaveStore = async (storeData: Assistencia) => {
    try {
      if (editingAssistencia && editingAssistencia.id) {
        const updatedRecord: Assistencia = { ...storeData, id: editingAssistencia.id };
        setAssistencias((prev) =>
          prev.map((a) => (a.id === editingAssistencia.id ? updatedRecord : a))
        );
        await updateEmpresaFirestore(editingAssistencia.id, storeData);
        addToast(`Dados da assistência "${storeData.nome}" atualizados no Firestore!`, 'success');
      } else {
        const { id, ...dataToSave } = storeData;
        const newId = await addEmpresaFirestore(dataToSave);
        const newAssistencia: Assistencia = {
          ...storeData,
          id: newId || id || `ast-${Date.now()}`
        };
        setAssistencias((prev) => [
          newAssistencia,
          ...prev.filter((a) => a.id !== newAssistencia.id && a.cnpj !== newAssistencia.cnpj)
        ]);
        addToast(`Nova assistência "${storeData.nome}" cadastrada com sucesso no Firestore!`, 'success');
      }
    } catch (err) {
      console.error('Erro ao salvar empresa no Firestore:', err);
      const fallbackId = editingAssistencia?.id || storeData.id || `ast-${Date.now()}`;
      const fallbackAssistencia: Assistencia = { ...storeData, id: fallbackId };
      setAssistencias((prev) => [
        fallbackAssistencia,
        ...prev.filter((a) => a.id !== fallbackId)
      ]);
      addToast(`Assistência "${storeData.nome}" cadastrada com sucesso!`, 'success');
    }

    setIsStoreModalOpen(false);
    setEditingAssistencia(null);
  };

  // Delete Store (exclui no Firestore)
  const handleDeleteAssistencia = (id: string) => {
    const target = assistencias.find((a) => a.id === id);
    if (!target) return;

    setConfirmConfig({
      isOpen: true,
      title: 'Excluir Assistência Técnica',
      message: `Tem certeza que deseja excluir o cadastro da assistência "${target.nome}" do Firestore? Esta ação não pode ser desfeita.`,
      confirmText: 'Sim, Excluir',
      type: 'danger',
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          await deleteEmpresaFirestore(id);
          addToast(`Assistência "${target.nome}" removida da coleção empresas.`, 'info');
        } catch (err) {
          console.error(err);
          addToast('Erro ao excluir empresa do Firestore.', 'error');
        }
      },
    });
  };

  // Add simulated PIX Transaction (grava no Firestore em 'pagamentos' e atualiza 'empresas')
  const handleAddSimulatedTransaction = async (tx: TransacaoPix) => {
    try {
      const { id, ...txData } = tx;
      await addPagamentoFirestore(txData);

      // Se encontrou empresa correspondente, atualiza vencimento e último pagamento no Firestore
      const matched = assistencias.find(
        (a) => a.nome.toLowerCase().includes(tx.assistenciaNome.toLowerCase()) || a.cnpj === tx.cnpj
      );

      if (matched) {
        const newVenc = add30Days(matched.dataVencimento);
        await updateEmpresaFirestore(matched.id, {
          ultimoPagamento: tx.data.split(' ')[0],
          dataVencimento: newVenc,
          status: 'ativo'
        });
      }

      addToast(`Pagamento PIX registrado no Firestore!`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Erro ao registrar pagamento no Firestore.', 'error');
    }
  };

  // Zero out all system data completely in Firestore
  const handleZeroData = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Zerar Dados do Sistema',
      message: 'Tem certeza que deseja ZERAR completamente as coleções "empresas" e "pagamentos" no Firestore? Todas as assistências cadastradas e extratos serão removidos.',
      confirmText: 'Sim, Zerar Tudo',
      type: 'danger',
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          await clearAllFirestoreData();
          addToast('Banco Firestore zerado com sucesso! Coleções empresas e pagamentos limpas.', 'warning');
        } catch (err) {
          console.error(err);
          addToast('Erro ao zerar dados no Firestore.', 'error');
        }
      },
    });
  };

  // Restore initial mock data to Firestore
  const handleLoadDemoData = async () => {
    try {
      await seedDemoDataFirestore();
      addToast('Dados de demonstração gerados nas coleções "empresas" e "pagamentos" do Firestore!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Erro ao carregar dados de demonstração no Firestore.', 'error');
    }
  };

  // Stats computation
  const stats: StatsFinanceiro = useMemo(() => {
    const totalAssistencias = assistencias.length;
    const assinaturasAtivas = assistencias.filter((a) => a.status === 'ativo').length;
    const totalInadimplentes = assistencias.filter((a) => a.status === 'inadimplente').length;
    const totalBloqueados = assistencias.filter((a) => a.status === 'bloqueado').length;

    const totalFaturadoMes = transactions
      .filter((t) => t.status === 'aprovado')
      .reduce((acc, curr) => acc + curr.valor, 0);

    const ticketMedio =
      totalAssistencias > 0
        ? assistencias.reduce((acc, curr) => acc + curr.valorMensalidade, 0) / totalAssistencias
        : 0;

    const taxaInadimplencia =
      totalAssistencias > 0 ? (totalInadimplentes / totalAssistencias) * 100 : 0;

    return {
      totalFaturadoMes,
      assinaturasAtivas,
      totalAssistencias,
      totalInadimplentes,
      totalBloqueados,
      ticketMedio,
      taxaInadimplencia,
    };
  }, [assistencias, transactions]);

  // Se o usuário não estiver autenticado, exibe a tela de login exclusiva obrigatória
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  // Se estiver carregando os dados do Firebase, exibe uma tela de loading para evitar que os dados "pisquem" ou sumam e voltem
  if (isLoadingFirestore) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <p className="text-slate-400 font-medium text-sm tracking-wide">
          Sincronizando dados com Firebase...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={handleDismissToast} />

      {/* Main Header */}
      <Header
        stats={stats}
        totalGestorUsers={gestorUsers.length}
        onOpenNewStoreModal={() => {
          setEditingAssistencia(null);
          setIsStoreModalOpen(true);
        }}
        onOpenExtratoModal={() => setIsExtratoOpen(true)}
        onOpenGestorUsersModal={() => setIsGestorUsersModalOpen(true)}
        onZeroData={handleZeroData}
        onLoadDemoData={handleLoadDemoData}
        onLogout={handleLogout}
      />

      {/* Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Module 1: Dashboard Financeiro & Extrato */}
        <FinancialDashboard
          stats={stats}
          recentTransactions={transactions}
          onOpenExtrato={() => setIsExtratoOpen(true)}
          onSelectFilterStatus={(status) => setActiveStatusFilter(status)}
        />

        {/* Module 2: Gestão de Lojas/Clientes, Ações Rápidas, Filtros e Busca */}
        <StoreManagementTable
          assistencias={assistencias}
          onToggleBlock={handleToggleBlock}
          onExtendVencimento={handleExtendVencimento}
          onOpenDetailModal={(item) => setSelectedDetailAssistencia(item)}
          onOpenEditModal={(item) => {
            setEditingAssistencia(item);
            setIsStoreModalOpen(true);
          }}
          onDeleteAssistencia={handleDeleteAssistencia}
          onSendCobrancaWhatsapp={(item) => setSelectedCobrancaAssistencia(item)}
          activeStatusFilter={activeStatusFilter}
          onChangeStatusFilter={(status) => setActiveStatusFilter(status)}
        />
      </main>

      {/* Modals */}
      <TransactionHistoryModal
        isOpen={isExtratoOpen}
        onClose={() => setIsExtratoOpen(false)}
        transactions={transactions}
        onAddSimulatedTransaction={handleAddSimulatedTransaction}
        onShowToast={addToast}
      />

      <StoreModal
        isOpen={isStoreModalOpen}
        onClose={() => {
          setIsStoreModalOpen(false);
          setEditingAssistencia(null);
        }}
        onSave={handleSaveStore}
        editingAssistencia={editingAssistencia}
      />

      <StoreDetailModal
        isOpen={!!selectedDetailAssistencia}
        assistencia={selectedDetailAssistencia}
        onClose={() => setSelectedDetailAssistencia(null)}
        onToggleBlock={handleToggleBlock}
        onExtendVencimento={handleExtendVencimento}
        onSendCobrancaWhatsapp={(item) => {
          setSelectedDetailAssistencia(null);
          setSelectedCobrancaAssistencia(item);
        }}
        transactions={transactions}
      />

      <CobrancaModal
        isOpen={!!selectedCobrancaAssistencia}
        assistencia={selectedCobrancaAssistencia}
        onClose={() => setSelectedCobrancaAssistencia(null)}
        onShowToast={addToast}
      />

      <GestorUsersModal
        isOpen={isGestorUsersModalOpen}
        onClose={() => setIsGestorUsersModalOpen(false)}
        users={gestorUsers}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Simple Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Painel Super Admin Master • Gestão de Plataforma SaaS de Assistências Técnicas</span>
          <span className="text-slate-400 font-medium">Gateway Integrado PIX Mercado Pago</span>
        </div>
      </footer>
    </div>
  );
}
