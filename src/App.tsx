import React, { useState, useEffect, useMemo } from 'react';
import { Assistencia, TransacaoPix, FiltroStatus, ToastNotification, StatsFinanceiro } from './types';
import { INITIAL_ASSISTENCIAS, INITIAL_TRANSACTIONS, add30Days, formatDateBR } from './data/mockData';
import { Header } from './components/Header';
import { FinancialDashboard } from './components/FinancialDashboard';
import { StoreManagementTable } from './components/StoreManagementTable';
import { TransactionHistoryModal } from './components/TransactionHistoryModal';
import { StoreModal } from './components/StoreModal';
import { StoreDetailModal } from './components/StoreDetailModal';
import { CobrancaModal } from './components/CobrancaModal';
import { Toast } from './components/Toast';

export default function App() {
  // Persistence via localStorage
  const [assistencias, setAssistencias] = useState<Assistencia[]>(() => {
    const isZeroed = localStorage.getItem('saas_admin_zeroed');
    if (isZeroed === 'true') {
      return [];
    }
    const saved = localStorage.getItem('saas_admin_assistencias');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    // Default to empty array as user explicitly requested "zere ele total"
    return [];
  });

  const [transactions, setTransactions] = useState<TransacaoPix[]>(() => {
    const isZeroed = localStorage.getItem('saas_admin_zeroed');
    if (isZeroed === 'true') {
      return [];
    }
    const saved = localStorage.getItem('saas_admin_transactions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return [];
  });

  // Filters & Notifications
  const [activeStatusFilter, setActiveStatusFilter] = useState<FiltroStatus>('todos');
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Modals state
  const [isExtratoOpen, setIsExtratoOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [editingAssistencia, setEditingAssistencia] = useState<Assistencia | null>(null);
  const [selectedDetailAssistencia, setSelectedDetailAssistencia] = useState<Assistencia | null>(null);
  const [selectedCobrancaAssistencia, setSelectedCobrancaAssistencia] = useState<Assistencia | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('saas_admin_assistencias', JSON.stringify(assistencias));
  }, [assistencias]);

  useEffect(() => {
    localStorage.setItem('saas_admin_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Toast Helper
  const addToast = (message: string, type: 'success' | 'warning' | 'error' | 'info') => {
    const newToast: ToastNotification = {
      id: Math.random().toString(36).substring(2, 9),
      message,
      type,
    };
    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1-CLICK ACTION 1: Bloquear ou Desbloquear
  const handleToggleBlock = (id: string) => {
    setAssistencias((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const isCurrentlyBlocked = item.status === 'bloqueado';
          const nextStatus = isCurrentlyBlocked ? 'ativo' : 'bloqueado';

          if (isCurrentlyBlocked) {
            addToast(`Acesso liberado para a assistência "${item.nome}" com sucesso!`, 'success');
          } else {
            addToast(`Acesso bloqueado para a assistência "${item.nome}" com sucesso!`, 'error');
          }

          return { ...item, status: nextStatus };
        }
        return item;
      })
    );
  };

  // 1-CLICK ACTION 2: Prorrogar Vencimento (+30 dias)
  const handleExtendVencimento = (id: string) => {
    setAssistencias((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newVencimento = add30Days(item.dataVencimento);
          const wasInadimplente = item.status === 'inadimplente';
          const nextStatus = wasInadimplente ? 'ativo' : item.status;

          addToast(
            `Vencimento de "${item.nome}" prorrogado para ${formatDateBR(newVencimento)} (+30 dias)!${
              wasInadimplente ? ' Status reativado para ATIVO.' : ''
            }`,
            'success'
          );

          return {
            ...item,
            dataVencimento: newVencimento,
            status: nextStatus,
          };
        }
        return item;
      })
    );
  };

  // Create / Edit Store
  const handleSaveStore = (storeData: Assistencia) => {
    if (editingAssistencia) {
      setAssistencias((prev) =>
        prev.map((item) => (item.id === storeData.id ? storeData : item))
      );
      addToast(`Dados da assistência "${storeData.nome}" atualizados!`, 'success');
    } else {
      setAssistencias((prev) => [storeData, ...prev]);
      addToast(`Nova assistência "${storeData.nome}" cadastrada no sistema!`, 'success');
    }

    setIsStoreModalOpen(false);
    setEditingAssistencia(null);
  };

  // Delete Store
  const handleDeleteAssistencia = (id: string) => {
    const target = assistencias.find((a) => a.id === id);
    if (!target) return;

    if (window.confirm(`Tem certeza que deseja excluir o cadastro da assistência "${target.nome}"?`)) {
      setAssistencias((prev) => prev.filter((a) => a.id !== id));
      addToast(`Assistência "${target.nome}" excluída da base.`, 'info');
    }
  };

  // Add simulated PIX Transaction
  const handleAddSimulatedTransaction = (tx: TransacaoPix) => {
    setTransactions((prev) => [tx, ...prev]);

    // Check if store exists and update payment status & extend vencimento if needed
    setAssistencias((prev) =>
      prev.map((item) => {
        if (
          item.nome.toLowerCase().includes(tx.assistenciaNome.toLowerCase()) ||
          item.cnpj === tx.cnpj
        ) {
          const newVenc = add30Days(item.dataVencimento);
          return {
            ...item,
            ultimoPagamento: tx.data.split(' ')[0],
            dataVencimento: newVenc,
            status: 'ativo',
          };
        }
        return item;
      })
    );
  };

  // Zero out all system data completely
  const handleZeroData = () => {
    setAssistencias([]);
    setTransactions([]);
    localStorage.setItem('saas_admin_zeroed', 'true');
    localStorage.setItem('saas_admin_assistencias', JSON.stringify([]));
    localStorage.setItem('saas_admin_transactions', JSON.stringify([]));
    addToast('Sistema zerado com sucesso! Base limpa (0 assistências, R$ 0,00 faturado).', 'warning');
  };

  // Restore initial mock data
  const handleLoadDemoData = () => {
    setAssistencias(INITIAL_ASSISTENCIAS);
    setTransactions(INITIAL_TRANSACTIONS);
    localStorage.setItem('saas_admin_zeroed', 'false');
    localStorage.setItem('saas_admin_assistencias', JSON.stringify(INITIAL_ASSISTENCIAS));
    localStorage.setItem('saas_admin_transactions', JSON.stringify(INITIAL_TRANSACTIONS));
    addToast('Dados demonstrativos recarregados com sucesso!', 'success');
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={handleDismissToast} />

      {/* Main Header */}
      <Header
        stats={stats}
        onOpenNewStoreModal={() => {
          setEditingAssistencia(null);
          setIsStoreModalOpen(true);
        }}
        onOpenExtratoModal={() => setIsExtratoOpen(true)}
        onZeroData={handleZeroData}
        onLoadDemoData={handleLoadDemoData}
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
