import { useState } from 'react'

type Cliente = {
  id: number
  nome: string
  telefone: string
  email: string
}

type Produto = {
  id: number
  codigo: string
  nome: string
  marca: string
  precoVenda: number
  quantidade: number
}

type ItemVenda = {
  produtoId: number
  codigo: string
  nome: string
  marca: string
  precoUnitario: number
  quantidade: number
}

type FormaPagamento = 'Dinheiro' | 'Pix' | 'Cartão' | 'Fiado'

type VendaSalva = {
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

function lerLista<T>(chave: string): T[] {
  try {
    const dados = localStorage.getItem(chave)

    if (!dados) return []

    const resultado: unknown = JSON.parse(dados)

    return Array.isArray(resultado) ? (resultado as T[]) : []
  } catch {
    return []
  }
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function Vendas() {
  const [clientes, setClientes] = useState<Cliente[]>(() =>
    lerLista<Cliente>('norma-clientes'),
  )

  const [produtos, setProdutos] = useState<Produto[]>(() =>
    lerLista<Produto>('norma-produtos'),
  )

  const [clienteId, setClienteId] = useState('')
  const [buscaProduto, setBuscaProduto] = useState('')
  const [quantidade, setQuantidade] = useState('1')
  const [itens, setItens] = useState<ItemVenda[]>([])
  const [formaPagamento, setFormaPagamento] =
    useState<FormaPagamento>('Pix')
  const [dataVencimento, setDataVencimento] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState(false)

  const produtosFiltrados = produtos.filter((produto) => {
    const termo = buscaProduto.trim().toLowerCase()

    return (
      produto.nome.toLowerCase().includes(termo) ||
      produto.codigo.toLowerCase().includes(termo) ||
      produto.marca.toLowerCase().includes(termo)
    )
  })

  const subtotal = itens.reduce((total, item) => {
    return total + item.precoUnitario * item.quantidade
  }, 0)

  function mostrarMensagem(texto: string, temErro = false) {
    setMensagem(texto)
    setErro(temErro)
  }

  function atualizarDados() {
    setClientes(lerLista<Cliente>('norma-clientes'))
    setProdutos(lerLista<Produto>('norma-produtos'))
  }

  function adicionarProduto(produto: Produto) {
    const produtosAtuais = lerLista<Produto>('norma-produtos')
    const produtoAtual = produtosAtuais.find(
      (item) => Number(item.id) === Number(produto.id),
    )

    if (!produtoAtual) {
      atualizarDados()
      mostrarMensagem(
        'Produto não encontrado. Atualize a tela e tente novamente.',
        true,
      )
      return
    }

    const quantidadeEscolhida = Number(quantidade)

    if (
      !Number.isSafeInteger(quantidadeEscolhida) ||
      quantidadeEscolhida <= 0
    ) {
      mostrarMensagem(
        'Informe uma quantidade inteira maior que zero.',
        true,
      )
      return
    }

    const estoqueDisponivel = Number(produtoAtual.quantidade)

    if (!Number.isSafeInteger(estoqueDisponivel) || estoqueDisponivel < 0) {
      atualizarDados()
      mostrarMensagem(
        'A quantidade de estoque deste produto está inválida. Confira o cadastro.',
        true,
      )
      return
    }

    const itemExistente = itens.find(
      (item) => Number(item.produtoId) === Number(produtoAtual.id),
    )

    const quantidadeJaAdicionada = itemExistente
      ? itemExistente.quantidade
      : 0

    const quantidadeSolicitada =
      quantidadeJaAdicionada + quantidadeEscolhida

    if (quantidadeSolicitada > estoqueDisponivel) {
      const quantidadeRestante = Math.max(
        0,
        estoqueDisponivel - quantidadeJaAdicionada,
      )

      mostrarMensagem(
        `Não foi possível adicionar o produto "${produtoAtual.nome}". ` +
          `Você solicitou ${quantidadeEscolhida} unidade(s), mas ` +
          `há somente ${quantidadeRestante} unidade(s) disponível(is) ` +
          `para adicionar à venda.`,
        true,
      )
      return
    }

    const novoItem: ItemVenda = {
      produtoId: Number(produtoAtual.id),
      codigo: produtoAtual.codigo,
      nome: produtoAtual.nome,
      marca: produtoAtual.marca,
      precoUnitario: Number(produtoAtual.precoVenda) || 0,
      quantidade: quantidadeSolicitada,
    }

    setItens((itensAtuais) => {
      const jaExiste = itensAtuais.some(
        (item) => Number(item.produtoId) === Number(produtoAtual.id),
      )

      if (jaExiste) {
        return itensAtuais.map((item) =>
          Number(item.produtoId) === Number(produtoAtual.id) ? novoItem : item,
        )
      }

      return [...itensAtuais, novoItem]
    })

    setProdutos(produtosAtuais)
    setBuscaProduto('')
    setQuantidade('1')
    mostrarMensagem('Produto adicionado à venda.')
  }

  function removerProduto(produtoId: number) {
    setItens((itensAtuais) =>
      itensAtuais.filter((item) => Number(item.produtoId) !== Number(produtoId)),
    )

    mostrarMensagem('Produto removido da venda.')
  }

  function limparVenda() {
    setClienteId('')
    setBuscaProduto('')
    setQuantidade('1')
    setItens([])
    setFormaPagamento('Pix')
    setDataVencimento('')
    setMensagem('')
    setErro(false)
    atualizarDados()
  }

  function finalizarVenda() {
    if (!clienteId) {
      mostrarMensagem('Selecione um cliente para continuar.', true)
      return
    }

    if (itens.length === 0) {
      mostrarMensagem(
        'Adicione pelo menos um produto à venda.',
        true,
      )
      return
    }

    const hoje = new Date()

    const dataLocalHoje = [
      hoje.getFullYear(),
      String(hoje.getMonth() + 1).padStart(2, '0'),
      String(hoje.getDate()).padStart(2, '0'),
    ].join('-')

    if (formaPagamento === 'Fiado' && !dataVencimento) {
      mostrarMensagem(
        'Informe a data de vencimento do fiado.',
        true,
      )
      return
    }

    if (
      formaPagamento === 'Fiado' &&
      dataVencimento < dataLocalHoje
    ) {
      mostrarMensagem(
        'A data de vencimento não pode ser anterior a hoje.',
        true,
      )
      return
    }

    const clientesAtuais = lerLista<Cliente>('norma-clientes')
    const produtosAtuais = lerLista<Produto>('norma-produtos')
    const vendasAtuais = lerLista<VendaSalva>('norma-vendas')

    const clienteSelecionado = clientesAtuais.find(
      (cliente) => String(cliente.id) === clienteId,
    )

    if (!clienteSelecionado) {
      setClientes(clientesAtuais)
      mostrarMensagem(
        'Cliente não encontrado. Confira o cadastro e tente novamente.',
        true,
      )
      return
    }

    for (const item of itens) {
      const produtoAtual = produtosAtuais.find(
        (produto) => Number(produto.id) === Number(item.produtoId),
      )

      if (!produtoAtual) {
        mostrarMensagem(
          `O produto "${item.nome}" não foi encontrado no cadastro.`,
          true,
        )
        return
      }

      const estoqueDisponivel = Number(produtoAtual.quantidade)

      if (
        !Number.isSafeInteger(item.quantidade) ||
        item.quantidade <= 0 ||
        !Number.isSafeInteger(estoqueDisponivel) ||
        estoqueDisponivel < 0 ||
        item.quantidade > estoqueDisponivel
      ) {
        atualizarDados()

        mostrarMensagem(
          `VENDA BLOQUEADA! O produto "${produtoAtual.nome}" ` +
            `tem apenas ${Math.max(0, estoqueDisponivel || 0)} ` +
            `unidade(s) em estoque, mas a venda solicita ` +
            `${item.quantidade}. Nenhuma alteração foi feita.`,
          true,
        )
        return
      }
    }

    const total = itens.reduce((soma, item) => {
      return soma + item.precoUnitario * item.quantidade
    }, 0)

    // Atualiza o estoque de TODOS os produtos vendidos simultaneamente
    const produtosAtualizados = produtosAtuais.map((produto) => {
      const itemVendido = itens.find(
        (item) => Number(item.produtoId) === Number(produto.id),
      )

      if (!itemVendido) return produto

      const novoEstoque = Number(produto.quantidade) - Number(itemVendido.quantidade)

      return {
        ...produto,
        quantidade: Math.max(0, novoEstoque),
      }
    })

    const novaVenda: VendaSalva = {
      id: Date.now(),
      data: new Date().toISOString(),
      clienteId: clienteSelecionado.id,
      clienteNome: clienteSelecionado.nome,
      itens: itens.map((item) => ({ ...item })),
      subtotal: total,
      total,
      formaPagamento,
      statusPagamento: formaPagamento === 'Fiado' ? 'Pendente' : 'Pago',
      dataVencimento:
        formaPagamento === 'Fiado' ? dataVencimento : null,
    }

    const produtosAnteriores = localStorage.getItem('norma-produtos')
    const vendasAnteriores = localStorage.getItem('norma-vendas')

    try {
      localStorage.setItem(
        'norma-produtos',
        JSON.stringify(produtosAtualizados),
      )

      localStorage.setItem(
        'norma-vendas',
        JSON.stringify([...vendasAtuais, novaVenda]),
      )
    } catch {
      try {
        if (produtosAnteriores === null) {
          localStorage.removeItem('norma-produtos')
        } else {
          localStorage.setItem('norma-produtos', produtosAnteriores)
        }

        if (vendasAnteriores === null) {
          localStorage.removeItem('norma-vendas')
        } else {
          localStorage.setItem('norma-vendas', vendasAnteriores)
        }
      } catch {
        // Armazenamento indisponível
      }

      atualizarDados()
      mostrarMensagem(
        'Não foi possível salvar a venda. Confira o estoque e tente novamente.',
        true,
      )
      return
    }

    setProdutos(produtosAtualizados)
    setClientes(clientesAtuais)

    mostrarMensagem(
      `Venda registrada com sucesso! Total: ${formatarMoeda(total)}. ` +
        (formaPagamento === 'Fiado'
          ? `Pagamento pendente. Vencimento: ${dataVencimento
              .split('-')
              .reverse()
              .join('/')}.`
          : 'Pagamento registrado como pago.'),
    )

    setClienteId('')
    setBuscaProduto('')
    setQuantidade('1')
    setItens([])
    setFormaPagamento('Pix')
    setDataVencimento('')

    window.dispatchEvent(new Event('norma-dados-atualizados'))
  }

  return (
    <div className="vendas-page">
      <div className="vendas-introducao">
        <h2>Nova venda</h2>
        <p>Selecione o cliente e adicione os produtos da compra.</p>
      </div>

      <section className="vendas-secao">
        <h3>1. Selecionar cliente</h3>

        <label htmlFor="cliente-venda">Cliente</label>

        <select
          id="cliente-venda"
          value={clienteId}
          onChange={(evento) => setClienteId(evento.target.value)}
        >
          <option value="">Selecione um cliente</option>

          {clientes.map((cliente) => (
            <option key={cliente.id} value={String(cliente.id)}>
              {cliente.nome}
            </option>
          ))}
        </select>

        {clientes.length === 0 && (
          <p className="vendas-aviso">
            Nenhum cliente cadastrado. Cadastre um cliente antes de realizar
            a venda.
          </p>
        )}
      </section>

      <section className="vendas-secao">
        <h3>2. Adicionar produtos</h3>

        <label htmlFor="busca-produto-venda">Buscar produto</label>

        <input
          id="busca-produto-venda"
          type="text"
          placeholder="Digite o nome, código ou marca..."
          value={buscaProduto}
          onChange={(evento) => setBuscaProduto(evento.target.value)}
        />

        <label htmlFor="quantidade-venda">Quantidade</label>

        <input
          id="quantidade-venda"
          type="number"
          min="1"
          step="1"
          value={quantidade}
          onChange={(evento) => setQuantidade(evento.target.value)}
        />

        {buscaProduto.trim() !== '' && (
          <div className="vendas-resultados">
            {produtosFiltrados.length === 0 ? (
              <p>Nenhum produto encontrado.</p>
            ) : (
              produtosFiltrados.map((produto) => (
                <div className="vendas-produto" key={produto.id}>
                  <div>
                    <strong>{produto.nome}</strong>
                    <span>
                      {produto.marca} · Código: {produto.codigo}
                    </span>
                    <span>
                      Preço: {formatarMoeda(Number(produto.precoVenda) || 0)}
                    </span>
                    <span>
                      Estoque: {Number(produto.quantidade) || 0} unidade(s)
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={Number(produto.quantidade) <= 0}
                    onClick={() => adicionarProduto(produto)}
                  >
                    Adicionar
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {produtos.length === 0 && (
          <p className="vendas-aviso">
            Nenhum produto cadastrado. Cadastre produtos antes de realizar
            uma venda.
          </p>
        )}
      </section>

      <section className="vendas-secao">
        <h3>3. Resumo da venda</h3>

        {itens.length === 0 ? (
          <p className="vendas-vazio">
            Nenhum produto adicionado ainda.
          </p>
        ) : (
          <div className="vendas-tabela-container">
            <table className="vendas-tabela">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Preço</th>
                  <th>Qtd.</th>
                  <th>Total</th>
                  <th>Ação</th>
                </tr>
              </thead>

              <tbody>
                {itens.map((item) => (
                  <tr key={item.produtoId}>
                    <td>
                      <strong>{item.nome}</strong>
                      <span className="vendas-marca">{item.marca}</span>
                    </td>
                    <td>{formatarMoeda(item.precoUnitario)}</td>
                    <td>{item.quantidade}</td>
                    <td>
                      {formatarMoeda(
                        item.precoUnitario * item.quantidade,
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="vendas-remover"
                        onClick={() => removerProduto(item.produtoId)}
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="vendas-total">
          <span>Subtotal</span>
          <strong>{formatarMoeda(subtotal)}</strong>
        </div>

        <div className="vendas-pagamento">
          <label htmlFor="forma-pagamento">Forma de pagamento</label>

          <select
            id="forma-pagamento"
            value={formaPagamento}
            onChange={(evento) =>
              setFormaPagamento(evento.target.value as FormaPagamento)
            }
          >
            <option value="Pix">Pix</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Cartão">Cartão</option>
            <option value="Fiado">Fiado</option>
          </select>

          {formaPagamento === 'Fiado' && (
            <>
              <label htmlFor="vencimento-fiado">Data de vencimento</label>

              <input
                id="vencimento-fiado"
                type="date"
                value={dataVencimento}
                min={(() => {
                  const hoje = new Date()

                  return `${hoje.getFullYear()}-${String(
                    hoje.getMonth() + 1,
                  ).padStart(2, '0')}-${String(hoje.getDate()).padStart(
                    2,
                    '0',
                  )}`
                })()}
                onChange={(evento) =>
                  setDataVencimento(evento.target.value)
                }
                required
              />

              <p className="vendas-aviso">
                A venda será registrada como pagamento pendente.
              </p>
            </>
          )}
        </div>

        <div className="vendas-acoes">
          <button
            type="button"
            className="vendas-limpar"
            onClick={limparVenda}
          >
            Limpar venda
          </button>

          <button
            type="button"
            className="vendas-finalizar"
            disabled={!clienteId || itens.length === 0}
            onClick={finalizarVenda}
          >
            Finalizar venda
          </button>
        </div>

        {mensagem && (
          <p
            className={
              erro
                ? 'vendas-mensagem vendas-mensagem-erro'
                : 'vendas-mensagem'
            }
            role="status"
            aria-live="polite"
          >
            {mensagem}
          </p>
        )}
      </section>
    </div>
  )
}

export default Vendas