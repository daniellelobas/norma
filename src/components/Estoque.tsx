
import { useEffect, useState } from 'react'
import type { LoteEstoque } from '../types/estoque'

type Produto = {
  id: number
  codigo: string
  nome: string
  marca: string
  categoria: string
  precoCusto: number
  precoVenda: number
  quantidade: number
  estoqueMinimo: number
  validade: string
  lote: string
  fornecedor: string
}

type FiltroEstoque = 'todos' | 'baixo' | 'zerado' | 'validade' | 'normal'

function lerProdutosSalvos(): Produto[] {
  try {
    const dados = localStorage.getItem('norma-produtos')
    return dados ? (JSON.parse(dados) as Produto[]) : []
  } catch {
    return []
  }
}

function lerLotesSalvos(): LoteEstoque[] {
  try {
    const dados = localStorage.getItem('norma-lotes')
    return dados ? (JSON.parse(dados) as LoteEstoque[]) : []
  } catch {
    return []
  }
}

function Estoque() {
  const [produtos, setProdutos] = useState<Produto[]>(lerProdutosSalvos)
  const [lotes, setLotes] = useState<LoteEstoque[]>(lerLotesSalvos)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<FiltroEstoque>('todos')
  const [produtoExpandido, setProdutoExpandido] = useState<number | null>(null)

  useEffect(() => {
    function atualizarDados() {
      setProdutos(lerProdutosSalvos())
      setLotes(lerLotesSalvos())
    }

    window.addEventListener('storage', atualizarDados)
    window.addEventListener('norma-dados-atualizados', atualizarDados)

    return () => {
      window.removeEventListener('storage', atualizarDados)
      window.removeEventListener('norma-dados-atualizados', atualizarDados)
    }
  }, [])

  function obterLotesDoProduto(produtoId: number) {
    return lotes.filter((lote) => lote.produtoId === produtoId)
  }

  function estaProximoDoVencimento(validade: string) {
    if (!validade) return false

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const dataValidade = new Date(`${validade}T00:00:00`)
    const limite = new Date(hoje)
    limite.setDate(limite.getDate() + 30)

    return (
      !Number.isNaN(dataValidade.getTime()) &&
      dataValidade >= hoje &&
      dataValidade <= limite
    )
  }

  function formatarData(data: string) {
    if (!data) return 'Não informada'

    const dataFormatada = new Date(`${data}T12:00:00`)

    if (Number.isNaN(dataFormatada.getTime())) {
      return 'Não informada'
    }

    return dataFormatada.toLocaleDateString('pt-BR')
  }

  function produtoTemValidadeProxima(produto: Produto) {
    const lotesProduto = obterLotesDoProduto(produto.id)

    if (lotesProduto.length > 0) {
      return lotesProduto.some(
        (lote) =>
          lote.quantidadeDisponivel > 0 &&
          estaProximoDoVencimento(lote.validade),
      )
    }

    return estaProximoDoVencimento(produto.validade)
  }

  const produtosBaixos = produtos.filter(
    (produto) =>
      produto.quantidade > 0 &&
      produto.quantidade <= produto.estoqueMinimo,
  )

  const produtosZerados = produtos.filter(
    (produto) => produto.quantidade <= 0,
  )

  const produtosVencimento = produtos.filter((produto) =>
    produtoTemValidadeProxima(produto),
  )

  const produtosNormais = produtos.filter(
    (produto) => produto.quantidade > produto.estoqueMinimo,
  )

  const produtosFiltrados = produtos.filter((produto) => {
    const termo = busca.trim().toLowerCase()

    const correspondeBusca =
      produto.nome.toLowerCase().includes(termo) ||
      produto.codigo.toLowerCase().includes(termo) ||
      produto.marca.toLowerCase().includes(termo)

    let correspondeFiltro = true

    if (filtro === 'baixo') {
      correspondeFiltro =
        produto.quantidade > 0 &&
        produto.quantidade <= produto.estoqueMinimo
    } else if (filtro === 'zerado') {
      correspondeFiltro = produto.quantidade <= 0
    } else if (filtro === 'validade') {
      correspondeFiltro = produtoTemValidadeProxima(produto)
    } else if (filtro === 'normal') {
      correspondeFiltro = produto.quantidade > produto.estoqueMinimo
    }

    return correspondeBusca && correspondeFiltro
  })

  return (
    <section className="estoque-page">
      <div className="estoque-header">
        <h2>Controle de estoque</h2>
        <p>
          Acompanhe as quantidades disponíveis, os lotes e as validades
          dos produtos.
        </p>
      </div>

      <div className="estoque-resumos">
        <article className="estoque-card">
          <span>Total de produtos</span>
          <strong>{produtos.length}</strong>
          <small>Produtos cadastrados</small>
        </article>

        <article className="estoque-card estoque-card-alerta">
          <span>Estoque baixo</span>
          <strong>{produtosBaixos.length}</strong>
          <small>Precisam de reposição</small>
        </article>

        <article className="estoque-card estoque-card-zerado">
          <span>Sem estoque</span>
          <strong>{produtosZerados.length}</strong>
          <small>Quantidade igual a zero</small>
        </article>

        <article className="estoque-card estoque-card-validade">
          <span>Próximos do vencimento</span>
          <strong>{produtosVencimento.length}</strong>
          <small>Produtos com lotes que vencem em até 30 dias</small>
        </article>
      </div>

      <section className="estoque-lista">
        <h3>Produtos em estoque</h3>

        <div className="estoque-filtros">
          <input
            type="search"
            placeholder="Buscar por nome, código ou marca..."
            aria-label="Buscar produtos no estoque"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
          />

          <select
            aria-label="Filtrar produtos por situação"
            value={filtro}
            onChange={(event) =>
              setFiltro(event.target.value as FiltroEstoque)
            }
          >
            <option value="todos">Todas as situações</option>
            <option value="baixo">Estoque baixo</option>
            <option value="zerado">Sem estoque</option>
            <option value="validade">Próximos do vencimento</option>
            <option value="normal">Estoque normal</option>
          </select>
        </div>

        {produtosFiltrados.length === 0 ? (
          <div className="estoque-vazio">
            <h3>Nenhum produto encontrado</h3>
            <p>
              {produtos.length === 0
                ? 'Cadastre produtos na tela Produtos para acompanhar o estoque.'
                : 'Altere a pesquisa ou escolha outra situação no filtro.'}
            </p>
          </div>
        ) : (
          <div className="tabela-estoque">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Código</th>
                  <th>Produto</th>
                  <th>Marca</th>
                  <th>Quantidade total</th>
                  <th>Estoque mínimo</th>
                  <th>Situação</th>
                </tr>
              </thead>

              <tbody>
                {produtosFiltrados.map((produto) => {
                  let situacao = 'Normal'
                  let classeSituacao = 'situacao-normal'

                  if (produto.quantidade <= 0) {
                    situacao = 'Sem estoque'
                    classeSituacao = 'situacao-zerado'
                  } else if (produto.quantidade <= produto.estoqueMinimo) {
                    situacao = 'Estoque baixo'
                    classeSituacao = 'situacao-baixo'
                  }

                  const lotesProduto = obterLotesDoProduto(produto.id)
                  const totalNosLotes = lotesProduto.reduce(
                    (total, lote) =>
                      total + Math.max(0, lote.quantidadeDisponivel),
                    0,
                  )

                  // Quantidade antiga que ainda não foi associada a um lote.
                  const quantidadeSemLote = Math.max(
                    0,
                    produto.quantidade - totalNosLotes,
                  )

                  const expandido = produtoExpandido === produto.id

                  return (
                    <>
                      <tr key={produto.id}>
                        <td>
                          <button
                            type="button"
                            className="estoque-botao-lotes"
                            onClick={() =>
                              setProdutoExpandido(
                                expandido ? null : produto.id,
                              )
                            }
                            aria-expanded={expandido}
                            title="Ver detalhes dos lotes"
                          >
                            {expandido ? '−' : '+'}
                          </button>
                        </td>
                        <td>{produto.codigo}</td>
                        <td>{produto.nome}</td>
                        <td>{produto.marca}</td>
                        <td>{produto.quantidade}</td>
                        <td>{produto.estoqueMinimo}</td>
                        <td>
                          <span className={`situacao ${classeSituacao}`}>
                            {situacao}
                          </span>
                        </td>
                      </tr>

                      {expandido && (
                        <tr key={`${produto.id}-lotes`}>
                          <td colSpan={7}>
                            <div className="estoque-detalhes-lotes">
                              <h4>Lotes de {produto.nome}</h4>

                              {lotesProduto.length === 0 ? (
                                <p>
                                  Nenhum lote registrado para este produto.
                                  A quantidade atual é mantida como estoque
                                  sem lote registrado.
                                </p>
                              ) : (
                                <div className="tabela-estoque">
                                  <table>
                                    <thead>
                                      <tr>
                                        <th>Lote</th>
                                        <th>Quantidade disponível</th>
                                        <th>Validade</th>
                                        <th>Fornecedor</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {lotesProduto.map((lote) => (
                                        <tr key={lote.id}>
                                          <td>{lote.lote || 'Não informado'}</td>
                                          <td>{lote.quantidadeDisponivel}</td>
                                          <td>
                                            {formatarData(lote.validade)}
                                            {estaProximoDoVencimento(
                                              lote.validade,
                                            ) &&
                                              lote.quantidadeDisponivel > 0 && (
                                                <span className="aviso-validade">
                                                  Próximo do vencimento
                                                </span>
                                              )}
                                          </td>
                                          <td>
                                            {lote.fornecedorNome ||
                                              'Não informado'}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}

                              {quantidadeSemLote > 0 && (
                                <p className="estoque-sem-lote">
                                  <strong>{quantidadeSemLote}</strong>{' '}
                                  unidade(s) ainda não vinculada(s) a um lote.
                                  Esse saldo foi preservado do estoque anterior.
                                </p>
                              )}

                              {lotesProduto.length > 0 &&
                                totalNosLotes > produto.quantidade && (
                                  <p className="estoque-aviso-divergencia">
                                    Atenção: a soma das quantidades dos lotes
                                    é maior que o estoque total do produto.
                                    Confira os registros antes de movimentar
                                    esse estoque.
                                  </p>
                                )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="estoque-legenda">
          Exibindo {produtosFiltrados.length} de {produtos.length} produtos.
        </p>
      </section>
    </section>
  )
}

export default Estoque
