import React, { useState, useMemo } from 'react';
import { Assistencia, FiltroStatus, PlanoSaaS } from '../types';
import { formatDateBR, formatCurrencyBRL, cleanCNPJ, isOverdue } from '../data/mockData';
import {
  Search,
  Filter,
  Lock,
  Unlock,
  CalendarPlus,
  MoreVertical,
  Mail,
  Phone,
  Building2,
  AlertCircle,
  CheckCircle2,
  Ban,
  Clock,
  Send,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  X,
  Sparkles,
  ExternalLink,
  Key,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StoreManagementTableProps {
  assistencias: Assistencia[];
  onToggleBlock: (id: string) => void;
  onExtendVencimento: (id: string) => void;
  onOpenDetailModal: (assistencia: Assistencia) => void;
  onOpenEditModal: (assistencia: Assistencia) => void;
  onDeleteAssistencia: (id: string) => void;
  onSendCobrancaWhatsapp: (assistencia: Assistencia) => void;
  activeStatusFilter: FiltroStatus;
  onChangeStatusFilter: (status: FiltroStatus) => void;
}

export const StoreManagementTable: React.FC<StoreManagementTableProps> = ({
  assistencias,
  onToggleBlock,
  onExtendVencimento,
  onOpenDetailModal,
  onOpenEditModal,
  onDeleteAssistencia,
  onSendCobrancaWhatsapp,
  activeStatusFilter,
  onChangeStatusFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlano, setSelectedPlano] = useState<string>('todos');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [copiedSenhaId, setCopiedSenhaId] = useState<string | null>(null);
  const [showSenhaMap, setShowSenhaMap] = useState<Record<string, boolean>>({});

  const handleCopySenha = (id: string, senhaText: string) => {
    navigator.clipboard.writeText(senhaText);
    setCopiedSenhaId(id);
    setTimeout(() => setCopiedSenhaId(null), 2000);
  };

  const toggleShowSenha = (id: string) => {
    setShowSenhaMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered logic
  const filteredAssistencias = useMemo(() => {
    return assistencias.filter((item) => {
      // Status filter
      if (activeStatusFilter === 'ativos' && item.status !== 'ativo') return false;
      if (activeStatusFilter === 'bloqueados' && item.status !== 'bloqueado') return false;
      if (activeStatusFilter === 'inadimplentes' && item.status !== 'inadimplente') return false;
      if (activeStatusFilter === 'teste' && item.status !== 'teste') return false;
      if (activeStatusFilter === 'teste_pendente' && item.status !== 'teste_pendente') return false;

      // Plan filter
      if (selectedPlano !== 'todos' && item.plano !== selectedPlano) return false;

      // Search term (Nome or CNPJ or Responsável)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const cleanQuery = cleanCNPJ(query);
        const nameMatch = item.nome.toLowerCase().includes(query);
        const respMatch = item.responsavel.toLowerCase().includes(query);
        const emailMatch = item.email.toLowerCase().includes(query);
        const cnpjMatch = cleanCNPJ(item.cnpj).includes(cleanQuery || query);

        return nameMatch || respMatch || emailMatch || cnpjMatch;
      }

      return true;
    });
  }, [assistencias, activeStatusFilter, selectedPlano, searchTerm]);

  // Counts for tabs
  const counts = useMemo(() => {
    const total = assistencias.length;
    const ativos = assistencias.filter(a => a.status === 'ativo').length;
    const bloqueados = assistencias.filter(a => a.status === 'bloqueado').length;
    const inadimplentes = assistencias.filter(a => a.status === 'inadimplente').length;
    const testes = assistencias.filter(a => a.status === 'teste' || a.status === 'teste_pendente').length;
    return { total, ativos, bloqueados, inadimplentes, testes };
  }, [assistencias]);

  // Helper to calculate days remaining or overdue
  const getVencimentoBadge = (dateString: string, status: string) => {
    if (!dateString) return null;
    const today = new Date();
    today.setHours(0,0,0,0);
    const venc = new Date(dateString);
    const diffTime = venc.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (status === 'bloqueado') {
      return (
        <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1">
          <Ban className="w-3 h-3" />
          Acesso Bloqueado
        </span>
      );
    }

    if (diffDays < 0) {
      return (
        <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Vencido há {Math.abs(diffDays)} dia(s)
        </span>
      );
    } else if (diffDays === 0) {
      return (
        <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Vence Hoje!
        </span>
      );
    } else if (diffDays <= 5) {
      return (
        <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Vence em {diffDays} dias
        </span>
      );
    } else {
      return (
        <span className="text-[11px] font-medium text-slate-400">
          Vence em {diffDays} dias
        </span>
      );
    }
  };

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
      {/* Filters Header Bar */}
      <div className="p-5 border-b border-slate-800/80 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-400" />
              Gestão de Assistências e Clientes SaaS
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Controle de acessos, vencimentos de assinaturas e ações rápidas em 1 clique
            </p>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[280px] sm:min-w-[340px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Nome da Loja ou CNPJ..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tabs and Plan Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 overflow-x-auto max-w-full">
            <button
              onClick={() => onChangeStatusFilter('todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeStatusFilter === 'todos'
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>Todos</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeStatusFilter === 'todos' ? 'bg-slate-950/30 text-slate-900 font-bold' : 'bg-slate-800 text-slate-300'
              }`}>
                {counts.total}
              </span>
            </button>

            <button
              onClick={() => onChangeStatusFilter('ativos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeStatusFilter === 'ativos'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ativos</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeStatusFilter === 'ativos' ? 'bg-slate-950/30 text-slate-900 font-bold' : 'bg-slate-800 text-emerald-400'
              }`}>
                {counts.ativos}
              </span>
            </button>

            <button
              onClick={() => onChangeStatusFilter('inadimplentes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeStatusFilter === 'inadimplentes'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Inadimplentes</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeStatusFilter === 'inadimplentes' ? 'bg-slate-950/30 text-slate-900 font-bold' : 'bg-slate-800 text-amber-400'
              }`}>
                {counts.inadimplentes}
              </span>
            </button>

            <button
              onClick={() => onChangeStatusFilter('bloqueados')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeStatusFilter === 'bloqueados'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Bloqueados</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeStatusFilter === 'bloqueados' ? 'bg-slate-950/30 text-white font-bold' : 'bg-slate-800 text-rose-400'
              }`}>
                {counts.bloqueados}
              </span>
            </button>

            <button
              onClick={() => onChangeStatusFilter('teste')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeStatusFilter === 'teste' || activeStatusFilter === 'teste_pendente'
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>Testes</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeStatusFilter === 'teste' || activeStatusFilter === 'teste_pendente' ? 'bg-slate-950/30 text-slate-900 font-bold' : 'bg-slate-800 text-sky-400'
              }`}>
                {counts.testes}
              </span>
            </button>
          </div>

          {/* Plano Dropdown Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedPlano}
              onChange={(e) => setSelectedPlano(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-sky-500"
            >
              <option value="todos">Todos os Planos</option>
              <option value="Básico">Plano Básico (R$ 149,90)</option>
              <option value="Profissional">Plano Profissional (R$ 299,90)</option>
              <option value="Enterprise">Plano Enterprise (R$ 599,90)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/60 border-b border-slate-800/80 text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
              <th className="py-3.5 px-4 sm:px-6">Assistência / CNPJ</th>
              <th className="py-3.5 px-4">E-mail & Contato</th>
              <th className="py-3.5 px-4">Plano & Valor</th>
              <th className="py-3.5 px-4">Status Acesso</th>
              <th className="py-3.5 px-4">Data Vencimento</th>
              <th className="py-3.5 px-4 text-center min-w-[210px]">
                <span className="text-sky-400 flex items-center justify-center gap-1 font-bold">
                  <Sparkles className="w-3 h-3" />
                  Ações Rápidas (1-Clique)
                </span>
              </th>
              <th className="py-3.5 px-4 text-right">Ações</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/50">
            {filteredAssistencias.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
                      <Building2 className="w-6 h-6 text-slate-400" />
                    </div>
                    {assistencias.length === 0 ? (
                      <>
                        <p className="font-bold text-slate-200 text-sm">Base de dados totalmente zerada (0 assistências)</p>
                        <p className="text-xs text-slate-400">
                          O sistema está completamente limpo. Você pode cadastrar novas assistências do zero ou recarregar os dados de demonstração.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-slate-300">Nenhuma assistência encontrada</p>
                        <p className="text-xs text-slate-500">
                          Tente alterar a busca por Nome/CNPJ ou limpar os filtros de status.
                        </p>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredAssistencias.map((item) => {
                const isBlocked = item.status === 'bloqueado';
                const isInadimplente = item.status === 'inadimplente';
                const isAtivo = item.status === 'ativo';

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    {/* Nome & CNPJ */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex flex-col">
                        <span
                          onClick={() => onOpenDetailModal(item)}
                          className="font-bold text-white group-hover:text-sky-300 transition-colors cursor-pointer text-sm flex items-center gap-1.5"
                        >
                          {item.nome}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-slate-400 font-mono text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {item.cnpj}
                          </span>
                          <span className="text-slate-500 text-[11px]">
                            • {item.responsavel}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* E-mail & Credenciais de Acesso */}
                    <td className="py-4 px-4 text-slate-300">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1 text-slate-200">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {item.email}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {item.telefone}
                        </span>

                        {/* Credenciais de Acesso Firestore */}
                        <div className="mt-1 pt-1 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[10px]">
                          <div className="flex items-center gap-1 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800">
                            <Key className="w-2.5 h-2.5 text-sky-400" />
                            <span className="text-slate-400 font-mono">
                              {showSenhaMap[item.id] ? (item.senha || '••••••') : '••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleShowSenha(item.id)}
                              className="text-slate-500 hover:text-slate-300 ml-0.5 cursor-pointer"
                              title={showSenhaMap[item.id] ? 'Ocultar senha' : 'Ver senha'}
                            >
                              {showSenhaMap[item.id] ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopySenha(item.id, item.senha || '')}
                              className="text-slate-500 hover:text-emerald-400 ml-0.5 cursor-pointer"
                              title="Copiar senha do Firestore"
                            >
                              {copiedSenhaId === item.id ? (
                                <Check className="w-2.5 h-2.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-2.5 h-2.5" />
                              )}
                            </button>
                          </div>

                          {item.loginUsuario && (
                            <span className="bg-sky-500/10 text-sky-300 px-1.5 py-0.5 rounded text-[10px] font-mono border border-sky-500/20">
                              @{item.loginUsuario}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Plano & Valor Reconhecido */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <span
                            className={`inline-self-start px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              item.plano === 'Enterprise'
                                ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                                : item.plano === 'Profissional'
                                ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                                : item.plano === 'Teste'
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {item.plano}
                          </span>
                        </div>
                        <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                          {formatCurrencyBRL(item.valorMensalidade)}
                          <span className="text-[10px] text-slate-500 font-normal">/mês</span>
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      {isAtivo && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          Ativo
                        </span>
                      )}
                      {item.status === 'teste' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/30 font-bold text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                          Teste / Trial
                        </span>
                      )}
                      {item.status === 'teste_pendente' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Teste Expirado
                        </span>
                      )}
                      {isInadimplente && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Inadimplente
                        </span>
                      )}
                      {isBlocked && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold text-[11px]">
                          <Ban className="w-3.5 h-3.5" />
                          Bloqueado
                        </span>
                      )}
                    </td>

                    {/* Vencimento */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-200">
                          {formatDateBR(item.dataVencimento)}
                        </span>
                        {getVencimentoBadge(item.dataVencimento, item.status)}
                      </div>
                    </td>

                    {/* AÇÕES RÁPIDAS 1-CLIQUE */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Botão Bloquear/Desbloquear */}
                        {isBlocked ? (
                          <button
                            onClick={() => onToggleBlock(item.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold transition-all text-xs flex items-center gap-1.5 shadow-sm active:scale-95"
                            title="Desbloquear acesso instantaneamente com 1 clique"
                          >
                            <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Desbloquear</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onToggleBlock(item.id)}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold transition-all text-xs flex items-center gap-1.5 shadow-sm active:scale-95"
                            title="Bloquear acesso instantaneamente com 1 clique"
                          >
                            <Lock className="w-3.5 h-3.5 text-rose-400" />
                            <span>Bloquear</span>
                          </button>
                        )}

                        {/* Botão Prorrogar Vencimento (+30 dias) */}
                        <button
                          onClick={() => onExtendVencimento(item.id)}
                          className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-500/40 font-bold transition-all text-xs flex items-center gap-1.5 shadow-sm active:scale-95"
                          title="Prorrogar Vencimento por mais 30 dias com 1 clique"
                        >
                          <CalendarPlus className="w-3.5 h-3.5 text-sky-400" />
                          <span>+30 dias</span>
                        </button>
                      </div>
                    </td>

                    {/* Menu Secundário */}
                    <td className="py-4 px-4 text-right relative">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onSendCobrancaWhatsapp(item)}
                          className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                          title="Cobrar via WhatsApp com Chave PIX Mercado Pago"
                        >
                          <Send className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                          {activeMenuId === item.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute right-4 top-12 z-20 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 text-left"
                            >
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onOpenDetailModal(item);
                                }}
                                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2"
                              >
                                <Eye className="w-3.5 h-3.5 text-sky-400" />
                                Ver Dossiê Completo
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onOpenEditModal(item);
                                }}
                                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2"
                              >
                                <Edit className="w-3.5 h-3.5 text-amber-400" />
                                Editar Cadastro
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onSendCobrancaWhatsapp(item);
                                }}
                                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-emerald-400 hover:bg-emerald-950/40 flex items-center gap-2"
                              >
                                <Send className="w-3.5 h-3.5" />
                                Cobrar PIX no WhatsApp
                              </button>

                              <div className="h-px bg-slate-800 my-1"></div>

                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onDeleteAssistencia(item.id);
                                }}
                                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/40 flex items-center gap-2"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Excluir Registro
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
        <span>Exibindo {filteredAssistencias.length} de {assistencias.length} assistências cadastradas</span>
        <span className="flex items-center gap-1.5 text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          Clique em "+30 dias" para renovar o vencimento e reativar clientes vencidos instantaneamente
        </span>
      </div>
    </section>
  );
};
