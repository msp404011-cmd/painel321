import React, { useState, useEffect } from 'react';
import { Assistencia, PlanoSaaS, StatusCliente, PlanoGestorInfo } from '../types';
import { add30Days, addDays, formatCNPJ, GESTOR_OFFICIAL_PLANS } from '../data/mockData';
import { subscribePlanosFirebase } from '../lib/firebaseService';
import { 
  X, 
  Building2, 
  Save, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Calendar, 
  FileText, 
  CreditCard,
  Zap,
  Crown,
  Layers,
  Check
} from 'lucide-react';
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
  const [plano, setPlano] = useState<PlanoSaaS>('Plano Assistência Técnica');
  const [valorMensalidade, setValorMensalidade] = useState(69.90);
  const [status, setStatus] = useState<StatusCliente>('ativo');
  const [senha, setSenha] = useState('123456');
  const [dataVencimento, setDataVencimento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [planosDisponiveis, setPlanosDisponiveis] = useState<PlanoGestorInfo[]>(GESTOR_OFFICIAL_PLANS);

  // Escuta os planos e valores reais configurados no Firestore do Gestor
  useEffect(() => {
    const unsub = subscribePlanosFirebase((planosDoGestor) => {
      if (planosDoGestor && planosDoGestor.length > 0) {
        // Filtra para remover qualquer plano de teste grátis ou com valor zerado
        const filteredPlans = planosDoGestor.filter(p => p.valor > 0 && !p.nome.toLowerCase().includes('teste') && !p.nome.toLowerCase().includes('grátis'));
        setPlanosDisponiveis(filteredPlans);
        
        // Se estiver criando nova loja e ainda não tem plano definido ou se o plano atual coincidir
        if (!editingAssistencia) {
          const match = filteredPlans.find(p => p.nome.toLowerCase() === String(plano).toLowerCase());
          if (match) {
            setValorMensalidade(match.valor);
          } else if (filteredPlans.length > 0) {
            setPlano(filteredPlans[0].nome as PlanoSaaS);
            setValorMensalidade(filteredPlans[0].valor);
          }
        }
      }
    });

    return () => unsub();
  }, [editingAssistencia]);

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
      setSenha(editingAssistencia.senha || '123456');
      setDataVencimento(editingAssistencia.dataVencimento);
      setObservacoes(editingAssistencia.observacoes || '');
    } else {
      // Padrões para nova assistência
      setNome('');
      setCnpj('');
      setResponsavel('');
      setEmail('');
      setTelefone('');
      setCidadeUf('São Paulo/SP');
      setPlano('Plano Assistência Técnica');
      setValorMensalidade(69.90);
      setStatus('ativo');
      setSenha('123456');
      setDataVencimento(add30Days(''));
      setObservacoes('');
    }
  }, [editingAssistencia, isOpen]);

  const handlePlanoSelect = (p: PlanoGestorInfo) => {
    setPlano(p.nome as PlanoSaaS);
    setValorMensalidade(p.valor);

    if (!editingAssistencia) {
      setStatus('ativo');
      setDataVencimento(add30Days(''));
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !responsavel.trim() || !email.trim()) return;

    setIsSaving(true);
    const storeData: Assistencia = {
      id: editingAssistencia ? editingAssistencia.id : `ast_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`,
      nome: nome.trim(),
      cnpj: cnpj ? formatCNPJ(cnpj) : '00.000.000/0001-00',
      responsavel: responsavel.trim(),
      email: email.trim(),
      telefone: telefone.trim() || '(11) 99999-9999',
      cidadeUf: cidadeUf.trim() || 'São Paulo/SP',
      plano,
      valorMensalidade: Number(valorMensalidade),
      status,
      senha: senha.trim() || '123456',
      dataVencimento: dataVencimento || add30Days(''),
      dataCadastro: editingAssistencia ? editingAssistencia.dataCadastro : new Date().toISOString().split('T')[0],
      ultimoPagamento: editingAssistencia ? editingAssistencia.ultimoPagamento : new Date().toISOString().split('T')[0],
      metodoPagamento: 'PIX Mercado Pago',
      observacoes: observacoes.trim(),
    };

    try {
      await onSave(storeData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#08131f] border border-[#142e42] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-5 bg-[#050c14] border-b border-[#142838] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">
                  {editingAssistencia ? 'Editar Assistência Técnica' : 'Cadastrar Nova Assistência'}
                </h2>
                {!editingAssistencia && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    <Sparkles className="w-3 h-3" /> 7 Dias Grátis
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {editingAssistencia
                  ? 'Atualize dados cadastrais, plano e vencimento'
                  : 'Preencha os dados da loja para provisionar no Firestore'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* Nome da Loja */}
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1.5">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Nome da Loja / Assistência: *</span>
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: TechCell Celulares & Informática"
                className="w-full bg-[#050c14] border border-[#142838] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none"
              />
            </div>

            {/* Responsável */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1.5">
                <User className="w-4 h-4 text-emerald-400" />
                <span>Seu Nome (Responsável): *</span>
              </label>
              <input
                type="text"
                required
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Ex: Carlos Silva"
                className="w-full bg-[#050c14] border border-[#142838] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none"
              />
            </div>

            {/* CNPJ / CPF */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1.5">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>CNPJ / CPF:</span>
              </label>
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0001-00"
                className="w-full bg-[#050c14] border border-[#142838] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none"
              />
            </div>

            {/* E-mail */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1.5">
                <Mail className="w-4 h-4 text-emerald-400" />
                <span>E-mail: *</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@loja.com"
                className="w-full bg-[#050c14] border border-[#142838] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none"
              />
            </div>

            {/* Telefone / WhatsApp */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1.5">
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp / Telefone: *</span>
              </label>
              <input
                type="text"
                required
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full bg-[#050c14] border border-[#142838] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none"
              />
            </div>

            {/* Cidade / UF */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Cidade / UF:
              </label>
              <input
                type="text"
                value={cidadeUf}
                onChange={(e) => setCidadeUf(e.target.value)}
                placeholder="São Paulo/SP"
                className="w-full bg-[#050c14] border border-[#142838] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>

            {/* Senha de Acesso */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1.5">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Senha do Cliente:</span>
              </label>
              <input
                type="text"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Ex: 123456"
                className="w-full bg-[#050c14] border border-[#142838] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none font-mono"
              />
            </div>

            {/* SELEÇÃO DO PLANO OFICIAL COM OS VALORES E ESTRUTURA DO GESTOR */}
            <div className="sm:col-span-2 pt-2">
              <div className="flex items-center justify-between mb-2.5">
                <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-400">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Escolha o Plano do Gestor:</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    {valorMensalidade === 0 ? 'Grátis (7 Dias)' : `${valorMensalidade.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês`}
                  </span>
                </div>
              </div>

              {/* 4 Cards de Planos Oficiais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {planosDisponiveis.map((p) => {
                  const isSelected = String(plano).toLowerCase() === p.nome.toLowerCase() || String(plano).toLowerCase() === p.id.toLowerCase();
                  
                  const isTrial = p.valor === 0 || p.nome.toLowerCase().includes('teste') || p.nome.toLowerCase().includes('grátis');
                  const isPdv = p.nome.toLowerCase().includes('pdv');
                  const isAssistencia = p.nome.toLowerCase().includes('assistência') || p.nome.toLowerCase().includes('assistencia');
                  const isRevenda = p.nome.toLowerCase().includes('revenda');

                  const borderColor = isSelected 
                    ? (isTrial ? 'border-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.3)]' : isPdv ? 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]' : isAssistencia ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]')
                    : 'border-[#142838] hover:border-slate-700';

                  const badgeBg = isTrial ? 'bg-sky-500/20 text-sky-400 border-sky-500/30' : isPdv ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : isAssistencia ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-purple-500/20 text-purple-300 border-purple-500/30';

                  return (
                    <button
                      key={p.id || p.nome}
                      type="button"
                      onClick={() => handlePlanoSelect(p)}
                      className={`p-3.5 rounded-2xl text-left border transition-all relative flex flex-col justify-between cursor-pointer ${borderColor} ${
                        isSelected
                          ? 'bg-gradient-to-b from-[#0b2432] to-[#061821] ring-1 ring-emerald-400/50'
                          : 'bg-[#050c14] opacity-85 hover:opacity-100'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${badgeBg}`}>
                            {p.badge || (isTrial ? '7 DIAS GRÁTIS' : isAssistencia ? '⭐ RECOMENDADO' : p.nome)}
                          </span>
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-700" />
                          )}
                        </div>

                        <h4 className="text-xs sm:text-sm font-black text-white mb-0.5">
                          {p.nome}
                        </h4>
                        <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                          {p.subtitulo || p.descricao}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-baseline justify-between">
                        <div>
                          <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                            {p.valor === 0 ? 'R$ 0' : p.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1">
                            {p.valor === 0 ? '/ 7 dias' : '/mês'}
                          </span>
                        </div>
                        {isTrial && (
                          <span className="text-[10px] text-sky-400 font-semibold">
                            100% Liberado
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status do Acesso */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Status do Acesso:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusCliente)}
                className="w-full bg-[#050c14] border border-[#142838] focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
              >
                <option value="ativo">Ativo (Acesso Liberado)</option>
                <option value="teste">Teste / Trial (7 Dias Grátis)</option>
                <option value="teste_pendente">Teste Pendente (Expirado)</option>
                <option value="inadimplente">Inadimplente (Aviso de Vencimento)</option>
                <option value="bloqueado">Bloqueado (Acesso Interrompido)</option>
              </select>
            </div>

            {/* Data de Vencimento */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Data de Vencimento:</span>
              </label>
              <input
                type="date"
                required
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                className="w-full bg-[#050c14] border border-[#142838] focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
              />
            </div>

            {/* Observações */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Observações Internas (Super Admin):
              </label>
              <textarea
                rows={2}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Anotações sobre parcelamento, contatos especiais, suporte..."
                className="w-full bg-[#050c14] border border-[#142838] focus:border-emerald-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#142838] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4 stroke-[2.5]" />
              )}
              <span>
                {isSaving 
                  ? 'Gravando no Firestore...' 
                  : (editingAssistencia ? 'Salvar Alterações' : 'Cadastrar Assistência')}
              </span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
