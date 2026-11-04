import { useState } from 'react'
import type { LoteEstoque, MovimentacaoEstoque } from '../types/estoque'

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
  const [quantidadesProdutos, setQuantidadesProdutos] = useState<
    Record<number, string>
  >({})
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

  const subtotal = itens.reduce(
    (total, item) => total + item.precoUnitario * item.quantidade,
    0,
  )

  function mostrarMensagem(texto: string, temErro = false) {
    setMensagem(texto)
    setErro(temErro)
  }

  function atualizarDados() {
    setClientes(lerLista<Cliente>('norma-clientes'))
    setProdutos(lerLista<Produto>('norma-produtos'))
  }

  function alterarQuantidadeProduto(produtoId: number, valor: string) {
    setQuantidadesProdutos((quantidadesAtuais) => ({
      ...quantidadesAtuais,
      [produtoId]: valor,
    }))
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

    const quantidadeEscolhida = Number(
      quantidadesProdutos[produto.id] ?? '1',
    )

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

    if (
      !Number.isSafeInteger(estoqueDisponivel) ||
      estoqueDisponivel < 0
    ) {
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
        `Não foi possível adicionar "${produtoAtual.nome}". Há somente ${quantidadeRestante} unidade(s) disponível(is) para adicionar.`,
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
          Number(item.produtoId) === Number(produtoAtual.id)
            ? novoItem
            : item,
        )
      }

      return [...itensAtuais, novoItem]
    })

    setProdutos(produtosAtuais)

    setQuantidadesProdutos((quantidadesAtuais) => ({
      ...quantidadesAtuais,
      [produto.id]: '1',
    }))

    mostrarMensagem(
      `${quantidadeEscolhida} unidade(s) de "${produtoAtual.nome}" adicionada(s) à venda.`,
    )
  }

  function removerProduto(produtoId: number) {
    setItens((itensAtuais) =>
      itensAtuais.filter(
        (item) => Number(item.produtoId) !== Number(produtoId),
      ),
    )

    mostrarMensagem('Produto removido da venda.')
  }

  function limparVenda() {
    setClienteId('')
    setBuscaProduto('')
    setQuantidadesProdutos({})
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
      mostrarMensagem('Adicione pelo menos um produto à venda.', true)
      return
    }

    const hoje = new Date()

    const dataLocalHoje = [
      hoje.getFullYear(),
      String(hoje.getMonth() + 1).padStart(2, '0'),
      String(hoje.getDate()).padStart(2, '0'),
    ].join('-')

    if (formaPagamento === 'Fiado' && !dataVencimento) {
      mostrarMensagem('Informe a data de vencimento do fiado.', true)
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
    const lotesAtuais = lerLista<LoteEstoque>('norma-lotes')
    const movimentacoesAtuais =
      lerLista<MovimentacaoEstoque>('norma-movimentacoes')

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

    // Confere novamente o estoque antes de finalizar.
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
          `VENDA BLOQUEADA! "${produtoAtual.nome}" possui ${Math.max(
            0,
            estoqueDisponivel || 0,
          )} unidade(s), mas a venda solicita ${item.quantidade}. Nenhuma alteração foi feita.`,
          true,
        )
        return
      }
    }

    // Prepara as quantidades dos lotes sem salvar nada ainda.
    const lotesAtualizados = lotesAtuais.map((lote) => ({ ...lote }))
    const novasMovimentacoes: MovimentacaoEstoque[] = []

    for (const item of itens) {
      const produtoAtual = produtosAtuais.find(
        (produto) => Number(produto.id) === Number(item.produtoId),
      )

      if (!produtoAtual) {
        mostrarMensagem(`Produto "${item.nome}" não encontrado.`, true)
        return
      }

      const lotesDoProduto = lotesAtualizados
        .filter(
          (lote) =>
            Number(lote.produtoId) === Number(item.produtoId) &&
            Number(lote.quantidadeDisponivel) > 0,
        )
        .sort((a, b) => {
          if (!a.validade && !b.validade) return 0
          if (!a.validade) return 1
          if (!b.validade) return -1

          return a.validade.localeCompare(b.validade)
        })

      const totalDisponivelNosLotesAntes = lotesDoProduto.reduce(
        (total, lote) =>
          total + Math.max(0, Number(lote.quantidadeDisponivel) || 0),
        0,
      )

      const estoqueTotal = Number(produtoAtual.quantidade)

      const estoqueSemLoteAntes = Math.max(
        0,
        estoqueTotal - totalDisponivelNosLotesAntes,
      )

      let quantidadeRestante = item.quantidade

      // Dá baixa primeiro nos lotes que vencem mais cedo.
      for (const lote of lotesDoProduto) {
        if (quantidadeRestante <= 0) break

        const disponivel = Math.max(
          0,
          Number(lote.quantidadeDisponivel) || 0,
        )

        const quantidadeBaixada = Math.min(
          disponivel,
          quantidadeRestante,
        )

        if (quantidadeBaixada > 0) {
          lote.quantidadeDisponivel = disponivel - quantidadeBaixada
          quantidadeRestante -= quantidadeBaixada

          novasMovimentacoes.push({
            id: Date.now() + novasMovimentacoes.length + 1,
            tipo: 'Saída',
            produtoId: item.produtoId,
            produtoNome: item.nome,
            quantidade: quantidadeBaixada,
            loteId: lote.id,
            lote: lote.lote || 'Não informado',
            data: new Date().toISOString(),
            origemId: Date.now(),
            origem: 'Venda',
            pessoaNome: clienteSelecionado.nome,
          })
        }
      }

      // O restante pode sair do estoque antigo, sem lote vinculado.
      if (quantidadeRestante > estoqueSemLoteAntes) {
        mostrarMensagem(
          `Não foi possível distribuir a baixa dos lotes de "${item.nome}". Confira o estoque antes de tentar novamente.`,
          true,
        )
        return
      }

      if (quantidadeRestante > 0) {
        novasMovimentacoes.push({
          id: Date.now() + novasMovimentacoes.length + 1,
          tipo: 'Saída',
          produtoId: item.produtoId,
          produtoNome: item.nome,
          quantidade: quantidadeRestante,
          loteId: null,
          lote: 'Estoque antigo (sem lote)',
          data: new Date().toISOString(),
          origemId: Date.now(),
          origem: 'Venda',
          pessoaNome: clienteSelecionado.nome,
        })
      }
    }

    const total = itens.reduce(
      (soma, item) => soma + item.precoUnitario * item.quantidade,
      0,
    )

    const produtosAtualizados = produtosAtuais.map((produto) => {
      const itemVendido = itens.find(
        (item) => Number(item.produtoId) === Number(produto.id),
      )

      if (!itemVendido) return produto

      return {
        ...produto,
        quantidade:
          Number(produto.quantidade) - Number(itemVendido.quantidade),
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

    // Usa o mesmo ID da venda como origem das movimentações.
    const movimentacoesDaVenda = novasMovimentacoes.map((movimentacao) => ({
      ...movimentacao,
      origemId: novaVenda.id,
      data: novaVenda.data,
    }))

    const produtosAnteriores = localStorage.getItem('norma-produtos')
    const vendasAnteriores = localStorage.getItem('norma-vendas')
    const lotesAnteriores = localStorage.getItem('norma-lotes')
    const movimentacoesAnteriores = localStorage.getItem(
      'norma-movimentacoes',
    )

    try {
      localStorage.setItem(
        'norma-produtos',
        JSON.stringify(produtosAtualizados),
      )

      localStorage.setItem(
        'norma-vendas',
        JSON.stringify([...vendasAtuais, novaVenda]),
      )

      localStorage.setItem(
        'norma-lotes',
        JSON.stringify(lotesAtualizados),
      )

      localStorage.setItem(
        'norma-movimentacoes',
        JSON.stringify([
          ...movimentacoesAtuais,
          ...movimentacoesDaVenda,
        ]),
      )
    } catch {
      // Tenta restaurar os dados anteriores caso alguma gravação falhe.
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

        if (lotesAnteriores === null) {
          localStorage.removeItem('norma-lotes')
        } else {
          localStorage.setItem('norma-lotes', lotesAnteriores)
        }

        if (movimentacoesAnteriores === null) {
          localStorage.removeItem('norma-movimentacoes')
        } else {
          localStorage.setItem(
            'norma-movimentacoes',
            movimentacoesAnteriores,
          )
        }
      } catch {
        // O armazenamento pode estar indisponível.
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
    setQuantidadesProdutos({})
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
                      Preço:{' '}
                      {formatarMoeda(Number(produto.precoVenda) || 0)}
                    </span>
                    <span>
                      Estoque: {Number(produto.quantidade) || 0} unidade(s)
                    </span>
                  </div>

                  <div className="vendas-produto-acoes">
                    <label htmlFor={`quantidade-produto-${produto.id}`}>
                      Qtd.
                    </label>

                    <input
                      id={`quantidade-produto-${produto.id}`}
                      type="number"
                      min="1"
                      step="1"
                      value={quantidadesProdutos[produto.id] ?? '1'}
                      onChange={(evento) =>
                        alterarQuantidadeProduto(
                          produto.id,
                          evento.target.value,
                        )
                      }
                    />

                    <button
                      type="button"
                      disabled={Number(produto.quantidade) <= 0}
                      onClick={() => adicionarProduto(produto)}
                    >
                      Adicionar
                    </button>
                  </div>
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
          <p className="vendas-vazio">Nenhum produto adicionado ainda.</p>
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