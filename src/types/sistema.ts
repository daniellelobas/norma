export type Cliente = {
  id: number
  nome: string
  cpf?: string
  dataNascimento?: string
  telefone: string
  email: string
  cep?: string
  endereco?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  tipoPele?: string
  tomBase?: string
  limiteCrediario?: string
  situacao?: string
  observacoes?: string
  dataCadastro?: string
}

export type Produto = {
  id: number
  codigo: string
  nome: string
  marca: string
  categoria?: string
  precoCusto?: number
  precoVenda: number
  quantidade: number
  estoqueMinimo?: number
  imagem?: string
}

export type ItemVenda = {
  produtoId: number
  codigo: string
  nome: string
  marca: string
  precoUnitario: number
  quantidade: number
}

export type FormaPagamento = 'Dinheiro' | 'Pix' | 'Cartão' | 'Fiado'

export type VendaSalva = {
  id: number
  data: string
  clienteId: number
  clienteNome: string
  itens: ItemVenda[]
  subtotal: number
  total: number
  formaPagamento: FormaPagamento
  statusPagamento: 'Pago' | 'Pendente'
  dataVencimento: string | null
}

export type ContaPagar = {
  id: number
  descricao: string
  categoria?: string
  fornecedorNome?: string
  valor: number
  vencimento: string
  status: 'Pendente' | 'Pago'
  dataCompra?: string
}