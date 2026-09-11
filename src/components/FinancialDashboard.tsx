import React from 'react';
import { StatsFinanceiro, TransacaoPix } from '../types';
import { formatCurrencyBRL, formatDateBR } from '../data/mockData';
import { DollarSign, ShieldCheck, AlertTriangle, TrendingUp, CreditCard, ArrowUpRight, ArrowDownRight, Layers, CheckCircle2, Clock, Ban } from 'lucide-react';
import { motion } from 'motion/react';

interface FinancialDashboardProps {
  stats: StatsFinanceiro;
  recentTransactions: TransacaoPix[];
  onOpenExtrato: () => void;
  onSelectFilterStatus: (status: 'todos' | 'ativos' | 'bloqueados' | 'inadimplentes') => void;
}

export const FinancialDashboard: React.FC<FinancialDashboardProps> = ({
  stats,
  recentTransactions,
  onOpenExtrato,
  onSelectFilterStatus,
}) => {
  const approvedTransactions = recentTransactions.filter(t => t.status === 'aprovado');

  return (
    <section className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faturamento PIX Mercado Pago */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 shadow-xl shadow-emerald-950/20 group hover:border-emerald-500/50 transition-all"
        >
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Faturado no Mês (PIX MP)
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {formatCurrencyBRL(stats.totalFaturadoMes)}
            </h2>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                <ArrowUpRight className="w-3.5 h-3.5" />
                +18.4%
              </span>
              <span className="text-slate-400">vs. mês anterior via Mercado Pago</span>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Assinaturas Ativas */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          onClick={() => onSelectFilterStatus('ativos')}
          className="cursor-pointer relative overflow-hidden bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl group hover:border-sky-500/40 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Assinaturas Ativas
            </span>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {stats.assinaturasAtivas}
              </h2>
              <span className="text-slate-400 text-sm font-medium">
                de {stats.totalAssistencias} assistências
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-sky-400 font-semibold">
                {((stats.assinaturasAtivas / Math.max(stats.totalAssistencias, 1)) * 100).toFixed(0)}% da base
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">Em dia com acesso liberado</span>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Inadimplentes / Risco */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          onClick={() => onSelectFilterStatus('inadimplentes')}
          className="cursor-pointer relative overflow-hidden bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl group hover:border-amber-500/40 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Inadimplentes
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-400 tracking-tight">
                {stats.totalInadimplentes}
              </h2>
              <span className="text-slate-400 text-sm font-medium">
                ({stats.taxaInadimplencia.toFixed(1)}% taxa)
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
              <span className="text-amber-400 font-semibold">Requer Ação:</span>
              <span>Aguardando renovação PIX</span>
            </div>
          </div>
        </motion.div>

        {/* Card 4: Ticket Médio Mensal */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="relative overflow-hidden bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl group hover:border-purple-500/40 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Ticket Médio / Mês
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {formatCurrencyBRL(stats.ticketMedio)}
            </h2>
            <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
              <span className="text-purple-400 font-semibold">{stats.totalBloqueados} Bloqueados</span>
              <span className="text-slate-500">•</span>
              <span>Planos Básico / Prof / Ent</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Visual Analytics & Recent PIX Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Base Distribution Bar */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                Saúde da Base de Assinantes SaaS
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Distribuição das assistências cadastradas por status e recebimentos PIX
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 font-semibold border border-sky-500/20">
              Total: {stats.totalAssistencias} Lojas
            </span>
          </div>

          {/* Progress Distribution */}
          <div className="my-6 space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ativos com Acesso ({stats.assinaturasAtivas})
                </span>
                <span className="text-slate-300">
                  {((stats.assinaturasAtivas / Math.max(stats.totalAssistencias, 1)) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.assinaturasAtivas / Math.max(stats.totalAssistencias, 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-amber-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Inadimplentes - Vencidos ({stats.totalInadimplentes})
                </span>
                <span className="text-slate-300">
                  {((stats.totalInadimplentes / Math.max(stats.totalAssistencias, 1)) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.totalInadimplentes / Math.max(stats.totalAssistencias, 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-rose-400 flex items-center gap-1.5">
                  <Ban className="w-3.5 h-3.5" />
                  Bloqueados sem Acesso ({stats.totalBloqueados})
                </span>
                <span className="text-slate-300">
                  {((stats.totalBloqueados / Math.max(stats.totalAssistencias, 1)) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.totalBloqueados / Math.max(stats.totalAssistencias, 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <span>Mercado Pago Webhook: Recebimento Instantâneo via QR Code e Chave PIX</span>
            <button
              onClick={() => onSelectFilterStatus('inadimplentes')}
              className="text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-4"
            >
              Ver {stats.totalInadimplentes} Inadimplentes →
            </button>
          </div>
        </div>

        {/* Recent Mercado Pago PIX Transactions Widget */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Últimos Pagamentos PIX
              </h3>
              <button
                onClick={onOpenExtrato}
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold"
              >
                Ver Extrato
              </button>
            </div>

            <div className="mt-3 divide-y divide-slate-800/50">
              {recentTransactions.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs">
                  Nenhum pagamento PIX registrado.
                </div>
              ) : (
                recentTransactions.slice(0, 4).map((tx) => (
                  <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-200 truncate max-w-[170px]">
                        {tx.assistenciaNome}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {tx.id} • {formatDateBR(tx.data)}
                      </span>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-emerald-400">
                        +{formatCurrencyBRL(tx.valor)}
                      </p>
                      <span
                        className={`inline-block text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          tx.status === 'aprovado'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : tx.status === 'pendente'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {tx.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-center">
            <span className="text-[11px] text-slate-500">
              Transações processadas via Gateway PIX Mercado Pago
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
