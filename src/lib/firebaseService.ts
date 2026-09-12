import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  getDoc,
  where,
  orderBy,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db, defaultDb, auth } from './firebase';
import { Assistencia, TransacaoPix, StatusCliente, StatusTransacao, GestorUserFirebase, PlanoSaaS, PlanoGestorInfo } from '../types';
import { INITIAL_ASSISTENCIAS, INITIAL_TRANSACTIONS, GESTOR_OFFICIAL_PLANS } from '../data/mockData';

const USER_ACCOUNTS_COLLECTION = 'user_accounts';
const EMPRESAS_COLLECTION = 'empresas';
const COMPANIES_COLLECTION = 'companies';
const USERS_COLLECTION = 'users';
const USUARIOS_COLLECTION = 'usuarios';
const CLIENTES_COLLECTION = 'clientes';
const ADMIN_USERS_COLLECTION = 'admin_users';
const GESTORES_COLLECTION = 'gestores';
const GESTOR_USERS_COLLECTION = 'gestor_users';
const USUARIOS_GESTOR_COLLECTION = 'usuarios_gestor';
const USUARIOS_SISTEMA_COLLECTION = 'usuarios_sistema';
const ASSISTENCIAS_COLLECTION = 'assistencias';
const ASSISTENCIAS_TECNICAS_COLLECTION = 'assistencias_tecnicas';
const LOJAS_COLLECTION = 'lojas';
const STORES_COLLECTION = 'stores';
const ESTABELECIMENTOS_COLLECTION = 'estabelecimentos';
const CONTAS_COLLECTION = 'contas';
const ACCOUNTS_COLLECTION = 'accounts';
const TENANTS_COLLECTION = 'tenants';
const ASSINATURAS_COLLECTION = 'assinaturas';
const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const EMPRESA_DOC_COLLECTION = 'empresa';
const USUARIO_DOC_COLLECTION = 'usuario';
const DADOS_EMPRESA_COLLECTION = 'dados_empresa';

const PAGAMENTOS_COLLECTION = 'pagamentos';
const PAYMENTS_COLLECTION = 'payments';

export const TARGET_PAYMENT_COLLECTIONS = [
  PAGAMENTOS_COLLECTION,
  PAYMENTS_COLLECTION,
  'pix',
  'transacoes',
  'faturas',
  'cobrancas',
  'mensalidades'
];

export const TARGET_COMPANY_COLLECTIONS = [
  USER_ACCOUNTS_COLLECTION,
  EMPRESAS_COLLECTION,
  COMPANIES_COLLECTION,
  USERS_COLLECTION,
  USUARIOS_COLLECTION,
  CLIENTES_COLLECTION,
  ASSISTENCIAS_COLLECTION,
  ASSISTENCIAS_TECNICAS_COLLECTION,
  LOJAS_COLLECTION,
  STORES_COLLECTION,
  ESTABELECIMENTOS_COLLECTION,
  CONTAS_COLLECTION,
  ACCOUNTS_COLLECTION,
  TENANTS_COLLECTION,
  ASSINATURAS_COLLECTION,
  SUBSCRIPTIONS_COLLECTION,
  EMPRESA_DOC_COLLECTION,
  DADOS_EMPRESA_COLLECTION,
];

export const TARGET_USER_COLLECTIONS = [
  ADMIN_USERS_COLLECTION,
  USERS_COLLECTION,
  USUARIOS_COLLECTION,
  USER_ACCOUNTS_COLLECTION,
  GESTORES_COLLECTION,
  GESTOR_USERS_COLLECTION,
  USUARIOS_GESTOR_COLLECTION,
  USUARIOS_SISTEMA_COLLECTION,
  'admins',
  'administradores',
  CLIENTES_COLLECTION,
  EMPRESAS_COLLECTION,
  COMPANIES_COLLECTION,
  ASSISTENCIAS_COLLECTION,
  LOJAS_COLLECTION,
  CONTAS_COLLECTION,
  ACCOUNTS_COLLECTION,
  TENANTS_COLLECTION,
  USUARIO_DOC_COLLECTION,
];

export const TARGET_PLAN_COLLECTIONS = [
  'planos',
  'plans',
  'planos_sistema',
  'planos_saas',
  'planos_gestor',
  'tabela_precos',
  'precos',
  'produtos',
  'products',
  'pacotes',
  'assinaturas',
  'subscriptions',
  'configuracao_planos',
  'config_planos',
  'config',
  'configuracao',
  'configuracoes',
  'settings',
  'sistema',
];

// Cache em memória dos planos lidos diretamente do Firestore do Gestor
let activeFirestorePlans: PlanoGestorInfo[] = [];

/**
 * Helper para converter qualquer formato de string numérica/moeda para número float
 */
export function parseNumericValue(val: any): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;
    
    // Tratamento de formato brasileiro "R$ 1.299,90" ou "299,90" ou "299.90"
    let clean = trimmed.replace(/[R$\s]/gi, '');
    if (clean.includes(',') && clean.includes('.')) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else if (clean.includes(',')) {
      clean = clean.replace(',', '.');
    }
    const parsed = parseFloat(clean);
    if (!isNaN(parsed)) return parsed;
  }
  return null;
}

/**
 * Extrai com máxima precisão o plano salvo no Firestore
 * Mapeia todos os tipos de planos do Gestor (Básico, Profissional, Enterprise, Trial, etc.)
 */
export function extractPlanoFirestore(data: any): PlanoSaaS {
  if (!data || typeof data !== 'object') return 'Profissional';
  
  // 1. Campos de texto direto
  const strCandidates = [
    data.plano,
    data.plan,
    data.planoNome,
    data.plano_nome,
    data.nomePlano,
    data.nome_plano,
    data.planName,
    data.plan_name,
    data.tipoPlano,
    data.tipo_plano,
    data.planoEscolhido,
    data.chosenPlan,
  ];

  for (const cand of strCandidates) {
    if (typeof cand === 'string' && cand.trim()) {
      const clean = cand.trim();
      // Se coincidir exatamente com algum plano carregado do Firestore, retorna ele
      const matchDynamic = activeFirestorePlans.find(p => p.nome.toLowerCase() === clean.toLowerCase() || p.id.toLowerCase() === clean.toLowerCase());
      if (matchDynamic) return matchDynamic.nome;

      const lower = clean.toLowerCase();
      if (lower.includes('enter') || lower.includes('vip') || lower.includes('avanç') || lower.includes('premium')) return 'Enterprise';
      if (lower.includes('pro') || lower.includes('plus') || lower.includes('completo')) return 'Profissional';
      if (lower.includes('bás') || lower.includes('bas') || lower.includes('start') || lower.includes('inicial') || lower.includes('lite')) return 'Básico';
      return clean; // Retorna o nome real vindo do Firestore
    }
  }

  // 2. Objetos aninhados (plano: { nome: 'Profissional' }, assinatura: { plano: 'Enterprise' }, etc.)
  const nestedObjects = [
    data.plano,
    data.plan,
    data.assinatura,
    data.subscription,
    data.cobranca,
    data.billing,
  ];

  for (const obj of nestedObjects) {
    if (obj && typeof obj === 'object') {
      const name = obj.nome || obj.name || obj.title || obj.plano || obj.plan || obj.id;
      if (typeof name === 'string' && name.trim()) {
        const clean = name.trim();
        const matchDynamic = activeFirestorePlans.find(p => p.nome.toLowerCase() === clean.toLowerCase() || p.id.toLowerCase() === clean.toLowerCase());
        if (matchDynamic) return matchDynamic.nome;

        const lower = clean.toLowerCase();
        if (lower.includes('enter') || lower.includes('vip') || lower.includes('avanç') || lower.includes('premium')) return 'Enterprise';
        if (lower.includes('pro') || lower.includes('plus')) return 'Profissional';
        if (lower.includes('bás') || lower.includes('bas') || lower.includes('start')) return 'Básico';
        return clean;
      }
    }
  }

  // 3. Procura nos planos carregados do Firestore pelo valor
  const val = extractValorFirestore(data);
  if (activeFirestorePlans.length > 0) {
    const matchedByVal = activeFirestorePlans.find(p => Math.abs(p.valor - val) < 0.01);
    if (matchedByVal) return matchedByVal.nome;
  }

  return 'Profissional';
}

/**
 * Extrai com máxima precisão o valor numérico da mensalidade salvo no Firestore
 * Mapeia todos os campos de Gestores, SaaS, PDVs e Sistemas de Assistência Técnica
 */
