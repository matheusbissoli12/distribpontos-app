export type Distributor = {
  id: string;
  nome: string;
  cnpj: string;
  cidade: string;
  bairro: string;
  segmento: string;
  cor: string;
  plano: 'Essencial' | 'Pro' | 'Rede';
  status: 'implantacao' | 'ativa' | 'suspensa';
  contrato_assinado: boolean;
  horario_abre: string;
  horario_fecha: string;
  pausada: boolean;
  pedido_minimo: number;
  frete_gratis_acima: number;
  prazo_texto: string;
  pts_por_real: number;
  nivel_prata: number;
  nivel_ouro: number;
  validade_meses: number;
  timezone: string;
  pix_ativo: boolean;
};

export type Area = { distributor_id: string; bairro_id: number; taxa: number };
export type Bairro = { id: number; nome: string; cidade: string };

export type Product = {
  id: string;
  distributor_id: string;
  nome: string;
  categoria: string;
  unidade: string;
  preco: number;
  estoque: number;
  ativo: boolean;
  pontos_dobro: boolean;
};

export type Reward = { id: string; distributor_id: string; nome: string; categoria: string; custo: number; ativo: boolean };

export type OrderItem = { id: number; order_id: number; product_id: string | null; nome: string; preco: number; qty: number };

export type Order = {
  id: number;
  distributor_id: string;
  customer_id: string | null;
  cpf: string;
  cliente_nome: string;
  cliente_celular: string | null;
  canal: 'app' | 'balcao';
  tipo: 'compra' | 'resgate';
  status: 'aguardando_pagamento' | 'novo' | 'separando' | 'em_rota' | 'entregue' | 'cancelado';
  subtotal: number;
  frete: number;
  total: number;
  pontos: number;
  pag_metodo: 'pix' | 'cartao' | 'dinheiro' | null;
  pag_status: string | null;
  pix_qr: string | null;
  pix_qr_base64: string | null;
  entrega: 'entrega' | 'retirada';
  endereco: { bairro_id: number; bairro: string; cidade: string; rua: string; comp: string } | null;
  entregador_id: string | null;
  entregador_nome: string | null;
  eta: string | null;
  cupom: string | null;
  motivo_cancelamento: string | null;
  created_at: string;
  order_items?: OrderItem[];
  distributors?: { nome: string; cor: string } | null;
};

export type Wallet = {
  distributor_id: string;
  nome: string;
  cor: string;
  saldo: number;
  acumulado_12m: number;
  pendente: number;
  nivel: 'Bronze' | 'Prata' | 'Ouro';
  vence_30d: number;
};

export type Profile = { id: string; nome: string | null; cpf: string | null; celular: string | null; email: string | null; mkt_optin: boolean; is_admin: boolean };

export type Member = { distributor_id: string; user_id: string; role: 'dono' | 'caixa' | 'entregador'; nome: string; email: string | null };
