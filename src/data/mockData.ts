import { Assistencia, TransacaoPix, PlanoGestorInfo } from '../types';

export const GESTOR_OFFICIAL_PLANS: PlanoGestorInfo[] = [
  {
    id: 'pdv_vendas',
    nome: 'Plano PDV & Vendas',
    valor: 34.90,
    badge: 'PDV & VENDAS',
    subtitulo: 'Para comércios e lojas de vendas balcão',
    descricao: 'Focado exclusivamente em Frente de Caixa (PDV), Vendas Balcão, Estoque e Clientes.',
    cor: 'cyan',
    recursos: [
      'Frente de Caixa (PDV) Rápido e Ágil',
      'Vendas Balcão e Emissão de Recibos Térmicos',
      'Cadastro de Produtos e Controle de Estoque',
      'Gestão de Clientes e Crediário / A Prazo',
      'Abertura, Sangria e Fechamento de Caixa',
      'Relatórios de Vendas e Faturamento Balcão',
    ],
  },
  {
    id: 'assistencia_tecnica',
    nome: 'Plano Assistência Técnica',
    valor: 69.90,
    badge: '⭐ RECOMENDADO',
    destaque: true,
    subtitulo: 'Completo para gestão de O.S. e Loja',
    descricao: 'Solução completa para Assistência Técnica: OS, Aparelhos, Checklists, PDV e Peças.',
    cor: 'amber',
    recursos: [
      'Ordens de Serviço Ilimitadas todo mês',
      'Gestão de Aparelhos e Equipamentos',
      'Checklist de Entrada e Saída com Fotos',
      'Frente de Caixa (PDV) e Vendas Balcão',
      'Produtos, Peças e Insumos Ilimitados',
      'Controle Financeiro de Caixa e DRE',
      'Relatórios Gerenciais e Exportação PDF',
    ],
  },
  {
    id: 'completo_revenda',
    nome: 'Plano Completo + Revenda',
    valor: 79.90,
    badge: 'COMPLETO + REVENDA',
    subtitulo: 'Módulo completo de revendedores e atacado',
    descricao: 'Tudo da Assistência Técnica + Módulo de Revenda, Atacado e Consignados.',
    cor: 'purple',
    recursos: [
      'Tudo do Plano Assistência Técnica incluso',
      'Módulo de Revendedores e Atacado Completo',
      'Tabela de Preços Diferenciada (Varejo vs Revenda)',
      'Cadastro e Gestão de Revendedores Parceiros',
      'Controle Automático de Comissões de Revenda',
      'Vendas Consignadas e Fechamento no PDV',
    ],
  },
];