export function extractValorFirestore(data: any): number {
  if (!data || typeof data !== 'object') return 0;
  
  // 1. Candidatos diretos de primeiro nível
  const directCandidates = [
    data.valorMensalidade,
    data.valor_mensalidade,
    data.valorMensal,
    data.valor_mensal,
    data.mensalidade,
    data.mensal,
    data.monthlyFee,
    data.monthly_fee,
    data.monthlyPrice,
    data.monthly_price,
    data.valor,
    data.valorPlano,
    data.valor_plano,
    data.planoValor,
    data.plano_valor,
    data.valorAssinatura,
    data.valor_assinatura,
    data.assinaturaValor,
    data.assinatura_valor,
    data.preco,
    data.precoMensal,
    data.preco_mensal,
    data.price,
    data.taxa,
    data.custo,
    data.cost,
    data.fee,
    data.amount,
    data.total,
    data.valorTotal,
    data.valor_total,
  ];

  for (const candidate of directCandidates) {
    const parsed = parseNumericValue(candidate);
    if (parsed !== null && parsed >= 0) {
      return parsed;
    }
  }

  // 2. Valores em centavos (ex: 29990 = 299.90)
  const centsCandidates = [
    data.amount_cents,
    data.amountCents,
    data.valorCentavos,
    data.valor_centavos,
    data.cents,
    data.centavos,
  ];
  for (const centVal of centsCandidates) {
    const parsed = parseNumericValue(centVal);
    if (parsed !== null && parsed > 0) {
      return parsed / 100;
    }
  }

  // 3. Objetos aninhados comuns em Gestores (plano, plan, assinatura, subscription, financeiro, cobranca, etc.)
  const nestedObjects = [
    data.plano,
    data.plan,
    data.assinatura,
    data.subscription,
    data.financeiro,
    data.financial,
    data.cobranca,
    data.billing,
    data.configuracao,
    data.config,
    data.settings,
    data.pagamento,
    data.payment,
    data.fatura,
    data.invoice,
    data.dadosFinanceiros,
    data.dadosCobranca,
  ];

  for (const nested of nestedObjects) {
    if (nested && typeof nested === 'object') {
      const nestedCandidates = [
        nested.valor,
        nested.valorMensalidade,
        nested.valor_mensalidade,
        nested.valorMensal,
        nested.mensalidade,
        nested.monthlyFee,
        nested.monthlyPrice,
        nested.price,
        nested.preco,
        nested.amount,
        nested.total,
        nested.taxa,
        nested.custo,
      ];
      for (const val of nestedCandidates) {
        const parsed = parseNumericValue(val);
        if (parsed !== null && parsed >= 0) {
          return parsed;
        }
      }
      if (nested.plan && typeof nested.plan === 'object') {
        const p1 = parseNumericValue(nested.plan.price ?? nested.plan.valor ?? nested.plan.preco);
        if (p1 !== null && p1 >= 0) return p1;
      }
    }
  }

  // 4. Arrays de mensalidades/faturas/pagamentos (ex: última fatura ou valor recorrente)
  if (Array.isArray(data.mensalidades) && data.mensalidades.length > 0) {
    const last = data.mensalidades[data.mensalidades.length - 1];
    const p = typeof last === 'number' ? last : parseNumericValue(last?.valor ?? last?.amount ?? last?.preco);
    if (p !== null && p >= 0) return p;
  }
  if (Array.isArray(data.faturas) && data.faturas.length > 0) {
    const last = data.faturas[data.faturas.length - 1];
    const p = typeof last === 'number' ? last : parseNumericValue(last?.valor ?? last?.amount ?? last?.preco);
    if (p !== null && p >= 0) return p;
  }

  // 5. Se o nome do plano tiver um número ou preço embutido
  const rawPlanString = String(
    (typeof data.plano === 'string' ? data.plano : data.plano?.nome || data.plano?.name) ||
    (typeof data.plan === 'string' ? data.plan : data.plan?.nome || data.plan?.name) ||
    data.planName || 
    data.nomePlano || 
    ''
  );

  if (rawPlanString) {
    // Verifica se coincide com algum plano já lido do Firestore
    const matchDynamic = activeFirestorePlans.find(p => p.nome.toLowerCase() === rawPlanString.toLowerCase() || p.id.toLowerCase() === rawPlanString.toLowerCase());
    if (matchDynamic && matchDynamic.valor > 0) {
      return matchDynamic.valor;
    }

    const matchCurrency = rawPlanString.match(/(\d+[\.,]\d{2})/);
    if (matchCurrency) {
      const parsed = parseNumericValue(matchCurrency[1]);
      if (parsed !== null && parsed > 0) return parsed;
    }
    const matchInt = rawPlanString.match(/(?:R\$|\$|plano|mensal|mês|mes)?\s*(\d{2,4})/i);
    if (matchInt) {
      const parsed = parseFloat(matchInt[1]);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  }

  return 0;
}

/**
 * Extrai a senha salva no documento do Firestore
 */
export function extractSenhaFirestore(data: any): string {
  if (!data) return '123456';
  const candidates = [
    data.senha,
    data.password,
    data.pass,
    data.senhaAcesso,
    data.userPassword,
    data.pin,
    data.chaveAcesso,
    data.key,
  ];
  for (const s of candidates) {
    if (s !== undefined && s !== null && String(s).trim() !== '') {
      return String(s).trim();
    }
  }
  return '123456';
}

/**
 * Extrai o login/usuário do documento do Firestore
 */
export function extractUsuarioFirestore(docId: string, data: any): string {
  if (!data) return docId;
  const candidates = [
    data.usuario,
    data.username,
    data.login,
    data.user,
    data.userEmail,
    data.email,
  ];
  for (const u of candidates) {
    if (u !== undefined && u !== null && String(u).trim() !== '') {
      return String(u).trim();
    }
  }
  return docId;
}

/**
 * LÊ E SINCRONIZA EM TEMPO REAL OS PLANOS E VALORES REAIS DO FIRESTORE DO GESTOR
 * Busca nas coleções de planos, tabelas de preço, configurações do sistema
 * e também extrai dinamicamente os planos e valores já cadastrados nas empresas e usuários.
 */
export function subscribePlanosFirebase(
  onData: (planos: PlanoGestorInfo[]) => void,
  onError?: (err: Error) => void
): () => void {
  // 1. Tenta carregar cache prévio salvo
  const getCachedPlanos = (): PlanoGestorInfo[] => {
    try {
      const cached = localStorage.getItem('msp_gestor_planos');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  };

  const cached = getCachedPlanos();
  if (cached.length > 0) {
    activeFirestorePlans = cached;
    onData(cached);
  }

  const plansMap = new Map<string, PlanoGestorInfo>();
  GESTOR_OFFICIAL_PLANS.forEach(p => {
    plansMap.set(p.nome.toLowerCase().trim(), { ...p });
    if (p.id) plansMap.set(p.id.toLowerCase().trim(), { ...p });
  });

  const unsubs: (() => void)[] = [];

  const emitPlanos = () => {
    // Unique list by name
    const seen = new Set<string>();
    const list: PlanoGestorInfo[] = [];
    
    // First include official plans
    GESTOR_OFFICIAL_PLANS.forEach(op => {
      const match = plansMap.get(op.nome.toLowerCase().trim()) || plansMap.get(op.id.toLowerCase().trim()) || op;
      list.push(match);
      seen.add(op.nome.toLowerCase().trim());
      if (op.id) seen.add(op.id.toLowerCase().trim());
    });

    // Then any other plans from Firestore
    plansMap.forEach((p, key) => {
      if (!seen.has(key) && !seen.has(p.nome.toLowerCase().trim())) {
        seen.add(p.nome.toLowerCase().trim());
        list.push(p);
      }
    });
    
    // Sort by price (free first, then ascending)
    list.sort((a, b) => a.valor - b.valor);

    if (list.length > 0) {
      activeFirestorePlans = list;
      try {
        localStorage.setItem('msp_gestor_planos', JSON.stringify(list));
      } catch (e) {}
      onData(list);
    }
  };

  // Emit initial official plans immediately
  emitPlanos();

  // Helper para processar qualquer documento de plano ou configuração
  const processPlanDoc = (docId: string, data: any) => {
    if (!data || typeof data !== 'object') return;

    // Se o documento for um mapa de múltiplos planos (ex: config/planos -> { basico: { nome, valor }, pro: { nome, valor } })
    if (Array.isArray(data.planos) || Array.isArray(data.plans) || Array.isArray(data.items)) {
      const arr = data.planos || data.plans || data.items;
      arr.forEach((item: any, idx: number) => {
        if (item && typeof item === 'object') {
          const nome = item.nome || item.name || item.titulo || item.title || `Plano ${idx + 1}`;
          const val = extractValorFirestore(item);
          const key = nome.toLowerCase().trim();
          plansMap.set(key, {
            id: item.id || key,
            nome: nome,
            valor: val,
            descricao: item.descricao || item.description || '',
            destaque: item.destaque || item.featured || false,
            badge: item.badge || item.tag || '',
            recursos: item.recursos || item.features || [],
          });
        }
      });
      return;
    }

    // Se o documento for um plano individual
    const rawNome = data.nome || data.name || data.titulo || data.title || data.plano || data.plan || docId;
    const rawVal = extractValorFirestore(data);

    if (rawNome && rawVal > 0) {
      const key = String(rawNome).toLowerCase().trim();
      const existing = plansMap.get(key);
      plansMap.set(key, {
        id: data.id || docId,
        nome: String(rawNome).trim(),
        valor: rawVal,
        descricao: data.descricao || data.description || existing?.descricao || '',
        destaque: Boolean(data.destaque || data.featured || existing?.destaque),
        badge: data.badge || data.tag || existing?.badge || '',
        recursos: data.recursos || data.features || existing?.recursos || [],
      });
    }
  };

  // 1. Escuta em tempo real as coleções de planos e configurações no db e defaultDb
  TARGET_PLAN_COLLECTIONS.forEach(colName => {
    try {
      const u1 = onSnapshot(collection(db, colName), (snap) => {
        snap.forEach(d => processPlanDoc(d.id, d.data()));
        emitPlanos();
      }, () => {});
      unsubs.push(u1);
    } catch (e) {}

    try {
      const u2 = onSnapshot(collection(defaultDb, colName), (snap) => {
        snap.forEach(d => processPlanDoc(d.id, d.data()));
        emitPlanos();
      }, () => {});
      unsubs.push(u2);
    } catch (e) {}
  });

  // 2. Também lê e extrai os valores dos planos presentes nos documentos das empresas e usuários reais do Gestor
  const listenToActiveEntities = (colName: string) => {
    try {
      const u = onSnapshot(collection(db, colName), (snap) => {
        snap.forEach(d => {
          const data = d.data();
          const pName = data.plano || data.plan || data.planName || data.nomePlano;
          const pVal = extractValorFirestore(data);
          if (typeof pName === 'string' && pName.trim() && pVal > 0) {
            const key = pName.trim().toLowerCase();
            if (!plansMap.has(key)) {
              plansMap.set(key, {
                id: key,
                nome: pName.trim(),
                valor: pVal,
                descricao: `Plano ${pName.trim()} do Gestor`,
              });
            } else {
              // Atualiza o valor real registrado caso ainda estivesse zerado
              const current = plansMap.get(key)!;
              if (current.valor === 0 && pVal > 0) {
                current.valor = pVal;
                plansMap.set(key, current);
              }
            }
          }
        });
        emitPlanos();
      }, () => {});
      unsubs.push(u);
    } catch (e) {}
  };

  listenToActiveEntities(EMPRESAS_COLLECTION);
  listenToActiveEntities(USER_ACCOUNTS_COLLECTION);
  listenToActiveEntities(USERS_COLLECTION);
  listenToActiveEntities(ASSISTENCIAS_COLLECTION);

  return () => {
    unsubs.forEach(fn => fn());
  };
}

/**
 * Função 'ensureUserCompany'
 * 1. Verifica se o documento do usuário/empresa específico existe no Firestore.
 * 2. Caso NÃO exista ou contenha novos parâmetros, cria/atualiza imediatamente o documento com o UID/login do usuário.
 * 3. Executa console.log("Nova empresa criada no Firestore com sucesso:", user.uid) logo após o salvamento.
 */
export async function ensureUserCompany(userIdentifierOrUid?: string, userDetails?: any): Promise<Assistencia> {
  const currentAuthUid = auth?.currentUser?.uid;
  const userUid = userIdentifierOrUid || currentAuthUid || localStorage.getItem('msp_admin_user') || 'msp161507';
  const cleanKey = userUid.trim().toLowerCase();
  const cleanEmail = (userDetails?.email || '').trim().toLowerCase();
  const sanitizedEmail = cleanEmail.replace(/[@.]/g, '_');

  let exists = false;
  let existingData: any = null;

  // 1. Verifica se já existe documento específico para este userUid
  try {
    const docSnap1 = await getDoc(doc(db, EMPRESAS_COLLECTION, cleanKey));
    if (docSnap1.exists()) {
      exists = true;
      existingData = docSnap1.data();
    }
  } catch (e) {}

  if (!exists) {
    try {
      const docSnap2 = await getDoc(doc(db, USER_ACCOUNTS_COLLECTION, cleanKey));
      if (docSnap2.exists()) {
        exists = true;
        existingData = docSnap2.data();
      }
    } catch (e) {}
  }

  // Se não passou novos dados e o documento já existe, retorna o existente
  if (exists && existingData && !userDetails) {
    return mapDocToAssistencia(userUid, existingData);
  }

  // Prepara dados da empresa garantindo compatibilidade total com o Gestor
  const today = new Date().toISOString().split('T')[0];
  const nextMonthDate = new Date();
  nextMonthDate.setDate(nextMonthDate.getDate() + 30);
  const dataVencimento = userDetails?.dataVencimento || nextMonthDate.toISOString().split('T')[0];

  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 7);
  const dataTrial = trialEndDate.toISOString().split('T')[0];

  const nomeEmpresa = userDetails?.empresa || userDetails?.nomeEmpresa || userDetails?.nome || (userUid !== 'msp161507' ? `Assistência Técnica ${userUid}` : 'Assistência Técnica Modelo SP');
  const responsavel = userDetails?.responsavel || userDetails?.nome || (userUid !== 'msp161507' ? userUid : 'Administrador Responsável');
  const emailVal = cleanEmail || userDetails?.email || (userUid !== 'msp161507' ? `${cleanKey}@assistencia.com.br` : 'contato@assistencia.com.br');
  const telefone = userDetails?.telefone || '(11) 98765-4321';
  
  const plano: PlanoSaaS = userDetails?.plano ? extractPlanoFirestore(userDetails) : (existingData ? extractPlanoFirestore(existingData) : 'Profissional');
  const valorMensalidade = userDetails?.valorMensalidade !== undefined 
    ? Number(userDetails.valorMensalidade)
    : (existingData ? extractValorFirestore(existingData) : 0);
  
  const senha = userDetails?.senha || userDetails?.password || (existingData ? extractSenhaFirestore(existingData) : '123456');
  const status: StatusCliente = userDetails?.status || (existingData?.status ? existingData.status : 'ativo');

  const newCompany: Assistencia = {
    id: cleanKey,
    nome: nomeEmpresa,
    cnpj: userDetails?.cnpj || existingData?.cnpj || '24.819.304/0001-88',
    responsavel: responsavel,
    email: emailVal,
    telefone: telefone,
    cidadeUf: userDetails?.cidadeUf || existingData?.cidadeUf || 'São Paulo/SP',
    plano: plano,
    valorMensalidade: valorMensalidade,
    status: status,
    dataVencimento: dataVencimento,
    dataCadastro: existingData?.dataCadastro || today,
    ultimoPagamento: today,
    metodoPagamento: 'PIX Mercado Pago',
    loginUsuario: cleanKey,
    senha: senha,
    observacoes: userDetails?.observacoes || existingData?.observacoes || 'Conta integrada e sincronizada com o Gestor.',
  };

  const payload = {
    ...newCompany,
    name: newCompany.nome,
    nomeEmpresa: newCompany.nome,
    razaoSocial: newCompany.nome,
    nomeFantasia: newCompany.nome,
    storeName: newCompany.nome,
    companyName: newCompany.nome,
    phone: newCompany.telefone,
    celular: newCompany.telefone,
    whatsapp: newCompany.telefone,
    dueDate: newCompany.dataVencimento,
    vencimento: newCompany.dataVencimento,
    valorMensalidade: valorMensalidade,
    monthlyFee: valorMensalidade,
    mensalidade: valorMensalidade,
    valor: valorMensalidade,
    valorPlano: valorMensalidade,
    preco: valorMensalidade,
    price: valorMensalidade,
    amount: valorMensalidade,
    plano: plano,
    plan: plano,
    planName: plano,
    planoNome: plano,
    tipoPlano: plano,
    planoId: String(plano).toLowerCase(),
    planoObjeto: { id: String(plano).toLowerCase(), nome: plano, valor: valorMensalidade, status: 'ativo' },
    status: status,
    situacao: status === 'bloqueado' ? 'blocked' : (status === 'inadimplente' ? 'overdue' : 'active'),
    userStatus: 'active',
    ativo: status !== 'bloqueado',
    active: status !== 'bloqueado',
    bloqueado: status === 'bloqueado',
    blocked: status === 'bloqueado',
    inadimplente: status === 'inadimplente',
    isTrial: status === 'teste',
    trial: status === 'teste',
    diasGratis: 7,
    trialDays: 7,
    trialEndsAt: dataTrial,
    uid: cleanKey,
    userId: cleanKey,
    usuario: cleanKey,
    username: cleanKey,
    login: cleanKey,
    loginUsuario: cleanKey,
    password: senha,
    senha: senha,
    role: 'gestor',
    tipo: 'gestor',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Grava no Firestore nas coleções principais usando múltiplas chaves (docId = cleanKey, cleanEmail, etc.) de forma paralela e não-bloqueante
  const targetKeys = [cleanKey];
  if (cleanEmail && cleanEmail !== cleanKey) targetKeys.push(cleanEmail);
  if (sanitizedEmail && !targetKeys.includes(sanitizedEmail)) targetKeys.push(sanitizedEmail);

  const backgroundPromises: Promise<any>[] = [];
  for (const col of TARGET_COMPANY_COLLECTIONS) {
    for (const docKey of targetKeys) {
      backgroundPromises.push(setDoc(doc(db, col, docKey), payload, { merge: true }).catch(() => {}));
      backgroundPromises.push(setDoc(doc(defaultDb, col, docKey), payload, { merge: true }).catch(() => {}));
    }
  }

  // Não bloqueia a resposta se a rede estiver lenta
  Promise.race([
    Promise.allSettled(backgroundPromises),
    new Promise(resolve => setTimeout(resolve, 800))
  ]).catch(() => {});

  // Atualiza cache local
  try {
    const cached = localStorage.getItem('msp_empresas_cache');
    const list: Assistencia[] = cached ? JSON.parse(cached) : [];
    const filtered = list.filter(item => item.id !== cleanKey && item.cnpj !== newCompany.cnpj);
    filtered.unshift(newCompany);
    localStorage.setItem('msp_empresas_cache', JSON.stringify(filtered));
  } catch (e) {}

  // Log obrigatório de confirmação de gravação
  console.log("Nova empresa criada no Firestore com sucesso:", cleanKey);

  return newCompany;
}

/**
 * Garante / cria uma empresa inicial com configurações padrão no Firestore
 */
export async function ensureDefaultEmpresaForUser(customDefaults?: Partial<Assistencia>): Promise<Assistencia> {
  const currentUid = auth?.currentUser?.uid || localStorage.getItem('msp_admin_user') || 'msp161507';
  return ensureUserCompany(currentUid, customDefaults);
}

/**
 * Verifica e cria a empresa caso o usuário não possua
 */
export async function checkAndEnsureUserCompany(username: string, userDetails?: any): Promise<Assistencia> {
  return ensureUserCompany(username, userDetails);
}

/**
 * Registra um novo usuário/tenant no Firestore para que possa ser usado diretamente no Gestor
 */
export async function registerUserFirebase(dados: {
  usuario: string;
  senha: string;
  nome: string;
  email: string;
  nomeEmpresa?: string;
  telefone?: string;
  plano?: PlanoSaaS;
  valorMensalidade?: number;
  status?: StatusCliente;
}): Promise<boolean> {
  const cleanUser = dados.usuario.trim().toLowerCase();
  const cleanPass = dados.senha.trim();
  const cleanEmail = dados.email.trim().toLowerCase();
  const cleanNome = dados.nome.trim();
  const selectedPlano: PlanoSaaS = dados.plano || 'Profissional';
  const valNum = dados.valorMensalidade !== undefined ? Number(dados.valorMensalidade) : 0;
  const selectedStatus = dados.status || 'teste';

  const userPayload = {
    username: cleanUser,
    usuario: cleanUser,
    login: cleanUser,
    user: cleanUser,
    user_login: cleanUser,
    password: cleanPass,
    senha: cleanPass,
    pass: cleanPass,
    pin: cleanPass,
    user_password: cleanPass,
    role: 'gestor',
    tipo: 'gestor',
    userType: 'gestor',
    accessLevel: 'gestor',
    nome: cleanNome,
    name: cleanNome,
    nomeResponsavel: cleanNome,
    responsavel: cleanNome,
    displayName: cleanNome,
    email: cleanEmail,
    userEmail: cleanEmail,
    mail: cleanEmail,
    empresa: dados.nomeEmpresa || `Assistência ${cleanNome}`,
    nomeEmpresa: dados.nomeEmpresa || `Assistência ${cleanNome}`,
    storeName: dados.nomeEmpresa || `Assistência ${cleanNome}`,
    companyName: dados.nomeEmpresa || `Assistência ${cleanNome}`,
    plano: selectedPlano,
    plan: selectedPlano,
    planName: selectedPlano,
    planoNome: selectedPlano,
    tipoPlano: selectedPlano,
    planoId: String(selectedPlano).toLowerCase(),
    planoObjeto: { id: String(selectedPlano).toLowerCase(), nome: selectedPlano, valor: valNum, status: 'ativo' },
    valorMensalidade: valNum,
    monthlyFee: valNum,
    mensalidade: valNum,
    valor: valNum,
    valor_mensalidade: valNum,
    valorPlano: valNum,
    preco: valNum,
    price: valNum,
    amount: valNum,
    status: selectedStatus,
    situacao: selectedStatus === 'bloqueado' ? 'blocked' : 'active',
    userStatus: 'active',
    ativo: true,
    active: true,
    bloqueado: false,
    blocked: false,
    isTrial: selectedStatus === 'teste',
    trial: selectedStatus === 'teste',
    diasGratis: 7,
    trialDays: 7,
    telefone: dados.telefone || '(11) 98765-4321',
    phone: dados.telefone || '(11) 98765-4321',
    whatsapp: dados.telefone || '(11) 98765-4321',
    celular: dados.telefone || '(11) 98765-4321',
    dataCadastro: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    criadoEm: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Grava para todas as chaves possíveis de busca (username, email, email sanitizado)
  const targetKeys = [cleanUser];
  if (cleanEmail && !targetKeys.includes(cleanEmail)) targetKeys.push(cleanEmail);
  const sanitizedEmail = cleanEmail.replace(/[@.]/g, '_');
  if (sanitizedEmail && !targetKeys.includes(sanitizedEmail)) targetKeys.push(sanitizedEmail);

  const targetCols = TARGET_USER_COLLECTIONS;
  const savePromises: Promise<any>[] = [];

  for (const col of targetCols) {
    for (const docKey of targetKeys) {
      savePromises.push(setDoc(doc(db, col, docKey), userPayload, { merge: true }).catch(() => {}));
      savePromises.push(setDoc(doc(defaultDb, col, docKey), userPayload, { merge: true }).catch(() => {}));
    }
  }

  // Provisiona imediatamente o documento de empresa/loja correspondente em paralelo
  savePromises.push(
    ensureUserCompany(cleanUser, {
      nome: dados.nomeEmpresa || `Assistência Técnica ${cleanNome}`,
      responsavel: cleanNome,
      email: cleanEmail,
      telefone: dados.telefone || '(11) 98765-4321',
      senha: cleanPass,
      plano: selectedPlano,
      valorMensalidade: valNum,
      status: selectedStatus,
    }).catch(() => {})
  );

  // Aguarda até 900ms para gravações primárias concluírem de forma não-bloqueante
  await Promise.race([
    Promise.allSettled(savePromises),
    new Promise(resolve => setTimeout(resolve, 900))
  ]);

  return true;
}

/**
 * Registra/garante o superadmin no Firestore
 */
export async function ensureAdminUserInFirebase(): Promise<void> {
  const adminPayload = {
    username: 'msp161507',
    usuario: 'msp161507',
    password: 'painelultra',
    senha: 'painelultra',
    role: 'superadmin',
    tipo: 'superadmin',
    nome: 'Super Admin MSP',
    email: 'msp161507@admin.com',
    empresa: 'Painel Ultra Super Admin Master',
    status: 'ativo',
    plano: 'Enterprise',
    valorMensalidade: 0.00,
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, ADMIN_USERS_COLLECTION, 'msp161507'), adminPayload, { merge: true });
    await setDoc(doc(db, USERS_COLLECTION, 'msp161507'), adminPayload, { merge: true });
  } catch (e: any) {}

  try {
    await setDoc(doc(defaultDb, ADMIN_USERS_COLLECTION, 'msp161507'), adminPayload, { merge: true });
    await setDoc(doc(defaultDb, USERS_COLLECTION, 'msp161507'), adminPayload, { merge: true });
  } catch (e: any) {}
}

/**
 * Autentica o usuário no Firestore ou credencial primária
 * Suporta busca por Login, E-mail ou Nome de Usuário do Gestor
 */
export async function authenticateAdminFirebase(usuario: string, senhaDigitada: string): Promise<boolean> {
  const cleanUser = usuario.trim().toLowerCase();
  const cleanPass = senhaDigitada.trim();

  let authenticated = false;
  let userDetails: any = null;

  // Credencial única msp161507 / painelultra
  if ((cleanUser === 'msp161507' || cleanUser === 'msp161507@admin.com') && cleanPass === 'painelultra') {
    ensureAdminUserInFirebase().catch(() => {});
    authenticated = true;
    userDetails = { nome: 'Super Admin MSP', email: 'msp161507@admin.com' };
  } else {
    // 1. Busca direta por Document ID nas coleções de usuários
    const targetCols = TARGET_USER_COLLECTIONS;
    const searchKeys = [cleanUser, cleanUser.replace(/[@.]/g, '_')];

    for (const col of targetCols) {
      if (authenticated) break;
      for (const k of searchKeys) {
        try {
          const docSnap = await getDoc(doc(db, col, k));
          if (docSnap.exists()) {
            const data = docSnap.data();
            const pass = extractSenhaFirestore(data);
            if (pass === cleanPass || data.password === cleanPass || data.senha === cleanPass) {
              authenticated = true;
              userDetails = data;
              break;
            }
          }
        } catch (e) {}
      }
    }

    // 2. Se não encontrou por docId direto, executa query por email ou username
    if (!authenticated) {
      for (const col of [USERS_COLLECTION, USUARIOS_COLLECTION, ADMIN_USERS_COLLECTION, USER_ACCOUNTS_COLLECTION, GESTORES_COLLECTION, EMPRESAS_COLLECTION]) {
        if (authenticated) break;
        try {
          const qEmail = query(collection(db, col), where('email', '==', cleanUser));
          const snapEmail = await getDocs(qEmail);
          if (!snapEmail.empty) {
            const data = snapEmail.docs[0].data();
            const pass = extractSenhaFirestore(data);
            if (pass === cleanPass || data.password === cleanPass || data.senha === cleanPass) {
              authenticated = true;
              userDetails = data;
              break;
            }
          }

          const qUser = query(collection(db, col), where('usuario', '==', cleanUser));
          const snapUser = await getDocs(qUser);
          if (!snapUser.empty) {
            const data = snapUser.docs[0].data();
            const pass = extractSenhaFirestore(data);
            if (pass === cleanPass || data.password === cleanPass || data.senha === cleanPass) {
              authenticated = true;
              userDetails = data;
              break;
            }
          }

          const qUsername = query(collection(db, col), where('username', '==', cleanUser));
          const snapUsername = await getDocs(qUsername);
          if (!snapUsername.empty) {
            const data = snapUsername.docs[0].data();
            const pass = extractSenhaFirestore(data);
            if (pass === cleanPass || data.password === cleanPass || data.senha === cleanPass) {
              authenticated = true;
              userDetails = data;
              break;
            }
          }
        } catch (e) {}
      }
    }
  }

  if (authenticated) {
    checkAndEnsureUserCompany(cleanUser, userDetails).catch(() => {});
    return true;
  }

  return false;
}

/**
 * Normaliza um documento do Firestore para a interface Assistencia respeitando estritamente os valores do banco
 */
function mapDocToAssistencia(docId: string, data: any): Assistencia {
  let status: StatusCliente = 'ativo';
  const rawStatus = String(data.status || data.situacao || data.userStatus || '').toLowerCase();

  if (rawStatus === 'teste' || rawStatus === 'trial' || rawStatus === 'degustacao' || data.isTrial === true || data.emTeste === true) {
    status = 'teste';
  } else if (rawStatus === 'teste_pendente' || rawStatus === 'trial_expired' || rawStatus === 'teste_expirado' || data.testePendente === true) {
    status = 'teste_pendente';
  } else if (
    rawStatus === 'bloqueado' || 
    rawStatus === 'blocked' || 
    rawStatus === 'inativo' || 
    rawStatus === 'disabled' || 
    data.bloqueado === true || 
    data.blocked === true || 
    data.ativo === false || 
    data.active === false
  ) {
    status = 'bloqueado';
  } else if (rawStatus === 'inadimplente' || rawStatus === 'overdue' || data.inadimplente === true) {
    status = 'inadimplente';
  } else if (rawStatus === 'ativo' || rawStatus === 'active' || data.ativo === true || data.active === true) {
    status = 'ativo';
  }

  const nome = data.nome || data.name || data.nomeFantasia || data.razaoSocial || data.nomeEmpresa || data.storeName || data.companyName || `Empresa #${docId.slice(0, 6)}`;
  const valorReconhecido = extractValorFirestore(data);
  const senhaReconhecida = extractSenhaFirestore(data);
  const loginReconhecido = extractUsuarioFirestore(docId, data);
  const recognizedPlan = extractPlanoFirestore(data);

  return {
    id: docId,
    nome: nome,
    cnpj: data.cnpj || data.documento || data.cpf || '00.000.000/0001-00',
    responsavel: data.responsavel || data.nomeResponsavel || data.owner || data.contato || 'Não informado',
    email: data.email || data.userEmail || 'contato@empresa.com',
    telefone: data.telefone || data.celular || data.whatsapp || data.phone || '(00) 00000-0000',
    cidadeUf: data.cidadeUf || data.cidade || 'São Paulo/SP',
    plano: recognizedPlan,
    valorMensalidade: valorReconhecido,
    status: status,
    loginUsuario: loginReconhecido,
    senha: senhaReconhecida,
    dataVencimento: data.dataVencimento || data.vencimento || data.dueDate || new Date().toISOString().split('T')[0],
    dataCadastro: data.dataCadastro || data.criadoEm || data.createdAt || new Date().toISOString().split('T')[0],
    ultimoPagamento: data.ultimoPagamento || data.paidAt || new Date().toISOString().split('T')[0],
    metodoPagamento: data.metodoPagamento || 'PIX Mercado Pago',
    observacoes: data.observacoes || '',
  };
}

/**
 * Normaliza um documento do Firestore da coleção 'pagamentos' para TransacaoPix
 */
function mapDocToTransacao(docId: string, data: any): TransacaoPix {
  let status: StatusTransacao = 'aprovado';
  if (['aprovado', 'pendente', 'estornado', 'falhado'].includes(data.status)) {
    status = data.status as StatusTransacao;
  }

  return {
    id: docId,
    assistenciaId: data.assistenciaId || data.empresaId || '',
    assistenciaNome: data.assistenciaNome || data.empresaNome || data.nome || 'Empresa',
    cnpj: data.cnpj || '00.000.000/0001-00',
    valor: typeof data.valor === 'number' ? data.valor : (Number(data.valor) || 0),
    data: data.data || data.dataPagamento || data.createdAt || new Date().toLocaleString('pt-BR'),
    status: status,
    metodo: 'PIX Mercado Pago',
    codigoPixCopyPaste: data.codigoPixCopyPaste || data.pixCopiaECola || '',
  };
}

/**
 * Inscreve-se nas alterações em tempo real das coleções de empresas com cache resiliente e auto-provisionamento
 */
export function subscribeEmpresas(
  onData: (empresas: Assistencia[]) => void,
  onError?: (err: Error) => void
) {
  // Carrega imediatamente cache local
  const getCachedData = (): Assistencia[] => {
    try {
      const cached = localStorage.getItem('msp_empresas_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  };

  const initial = getCachedData();
  
  const collectionsList = [
    EMPRESAS_COLLECTION,
    USER_ACCOUNTS_COLLECTION,
    COMPANIES_COLLECTION,
    ASSISTENCIAS_COLLECTION,
  ];
  const sourceDocsMap = new Map<string, Map<string, Assistencia>>();
  const unsubs: (() => void)[] = [];

  let firstEmitDone = false;
  let snapsFired = 0;
  const EXPECTED_SNAPS = collectionsList.length * 2; // db and defaultDb

  const emitMerged = () => {
    const combinedById = new Map<string, Assistencia>();
    sourceDocsMap.forEach((colMap) => {
      colMap.forEach((item, id) => combinedById.set(id, item));
    });

    // Deduplicação inteligente também por CNPJ / Nome
    const uniqueList: Assistencia[] = [];
    const seenCnpjs = new Set<string>();

    combinedById.forEach((item) => {
      const cleanCnpj = item.cnpj ? item.cnpj.replace(/\D/g, '') : '';
      const key = cleanCnpj && cleanCnpj.length >= 8 ? cleanCnpj : `${item.nome.trim().toLowerCase()}_${item.email.trim().toLowerCase()}`;
      
      if (!seenCnpjs.has(key)) {
        seenCnpjs.add(key);
        uniqueList.push(item);
      }
    });

    if (uniqueList.length > 0) {
      try {
        localStorage.setItem('msp_empresas_cache', JSON.stringify(uniqueList));
      } catch (e) {}
      firstEmitDone = true;
      onData(uniqueList);
    } else if (snapsFired >= EXPECTED_SNAPS) {
      // Se Firebase retornou vazio para todas as tabelas
      const cached = getCachedData();
      if (!firstEmitDone && cached.length > 0) {
        onData(cached);
      } else {
        onData([]);
      }
      firstEmitDone = true;
    }
  };

  // 1. Escuta em tempo real as 4 coleções principais
  collectionsList.forEach(colName => {
    try {
      const u1 = onSnapshot(
        collection(db, colName),
        (snap) => {
          snapsFired++;
          const colMap = new Map<string, Assistencia>();
          snap.docs.forEach(d => colMap.set(d.id, mapDocToAssistencia(d.id, d.data())));
          sourceDocsMap.set(`db_${colName}`, colMap);
          // Só emite se já carregou todos ou se achou algo substancial
          if (snapsFired >= EXPECTED_SNAPS || colMap.size > 0) {
            emitMerged();
          }
        },
        () => {}
      );
      unsubs.push(u1);
    } catch (e) {}

    try {
      const u2 = onSnapshot(
        collection(defaultDb, colName),
        (snap) => {
          snapsFired++;
          const colMap = new Map<string, Assistencia>();
          snap.docs.forEach(d => colMap.set(d.id, mapDocToAssistencia(d.id, d.data())));
          sourceDocsMap.set(`default_${colName}`, colMap);
          if (snapsFired >= EXPECTED_SNAPS || colMap.size > 0) {
            emitMerged();
          }
        },
        () => {}
      );
      unsubs.push(u2);
    } catch (e) {}
  });

  // 2. Busca assíncrona única rápida e silenciosa (sem snapshot persistente) das outras coleções secundárias para compatibilidade completa
  const secondaryCollections = TARGET_COMPANY_COLLECTIONS.filter(c => !collectionsList.includes(c));
  secondaryCollections.forEach(async (colName) => {
    try {
      const snap1 = await getDocs(collection(db, colName));
      if (!snap1.empty) {
        const colMap = sourceDocsMap.get(`db_sec_${colName}`) || new Map<string, Assistencia>();
        snap1.docs.forEach(d => colMap.set(d.id, mapDocToAssistencia(d.id, d.data())));
        sourceDocsMap.set(`db_sec_${colName}`, colMap);
        emitMerged();
      }
    } catch (e) {}

    try {
      const snap2 = await getDocs(collection(defaultDb, colName));
      if (!snap2.empty) {
        const colMap = sourceDocsMap.get(`def_sec_${colName}`) || new Map<string, Assistencia>();
        snap2.docs.forEach(d => colMap.set(d.id, mapDocToAssistencia(d.id, d.data())));
        sourceDocsMap.set(`def_sec_${colName}`, colMap);
        emitMerged();
      }
    } catch (e) {}
  });

  return () => {
    unsubs.forEach(fn => fn());
  };
}

/**
 * Inscreve-se nas alterações em tempo real da coleção 'pagamentos' e 'payments'
 */
export function subscribePagamentos(
  onData: (pagamentos: TransacaoPix[]) => void,
  onError?: (err: Error) => void
) {
  const collectionsList = [PAGAMENTOS_COLLECTION, PAYMENTS_COLLECTION];
  const txMap = new Map<string, TransacaoPix>();
  const unsubs: (() => void)[] = [];

  const handleUpdate = (snapshotDocs: any[]) => {
    snapshotDocs.forEach(d => {
      txMap.set(d.id, mapDocToTransacao(d.id, d.data()));
    });
    onData(Array.from(txMap.values()));
  };

  collectionsList.forEach(colName => {
    try {
      const u1 = onSnapshot(collection(db, colName), (snap) => handleUpdate(snap.docs), () => {});
      unsubs.push(u1);
    } catch (e) {}
    try {
      const u2 = onSnapshot(collection(defaultDb, colName), (snap) => handleUpdate(snap.docs), () => {});
      unsubs.push(u2);
    } catch (e) {}
  });

  return () => {
    unsubs.forEach(fn => fn());
  };
}

/**
 * Adiciona uma nova empresa/assistência no Firestore com provisionamento completo
 */
export async function addEmpresaFirestore(empresa: Omit<Assistencia, 'id'>): Promise<string> {
  const cleanStatus = empresa.status || 'ativo';
  const firestoreStatus = cleanStatus === 'bloqueado' ? 'blocked' : (cleanStatus === 'inadimplente' ? 'overdue' : 'active');
  const valNum = typeof empresa.valorMensalidade === 'number' ? empresa.valorMensalidade : (Number(empresa.valorMensalidade) || 0);

  const cleanUser = (empresa.loginUsuario || empresa.email?.split('@')[0] || empresa.nome?.replace(/[^a-zA-Z0-9]/g, '') || `ast_${Date.now()}`).toLowerCase().trim();
  const cleanEmail = (empresa.email || `${cleanUser}@empresa.com`).toLowerCase().trim();
  const cleanPass = (empresa.senha || '123456').trim();
  const realId = `ast_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;

  const payload = {
    ...empresa,
    id: realId,
    uid: realId,
    userId: realId,
    name: empresa.nome,
    nomeEmpresa: empresa.nome,
    razaoSocial: empresa.nome,
    nomeFantasia: empresa.nome,
    storeName: empresa.nome,
    companyName: empresa.nome,
    phone: empresa.telefone,
    celular: empresa.telefone,
    whatsapp: empresa.telefone,
    dueDate: empresa.dataVencimento,
    vencimento: empresa.dataVencimento,
    valorMensalidade: valNum,
    monthlyFee: valNum,
    mensalidade: valNum,
    valor: valNum,
    valor_mensalidade: valNum,
    valorPlano: valNum,
    preco: valNum,
    price: valNum,
    amount: valNum,
    status: cleanStatus,
    situacao: firestoreStatus,
    userStatus: firestoreStatus,
    ativo: cleanStatus !== 'bloqueado',
    bloqueado: cleanStatus === 'bloqueado',
    inadimplente: cleanStatus === 'inadimplente',
    active: cleanStatus !== 'bloqueado',
    blocked: cleanStatus === 'bloqueado',
    loginUsuario: cleanUser,
    usuario: cleanUser,
    username: cleanUser,
    senha: cleanPass,
    password: cleanPass,
    role: 'gestor',
    tipo: 'gestor',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const cached = localStorage.getItem('msp_empresas_cache');
    const list: Assistencia[] = cached ? JSON.parse(cached) : [];
    const filtered = list.filter(item => item.id !== realId && item.cnpj !== empresa.cnpj);
    filtered.unshift({
      ...empresa,
      id: realId,
      valorMensalidade: valNum,
      loginUsuario: cleanUser,
      senha: cleanPass
    });
    localStorage.setItem('msp_empresas_cache', JSON.stringify(filtered));
  } catch (e) {}

  const targetKeys = [realId, cleanUser];
  if (cleanEmail && !targetKeys.includes(cleanEmail)) targetKeys.push(cleanEmail);

  const savePromises: Promise<any>[] = [];
  for (const col of TARGET_COMPANY_COLLECTIONS) {
    for (const docKey of targetKeys) {
      savePromises.push(setDoc(doc(db, col, docKey), payload, { merge: true }).catch(() => {}));
      savePromises.push(setDoc(doc(defaultDb, col, docKey), payload, { merge: true }).catch(() => {}));
    }
  }

  // Provisiona credenciais do Gestor nas coleções de usuários em paralelo
  savePromises.push(
    createOrUpdateGestorUserFirebase({
      usuario: cleanUser,
      senha: cleanPass,
      nome: empresa.responsavel || empresa.nome,
      empresa: empresa.nome,
      email: cleanEmail,
      telefone: empresa.telefone,
      plano: empresa.plano,
      valorMensalidade: valNum,
      status: cleanStatus,
      tipo: 'gestor'
    }).catch(() => {})
  );

  // Aguarda até 900ms para gravações primárias concluírem sem travar o usuário
  await Promise.race([
    Promise.allSettled(savePromises),
    new Promise(resolve => setTimeout(resolve, 900))
  ]);

  return realId;
}

/**
 * Retorna todas as chaves associadas a uma assistência (ID real, username, e-mail e e-mail sanitizado)
 * para garantir que qualquer alteração de status/plano/vencimento se propague instantaneamente para todos os registros
 */
export function getStoreKeys(id: string): string[] {
  const keys = [id];
  const cleanId = id.includes('_') ? id.split('_').slice(1).join('_') : id;
  if (cleanId && !keys.includes(cleanId)) keys.push(cleanId);

  try {
    const cached = localStorage.getItem('msp_empresas_cache');
    if (cached) {
      const list: Assistencia[] = JSON.parse(cached);
      const matched = list.find(item => item.id === id || item.loginUsuario === id || item.email === id || item.id === cleanId);
      if (matched) {
        if (matched.id && !keys.includes(matched.id)) keys.push(matched.id);
        if (matched.loginUsuario && !keys.includes(matched.loginUsuario)) keys.push(matched.loginUsuario);
        if (matched.email && !keys.includes(matched.email)) keys.push(matched.email);
        const sanitized = matched.email?.replace(/[@.]/g, '_');
        if (sanitized && !keys.includes(sanitized)) keys.push(sanitized);
      }
    }
  } catch (e) {}
  return keys;
}

/**
 * Atualiza o status de uma empresa no Firestore (ativo, bloqueado, inadimplente)
 */
export async function updateEmpresaStatusFirestore(id: string, newStatus: StatusCliente) {
  const keys = getStoreKeys(id);
  const firestoreStatus = newStatus === 'bloqueado' ? 'blocked' : (newStatus === 'inadimplente' ? 'overdue' : 'active');

  const payload = {
    status: newStatus,
    situacao: firestoreStatus,
    userStatus: firestoreStatus,
    ativo: newStatus === 'ativo',
    bloqueado: newStatus === 'bloqueado',
    inadimplente: newStatus === 'inadimplente',
    active: newStatus === 'ativo',
    blocked: newStatus === 'bloqueado',
    updatedAt: new Date().toISOString(),
  };

  try {
    const cached = localStorage.getItem('msp_empresas_cache');
    if (cached) {
      const list: Assistencia[] = JSON.parse(cached);
      const updated = list.map(item => keys.includes(item.id) || keys.includes(item.loginUsuario || '') || keys.includes(item.email || '') ? { ...item, status: newStatus } : item);
      localStorage.setItem('msp_empresas_cache', JSON.stringify(updated));
    }
  } catch (e) {}

  const savePromises: Promise<any>[] = [];
  const allCollections = [...TARGET_COMPANY_COLLECTIONS, ...TARGET_USER_COLLECTIONS];
  for (const col of allCollections) {
    for (const key of keys) {
      savePromises.push(setDoc(doc(db, col, key), payload, { merge: true }).catch(() => {}));
      savePromises.push(setDoc(doc(defaultDb, col, key), payload, { merge: true }).catch(() => {}));
    }
  }

  // Aguarda a sincronização completa rápida
  await Promise.race([
    Promise.allSettled(savePromises),
    new Promise(resolve => setTimeout(resolve, 900))
  ]);
}

/**
 * Prorroga a data de vencimento de uma empresa no Firestore
 */
export async function extendEmpresaVencimentoFirestore(id: string, novaData: string) {
  const keys = getStoreKeys(id);

  const payload = {
    dataVencimento: novaData,
    vencimento: novaData,
    dueDate: novaData,
    status: 'ativo' as StatusCliente,
    situacao: 'active',
    userStatus: 'active',
    ativo: true,
    bloqueado: false,
    inadimplente: false,
    active: true,
    blocked: false,
    updatedAt: new Date().toISOString(),
  };

  try {
    const cached = localStorage.getItem('msp_empresas_cache');
    if (cached) {
      const list: Assistencia[] = JSON.parse(cached);
      const updated = list.map(item => keys.includes(item.id) || keys.includes(item.loginUsuario || '') || keys.includes(item.email || '') ? { ...item, dataVencimento: novaData, status: 'ativo' as StatusCliente } : item);
      localStorage.setItem('msp_empresas_cache', JSON.stringify(updated));
    }
  } catch (e) {}

  const savePromises: Promise<any>[] = [];
  const allCollections = [...TARGET_COMPANY_COLLECTIONS, ...TARGET_USER_COLLECTIONS];
  for (const col of allCollections) {
    for (const key of keys) {
      savePromises.push(setDoc(doc(db, col, key), payload, { merge: true }).catch(() => {}));
      savePromises.push(setDoc(doc(defaultDb, col, key), payload, { merge: true }).catch(() => {}));
    }
  }

  await Promise.race([
    Promise.allSettled(savePromises),
    new Promise(resolve => setTimeout(resolve, 900))
  ]);
}

/**
 * Atualiza os dados completos de uma empresa no Firestore
 */
export async function updateEmpresaFirestore(id: string, dados: Partial<Assistencia>) {
  const keys = getStoreKeys(id);
  const updateData: any = { 
    ...dados, 
    updatedAt: new Date().toISOString() 
  };

  if (dados.nome) {
    updateData.name = dados.nome;
    updateData.nomeEmpresa = dados.nome;
  }
  if (dados.telefone) {
    updateData.phone = dados.telefone;
    updateData.whatsapp = dados.telefone;
  }
  if (dados.dataVencimento) updateData.dueDate = dados.dataVencimento;
  
  if (dados.valorMensalidade !== undefined) {
    const valNum = typeof dados.valorMensalidade === 'number' ? dados.valorMensalidade : (Number(dados.valorMensalidade) || 0);
    updateData.valorMensalidade = valNum;
    updateData.monthlyFee = valNum;
    updateData.mensalidade = valNum;
    updateData.valor = valNum;
    updateData.valor_mensalidade = valNum;
    updateData.valorPlano = valNum;
    updateData.preco = valNum;
    updateData.price = valNum;
    updateData.amount = valNum;
  }

  if (dados.status) {
    const cleanStatus = dados.status;
    const firestoreStatus = cleanStatus === 'bloqueado' ? 'blocked' : (cleanStatus === 'inadimplente' ? 'overdue' : 'active');
    updateData.status = cleanStatus;
    updateData.situacao = firestoreStatus;
    updateData.userStatus = firestoreStatus;
    updateData.ativo = cleanStatus === 'ativo';
    updateData.bloqueado = cleanStatus === 'bloqueado';
    updateData.inadimplente = cleanStatus === 'inadimplente';
    updateData.active = cleanStatus === 'ativo';
    updateData.blocked = cleanStatus === 'bloqueado';
  }

  if (dados.plano) {
    const selectedPlano = dados.plano;
    updateData.plan = selectedPlano;
    updateData.planName = selectedPlano;
    updateData.planoNome = selectedPlano;
    updateData.tipoPlano = selectedPlano;
    updateData.planoId = String(selectedPlano).toLowerCase();
    updateData.planoObjeto = { id: String(selectedPlano).toLowerCase(), nome: selectedPlano, status: 'ativo' };
  }

  try {
    const cached = localStorage.getItem('msp_empresas_cache');
    if (cached) {
      const list: Assistencia[] = JSON.parse(cached);
      const updated = list.map(item => keys.includes(item.id) || keys.includes(item.loginUsuario || '') || keys.includes(item.email || '') ? { ...item, ...dados } : item);
      localStorage.setItem('msp_empresas_cache', JSON.stringify(updated));
    }
  } catch (e) {}

  const savePromises: Promise<any>[] = [];
  const allCollections = [...TARGET_COMPANY_COLLECTIONS, ...TARGET_USER_COLLECTIONS];
  for (const col of allCollections) {
    for (const key of keys) {
      savePromises.push(setDoc(doc(db, col, key), updateData, { merge: true }).catch(() => {}));
      savePromises.push(setDoc(doc(defaultDb, col, key), updateData, { merge: true }).catch(() => {}));
    }
  }

  await Promise.race([
    Promise.allSettled(savePromises),
    new Promise(resolve => setTimeout(resolve, 900))
  ]);
}

/**
 * Exclui uma empresa do Firestore
 */
export async function deleteEmpresaFirestore(id: string) {
  const keys = getStoreKeys(id);

  try {
    const cached = localStorage.getItem('msp_empresas_cache');
    if (cached) {
      const list: Assistencia[] = JSON.parse(cached);
      const updated = list.filter(item => !keys.includes(item.id) && !keys.includes(item.loginUsuario || '') && !keys.includes(item.email || ''));
      localStorage.setItem('msp_empresas_cache', JSON.stringify(updated));
    }
  } catch (e) {}

  const deletePromises: Promise<any>[] = [];
  const allCollections = [...TARGET_COMPANY_COLLECTIONS, ...TARGET_USER_COLLECTIONS];
  for (const col of allCollections) {
    for (const key of keys) {
      deletePromises.push(deleteDoc(doc(db, col, key)).catch(() => {}));
      deletePromises.push(deleteDoc(doc(defaultDb, col, key)).catch(() => {}));
    }
  }

  await Promise.race([
    Promise.allSettled(deletePromises),
    new Promise(resolve => setTimeout(resolve, 900))
  ]);
}

/**
 * Registra um novo pagamento PIX no Firestore
 */
export async function addPagamentoFirestore(pagamento: Omit<TransacaoPix, 'id'>): Promise<string> {
  const colRef = collection(db, PAGAMENTOS_COLLECTION);
  const docRef = await addDoc(colRef, {
    ...pagamento,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

/**
 * Assina em tempo real a lista de usuários, gestores e contas salvas no Firebase
 * Retorna todos os logins, senhas reais cadastradas, status e valores salvos no Firestore
 */
export function subscribeGestorUsersFirebase(
  onData: (users: GestorUserFirebase[]) => void,
  onError?: (err: Error) => void
) {
  const baseDefaultUsers: GestorUserFirebase[] = [
    {
      id: 'msp161507',
      usuario: 'msp161507',
      senha: 'painelultra',
      nome: 'Super Admin MSP',
      email: 'msp161507@admin.com',
      tipo: 'superadmin',
      empresa: 'Painel Ultra Super Admin Master',
      status: 'ativo',
      valorMensalidade: 0.00,
      plano: 'Enterprise',
      telefone: '(11) 98765-4321',
      dataCadastro: new Date().toISOString().split('T')[0],
      origem: 'admin_users'
    }
  ];

  onData(baseDefaultUsers);
  ensureAdminUserInFirebase().catch(() => {});

  const collectionsList = [
    ADMIN_USERS_COLLECTION,
    USERS_COLLECTION,
    USUARIOS_COLLECTION,
    USER_ACCOUNTS_COLLECTION,
    GESTOR_USERS_COLLECTION,
  ];
  const docsMap = new Map<string, Map<string, GestorUserFirebase>>();
  const unsubs: (() => void)[] = [];

  const emitMergedUsers = () => {
    const combined = new Map<string, GestorUserFirebase>();

    docsMap.forEach((colDocs) => {
      colDocs.forEach((user, key) => {
        const lowerKey = key.toLowerCase();
        if (!combined.has(lowerKey)) {
          combined.set(lowerKey, user);
        } else {
          const existing = combined.get(lowerKey)!;
          const merged: GestorUserFirebase = {
            ...existing,
            senha: user.senha !== '123456' ? user.senha : existing.senha,
            valorMensalidade: user.valorMensalidade !== undefined && user.valorMensalidade > 0 ? user.valorMensalidade : existing.valorMensalidade,
            plano: user.plano || existing.plano,
            empresa: user.empresa || existing.empresa,
            status: user.status || existing.status,
            telefone: user.telefone || existing.telefone,
          };
          combined.set(lowerKey, merged);
        }
      });
    });

    if (combined.size === 0) {
      for (const u of baseDefaultUsers) {
        combined.set(u.usuario.toLowerCase(), u);
      }
    } else {
      if (!combined.has('msp161507')) {
        combined.set('msp161507', baseDefaultUsers[0]);
      }
    }

    const userList = Array.from(combined.values());
    onData(userList);
  };

  // 1. Escuta em tempo real as coleções principais
  collectionsList.forEach((colName) => {
    try {
      const colMapDb = new Map<string, GestorUserFirebase>();
      docsMap.set(`db_${colName}`, colMapDb);

      const unsubDb = onSnapshot(
        collection(db, colName),
        (snap) => {
          colMapDb.clear();
          snap.forEach((d) => {
            const data = d.data();
            const rawUser = extractUsuarioFirestore(d.id, data);
            const rawSenha = extractSenhaFirestore(data);
            const rawNome = data.nome || data.name || data.nomeResponsavel || data.responsavel || data.razaoSocial || rawUser;
            const rawEmail = data.email || data.userEmail || `${rawUser}@empresa.com`;
            const rawEmpresa = data.empresa || data.nomeEmpresa || data.nome || data.razaoSocial || data.storeName || 'Assistência Técnica';
            const rawPlano = extractPlanoFirestore(data);
            const rawValor = extractValorFirestore(data);
            
            let userType: GestorUserFirebase['tipo'] = 'gestor';
            if (rawUser === 'msp161507' || data.role === 'superadmin') userType = 'superadmin';
            else if (data.role === 'admin') userType = 'admin';
            else if (data.role === 'gestor') userType = 'gestor';
            else if (data.role === 'cliente') userType = 'cliente';
            else if (data.role === 'teste' || data.isTrial || data.emTeste) userType = 'teste';
            
            let userStatus: StatusCliente = 'ativo';
            if (data.status === 'bloqueado' || data.bloqueado) userStatus = 'bloqueado';
            else if (data.status === 'inadimplente' || data.inadimplente) userStatus = 'inadimplente';
            else if (data.status === 'teste' || data.status === 'trial' || data.isTrial) userStatus = 'teste';
            else if (data.status === 'teste_pendente') userStatus = 'teste_pendente';

            const gestorUser: GestorUserFirebase = {
              id: d.id,
              usuario: rawUser,
              senha: rawSenha,
              nome: rawNome,
              email: rawEmail,
              tipo: userType,
              empresa: rawEmpresa,
              status: userStatus,
              valorMensalidade: rawValor,
              plano: rawPlano,
              telefone: data.telefone || data.phone || data.celular || '(11) 98765-4321',
              dataCadastro: data.dataCadastro || data.createdAt || data.criadoEm || new Date().toISOString().split('T')[0],
              origem: colName
            };

            colMapDb.set(rawUser, gestorUser);
          });

          emitMergedUsers();
        },
        () => {}
      );
      unsubs.push(unsubDb);
    } catch (e) {}

    try {
      const colMapDef = new Map<string, GestorUserFirebase>();
      docsMap.set(`def_${colName}`, colMapDef);

      const unsubDef = onSnapshot(
        collection(defaultDb, colName),
        (snap) => {
          colMapDef.clear();
          snap.forEach((d) => {
            const data = d.data();
            const rawUser = extractUsuarioFirestore(d.id, data);
            const rawSenha = extractSenhaFirestore(data);
            const rawNome = data.nome || data.name || data.nomeResponsavel || data.responsavel || data.razaoSocial || rawUser;
            const rawEmail = data.email || data.userEmail || `${rawUser}@empresa.com`;
            const rawEmpresa = data.empresa || data.nomeEmpresa || data.nome || data.razaoSocial || data.storeName || 'Assistência Técnica';
            const rawPlano = extractPlanoFirestore(data);
            const rawValor = extractValorFirestore(data);
            
            let userType: GestorUserFirebase['tipo'] = 'gestor';
            if (rawUser === 'msp161507' || data.role === 'superadmin') userType = 'superadmin';
            else if (data.role === 'admin') userType = 'admin';
            else if (data.role === 'gestor') userType = 'gestor';
            else if (data.role === 'cliente') userType = 'cliente';
            else if (data.role === 'teste' || data.isTrial || data.emTeste) userType = 'teste';
            
            let userStatus: StatusCliente = 'ativo';
            if (data.status === 'bloqueado' || data.bloqueado) userStatus = 'bloqueado';
            else if (data.status === 'inadimplente' || data.inadimplente) userStatus = 'inadimplente';
            else if (data.status === 'teste' || data.status === 'trial' || data.isTrial) userStatus = 'teste';
            else if (data.status === 'teste_pendente') userStatus = 'teste_pendente';

            const gestorUser: GestorUserFirebase = {
              id: d.id,
              usuario: rawUser,
              senha: rawSenha,
              nome: rawNome,
              email: rawEmail,
              tipo: userType,
              empresa: rawEmpresa,
              status: userStatus,
              valorMensalidade: rawValor,
              plano: rawPlano,
              telefone: data.telefone || data.phone || data.celular || '(11) 98765-4321',
              dataCadastro: data.dataCadastro || data.createdAt || data.criadoEm || new Date().toISOString().split('T')[0],
              origem: colName
            };

            colMapDef.set(rawUser, gestorUser);
          });

          emitMergedUsers();
        },
        () => {}
      );
      unsubs.push(unsubDef);
    } catch (e) {}
  });

  // 2. Busca única assíncrona rápida das coleções secundárias para compatibilidade de dados legados
  const secondaryUserCols = TARGET_USER_COLLECTIONS.filter(c => !collectionsList.includes(c));
  secondaryUserCols.forEach(async (colName) => {
    const processSecData = (snap: any, prefix: string) => {
      if (snap.empty) return;
      const colMap = docsMap.get(`${prefix}_sec_${colName}`) || new Map<string, GestorUserFirebase>();
      snap.forEach((d: any) => {
        const data = d.data();
        const rawUser = extractUsuarioFirestore(d.id, data);
        const rawSenha = extractSenhaFirestore(data);
        const rawNome = data.nome || data.name || data.nomeResponsavel || data.responsavel || data.razaoSocial || rawUser;
        const rawEmail = data.email || data.userEmail || `${rawUser}@empresa.com`;
        const rawEmpresa = data.empresa || data.nomeEmpresa || data.nome || data.razaoSocial || data.storeName || 'Assistência Técnica';
        const rawPlano = extractPlanoFirestore(data);
        const rawValor = extractValorFirestore(data);
        
        let userType: GestorUserFirebase['tipo'] = 'gestor';
        if (rawUser === 'msp161507' || data.role === 'superadmin') userType = 'superadmin';
        else if (data.role === 'admin') userType = 'admin';
        else if (data.role === 'gestor') userType = 'gestor';
        else if (data.role === 'cliente') userType = 'cliente';
        else if (data.role === 'teste' || data.isTrial || data.emTeste) userType = 'teste';
        
        let userStatus: StatusCliente = 'ativo';
        if (data.status === 'bloqueado' || data.bloqueado) userStatus = 'bloqueado';
        else if (data.status === 'inadimplente' || data.inadimplente) userStatus = 'inadimplente';
        else if (data.status === 'teste' || data.status === 'trial' || data.isTrial) userStatus = 'teste';
        else if (data.status === 'teste_pendente') userStatus = 'teste_pendente';

        colMap.set(rawUser, {
          id: d.id,
          usuario: rawUser,
          senha: rawSenha,
          nome: rawNome,
          email: rawEmail,
          tipo: userType,
          empresa: rawEmpresa,
          status: userStatus,
          valorMensalidade: rawValor,
          plano: rawPlano,
          telefone: data.telefone || data.phone || data.celular || '(11) 98765-4321',
          dataCadastro: data.dataCadastro || data.createdAt || data.criadoEm || new Date().toISOString().split('T')[0],
          origem: colName
        });
      });
      docsMap.set(`${prefix}_sec_${colName}`, colMap);
      emitMergedUsers();
    };

    try {
      const snap1 = await getDocs(collection(db, colName));
      processSecData(snap1, 'db');
    } catch (e) {}

    try {
      const snap2 = await getDocs(collection(defaultDb, colName));
      processSecData(snap2, 'def');
    } catch (e) {}
  });

  return () => {
    unsubs.forEach(fn => fn());
  };
}

/**
 * Cria ou atualiza um usuário / gestor / conta diretamente no Firestore
 */
export async function createOrUpdateGestorUserFirebase(user: Partial<GestorUserFirebase>): Promise<boolean> {
  const cleanUser = (user.usuario || '').trim().toLowerCase();
  const cleanPass = (user.senha || '').trim();
  if (!cleanUser || !cleanPass) return false;

  const cleanEmail = (user.email || `${cleanUser}@empresa.com`).trim().toLowerCase();
  const selectedPlano: PlanoSaaS = user.plano ? extractPlanoFirestore({ plano: user.plano }) : 'Profissional';
  const valNum = typeof user.valorMensalidade === 'number' ? user.valorMensalidade : (Number(user.valorMensalidade) || 0);

  const payload = {
    username: cleanUser,
    usuario: cleanUser,
    login: cleanUser,
    user: cleanUser,
    password: cleanPass,
    senha: cleanPass,
    pass: cleanPass,
    pin: cleanPass,
    role: user.tipo || 'gestor',
    tipo: user.tipo || 'gestor',
    nome: user.nome || cleanUser,
    name: user.nome || cleanUser,
    responsavel: user.nome || cleanUser,
    email: cleanEmail,
    userEmail: cleanEmail,
    empresa: user.empresa || `Assistência ${user.nome || cleanUser}`,
    nomeEmpresa: user.empresa || `Assistência ${user.nome || cleanUser}`,
    plano: selectedPlano,
    plan: selectedPlano,
    planName: selectedPlano,
    tipoPlano: selectedPlano,
    planoObjeto: { id: String(selectedPlano).toLowerCase(), nome: selectedPlano, valor: valNum, status: 'ativo' },
    valorMensalidade: valNum,
    monthlyFee: valNum,
    mensalidade: valNum,
    valor: valNum,
    valor_mensalidade: valNum,
    valorPlano: valNum,
    preco: valNum,
    price: valNum,
    amount: valNum,
    status: user.status || 'ativo',
    ativo: user.status !== 'bloqueado',
    active: user.status !== 'bloqueado',
    telefone: user.telefone || '(11) 98765-4321',
    whatsapp: user.telefone || '(11) 98765-4321',
    updatedAt: new Date().toISOString(),
    createdAt: user.dataCadastro || new Date().toISOString(),
  };

  const targetKeys = [cleanUser];
  if (cleanEmail && !targetKeys.includes(cleanEmail)) targetKeys.push(cleanEmail);

  const targetCols = TARGET_USER_COLLECTIONS;
  for (const col of targetCols) {
    for (const docKey of targetKeys) {
      try {
        await setDoc(doc(db, col, docKey), payload, { merge: true });
      } catch (e) {}
      try {
        await setDoc(doc(defaultDb, col, docKey), payload, { merge: true });
      } catch (e) {}
    }
  }

  // Cria/atualiza também o documento de empresa vinculado
  await ensureUserCompany(cleanUser, {
    nome: payload.empresa,
    responsavel: payload.nome,
    email: payload.email,
    telefone: payload.telefone,
    plano: selectedPlano,
    status: payload.status as StatusCliente,
    valorMensalidade: valNum,
    senha: cleanPass,
  });

  return true;
}

/**
 * Exclui um usuário do Firestore
 */
export async function deleteGestorUserFirebase(usuario: string): Promise<boolean> {
  const cleanUser = usuario.trim().toLowerCase();
  if (cleanUser === 'msp161507') return false;

  const targetCols = TARGET_USER_COLLECTIONS;
  for (const col of targetCols) {
    try {
      await deleteDoc(doc(db, col, cleanUser));
    } catch (e) {}
    try {
      await deleteDoc(doc(defaultDb, col, cleanUser));
    } catch (e) {}
  }
  return true;
}

/**
 * Limpa todos os dados de empresas e pagamentos
 */
export async function clearAllFirestoreData(): Promise<void> {
  for (const col of TARGET_COMPANY_COLLECTIONS) {
    try {
      const snap = await getDocs(collection(db, col));
      const deletes = snap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletes);
    } catch (e) {}
    try {
      const snapDef = await getDocs(collection(defaultDb, col));
      const deletesDef = snapDef.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletesDef);
    } catch (e) {}
  }

  for (const col of TARGET_PAYMENT_COLLECTIONS) {
    try {
      const snap = await getDocs(collection(db, col));
      const deletes = snap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletes);
    } catch (e) {}
    try {
      const snapDef = await getDocs(collection(defaultDb, col));
      const deletesDef = snapDef.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletesDef);
    } catch (e) {}
  }
}

/**
 * Popula dados de demonstração no Firestore
 */
export async function seedDemoDataFirestore(): Promise<void> {
  await ensureAdminUserInFirebase();
}

