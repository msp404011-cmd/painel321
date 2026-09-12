import React, { useState, useEffect } from 'react';
import { GestorUserFirebase, StatusCliente, PlanoGestorInfo } from '../types';
import { formatCurrencyBRL, formatDateBR } from '../data/mockData';
import { 
  X, 
  Users, 
  Key, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Sparkles, 
  Plus, 
  Trash2, 
  UserCheck, 
  Building2, 
  DollarSign, 
  Search,
  Filter,
  RefreshCw,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createOrUpdateGestorUserFirebase, deleteGestorUserFirebase, subscribePlanosFirebase } from '../lib/firebaseService';

interface GestorUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: GestorUserFirebase[];
  onSelectUserForLogin?: (user: GestorUserFirebase) => void;
}

export const GestorUsersModal: React.FC<GestorUsersModalProps> = ({
  isOpen,
  onClose,
  users,
  onSelectUserForLogin
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [filterType, setFilterType] = useState<'todos' | 'teste' | 'gestor' | 'admin'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para criação de novo usuário de teste/gestor
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUsuario, setNewUsuario] = useState('');
  const [newSenha, setNewSenha] = useState('');
  const [newNome, setNewNome] = useState('');
  const [newEmpresa, setNewEmpresa] = useState('');
  const [newPlano, setNewPlano] = useState('Profissional');
  const [newValor, setNewValor] = useState<number>(0);
  const [newTipo, setNewTipo] = useState<GestorUserFirebase['tipo']>('teste');
  const [newStatus, setNewStatus] = useState<StatusCliente>('teste');
  const [isSaving, setIsSaving] = useState(false);
  const [planosDisponiveis, setPlanosDisponiveis] = useState<PlanoGestorInfo[]>([]);

  // Escuta os planos configurados no Firestore
  useEffect(() => {
    const unsub = subscribePlanosFirebase((planosDoGestor) => {
      if (planosDoGestor && planosDoGestor.length > 0) {
        setPlanosDisponiveis(planosDoGestor);
        const match = planosDoGestor.find(p => p.nome.toLowerCase() === newPlano.toLowerCase());
        if (match) {
          setNewValor(match.valor);
        } else {
          setNewPlano(planosDoGestor[0].nome);
          setNewValor(planosDoGestor[0].valor);
        }
      }
    });

    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsuario || !newSenha) return;
    setIsSaving(true);
    try {
      await createOrUpdateGestorUserFirebase({
        usuario: newUsuario,
        senha: newSenha,
        nome: newNome || newUsuario,
        empresa: newEmpresa || `Empresa ${newUsuario}`,
        plano: newPlano,
        valorMensalidade: Number(newValor),
        tipo: newTipo,
        status: newStatus,
        email: `${newUsuario}@empresa.com`,
        dataCadastro: new Date().toISOString().split('T')[0]
      });

      setShowAddForm(false);
      setNewUsuario('');
      setNewSenha('');
      setNewNome('');
      setNewEmpresa('');
      setNewValor(299.90);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (usuario: string) => {
    if (usuario === 'msp161507') {
      alert('O usuário Super Admin principal não pode ser excluído.');
      return;
    }
    if (confirm(`Deseja realmente remover o usuário "${usuario}" do Firestore?`)) {
      await deleteGestorUserFirebase(usuario);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'teste') return u.tipo === 'teste' || u.status === 'teste' || u.status === 'teste_pendente';
    if (filterType === 'gestor') return u.tipo === 'gestor' || u.tipo === 'cliente';
    if (filterType === 'admin') return u.tipo === 'admin' || u.tipo === 'superadmin';

    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Usuários & Senhas Salvas no Firebase
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {users.length} Registros
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Credenciais reais gravadas nas coleções do Firestore com planos e valores do banco
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Usuário</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3 sm:p-4 bg-slate-950/50 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por login, nome ou empresa..."
              className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-slate-500 hover:text-slate-300">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setFilterType('todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'todos'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Todos ({users.length})
            </button>
            <button
              onClick={() => setFilterType('teste')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                filterType === 'teste'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Usuários de Teste ({users.filter(u => u.tipo === 'teste' || u.status === 'teste').length})
            </button>
            <button
              onClick={() => setFilterType('gestor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'gestor'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-sky-300 hover:bg-slate-800/50'
              }`}
            >
              Gestores ({users.filter(u => u.tipo === 'gestor' || u.tipo === 'cliente').length})
            </button>
            <button
              onClick={() => setFilterType('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'admin'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-slate-400 hover:text-purple-300 hover:bg-slate-800/50'
              }`}
            >
              Admins ({users.filter(u => u.tipo === 'admin' || u.tipo === 'superadmin').length})
            </button>
          </div>
        </div>

        {/* Form para adicionar novo usuário (Colapsável) */}
        <AnimatePresence>
          {showAddForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreateUser}
              className="p-4 bg-slate-950/80 border-b border-sky-500/30 grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Usuário / Login *
                </label>
                <input
                  type="text"
                  required
                  value={newUsuario}
                  onChange={(e) => setNewUsuario(e.target.value)}
                  placeholder="Ex: gestor.loja"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Senha de Acesso *
                </label>
                <input
                  type="text"
                  required
                  value={newSenha}
                  onChange={(e) => setNewSenha(e.target.value)}
                  placeholder="Ex: senha123"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Tipo de Conta
                </label>
                <select
                  value={newTipo}
                  onChange={(e) => {
                    const val = e.target.value as GestorUserFirebase['tipo'];
                    setNewTipo(val);
                    if (val === 'teste') {
                      setNewStatus('teste');
                      setNewValor(0);
                    } else {
                      setNewStatus('ativo');
                      setNewValor(299.90);
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="teste">Usuário de Teste / Trial (R$ 0,00)</option>
                  <option value="gestor">Gestor de Loja (Padrão)</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Nome do Responsável
                </label>
                <input
                  type="text"
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                  placeholder="Ex: Marcos Souza"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Nome da Empresa
                </label>
                <input
                  type="text"
                  value={newEmpresa}
                  onChange={(e) => setNewEmpresa(e.target.value)}
                  placeholder="Ex: SmartFix Celulares"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Plano & Valor da Mensalidade
                </label>
                <select
                  value={newPlano}
                  onChange={(e) => {
                    const pl = e.target.value;
                    setNewPlano(pl);
                    const match = planosDisponiveis.find(p => p.nome.toLowerCase() === pl.toLowerCase() || p.id.toLowerCase() === pl.toLowerCase());
                    if (match) {
                      setNewValor(match.valor);
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  {planosDisponiveis.map((p) => (
                    <option key={p.id || p.nome} value={p.nome}>
                      Plano {p.nome} - {p.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Valor da Mensalidade (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newValor}
                  onChange={(e) => setNewValor(parseFloat(e.target.value) || 0)}
                  placeholder="299.90"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-emerald-400 font-bold focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Gravar no Firestore</span>
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Users List Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Users className="w-8 h-8 text-slate-600" />
              <p className="text-sm font-semibold">Nenhum usuário encontrado</p>
              <p className="text-xs text-slate-500">Tente ajustar o termo de pesquisa ou o filtro de categoria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredUsers.map((u) => {
                const isPassVisible = showPasswords[u.id] || false;
                const isSuperAdmin = u.tipo === 'superadmin';
                const isTeste = u.tipo === 'teste' || u.status === 'teste';

                return (
                  <div
                    key={`${u.origem}_${u.id}`}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isSuperAdmin
                        ? 'bg-purple-950/20 border-purple-500/40 hover:border-purple-500/60'
                        : isTeste
                        ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/60'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Top Row: User Type & Status Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        {isSuperAdmin && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            SUPER ADMIN MASTER
                          </span>
                        )}
                        {isTeste && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            CONTA DE TESTE / TRIAL
                          </span>
                        )}
                        {!isSuperAdmin && !isTeste && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            GESTOR ASSISTÊNCIA
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {u.origem}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {u.status === 'ativo' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                            Ativo
                          </span>
                        )}
                        {u.status === 'teste' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400">
                            Degustação
                          </span>
                        )}
                        {u.status === 'bloqueado' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400">
                            Bloqueado
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Nome & Empresa */}
                    <div className="mb-3">
                      <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                        {u.nome}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-500" />
                        {u.empresa}
                      </p>
                    </div>

                    {/* Credenciais Box (Usuário e Senha) */}
                    <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 space-y-2 mb-3">
                      {/* Usuário Login */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">Usuário:</span>
                        <div className="flex items-center gap-1.5">
                          <code className="font-mono font-bold text-sky-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {u.usuario}
                          </code>
                          <button
                            onClick={() => handleCopy(u.usuario, `user_${u.id}`)}
                            title="Copiar Usuário"
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          >
                            {copiedKey === `user_${u.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Senha */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">Senha Firestore:</span>
                        <div className="flex items-center gap-1.5">
                          <code className="font-mono font-bold text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 tracking-wider">
                            {isPassVisible ? u.senha : '••••••••'}
                          </code>
                          <button
                            onClick={() => togglePasswordVisibility(u.id)}
                            title={isPassVisible ? "Ocultar Senha" : "Exibir Senha"}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          >
                            {isPassVisible ? (
                              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <Eye className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </button>
                          <button
                            onClick={() => handleCopy(u.senha, `pass_${u.id}`)}
                            title="Copiar Senha"
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          >
                            {copiedKey === `pass_${u.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Valores e Plano salvos no Firebase */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-[11px]">Plano:</span>
                        <span className="font-semibold text-slate-200 text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {u.plano}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px]">
                        <span className="text-slate-400">Valor Salvo:</span>
                        <span className="font-bold text-emerald-400 font-mono">
                          {formatCurrencyBRL(u.valorMensalidade)}
                        </span>
                      </div>
                    </div>

                    {/* Ações Rápidas (Login e Excluir) */}
                    <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-800/60">
                      {onSelectUserForLogin && (
                        <button
                          onClick={() => {
                            onSelectUserForLogin(u);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[11px] font-semibold flex items-center gap-1 transition-all"
                        >
                          <LogIn className="w-3 h-3" />
                          <span>Preencher no Login</span>
                        </button>
                      )}

                      {!isSuperAdmin && (
                        <button
                          onClick={() => handleDelete(u.usuario)}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors ml-auto"
                          title="Excluir Usuário do Firestore"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Valores e senhas sincronizados diretamente com o banco Firestore do Gestor.</span>
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
};
