import React from 'react';
import { Shield, Sparkles, RefreshCw, Plus, FileText, Zap, RotateCcw, Trash2, Database, LogOut, Key, Users } from 'lucide-react';
import { StatsFinanceiro } from '../types';
import { formatCurrencyBRL } from '../data/mockData';

interface HeaderProps {
  stats: StatsFinanceiro;
  totalGestorUsers?: number;
  onOpenNewStoreModal: () => void;
  onOpenExtratoModal: () => void;
  onOpenGestorUsersModal?: () => void;
  onZeroData: () => void;
  onLoadDemoData: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  totalGestorUsers = 0,
  onOpenNewStoreModal,
  onOpenExtratoModal,
  onOpenGestorUsersModal,
  onZeroData,
  onLoadDemoData,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-500 via-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 font-bold">
              <Shield className="w-6 h-6" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Painel Super Admin Master
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                SaaS Gestão
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>Gestão de Assistências Técnicas & Mensalidades</span>
              <span className="inline-block w-1 h-1 rounded-full bg-slate-600"></span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <Database className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                Firestore Conectado
              </span>
            </p>
          </div>
        </div>

        {/* Quick Ticker & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Quick Info Pill */}
          <div className="hidden xl:flex items-center gap-3 bg-slate-950/60 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs">
            <div className="flex flex-col">
              <span className="text-slate-400">Total Faturado Mês</span>
              <span className="text-emerald-400 font-bold">{formatCurrencyBRL(stats.totalFaturadoMes)}</span>
            </div>
            <div className="h-6 w-px bg-slate-800"></div>
            <div className="flex flex-col">
              <span className="text-slate-400">Assinaturas Ativas</span>
              <span className="text-sky-400 font-bold">{stats.assinaturasAtivas} / {stats.totalAssistencias}</span>
            </div>
          </div>

          {/* Botão Usuários & Senhas do Gestor (Firebase) */}
          {onOpenGestorUsersModal && (
            <button
              onClick={onOpenGestorUsersModal}
              className="px-3.5 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-200 border border-sky-500/30 transition-all text-xs font-bold flex items-center gap-2 shadow-sm"
              title="Visualizar Usuários de Teste e Senhas Salvas no Firebase"
            >
              <Key className="w-4 h-4 text-sky-400" />
              <span>Usuários & Senhas</span>
              {totalGestorUsers > 0 && (
                <span className="bg-sky-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                  {totalGestorUsers}
                </span>
              )}
            </button>
          )}

          {/* Buttons */}
          <button
            onClick={onZeroData}
            className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 transition-all text-xs font-semibold flex items-center gap-1.5"
            title="Zerar completamente todos os dados (0 lojas, 0 faturamento)"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Zerar Tudo</span>
          </button>

          <button
            onClick={onLoadDemoData}
            className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all text-xs font-semibold flex items-center gap-1.5"
            title="Restaurar dados demonstrativos mock"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Carregar Demo</span>
          </button>

          <button
            onClick={onOpenExtratoModal}
            className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/60 transition-all text-xs font-semibold flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Extrato PIX</span>
          </button>

          <button
            onClick={onOpenNewStoreModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold transition-all shadow-lg shadow-emerald-500/20 text-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nova Assistência</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 border border-slate-700/80 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Sair do painel"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
