import React, { useState } from 'react';
import { Assistencia } from '../types';
import { formatCurrencyBRL, formatDateBR } from '../data/mockData';
import { X, Send, Copy, Check, QrCode, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

interface CobrancaModalProps {
  assistencia: Assistencia | null;
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (message: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export const CobrancaModal: React.FC<CobrancaModalProps> = ({
  assistencia,
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  if (!isOpen || !assistencia) return null;

  const pixKeyMock = `00020126580014BR.GOV.BCB.PIX0136mp-pix-cobranca-${assistencia.id}-5204000053039865802BR5915MERCADO PAGO SA6009SAO PAULO62070503***6304`;

  const cobrancaText = `Olá, *${assistencia.responsavel}* (${assistencia.nome})! tudo bem?

Aqui é da equipe de suporte do *SaaS Gestão de Assistências*.

Passando para lembrar que a mensalidade do seu plano *${assistencia.plano}* vence em *${formatDateBR(assistencia.dataVencimento)}*.

📌 *Dados para Pagamento via PIX Mercado Pago:*
• Valor: *${formatCurrencyBRL(assistencia.valorMensalidade)}*
• Chave PIX / Código Copia e Cola:
\`${pixKeyMock}\`

Ao efetuar o pagamento pelo aplicativo do seu banco, a baixa é realizada instantaneamente no sistema e seu acesso permanece 100% liberado sem interrupções!

Qualquer dúvida estamos à disposição!`;

  const handleCopyText = () => {
    navigator.clipboard.writeText(cobrancaText);
    setCopiedMsg(true);
    onShowToast('Mensagem de cobrança copiada com sucesso!', 'success');
    setTimeout(() => setCopiedMsg(false), 2500);
  };

  const handleCopyPixOnly = () => {
    navigator.clipboard.writeText(pixKeyMock);
    setCopiedPix(true);
    onShowToast('Código PIX Copia e Cola copiado!', 'success');
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleOpenWhatsapp = () => {
    const rawDigits = assistencia.telefone.replace(/\D/g, '');
    const phoneWithCountry = rawDigits.startsWith('55') ? rawDigits : `55${rawDigits}`;
    const encodedText = encodeURIComponent(cobrancaText);
    const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
    onShowToast(`Abre conversa no WhatsApp com ${assistencia.responsavel}...`, 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Enviar Lembrete de Cobrança PIX
              </h2>
              <p className="text-xs text-slate-400">
                {assistencia.nome} • {assistencia.telefone}
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

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
            <span>Valor da Cobrança: <strong className="text-white text-sm ml-1">{formatCurrencyBRL(assistencia.valorMensalidade)}</strong></span>
            <span>Vencimento: <strong className="text-white ml-1">{formatDateBR(assistencia.dataVencimento)}</strong></span>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Prévia da Mensagem (Editável antes de enviar)
              </label>
              <button
                onClick={handleCopyText}
                className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
              >
                {copiedMsg ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedMsg ? 'Copiado!' : 'Copiar Texto'}
              </button>
            </div>

            <textarea
              rows={9}
              readOnly
              value={cobrancaText}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none"
            />
          </div>

          {/* Quick PIX Copy paste box */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate pr-2">
              <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-mono text-slate-400 truncate text-[11px]">{pixKeyMock}</span>
            </div>

            <button
              onClick={handleCopyPixOnly}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shrink-0"
            >
              {copiedPix ? 'Copiado' : 'Copiar PIX'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
          >
            Cancelar
          </button>

          <button
            onClick={handleOpenWhatsapp}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Abrir no WhatsApp</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
