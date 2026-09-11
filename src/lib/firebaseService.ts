import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Assistencia, TransacaoPix, StatusCliente, StatusTransacao } from '../types';
import { INITIAL_ASSISTENCIAS, INITIAL_TRANSACTIONS } from '../data/mockData';

const EMPRESAS_COLLECTION = 'empresas';
const PAGAMENTOS_COLLECTION = 'pagamentos';

/**
 * Normaliza um documento do Firestore da coleção 'empresas' para a interface Assistencia
 */
function mapDocToAssistencia(docId: string, data: any): Assistencia {
  // Determina status considerando string ou booleanos
  let status: StatusCliente = 'ativo';
  if (data.status === 'ativo' || data.status === 'bloqueado' || data.status === 'inadimplente') {
    status = data.status;
  } else if (data.bloqueado === true || data.ativo === false) {
    status = 'bloqueado';
  } else if (data.inadimplente === true) {
    status = 'inadimplente';
  }

  return {
    id: docId,
    nome: data.nome || data.nomeFantasia || data.razaoSocial || data.nomeEmpresa || 'Empresa sem nome',
    cnpj: data.cnpj || data.documento || '00.000.000/0001-00',
    responsavel: data.responsavel || data.nomeResponsavel || data.contato || 'Não informado',
    email: data.email || 'contato@empresa.com',
    telefone: data.telefone || data.celular || data.whatsapp || '(00) 00000-0000',
    cidadeUf: data.cidadeUf || data.cidade || 'São Paulo/SP',
    plano: data.plano || 'Profissional',
    valorMensalidade: typeof data.valorMensalidade === 'number' ? data.valorMensalidade : (Number(data.valor) || 199.90),
    status: status,
    dataVencimento: data.dataVencimento || data.vencimento || new Date().toISOString().split('T')[0],
    dataCadastro: data.dataCadastro || data.criadoEm || new Date().toISOString().split('T')[0],
    ultimoPagamento: data.ultimoPagamento || new Date().toISOString().split('T')[0],
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
 * Inscreve-se nas alterações em tempo real da coleção 'empresas'
 */
export function subscribeEmpresas(
  onData: (empresas: Assistencia[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, EMPRESAS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Assistencia[] = snapshot.docs.map((d) => mapDocToAssistencia(d.id, d.data()));
      onData(list);
    },
    (error) => {
      console.error('Erro no listener do Firestore (empresas):', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Inscreve-se nas alterações em tempo real da coleção 'pagamentos'
 */
export function subscribePagamentos(
  onData: (pagamentos: TransacaoPix[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, PAGAMENTOS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: TransacaoPix[] = snapshot.docs.map((d) => mapDocToTransacao(d.id, d.data()));
      onData(list);
    },
    (error) => {
      console.error('Erro no listener do Firestore (pagamentos):', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Adiciona uma nova empresa/assistência no Firestore
 */
export async function addEmpresaFirestore(empresa: Omit<Assistencia, 'id'>): Promise<string> {
  const colRef = collection(db, EMPRESAS_COLLECTION);
  const docRef = await addDoc(colRef, {
    ...empresa,
    ativo: empresa.status === 'ativo',
    bloqueado: empresa.status === 'bloqueado',
    inadimplente: empresa.status === 'inadimplente',
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

/**
 * Atualiza o status de uma empresa no Firestore (ativo, bloqueado, inadimplente)
 */
export async function updateEmpresaStatusFirestore(id: string, newStatus: StatusCliente) {
  const docRef = doc(db, EMPRESAS_COLLECTION, id);
  await updateDoc(docRef, {
    status: newStatus,
    ativo: newStatus === 'ativo',
    bloqueado: newStatus === 'bloqueado',
    inadimplente: newStatus === 'inadimplente',
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Prorroga a data de vencimento de uma empresa no Firestore
 */
export async function extendEmpresaVencimentoFirestore(id: string, novaData: string) {
  const docRef = doc(db, EMPRESAS_COLLECTION, id);
  await updateDoc(docRef, {
    dataVencimento: novaData,
    status: 'ativo',
    ativo: true,
    bloqueado: false,
    inadimplente: false,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Atualiza os dados completos de uma empresa no Firestore
 */
export async function updateEmpresaFirestore(id: string, dados: Partial<Assistencia>) {
  const docRef = doc(db, EMPRESAS_COLLECTION, id);
  const updateData: any = { ...dados, updatedAt: new Date().toISOString() };
  if (dados.status) {
    updateData.ativo = dados.status === 'ativo';
    updateData.bloqueado = dados.status === 'bloqueado';
    updateData.inadimplente = dados.status === 'inadimplente';
  }
  await updateDoc(docRef, updateData);
}

/**
 * Exclui uma empresa do Firestore
 */
export async function deleteEmpresaFirestore(id: string) {
  const docRef = doc(db, EMPRESAS_COLLECTION, id);
  await deleteDoc(docRef);
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
 * Carrega dados de demonstração no Firestore (popula empresas e pagamentos)
 */
export async function seedDemoDataFirestore() {
  // Adiciona empresas
  for (const item of INITIAL_ASSISTENCIAS) {
    const { id, ...data } = item;
    const docRef = doc(db, EMPRESAS_COLLECTION, id);
    await setDoc(docRef, {
      ...data,
      ativo: data.status === 'ativo',
      bloqueado: data.status === 'bloqueado',
      inadimplente: data.status === 'inadimplente',
      createdAt: new Date().toISOString(),
    });
  }

  // Adiciona pagamentos
  for (const tx of INITIAL_TRANSACTIONS) {
    const { id, ...data } = tx;
    const docRef = doc(db, PAGAMENTOS_COLLECTION, id);
    await setDoc(docRef, {
      ...data,
      createdAt: new Date().toISOString(),
    });
  }
}

/**
 * Limpa/Zera todos os documentos das coleções 'empresas' e 'pagamentos' no Firestore
 */
export async function clearAllFirestoreData() {
  const empresasSnap = await getDocs(collection(db, EMPRESAS_COLLECTION));
  for (const d of empresasSnap.docs) {
    await deleteDoc(d.ref);
  }

  const pagamentosSnap = await getDocs(collection(db, PAGAMENTOS_COLLECTION));
  for (const d of pagamentosSnap.docs) {
    await deleteDoc(d.ref);
  }
}
