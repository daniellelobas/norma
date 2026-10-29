
import { useEffect, useState } from 'react'

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
  const dados = localStorage.getItem('norma-produtos')

  if (!dados) {
    return []
  }

  try {
    return JSON.parse(dados) as Produto[]
  } catch {
    return []
  }
}

function Estoque() {
  const [produtos, setProdutos] = useState<Produto[]>(lerProdutosSalvos)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<FiltroEstoque>('todos')

  useEffect(() => {
    function atualizarProdutos() {
      setProdutos(lerProdutosSalvos())
    }

    window.addEventListener('storage', atualizarProdutos)

    return () => {
      window.removeEventListener('storage', atualizarProdutos)
    }
  }, [])

  function estaProximoDoVencimento(validade: string) {
    if (!validade) {
      return false
    }

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const dataValidade = new Date(`${validade}T00:00:00`)
    const limite = new Date(hoje)
    limite.setDate(limite.getDate() + 30)

    return dataValidade >= hoje && dataValidade <= limite
  }

  function formatarData(data: string) {
    if (!data) {
      return 'Não informada'
    }

    return new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR')
  }

  const produtosBaixos = produtos.filter(
    (produto) =>
      produto.quantidade > 0 &&
      produto.quantidade <= produto.estoqueMinimo,
  )

  const produtosZerados = produtos.filter(
    (produto) => produto.quantidade === 0,
  )

  const produtosVencimento = produtos.filter((produto) =>
    estaProximoDoVencimento(produto.validade),
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
      correspondeFiltro = produto.quantidade === 0
    } else if (filtro === 'validade') {
      correspondeFiltro = estaProximoDoVencimento(produto.validade)
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
          Acompanhe as quantidades disponíveis e identifique os produtos
          que precisam de atenção.
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
          <small>Vencem nos próximos 30 dias</small>
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
                  <th>Código</th>
                  <th>Produto</th>
                  <th>Marca</th>
                  <th>Quantidade</th>
                  <th>Estoque mínimo</th>
                  <th>Validade</th>
                  <th>Situação</th>
                </tr>
              </thead>

              <tbody>
                {produtosFiltrados.map((produto) => {
                  let situacao = 'Normal'
                  let classeSituacao = 'situacao-normal'

                  if (produto.quantidade === 0) {
                    situacao = 'Sem estoque'
                    classeSituacao = 'situacao-zerado'
                  } else if (
                    produto.quantidade <= produto.estoqueMinimo
                  ) {
                    situacao = 'Estoque baixo'
                    classeSituacao = 'situacao-baixo'
                  }

                  const proximoVencimento = estaProximoDoVencimento(
                    produto.validade,
                  )

                  return (
                    <tr key={produto.id}>
                      <td>{produto.codigo}</td>
                      <td>{produto.nome}</td>
                      <td>{produto.marca}</td>
                      <td>{produto.quantidade}</td>
                      <td>{produto.estoqueMinimo}</td>
                      <td>
                        {formatarData(produto.validade)}
                        {proximoVencimento && (
                          <span className="aviso-validade">
                            Próximo do vencimento
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`situacao ${classeSituacao}`}>
                          {situacao}
                        </span>
                      </td>
                    </tr>
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