export const INITIAL_ASSISTENCIAS: Assistencia[] = [
  {
    id: 'ast-001',
    nome: 'TechFix Celulares & Notebooks',
    cnpj: '24.819.304/0001-88',
    responsavel: 'Carlos Eduardo Santos',
    email: 'carlos@techfix.com.br',
    telefone: '(11) 98765-4321',
    cidadeUf: 'São Paulo/SP',
    plano: 'Profissional',
    valorMensalidade: 299.90,
    status: 'ativo',
    dataVencimento: '2026-09-28',
    dataCadastro: '2025-03-15',
    ultimoPagamento: '2026-08-28',
    metodoPagamento: 'PIX Mercado Pago',
    observacoes: 'Cliente VIP, suporte prioritário habilitado.',
  },
  {
    id: 'ast-002',
    nome: 'Assistência Técnica iDoctor Express',
    cnpj: '31.402.119/0001-42',
    responsavel: 'Mariana Oliveira Rocha',
    email: 'financeiro@idoctor.com.br',
    telefone: '(21) 97123-8899',
    cidadeUf: 'Rio de Janeiro/RJ',
    plano: 'Enterprise',
    valorMensalidade: 599.90,
    status: 'ativo',
    dataVencimento: '2026-10-05',
    dataCadastro: '2024-11-10',
    ultimoPagamento: '2026-09-05',
    metodoPagamento: 'PIX Mercado Pago',
    observacoes: 'Rede com 3 filiais ativas.',
  },
  {
    id: 'ast-003',
    nome: 'SmartAssist Conserto Rápido',
    cnpj: '18.903.451/0001-09',
    responsavel: 'Rodrigo Mendonça',
    email: 'rodrigo@smartassist.com',
    telefone: '(31) 99881-2233',
    cidadeUf: 'Belo Horizonte/MG',
    plano: 'Básico',
    valorMensalidade: 149.90,
    status: 'inadimplente',
    dataVencimento: '2026-09-02',
    dataCadastro: '2025-08-01',
    ultimoPagamento: '2026-08-02',
    metodoPagamento: 'PIX Mercado Pago',
    observacoes: 'Pagamento pendente do mês atual.',
  },
  {
    id: 'ast-004',
    nome: 'MegaByte Informática & Games',
    cnpj: '45.120.988/0001-15',
    responsavel: 'Fernanda Lima Castro',
    email: 'contato@megabytegames.com.br',
    telefone: '(41) 99112-4455',
    cidadeUf: 'Curitiba/PR',
    plano: 'Profissional',
    valorMensalidade: 299.90,
    status: 'bloqueado',
    dataVencimento: '2026-08-15',
    dataCadastro: '2025-01-20',
    ultimoPagamento: '2026-07-15',
    metodoPagamento: 'PIX Mercado Pago',
    observacoes: 'Acesso bloqueado por falta de pagamento há mais de 25 dias.',
  },
  {
    id: 'ast-005',
    nome: 'Hospital do Smartphone',
    cnpj: '12.784.091/0001-77',
    responsavel: 'Lucas Henrique Ribeiro',
    email: 'lucas@hospitalsmartphone.com.br',
    telefone: '(81) 98432-1000',
    cidadeUf: 'Recife/PE',
    plano: 'Profissional',
    valorMensalidade: 299.90,
    status: 'ativo',
    dataVencimento: '2026-09-22',
    dataCadastro: '2025-05-12',
    ultimoPagamento: '2026-08-22',
    metodoPagamento: 'PIX Mercado Pago',
  },
  {
    id: 'ast-006',
    nome: 'Central de Eletrônicos & TV Fix',
    cnpj: '09.334.812/0001-33',
    responsavel: 'Sérgio Murilo Alencar',
    email: 'sergio@centralelectro.com',
    telefone: '(51) 99555-7788',
    cidadeUf: 'Porto Alegre/RS',
    plano: 'Básico',
    valorMensalidade: 149.90,
    status: 'inadimplente',
    dataVencimento: '2026-08-30',
    dataCadastro: '2025-06-18',
    ultimoPagamento: '2026-07-30',
    metodoPagamento: 'PIX Mercado Pago',
    observacoes: 'Aguardando confirmação de comprovante via WhatsApp.',
  },
  {
    id: 'ast-007',
    nome: 'Infotech Soluções em Hardware',
    cnpj: '38.672.109/0001-50',
    responsavel: 'Beatriz Vasconcelos',
    email: 'beatriz@infotechsolucoes.com',
    telefone: '(61) 98111-9900',
    cidadeUf: 'Brasília/DF',
    plano: 'Enterprise',
    valorMensalidade: 599.90,
    status: 'ativo',
    dataVencimento: '2026-10-01',
    dataCadastro: '2024-09-01',
    ultimoPagamento: '2026-09-01',
    metodoPagamento: 'PIX Mercado Pago',
  },
  {
    id: 'ast-008',
    nome: 'Recipros Consertos de Precisão',
    cnpj: '50.198.233/0001-99',
    responsavel: 'Guilherme Augusto Diniz',
    email: 'guilherme@recipros.com.br',
    telefone: '(71) 98877-6655',
    cidadeUf: 'Salvador/BA',
    plano: 'Básico',
    valorMensalidade: 149.90,
    status: 'bloqueado',
    dataVencimento: '2026-07-10',
    dataCadastro: '2025-02-14',
    ultimoPagamento: '2026-06-10',
    metodoPagamento: 'PIX Mercado Pago',
    observacoes: 'Solicitou congelamento temporário por reforma na loja.',
  },
  {
    id: 'ast-009',
    nome: 'Valedoi OS & Manutenção',
    cnpj: '27.491.002/0001-64',
    responsavel: 'Vanessa Martins Souza',
    email: 'vanessa@valedoios.com',
    telefone: '(19) 99444-3322',
    cidadeUf: 'Campinas/SP',
    plano: 'Profissional',
    valorMensalidade: 299.90,
    status: 'ativo',
    dataVencimento: '2026-09-18',
    dataCadastro: '2025-04-10',
    ultimoPagamento: '2026-08-18',
    metodoPagamento: 'PIX Mercado Pago',
  },
  {
    id: 'ast-010',
    nome: 'EletroPrime Assistência Especializada',
    cnpj: '33.910.450/0001-21',
    responsavel: 'Felipe Barreto',
    email: 'felipe@eletroprime.com.br',
    telefone: '(85) 99777-1122',
    cidadeUf: 'Fortaleza/CE',
    plano: 'Enterprise',
    valorMensalidade: 599.90,
    status: 'ativo',
    dataVencimento: '2026-10-08',
    dataCadastro: '2024-12-01',
    ultimoPagamento: '2026-09-08',
    metodoPagamento: 'PIX Mercado Pago',
  }
];

