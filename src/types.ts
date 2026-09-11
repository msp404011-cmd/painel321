export type StatusCliente = 'ativo' | 'bloqueado' | 'inadimplente';

export type PlanoSaaS = 'Básico' | 'Profissional' | 'Enterprise';

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
  dataVencimento: string; // YYYY-MM-DD
  dataCadastro: string;   // YYYY-MM-DD
  ultimoPagamento: string; // YYYY-MM-DD
  metodoPagamento: 'PIX Mercado Pago' | 'Cartão' | 'Boleto';
  observacoes?: string;
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

export type FiltroStatus = 'todos' | 'ativos' | 'bloqueados' | 'inadimplentes';

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
