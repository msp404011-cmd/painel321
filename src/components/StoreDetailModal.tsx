import React from 'react';
import { Assistencia, TransacaoPix } from '../types';
import { formatDateBR, formatCurrencyBRL } from '../data/mockData';
import {
  X,
  Building2,
  Lock,
  Unlock,
  CalendarPlus,
  Send,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  History,
  ShieldCheck,
  AlertCircle,
  Ban,
  Clock,
  Sparkles,
  MapPin,
  UserCheck
} from 'lucide-react';
import { motion } from 'motion/react';

interface StoreDetailModalProps {
  assistencia: Assistencia | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleBlock: (id: string) => void;
  onExtendVencimento: (id: string) => void;
  onSendCobrancaWhatsapp: (assistencia: Assistencia) => void;
  transactions: TransacaoPix[];
}

export const StoreDetailModal: React.FC<StoreDetailModalProps> = ({
  assistencia,
  isOpen,
  onClose,
  onToggleBlock,
  onExtendVencimento,
  onSendCobrancaWhatsapp,
  transactions,
}) => {
  if (!isOpen || !assistencia) return null;

  const isBlocked = assistencia.status === 'bloqueado';
  const isInadimplente = assistencia.status === 'inadimplente';
  const isAtivo = assistencia.status === 'ativo';

  // Transactions related to this store
  const storeTransactions = transactions.filter(
    (t) => t.assistenciaId === assistencia.id || t.cnpj === assistencia.cnpj
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 bg-slate-950/90 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {assistencia.nome}
                </h2>
                {isAtivo && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Ativo
                  </span>
                )}
                {assistencia.status === 'teste' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                    Teste / Trial
                  </span>
                )}
                {assistencia.status === 'teste_pendente' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Teste Expirado
                  </span>
                )}
                {isInadimplente && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Inadimplente
                  </span>
                )}
                {isBlocked && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1">
                    <Ban className="w-3.5 h-3.5" />
                    Bloqueado
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                CNPJ: {assistencia.cnpj} • ID: {assistencia.id}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors self-start sm:self-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Actions Header Bar */}
        <div className="bg-slate-950/60 p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Ações Rápidas de Controle:
          </span>

          <div className="flex items-center gap-2">
            {isBlocked ? (
              <button
                onClick={() => onToggleBlock(assistencia.id)}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Unlock className="w-4 h-4 text-emerald-400" />
                Desbloquear Acesso (1-Clique)
              </button>
            ) : (
              <button
                onClick={() => onToggleBlock(assistencia.id)}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Lock className="w-4 h-4 text-rose-400" />
                Bloquear Acesso (1-Clique)
              </button>
            )}

            <button
              onClick={() => onExtendVencimento(assistencia.id)}
              className="px-3.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <CalendarPlus className="w-4 h-4 text-sky-400" />
              Prorrogar Vencimento (+30 dias)
            </button>

            <button
              onClick={() => onSendCobrancaWhatsapp(assistencia)}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <Send className="w-4 h-4" />
              Cobrar no WhatsApp
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box 1: Cadastrais */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <UserCheck className="w-4 h-4 text-sky-400" />
                Dados do Responsável e Contato
              </h3>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Responsável Principal</span>
                  <span className="font-semibold text-slate-200">{assistencia.responsavel}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">E-mail Cadastrado</span>
                  <span className="font-semibold text-slate-200">{assistencia.email}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Telefone / WhatsApp</span>
                  <span className="font-semibold text-slate-200">{assistencia.telefone}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Senha de Acesso do Cliente</span>
                  <span className="font-mono font-bold text-sky-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {assistencia.senha || '123456'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Localização</span>
                  <span className="font-semibold text-slate-200">{assistencia.cidadeUf}</span>
                </div>
              </div>
            </div>

            {/* Box 2: Assinatura & Financeiro */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Plano & Vencimento SaaS
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Plano Contratado</span>
                  <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 font-bold border border-sky-500/20">
                    {assistencia.plano}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Valor Mensalidade</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    {formatCurrencyBRL(assistencia.valorMensalidade)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Data de Vencimento Atual</span>
                  <span className="font-bold text-white text-xs bg-slate-900 px-2 py-1 rounded border border-slate-700">
                    {formatDateBR(assistencia.dataVencimento)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Último Pagamento Confirmado</span>
                  <span className="text-slate-300">{formatDateBR(assistencia.ultimoPagamento)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Método de Cobrança</span>
                  <span className="text-slate-300 font-semibold">{assistencia.metodoPagamento}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Observações Internas */}
          {assistencia.observacoes && (
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Observações Internas do Admin
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {assistencia.observacoes}
              </p>
            </div>
          )}

          {/* Payments History for this Store */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <History className="w-4 h-4 text-sky-400" />
              Histórico de Pagamentos PIX Mercado Pago ({storeTransactions.length})
            </h3>

            {storeTransactions.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-500">
                Nenhum pagamento registrado especificamente para este CNPJ no período.
              </div>
            ) : (
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-semibold">
                    <tr>
                      <th className="p-2.5">ID Mercado Pago</th>
                      <th className="p-2.5">Data/Hora</th>
                      <th className="p-2.5">Valor</th>
                      <th className="p-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {storeTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/40">
                        <td className="p-2.5 font-mono text-sky-400">{tx.id}</td>
                        <td className="p-2.5 text-slate-300">{tx.data}</td>
                        <td className="p-2.5 font-bold text-emerald-400">{formatCurrencyBRL(tx.valor)}</td>
                        <td className="p-2.5 text-right">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[10px]">
                            {tx.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
          >
            Fechar Dossiê
          </button>
        </div>
      </motion.div>
    </div>
  );
};
