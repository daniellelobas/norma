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
  categoria?: string
  imagem?: string
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

export default function Vendas() {
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
    if (!termo) return true // Se busca vazia, exibe todos no catálogo

    return (
      produto.nome.toLowerCase().includes(termo) ||
      produto.codigo.toLowerCase().includes(termo) ||
      produto.marca.toLowerCase().includes(termo) ||
      (produto.categoria && produto.categoria.toLowerCase().includes(termo))
    )
  })

  // Agrupar produtos por categoria para exibição em blocos iguais à referência
  const produtosPorCategoria = produtosFiltrados.reduce((acc, produto) => {
    const cat = produto.categoria || 'Geral'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(produto)
    return acc
  }, {} as Record<string, Produto[]>)

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
        `Não foi possível adicionar "${produtoAtual.nome}". Há somente ${quantidadeRestante} unidade(s) disponível(is).`,
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
      `${quantidadeEscolhida} unidade(s) de "${produtoAtual.nome}" adicionada(s) ao carrinho.`,
    )
  }

  function alterarQuantidadeItemCarrinho(produtoId: number, novaQtd: number) {
    if (novaQtd <= 0) {
      removerProduto(produtoId)
      return
    }

    const produtoOriginal = produtos.find(p => Number(p.id) === Number(produtoId))
    const estoqueMax = produtoOriginal ? Number(produtoOriginal.quantidade) : 9999

    if (novaQtd > estoqueMax) {
      mostrarMensagem(`Estoque insuficiente. Máximo disponível: ${estoqueMax}`, true)
      return
    }

    setItens(itens.map(item => 
      Number(item.produtoId) === Number(produtoId) 
        ? { ...item, quantidade: novaQtd } 
        : item
    ))
  }

  function removerProduto(produtoId: number) {
    setItens((itensAtuais) =>
      itensAtuais.filter(
        (item) => Number(item.produtoId) !== Number(produtoId),
      ),
    )
    mostrarMensagem('Produto removido do carrinho.')
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
      mostrarMensagem('Adicione pelo menos um produto ao carrinho.', true)
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

    if (formaPagamento === 'Fiado' && dataVencimento < dataLocalHoje) {
      mostrarMensagem('A data de vencimento não pode ser anterior a hoje.', true)
      return
    }

    const clientesAtuais = lerLista<Cliente>('norma-clientes')
    const produtosAtuais = lerLista<Produto>('norma-produtos')
    const vendasAtuais = lerLista<VendaSalva>('norma-vendas')
    const lotesAtuais = lerLista<LoteEstoque>('norma-lotes')
    const movimentacoesAtuais = lerLista<MovimentacaoEstoque>('norma-movimentacoes')

    const clienteSelecionado = clientesAtuais.find(
      (cliente) => String(cliente.id) === clienteId,
    )

    if (!clienteSelecionado) {
      setClientes(clientesAtuais)
      mostrarMensagem('Cliente não encontrado. Confira o cadastro.', true)
      return
    }

    for (const item of itens) {
      const produtoAtual = produtosAtuais.find(
        (produto) => Number(produto.id) === Number(item.produtoId),
      )

      if (!produtoAtual) {
        mostrarMensagem(`O produto "${item.nome}" não foi encontrado.`, true)
        return
      }

      const estoqueDisponivel = Number(produtoAtual.quantidade)

      if (item.quantidade > estoqueDisponivel) {
        atualizarDados()
        mostrarMensagem(
          `ESTOQUE INSUFICIENTE! "${produtoAtual.nome}" possui ${estoqueDisponivel} un., mas o carrinho pede ${item.quantidade}.`,
          true,
        )
        return
      }
    }

    const lotesAtualizados = lotesAtuais.map((lote) => ({ ...lote }))
    const novasMovimentacoes: MovimentacaoEstoque[] = []

    for (const item of itens) {
      const produtoAtual = produtosAtuais.find(
        (produto) => Number(produto.id) === Number(item.produtoId),
      )

      if (!produtoAtual) return

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
        (total, lote) => total + Math.max(0, Number(lote.quantidadeDisponivel) || 0),
        0,
      )

      const estoqueTotal = Number(produtoAtual.quantidade)
      const estoqueSemLoteAntes = Math.max(0, estoqueTotal - totalDisponivelNosLotesAntes)

      let quantidadeRestante = item.quantidade

      for (const lote of lotesDoProduto) {
        if (quantidadeRestante <= 0) break

        const disponivel = Math.max(0, Number(lote.quantidadeDisponivel) || 0)
        const quantidadeBaixada = Math.min(disponivel, quantidadeRestante)

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

    const total = subtotal

    const produtosAtualizados = produtosAtuais.map((produto) => {
      const itemVendido = itens.find(
        (item) => Number(item.produtoId) === Number(produto.id),
      )
      if (!itemVendido) return produto
      return {
        ...produto,
        quantidade: Number(produto.quantidade) - Number(itemVendido.quantidade),
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
      dataVencimento: formaPagamento === 'Fiado' ? dataVencimento : null,
    }

    const movimentacoesDaVenda = novasMovimentacoes.map((movimentacao) => ({
      ...movimentacao,
      origemId: novaVenda.id,
      data: novaVenda.data,
    }))

    try {
      localStorage.setItem('norma-produtos', JSON.stringify(produtosAtualizados))
      localStorage.setItem('norma-vendas', JSON.stringify([...lerLista('norma-vendas'), novaVenda]))
      localStorage.setItem('norma-lotes', JSON.stringify(lotesAtualizados))
      localStorage.setItem(
        'norma-movimentacoes',
        JSON.stringify([...lerLista('norma-movimentacoes'), ...movimentacoesDaVenda]),
      )
    } catch {
      atualizarDados()
      mostrarMensagem('Erro ao salvar venda no armazenamento.', true)
      return
    }

    setProdutos(produtosAtualizados)
    setClientes(clientesAtuais)

    mostrarMensagem(
      `Venda finalizada com sucesso! Total: ${formatarMoeda(total)}.`,
    )

    limparVenda()
    window.dispatchEvent(new Event('norma-dados-atualizados'))
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* Cabeçalho da Página */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Tela de Vendas</h1>
        <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0 0' }}>Selecione os produtos do catálogo e finalize o pedido do cliente.</p>
      </div>

      {/* Layout de 3 Colunas IDÊNTICO À REFERÊNCIA */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px 340px', gap: '20px', alignItems: 'start' }}>
        
        {/* COLUNA 1: CATÁLOGO DE PRODUTOS */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '14px' }}>Catálogo de Produtos</h2>

          {/* Barra de Busca */}
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <span style={{ position: 'absolute', left: '14px', top: '12px', color: '#94a3b8' }}>🔍</span>
            <input
              type="text"
              placeholder="Buscar produto (nome, marca, código...)"
              value={buscaProduto}
              onChange={(e) => setBuscaProduto(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 40px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                outline: 'none',
                fontSize: '14px',
                backgroundColor: '#f8fafc'
              }}
            />
          </div>

          {/* Listagem por Categoria em Cards */}
          {Object.keys(produtosPorCategoria).length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>Nenhum produto cadastrado ou encontrado.</p>
          ) : (
            Object.entries(produtosPorCategoria).map(([categoria, prods]) => (
              <div key={categoria} style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#475569', marginBottom: '12px', textTransform: 'capitalize' }}>
                  {categoria}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                  {prods.map((produto) => {
                    const qtdInput = quantidadesProdutos[produto.id] ?? '1'
                    const semEstoque = Number(produto.quantidade) <= 0

                    return (
                      <div
                        key={produto.id}
                        style={{
                          border: '1px solid #f1f5f9',
                          borderRadius: '12px',
                          padding: '12px',
                          backgroundColor: '#fff',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}
                      >
                        <div>
                          <div style={{ height: '70px', background: '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '8px' }}>
                            🧴
                          </div>
                          <strong style={{ fontSize: '13px', color: '#1e293b', display: 'block', lineHeight: '1.3', marginBottom: '4px' }}>
                            {produto.nome}
                          </strong>
                          <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                            {produto.marca}
                          </span>
                          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#6d28d9', display: 'block' }}>
                            {formatarMoeda(Number(produto.precoVenda) || 0)}
                          </span>
                          <span style={{ fontSize: '10px', color: semEstoque ? '#ef4444' : '#10b981', display: 'block', marginBottom: '8px' }}>
                            Estoque: {Number(produto.quantidade) || 0} un.
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '8px' }}>
                          <input
                            type="number"
                            min="1"
                            value={qtdInput}
                            onChange={(e) => alterarQuantidadeProduto(produto.id, e.target.value)}
                            style={{ width: '45px', padding: '6px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px' }}
                          />
                          <button
                            type="button"
                            disabled={semEstoque}
                            onClick={() => adicionarProduto(produto)}
                            style={{
                              flex: 1,
                              backgroundColor: semEstoque ? '#cbd5e1' : '#6d28d9',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: semEstoque ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                           
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                          >
                            <span>+</span> Adicionar
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* COLUNA 2: CARRINHO DE COMPRAS */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '14px' }}>Carrinho de Compras</h2>

          {/* Seleção de Cliente */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
              Cliente da Venda *
            </label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                backgroundColor: '#fff',
                outline: 'none'
              }}
            >
              <option value="">Selecione o cliente...</option>
              {clientes.map((cli) => (
                <option key={cli.id} value={cli.id}>
                  {cli.nome}
                </option>
              ))}
            </select>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '14px 0' }} />

          {/* Lista de Itens no Carrinho */}
          <div style={{ minHeight: '220px', maxHeight: '340px', overflowY: 'auto', marginBottom: '16px' }}>
            {itens.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0', fontSize: '13px' }}>
                🛒 Carrinho vazio. Adicione produtos ao lado.
              </div>
            ) : (
              itens.map((item) => (
                <div
                  key={item.produtoId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: '1px solid #f8fafc'
                  }}
                >
                  <div style={{ flex: 1, paddingRight: '8px' }}>
                    <strong style={{ fontSize: '13px', color: '#1e293b', display: 'block' }}>{item.nome}</strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{formatarMoeda(item.precoUnitario)} un.</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => alterarQuantidadeItemCarrinho(item.produtoId, item.quantidade - 1)}
                      style={{ width: '24px', height: '24px', background: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      -
                    </button>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{item.quantidade}</span>
                    <button
                      type="button"
                      onClick={() => alterarQuantidadeItemCarrinho(item.produtoId, item.quantidade + 1)}
                      style={{ width: '24px', height: '24px', background: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      +
                    </button>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: '70px', marginLeft: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>
                      {formatarMoeda(item.precoUnitario * item.quantidade)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removerProduto(item.produtoId)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', marginLeft: '8px', fontSize: '14px' }}
                    title="Remover item"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUNA 3: RESUMO DA VENDA & PAGAMENTO */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '14px' }}>Resumo & Pagamento</h2>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '10px' }}>
            <span>Subtotal:</span>
            <span>{formatarMoeda(subtotal)}</span>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '14px 0' }} />

          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Total a Pagar:</span>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#6d28d9', marginTop: '4px' }}>
              {formatarMoeda(subtotal)}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
              Forma de Pagamento
            </label>
            <select
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                backgroundColor: '#fff',
                outline: 'none',
                fontWeight: 600,
                color: '#1e293b'
              }}
            >
              <option value="Pix">💠 Pix</option>
              <option value="Cartão">💳 Cartão (Crédito/Débito)</option>
              <option value="Dinheiro">💵 Dinheiro</option>
              <option value="Fiado">📝 Fiado (Pendente)</option>
            </select>
          </div>

          {formaPagamento === 'Fiado' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                Data de Vencimento *
              </label>
              <input
                type="date"
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px'
                }}
              />
            </div>
          )}

          {/* Botões de Ação */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              disabled={!clienteId || itens.length === 0}
              onClick={finalizarVenda}
              style={{
                width: '100%',
                backgroundColor: (!clienteId || itens.length === 0) ? '#cbd5e1' : '#6d28d9',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: (!clienteId || itens.length === 0) ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 10px rgba(109, 40, 217, 0.2)'
              }}
            >
              Finalizar Venda
            </button>

            <button
              type="button"
              onClick={limparVenda}
              style={{
                width: '100%',
                backgroundColor: 'white',
                color: '#64748b',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '10px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Limpar Carrinho
            </button>
          </div>

          {/* Mensagem de Feedback */}
          {mensagem && (
            <div
              style={{
                marginTop: '14px',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '12px',
                backgroundColor: erro ? '#fef2f2' : '#f0fdf4',
                color: erro ? '#dc2626' : '#16a34a',
                border: `1px solid ${erro ? '#fca5a5' : '#86efac'}`
              }}
            >
              {mensagem}
            </div>
          )}

        </div>

      </div>
    </div>
  )
}