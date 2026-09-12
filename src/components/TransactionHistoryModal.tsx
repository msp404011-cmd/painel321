import React, { useState, useMemo } from 'react';
import { TransacaoPix, StatusTransacao } from '../types';
import { formatCurrencyBRL, formatDateBR } from '../data/mockData';
import {
  X,
  FileText,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Copy,
  Check,
  Search,
  Plus,
  Download,
  Filter,
  CreditCard,
  QrCode,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: TransacaoPix[];
  onAddSimulatedTransaction: (tx: TransacaoPix) => void;
  onShowToast: (message: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  isOpen,
  onClose,
  transactions,
  onAddSimulatedTransaction,
  onShowToast,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSimulateForm, setShowSimulateForm] = useState<boolean>(false);

  // New tx form state
  const [simNome, setSimNome] = useState('');
  const [simCnpj, setSimCnpj] = useState('');
  const [simValor, setSimValor] = useState('299.90');

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (filterStatus !== 'todos' && tx.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const idMatch = tx.id.toLowerCase().includes(q);
        const nameMatch = tx.assistenciaNome.toLowerCase().includes(q);
        const cnpjMatch = tx.cnpj.includes(q);
        return idMatch || nameMatch || cnpjMatch;
      }
      return true;
    });
  }, [transactions, filterStatus, searchQuery]);

  const totalAprovado = useMemo(() => {
    return transactions
      .filter((t) => t.status === 'aprovado')
      .reduce((acc, curr) => acc + curr.valor, 0);
  }, [transactions]);

  if (!isOpen) return null;

  const handleCopyPix = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    onShowToast('Código PIX Copia e Cola copiado para a área de transferência!', 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSimulatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simNome.trim()) {
      onShowToast('Informe o nome da assistência para o PIX', 'warning');
      return;
    }

    const newTx: TransacaoPix = {
      id: `MP-PIX-${Math.floor(10000000 + Math.random() * 90000000)}`,
      assistenciaId: `ast-${Math.floor(100 + Math.random() * 900)}`,
      assistenciaNome: simNome,
      cnpj: simCnpj || '00.000.000/0001-00',
      valor: parseFloat(simValor) || 299.90,
      data: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'aprovado',
      metodo: 'PIX Mercado Pago',
      codigoPixCopyPaste: `00020126580014BR.GOV.BCB.PIX0136mp-pix-${Math.random().toString(36).substring(7)}`,
    };

    onAddSimulatedTransaction(newTx);
    onShowToast(`Pagamento PIX de ${formatCurrencyBRL(newTx.valor)} aprovado via Mercado Pago!`, 'success');
    setShowSimulateForm(false);
    setSimNome('');
  };

  const handleExportCSV = () => {
    const headers = ['ID Mercado Pago', 'Assistência', 'CNPJ', 'Valor (R$)', 'Data/Hora', 'Status', 'Método'];
    const rows = filtered.map(t => [
      t.id,
      `"${t.assistenciaNome}"`,
      t.cnpj,
      t.valor.toFixed(2),
      t.data,
      t.status,
      t.metodo
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `extrato_pix_mercadopago_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Extrato exportado em CSV com sucesso!', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Extrato Financeiro & Histórico PIX
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  Mercado Pago Gateway
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Log completo de transações e recebimentos via PIX instantâneo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Summary Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400">Total Faturado Aprovado</span>
              <p className="text-xl font-bold text-emerald-400 mt-1">
                {formatCurrencyBRL(totalAprovado)}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400">Transações no Período</span>
              <p className="text-xl font-bold text-white mt-1">
                {transactions.length} pagamentos
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400">Status Gateway</span>
              <p className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                <Zap className="w-4 h-4 fill-emerald-400" />
                PIX Webhook Ativo
              </p>
            </div>
          </div>

          {/* Action Bar & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar ID Mercado Pago ou Loja..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none"
              >
                <option value="todos">Todos Status</option>
                <option value="aprovado">Aprovado</option>
                <option value="pendente">Pendente</option>
                <option value="falhado">Falhado</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                Exportar CSV
              </button>

              <button
                onClick={() => setShowSimulateForm(!showSimulateForm)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                Simular Pagamento PIX
              </button>
            </div>
          </div>

          {/* Simulation Form */}
          {showSimulateForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSimulatePayment}
              className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4" />
                  Simular Recebimento PIX Mercado Pago Instantâneo
                </h4>
                <button
                  type="button"
                  onClick={() => setShowSimulateForm(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Nome da Assistência</label>
                  <input
                    type="text"
                    required
                    value={simNome}
                    onChange={(e) => setSimNome(e.target.value)}
                    placeholder="Ex: CelularFix Assistência"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">CNPJ (Opcional)</label>
                  <input
                    type="text"
                    value={simCnpj}
                    onChange={(e) => setSimCnpj(e.target.value)}
                    placeholder="Ex: 12.345.678/0001-90"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Valor (R$)</label>
                  <select
                    value={simValor}
                    onChange={(e) => setSimValor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                  >
                    <option value="149.90">R$ 149,90 (Plano Básico)</option>
                    <option value="299.90">R$ 299,90 (Plano Profissional)</option>
                    <option value="599.90">R$ 599,90 (Plano Enterprise)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                >
                  Confirmar Pagamento PIX
                </button>
              </div>
            </motion.form>
          )}

          {/* Transactions List Table */}
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="p-3">ID Mercado Pago</th>
                  <th className="p-3">Assistência / CNPJ</th>
                  <th className="p-3">Data e Hora</th>
                  <th className="p-3">Valor</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Ação PIX</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono text-[11px] font-semibold text-sky-400">
                      {tx.id}
                    </td>

                    <td className="p-3">
                      <p className="font-bold text-white">{tx.assistenciaNome}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{tx.cnpj}</span>
                    </td>

                    <td className="p-3 text-slate-300 font-mono text-[11px]">
                      {tx.data}
                    </td>

                    <td className="p-3 font-bold text-emerald-400 text-sm">
                      {formatCurrencyBRL(tx.valor)}
                    </td>

                    <td className="p-3">
                      {tx.status === 'aprovado' && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Aprovado
                        </span>
                      )}
                      {tx.status === 'pendente' && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-[10px] inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pendente
                        </span>
                      )}
                      {tx.status === 'falhado' && (
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold text-[10px] inline-flex items-center gap-1">
                          <AlertOctagon className="w-3 h-3" />
                          Falhou
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-right">
                      {tx.codigoPixCopyPaste ? (
                        <button
                          onClick={() => handleCopyPix(tx.codigoPixCopyPaste!, tx.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors border border-slate-700"
                        >
                          {copiedId === tx.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-sky-400" />
                              <span>Copiar PIX</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-slate-500 text-[11px]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>PIX Mercado Pago de baixa automática instantânea</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-all"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
};
