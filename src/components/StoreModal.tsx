import React, { useState, useEffect } from 'react';
import { Assistencia, PlanoSaaS, StatusCliente } from '../types';
import { add30Days, formatCNPJ } from '../data/mockData';
import { X, Building2, Save, Sparkles, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assistencia: Assistencia) => void;
  editingAssistencia?: Assistencia | null;
}

export const StoreModal: React.FC<StoreModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingAssistencia,
}) => {
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cidadeUf, setCidadeUf] = useState('São Paulo/SP');
  const [plano, setPlano] = useState<PlanoSaaS>('Profissional');
  const [valorMensalidade, setValorMensalidade] = useState(299.90);
  const [status, setStatus] = useState<StatusCliente>('ativo');
  const [dataVencimento, setDataVencimento] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (editingAssistencia) {
      setNome(editingAssistencia.nome);
      setCnpj(editingAssistencia.cnpj);
      setResponsavel(editingAssistencia.responsavel);
      setEmail(editingAssistencia.email);
      setTelefone(editingAssistencia.telefone);
      setCidadeUf(editingAssistencia.cidadeUf);
      setPlano(editingAssistencia.plano);
      setValorMensalidade(editingAssistencia.valorMensalidade);
      setStatus(editingAssistencia.status);
      setDataVencimento(editingAssistencia.dataVencimento);
      setObservacoes(editingAssistencia.observacoes || '');
    } else {
      // New store defaults
      setNome('');
      setCnpj('');
      setResponsavel('');
      setEmail('');
      setTelefone('');
      setCidadeUf('São Paulo/SP');
      setPlano('Profissional');
      setValorMensalidade(299.90);
      setStatus('ativo');
      setDataVencimento(add30Days(''));
      setObservacoes('');
    }
  }, [editingAssistencia, isOpen]);

  const handlePlanoChange = (newPlano: PlanoSaaS) => {
    setPlano(newPlano);
    if (newPlano === 'Básico') setValorMensalidade(149.90);
    else if (newPlano === 'Profissional') setValorMensalidade(299.90);
    else if (newPlano === 'Enterprise') setValorMensalidade(599.90);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const storeData: Assistencia = {
      id: editingAssistencia ? editingAssistencia.id : `ast-${Math.floor(100 + Math.random() * 900)}`,
      nome,
      cnpj: formatCNPJ(cnpj),
      responsavel,
      email,
      telefone,
      cidadeUf,
      plano,
      valorMensalidade: Number(valorMensalidade),
      status,
      dataVencimento: dataVencimento || add30Days(''),
      dataCadastro: editingAssistencia ? editingAssistencia.dataCadastro : new Date().toISOString().split('T')[0],
      ultimoPagamento: editingAssistencia ? editingAssistencia.ultimoPagamento : new Date().toISOString().split('T')[0],
      metodoPagamento: 'PIX Mercado Pago',
      observacoes,
    };

    onSave(storeData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {editingAssistencia ? 'Editar Assistência Técnica' : 'Cadastrar Nova Assistência'}
              </h2>
              <p className="text-xs text-slate-400">
                {editingAssistencia
                  ? 'Atualize dados cadastrais, plano e vencimento'
                  : 'Adicione uma nova loja à sua base SaaS'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nome da Loja */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome da Assistência / Empresa *
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: TechFix Celulares & Notebooks"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* CNPJ */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                CNPJ / CPF *
              </label>
              <input
                type="text"
                required
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0001-00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Responsável */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome do Responsável *
              </label>
              <input
                type="text"
                required
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Ex: Carlos Santos"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* E-mail */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                E-mail para Cobrança *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="financeiro@empresa.com.br"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Telefone / WhatsApp *
              </label>
              <input
                type="text"
                required
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Cidade / UF */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Cidade / UF
              </label>
              <input
                type="text"
                value={cidadeUf}
                onChange={(e) => setCidadeUf(e.target.value)}
                placeholder="São Paulo/SP"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Plano SaaS */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Plano SaaS
              </label>
              <select
                value={plano}
                onChange={(e) => handlePlanoChange(e.target.value as PlanoSaaS)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                <option value="Básico">Plano Básico (R$ 149,90)</option>
                <option value="Profissional">Plano Profissional (R$ 299,90)</option>
                <option value="Enterprise">Plano Enterprise (R$ 599,90)</option>
              </select>
            </div>

            {/* Valor Mensalidade */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Valor Mensalidade (R$)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={valorMensalidade}
                onChange={(e) => setValorMensalidade(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-emerald-400 font-bold focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Status Inicial do Acesso
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusCliente)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                <option value="ativo">Ativo (Acesso Liberado)</option>
                <option value="inadimplente">Inadimplente (Aviso de Vencimento)</option>
                <option value="bloqueado">Bloqueado (Acesso Interrompido)</option>
              </select>
            </div>

            {/* Data de Vencimento */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Data de Vencimento
              </label>
              <input
                type="date"
                required
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Observações */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Observações Internas (Anotações do Super Admin)
              </label>
              <textarea
                rows={2}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Anotações sobre parcelamento, contatos especiais, suporte..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>{editingAssistencia ? 'Salvar Alterações' : 'Cadastrar Loja'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