export const INITIAL_TRANSACTIONS: TransacaoPix[] = [
  {
    id: 'MP-PIX-98230192',
    assistenciaId: 'ast-002',
    assistenciaNome: 'Assistência Técnica iDoctor Express',
    cnpj: '31.402.119/0001-42',
    valor: 599.90,
    data: '2026-09-05 14:32:10',
    status: 'aprovado',
    metodo: 'PIX Mercado Pago',
    codigoPixCopyPaste: '00020126580014BR.GOV.BCB.PIX0136mp-pix-idoctor-599905204000053039865802BR5915MERCADO PAGO SA6009SAO PAULO62070503***6304D1A9',
  },
  {
    id: 'MP-PIX-98211044',
    assistenciaId: 'ast-010',
    assistenciaNome: 'EletroPrime Assistência Especializada',
    cnpj: '33.910.450/0001-21',
    valor: 599.90,
    data: '2026-09-08 09:15:42',
    status: 'aprovado',
    metodo: 'PIX Mercado Pago',
    codigoPixCopyPaste: '00020126580014BR.GOV.BCB.PIX0136mp-pix-eletroprime-599905204000053039865802BR5915MERCADO PAGO SA6009SAO PAULO62070503***6304E88F',
  },
  {
    id: 'MP-PIX-98199201',
    assistenciaId: 'ast-007',
    assistenciaNome: 'Infotech Soluções em Hardware',
    cnpj: '38.672.109/0001-50',
    valor: 599.90,
    data: '2026-09-01 18:45:00',
    status: 'aprovado',
    metodo: 'PIX Mercado Pago',
    codigoPixCopyPaste: '00020126580014BR.GOV.BCB.PIX0136mp-pix-infotech-599905204000053039865802BR5915MERCADO PAGO SA6009SAO PAULO62070503***6304A12B',
  },
  {
    id: 'MP-PIX-98150499',
    assistenciaId: 'ast-001',
    assistenciaNome: 'TechFix Celulares & Notebooks',
    cnpj: '24.819.304/0001-88',
    valor: 299.90,
    data: '2026-08-28 11:20:18',
    status: 'aprovado',
    metodo: 'PIX Mercado Pago',
  },
  {
    id: 'MP-PIX-98123001',
    assistenciaId: 'ast-005',
    assistenciaNome: 'Hospital do Smartphone',
    cnpj: '12.784.091/0001-77',
    valor: 299.90,
    data: '2026-08-22 16:04:33',
    status: 'aprovado',
    metodo: 'PIX Mercado Pago',
  },
  {
    id: 'MP-PIX-98099112',
    assistenciaId: 'ast-009',
    assistenciaNome: 'Valedoi OS & Manutenção',
    cnpj: '27.491.002/0001-64',
    valor: 299.90,
    data: '2026-08-18 10:50:11',
    status: 'aprovado',
    metodo: 'PIX Mercado Pago',
  },
  {
    id: 'MP-PIX-98041088',
    assistenciaId: 'ast-003',
    assistenciaNome: 'SmartAssist Conserto Rápido',
    cnpj: '18.903.451/0001-09',
    valor: 149.90,
    data: '2026-09-02 08:30:00',
    status: 'pendente',
    metodo: 'PIX Mercado Pago',
    codigoPixCopyPaste: '00020126580014BR.GOV.BCB.PIX0136mp-pix-smartassist-149905204000053039865802BR5915MERCADO PAGO SA6009SAO PAULO62070503***6304C991',
  },
  {
    id: 'MP-PIX-98012903',
    assistenciaId: 'ast-006',
    assistenciaNome: 'Central de Eletrônicos & TV Fix',
    cnpj: '09.334.812/0001-33',
    valor: 149.90,
    data: '2026-08-30 19:10:05',
    status: 'pendente',
    metodo: 'PIX Mercado Pago',
  },
  {
    id: 'MP-PIX-97990122',
    assistenciaId: 'ast-004',
    assistenciaNome: 'MegaByte Informática & Games',
    cnpj: '45.120.988/0001-15',
    valor: 299.90,
    data: '2026-08-15 15:00:22',
    status: 'falhado',
    metodo: 'PIX Mercado Pago',
  }
];

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDateBR(dateString: string): string {
  if (!dateString) return '-';
  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
}

export function cleanCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

export function formatCNPJ(cnpj: string): string {
  const digits = cleanCNPJ(cnpj);
  if (digits.length !== 14) return cnpj;
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export function addDays(days: number, fromDate?: string): string {
  const baseDate = fromDate ? new Date(fromDate) : new Date();
  if (isNaN(baseDate.getTime())) {
    const today = new Date();
    today.setDate(today.getDate() + days);
    return today.toISOString().split('T')[0];
  }
  const target = new Date(baseDate);
  target.setDate(target.getDate() + days);
  return target.toISOString().split('T')[0];
}

export function add30Days(dateString: string): string {
  const baseDate = dateString ? new Date(dateString) : new Date();
  if (isNaN(baseDate.getTime())) {
    const today = new Date();
    today.setDate(today.getDate() + 30);
    return today.toISOString().split('T')[0];
  }
  
  // If the date is already expired, extend starting from TODAY
  const today = new Date();
  today.setHours(0,0,0,0);
  
  let targetDate = new Date(baseDate);
  if (targetDate < today) {
    targetDate = new Date(today);
  }
  
  targetDate.setDate(targetDate.getDate() + 30);
  return targetDate.toISOString().split('T')[0];
}

export function isOverdue(dateString: string): boolean {
  if (!dateString) return false;
  const venc = new Date(dateString);
  const today = new Date();
  today.setHours(0,0,0,0);
  return venc < today;
}
