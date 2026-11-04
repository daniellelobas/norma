
export type LoteEstoque = {
  id: number
  produtoId: number
  compraId: number
  quantidadeInicial: number
  quantidadeDisponivel: number
  precoCusto: number
  lote: string
  validade: string
  dataEntrada: string
  fornecedorNome: string
}
export type TipoMovimentacao = 'Entrada' | 'Saída'

export type MovimentacaoEstoque = {
  id: number
  tipo: TipoMovimentacao
  produtoId: number
  produtoNome: string
  quantidade: number
  loteId: number | null
  lote: string
  data: string
  origemId: number
  origem: string
  pessoaNome: string
}