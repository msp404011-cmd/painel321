export type StatusCliente = 'ativo' | 'bloqueado' | 'inadimplente' | 'teste' | 'teste_pendente';

export type PlanoSaaS = 'Plano PDV & Vendas' | 'Plano Assistência Técnica' | 'Plano Completo + Revenda' | 'Teste Grátis (7 Dias)' | 'Básico' | 'Profissional' | 'Enterprise' | string;

export interface PlanoGestorInfo {
  id: string;
  nome: string;
  valor: number;
  descricao?: string;
  subtitulo?: string;
  destaque?: boolean;
  badge?: string;
  recursos?: string[];
  ativo?: boolean;
  diasValidade?: number;
  cor?: 'sky' | 'cyan' | 'amber' | 'purple' | string;
}

export interface Assistencia {
  id: string;
  nome: string;
  cnpj: string;
  responsavel: string;
  email: string;
  telefone: string;
  cidadeUf: string;
  plano: PlanoSaaS;
  valorMensalidade: number;
  status: StatusCliente;
  loginUsuario?: string;
  senha?: string;
  dataVencimento: string; // YYYY-MM-DD
  dataCadastro: string;   // YYYY-MM-DD
  ultimoPagamento: string; // YYYY-MM-DD
  metodoPagamento: 'PIX Mercado Pago' | 'Cartão' | 'Boleto';
  observacoes?: string;
}

export interface GestorUserFirebase {
  id: string;
  usuario: string;
  senha: string;
  nome: string;
  email: string;
  tipo: 'superadmin' | 'admin' | 'gestor' | 'teste' | 'cliente';
  empresa: string;
  status: StatusCliente;
  valorMensalidade: number;
  plano: string;
  telefone?: string;
  dataCadastro: string;
  origem: string;
}

export type StatusTransacao = 'aprovado' | 'pendente' | 'estornado' | 'falhado';

export interface TransacaoPix {
  id: string; // Mercado Pago Payment ID
  assistenciaId: string;
  assistenciaNome: string;
  cnpj: string;
  valor: number;
  data: string; // Data e Hora da transação
  status: StatusTransacao;
  metodo: 'PIX Mercado Pago';
  codigoPixCopyPaste?: string;
}

export type FiltroStatus = 'todos' | 'ativos' | 'bloqueados' | 'inadimplentes' | 'teste' | 'teste_pendente';

export interface StatsFinanceiro {
  totalFaturadoMes: number;
  assinaturasAtivas: number;
  totalAssistencias: number;
  totalInadimplentes: number;
  totalBloqueados: number;
  ticketMedio: number;
  taxaInadimplencia: number;
}

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}
