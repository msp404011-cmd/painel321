import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Building2, 
  Mail, 
  Phone, 
  UserPlus, 
  LogIn, 
  Sparkles, 
  CheckCircle2, 
  CreditCard,
  Zap,
  Crown,
  Layers
} from 'lucide-react';
import { authenticateAdminFirebase, registerUserFirebase, ensureUserCompany, subscribePlanosFirebase } from '../lib/firebaseService';
import { PlanoSaaS, PlanoGestorInfo } from '../types';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  
  // Login fields
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  
  // Register fields (Matching the exact image layout + plan selector)
  const [nomeLoja, setNomeLoja] = useState('');
  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senhaCadastro, setSenhaCadastro] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  
  // Plan Selection with corresponding prices loaded directly from Firebase
  const [planosDisponiveis, setPlanosDisponiveis] = useState<PlanoGestorInfo[]>([]);
  const [planoEscolhido, setPlanoEscolhido] = useState<PlanoSaaS>('Profissional');
  const [valorMensalidade, setValorMensalidade] = useState<number>(0);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Lê os planos e valores reais diretamente do Firestore do Gestor
  useEffect(() => {
    const unsub = subscribePlanosFirebase((planosDoGestor) => {
      if (planosDoGestor && planosDoGestor.length > 0) {
        // Filtra para remover qualquer plano de teste grátis ou com valor zerado
        const filteredPlans = planosDoGestor.filter(p => p.valor > 0 && !p.nome.toLowerCase().includes('teste') && !p.nome.toLowerCase().includes('grátis'));
        setPlanosDisponiveis(filteredPlans);
        
        // Seleciona inicialmente o primeiro plano ou o que coincide com a seleção atual
        const match = filteredPlans.find(p => p.nome.toLowerCase() === String(planoEscolhido).toLowerCase());
        if (match) {
          setValorMensalidade(match.valor);
        } else if (filteredPlans.length > 0) {
          setPlanoEscolhido(filteredPlans[0].nome as PlanoSaaS);
          setValorMensalidade(filteredPlans[0].valor);
        }
      }
    });

    return () => unsub();
  }, []);

  const handleSelectPlano = (p: PlanoSaaS, val: number) => {
    setPlanoEscolhido(p);
    setValorMensalidade(val);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const isOk = await authenticateAdminFirebase(usuario, senha);
      if (isOk) {
        sessionStorage.setItem('msp_admin_session', 'authenticated');
        localStorage.setItem('msp_admin_user', usuario.trim());
        await ensureUserCompany(usuario.trim());
        onLoginSuccess();
      } else {
        setError('Acesso negado. Usuário ou senha incorretos.');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Erro na autenticação:', err);
      if (usuario.trim().toLowerCase() === 'msp161507' && senha.trim() === 'painelultra') {
        sessionStorage.setItem('msp_admin_session', 'authenticated');
        localStorage.setItem('msp_admin_user', 'msp161507');
        await ensureUserCompany('msp161507');
        onLoginSuccess();
      } else {
        setError('Erro ao validar credenciais. Tente novamente.');
        setIsLoading(false);
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!nomeLoja.trim()) {
      setError('Por favor, informe o Nome da Loja / Assistência.');
      return;
    }
    if (!nomeResponsavel.trim()) {
      setError('Por favor, informe seu Nome Completo.');
      return;
    }
    if (!email.trim()) {
      setError('Por favor, informe o E-mail de contato.');
      return;
    }
    if (!senhaCadastro.trim() || senhaCadastro.length < 4) {
      setError('A senha deve conter no mínimo 4 dígitos.');
      return;
    }
    if (senhaCadastro !== confirmarSenha) {
      setError('As senhas digitadas não coincidem. Verifique a confirmação.');
      return;
    }

    setIsLoading(true);

    try {
      // Gera o nome de usuário a partir do e-mail ou do nome da loja
      const usernameGenerated = email.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase() || 
        nomeResponsavel.toLowerCase().replace(/\s+/g, '.');

      await registerUserFirebase({
        usuario: usernameGenerated,
        senha: senhaCadastro.trim(),
        nome: nomeResponsavel.trim(),
        email: email.trim(),
        nomeEmpresa: nomeLoja.trim(),
        telefone: telefone.trim() || '(11) 99999-9999',
        plano: planoEscolhido,
        valorMensalidade: valorMensalidade,
        status: 'ativo', // Inicia como ativo diretamente, removendo os 7 dias grátis de teste
      });

      setSuccessMsg(`Assistência cadastrada com sucesso no ${planoEscolhido}!`);
      sessionStorage.setItem('msp_admin_session', 'authenticated');
      localStorage.setItem('msp_admin_user', usernameGenerated);
      
      setTimeout(() => {
        onLoginSuccess();
      }, 700);
    } catch (err: any) {
      console.error('Erro ao registrar:', err);
      setError('Erro ao cadastrar assistência no Firestore. Tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050b14] text-slate-100 flex items-center justify-center p-3 sm:p-6 relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Ambient background glows matching the dark teal/cyan atmosphere */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="w-full max-w-xl bg-[#08131f]/95 border border-[#133044] rounded-3xl p-6 sm:p-9 shadow-2xl relative z-10 backdrop-blur-xl transition-all">
        
        {/* Top Switcher: [-> Entrar] | [+ Criar Conta] (Identical to Image) */}
        <div className="flex items-center justify-center mb-6">
          <div className="bg-[#050d17] p-1.5 rounded-2xl border border-[#142e40] flex items-center gap-1.5 w-full max-w-xs shadow-inner">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#0e2738] text-emerald-400 border border-emerald-500/30 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Entrar</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'register'
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              <span>Criar Conta</span>
            </button>
          </div>
        </div>

        {mode === 'register' ? (
          <div>
            {/* Header Badge & Title (Exact from image) */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#052620]/80 border border-emerald-500/40 text-emerald-400 text-xs font-black tracking-wider uppercase mb-3 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>CADASTRO DE CLIENTE GESTOR</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Cadastrar Assistência
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-1.5">
                Preencha os dados da sua loja para criar sua nova assistência.
              </p>
            </div>

            {error && (
              <div className="mb-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3.5 flex items-center gap-3 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 flex items-center gap-3 text-emerald-400 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              
              {/* Nome da Loja / Assistência */}
              <div>
                <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-400 mb-1.5">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Nome da Loja / Assistência:</span>
                </label>
                <input
                  type="text"
                  required
                  value={nomeLoja}
                  onChange={(e) => setNomeLoja(e.target.value)}
                  placeholder="Ex: TechCell Celulares & Informática"
                  className="w-full bg-[#050c14] border border-[#142838] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 transition-all outline-none"
                />
              </div>

              {/* Seu Nome (Responsável) */}
              <div>
                <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-400 mb-1.5">
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>Seu Nome (Responsável):</span>
                </label>
                <input
                  type="text"
                  required
                  value={nomeResponsavel}
                  onChange={(e) => setNomeResponsavel(e.target.value)}
                  placeholder="Ex: Carlos Silva"
                  className="w-full bg-[#050c14] border border-[#142838] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 transition-all outline-none"
                />
              </div>

              {/* E-mail & WhatsApp / Telefone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-400 mb-1.5">
                    <Mail className="w-4 h-4 text-emerald-400" />
                    <span>E-mail:</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contato@loja.com"
                    className="w-full bg-[#050c14] border border-[#142838] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-400 mb-1.5">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span>WhatsApp / Telefone:</span>
                  </label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full bg-[#050c14] border border-[#142838] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Criar Senha & Confirmar Senha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-400 mb-1.5">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>Criar Senha:</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={senhaCadastro}
                      onChange={(e) => setSenhaCadastro(e.target.value)}
                      placeholder="Mínimo 4 dígitos"
                      className="w-full bg-[#050c14] border border-[#142838] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-4 pr-10 py-3 text-sm text-white placeholder-slate-500 transition-all outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-400 mb-1.5">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>Confirmar Senha:</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      placeholder="Repita a senha"
                      className="w-full bg-[#050c14] border border-[#142838] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-4 pr-10 py-3 text-sm text-white placeholder-slate-500 transition-all outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* SELEÇÃO DO PLANO COM VALORES CORRESPONDENTES (Diferencial solicitado) */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-400">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>Escolha seu Plano & Mensalidade:</span>
                  </label>
                  <span className="text-[11px] text-emerald-400/90 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Sincronizado com Gestor
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {planosDisponiveis.map((p) => {
                    const isSelected = String(planoEscolhido).toLowerCase() === p.nome.toLowerCase() || String(planoEscolhido).toLowerCase() === p.id.toLowerCase();
                    const IconComponent = p.nome.toLowerCase().includes('enter') ? Crown : (p.nome.toLowerCase().includes('bás') || p.nome.toLowerCase().includes('bas') ? Layers : Zap);
                    const formattedPrice = p.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

                    return (
                      <button
                        key={p.id || p.nome}
                        type="button"
                        onClick={() => handleSelectPlano(p.nome, p.valor)}
                        className={`p-3 rounded-2xl text-left border transition-all relative flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-b from-[#0a232e] to-[#061821] border-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500'
                            : 'bg-[#050e18] border-[#142a3a] hover:border-slate-700 opacity-80 hover:opacity-100'
                        }`}
                      >
                        {p.destaque && (
                          <span className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow-sm">
                            {p.badge || 'Destaque'}
                          </span>
                        )}

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <IconComponent className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                              <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                {p.nome.replace('Plano ', '')}
                              </span>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            )}
                          </div>
                          
                          <p className="text-[10px] text-slate-400 line-clamp-2">
                            {p.descricao || `Plano ${p.nome} configurado no Gestor`}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-baseline gap-1">
                          <span className="text-sm sm:text-base font-extrabold text-emerald-400">
                            {formattedPrice}
                          </span>
                          <span className="text-[10px] text-slate-400">/mês</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Resumo do Plano Selecionado */}
                <div className="mt-2.5 p-2.5 rounded-xl bg-[#04121c] border border-[#0e2738] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-300">
                      Plano Selecionado: <strong className="text-white">{planoEscolhido}</strong>
                    </span>
                  </div>
                  <div className="font-mono font-bold text-emerald-400 text-sm">
                    {valorMensalidade.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} <span className="text-[10px] text-slate-400 font-sans font-normal">/mês</span>
                  </div>
                </div>
              </div>

              {/* Botão de Envio com Efeito Glow */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3.5 rounded-2xl transition-all shadow-[0_0_25px_rgba(16,185,129,0.35)] active:scale-[0.99] flex items-center justify-center gap-2 text-sm sm:text-base mt-4 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-slate-950" />
                    <span>Cadastrar Loja & Ativar Assinatura</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div>
            {/* Modo Login */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-[#0e2738] border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-emerald-400 shadow-lg">
                <Shield className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Acessar o Painel
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                Super Admin Master e Gestores de Assistência Técnica
              </p>
            </div>

            {error && (
              <div className="mb-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3.5 flex items-center gap-3 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1.5">
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>E-mail ou Usuário do Gestor:</span>
                </label>
                <input
                  type="text"
                  required
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="Ex: contato@loja.com, usuario ou msp161507"
                  autoFocus
                  className="w-full bg-[#050c14] border border-[#142838] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 transition-all outline-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1.5">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>Senha</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#050c14] border border-[#142838] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-4 pr-10 py-3 text-sm text-white placeholder-slate-500 transition-all outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3.5 rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] active:scale-[0.99] flex items-center justify-center gap-2 text-sm mt-4 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Entrar no Painel'
                )}
              </button>

              {/* Acesso Rápido Super Admin Master */}
              <div className="mt-4 pt-4 border-t border-[#122838]">
                <span className="text-[11px] font-bold text-slate-400 block mb-2">
                  Acesso Direto Super Admin Master:
                </span>
                <button
                  type="button"
                  onClick={() => { setUsuario('msp161507'); setSenha('painelultra'); }}
                  className="w-full p-2.5 rounded-xl bg-[#061421] hover:bg-[#091e30] border border-[#133044] text-left flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <div>
                    <span className="text-xs font-bold text-emerald-400 block">Super Admin Master</span>
                    <span className="text-[10px] text-slate-400 font-mono">msp161507 / painelultra</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-bold group-hover:translate-x-1 transition-transform">Preencher →</span>
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
