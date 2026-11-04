
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type {
  LoteEstoque,
  MovimentacaoEstoque,
} from '../types/estoque'

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

type Fornecedor = {
  id: number
  nome: string
  telefone?: string
  whatsapp?: string
  email?: string
}

type ItemCompra = {
  produtoId: number
  codigo: string
  nome: string
  quantidade: number
  precoUnitario: number
  total: number
  lote: string
  validade: string
}

type Compra = {
  id: number
  data: string
  fornecedorId: number
  fornecedorNome: string
  numeroNota: string
  itens: ItemCompra[]
  total: number
  formaPagamento: string
  parcelas: number
}

type ContaCompra = {
  id: number
  compraId: number
  descricao: string
  fornecedorId: number
  fornecedorNome: string
  valor: number
  vencimento: string
  status: 'Pendente' | 'Pago'
  dataPagamento: string
  formaPagamento: string
}

const chaveProdutos = 'norma-produtos'
const chaveFornecedores = 'norma-fornecedores'
const chaveCompras = 'norma-compras'
const chaveContas = 'norma-contas-compras'
const chaveLotes = 'norma-lotes'
const chaveMovimentacoes = 'norma-movimentacoes'

const dataHoje = () => {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const dia = String(hoje.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

const produtoVazio = {
  produtoId: '',
  quantidade: '',
  precoUnitario: '',
}

const produtoNovoVazio = {
  codigo: '',
  nome: '',
  marca: '',
  categoria: '',
  precoVenda: '',
  estoqueMinimo: '1',
}

function lerLista<T>(chave: string): T[] {
  try {
    const dados = localStorage.getItem(chave)
    return dados ? (JSON.parse(dados) as T[]) : []
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

function adicionarMes(data: string, quantidade: number) {
  const [ano, mes, dia] = data.split('-').map(Number)
  const dataNova = new Date(ano, mes - 1 + quantidade, dia)

  if (dataNova.getDate() !== dia) {
    dataNova.setDate(0)
  }

  const novoAno = dataNova.getFullYear()
  const novoMes = String(dataNova.getMonth() + 1).padStart(2, '0')
  const novoDia = String(dataNova.getDate()).padStart(2, '0')

  return `${novoAno}-${novoMes}-${novoDia}`
}

function Compras() {
  const [produtos, setProdutos] = useState<Produto[]>(() =>
    lerLista<Produto>(chaveProdutos),
  )

  const [fornecedores, setFornecedores] = useState<Fornecedor[]>(() =>
    lerLista<Fornecedor>(chaveFornecedores),
  )

  const [compras, setCompras] = useState<Compra[]>(() =>
    lerLista<Compra>(chaveCompras),
  )

  const [contasCompra, setContasCompra] = useState<ContaCompra[]>(() =>
    lerLista<ContaCompra>(chaveContas),
  )

  const [lotes, setLotes] = useState<LoteEstoque[]>(() =>
    lerLista<LoteEstoque>(chaveLotes),
  )

  const [compraSelecionada, setCompraSelecionada] =
    useState<Compra | null>(null)

  const [fornecedorId, setFornecedorId] = useState('')
  const [dataCompra, setDataCompra] = useState(dataHoje())
  const [numeroNota, setNumeroNota] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('Dinheiro')
  const [quantidadeParcelas, setQuantidadeParcelas] = useState('1')
  const [primeiroVencimento, setPrimeiroVencimento] = useState(dataHoje())

  const [itemFormulario, setItemFormulario] = useState({ ...produtoVazio })
  const [itens, setItens] = useState<ItemCompra[]>([])

  const [mostrarCadastroProduto, setMostrarCadastroProduto] =
    useState(false)

  const [produtoNovo, setProdutoNovo] = useState({
    ...produtoNovoVazio,
  })

  const [loteFormulario, setLoteFormulario] = useState('')
  const [validadeFormulario, setValidadeFormulario] = useState('')

  useEffect(() => {
    function atualizarDados() {
      setProdutos(lerLista<Produto>(chaveProdutos))
      setFornecedores(lerLista<Fornecedor>(chaveFornecedores))
      setCompras(lerLista<Compra>(chaveCompras))
      setContasCompra(lerLista<ContaCompra>(chaveContas))
      setLotes(lerLista<LoteEstoque>(chaveLotes))
    }

    window.addEventListener('storage', atualizarDados)
    window.addEventListener('norma-dados-atualizados', atualizarDados)

    return () => {
      window.removeEventListener('storage', atualizarDados)
      window.removeEventListener('norma-dados-atualizados', atualizarDados)
    }
  }, [])

  const totalCompra = itens.reduce(
    (total, item) => total + item.total,
    0,
  )

  const produtoSelecionado = produtos.find(
    (produto) => produto.id === Number(itemFormulario.produtoId),
  )

  function handleProdutoChange(valor: string) {
    const produto = produtos.find((item) => item.id === Number(valor))

    setItemFormulario({
      produtoId: valor,
      quantidade: '',
      precoUnitario: produto ? String(produto.precoCusto) : '',
    })

    setLoteFormulario('')
    setValidadeFormulario('')
  }

  function cadastrarNovoProduto() {
    if (!produtoNovo.codigo.trim()) {
      window.alert('Informe o código do produto.')
      return
    }

    if (!produtoNovo.nome.trim()) {
      window.alert('Informe o nome do produto.')
      return
    }

    const produtosAtuais = lerLista<Produto>(chaveProdutos)

    const codigoExiste = produtosAtuais.some(
      (produto) =>
        produto.codigo.toLowerCase() ===
        produtoNovo.codigo.trim().toLowerCase(),
    )

    if (codigoExiste) {
      window.alert('Já existe um produto cadastrado com esse código.')
      return
    }

    const precoVenda = Number(produtoNovo.precoVenda)
    const estoqueMinimo = Number(produtoNovo.estoqueMinimo)

    if (
      produtoNovo.precoVenda !== '' &&
      (!Number.isFinite(precoVenda) || precoVenda < 0)
    ) {
      window.alert('Informe um preço de venda válido.')
      return
    }

    if (
      !Number.isInteger(estoqueMinimo) ||
      estoqueMinimo < 0
    ) {
      window.alert('Informe um estoque mínimo válido.')
      return
    }

    const novoProduto: Produto = {
      id: Date.now(),
      codigo: produtoNovo.codigo.trim(),
      nome: produtoNovo.nome.trim(),
      marca: produtoNovo.marca.trim(),
      categoria: produtoNovo.categoria.trim(),
      precoCusto: 0,
      precoVenda: produtoNovo.precoVenda === '' ? 0 : precoVenda,
      quantidade: 0,
      estoqueMinimo,
      validade: '',
      lote: '',
      fornecedor: '',
    }

    const produtosAtualizados = [...produtosAtuais, novoProduto]

    try {
      localStorage.setItem(
        chaveProdutos,
        JSON.stringify(produtosAtualizados),
      )

      setProdutos(produtosAtualizados)

      setItemFormulario({
        produtoId: String(novoProduto.id),
        quantidade: '',
        precoUnitario: '',
      })

      setProdutoNovo({ ...produtoNovoVazio })
      setMostrarCadastroProduto(false)

      window.dispatchEvent(new Event('norma-dados-atualizados'))

      window.alert(
        'Produto cadastrado! Agora informe a quantidade, o custo, o lote e a validade da entrada.',
      )
    } catch {
      window.alert('Não foi possível salvar o novo produto.')
    }
  }

  function adicionarItem() {
    const produto = produtos.find(
      (item) => item.id === Number(itemFormulario.produtoId),
    )

    const quantidade = Number(itemFormulario.quantidade)
    const precoUnitario = Number(itemFormulario.precoUnitario)

    if (!produto) {
      window.alert('Selecione um produto.')
      return
    }

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      window.alert('Informe uma quantidade inteira maior que zero.')
      return
    }

    if (
      itemFormulario.precoUnitario === '' ||
      !Number.isFinite(precoUnitario) ||
      precoUnitario < 0
    ) {
      window.alert('Informe um preço de compra válido.')
      return
    }

    const itemExistente = itens.find(
      (item) => item.produtoId === produto.id,
    )

    if (itemExistente) {
      window.alert(
        'Este produto já foi adicionado. Remova-o para alterar seus dados.',
      )
      return
    }

    const novoItem: ItemCompra = {
      produtoId: produto.id,
      codigo: produto.codigo,
      nome: produto.nome,
      quantidade,
      precoUnitario,
      total: quantidade * precoUnitario,
      lote: loteFormulario.trim(),
      validade: validadeFormulario,
    }

    setItens((lista) => [...lista, novoItem])
    setItemFormulario({ ...produtoVazio })
    setLoteFormulario('')
    setValidadeFormulario('')
  }

  function removerItem(produtoId: number) {
    setItens((lista) =>
      lista.filter((item) => item.produtoId !== produtoId),
    )
  }

  function limparFormulario() {
    setFornecedorId('')
    setDataCompra(dataHoje())
    setNumeroNota('')
    setFormaPagamento('Dinheiro')
    setQuantidadeParcelas('1')
    setPrimeiroVencimento(dataHoje())
    setItemFormulario({ ...produtoVazio })
    setItens([])
    setProdutoNovo({ ...produtoNovoVazio })
    setMostrarCadastroProduto(false)
    setLoteFormulario('')
    setValidadeFormulario('')
  }

  function salvarCompra(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const fornecedor = fornecedores.find(
      (item) => item.id === Number(fornecedorId),
    )

    if (!fornecedor) {
      window.alert('Selecione um fornecedor cadastrado.')
      return
    }

    if (itens.length === 0) {
      window.alert('Adicione pelo menos um produto à compra.')
      return
    }

    const parcelas =
      formaPagamento === 'Crédito' || formaPagamento === 'Boleto'
        ? Number(quantidadeParcelas)
        : 1

    if (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > 48) {
      window.alert('Informe uma quantidade de parcelas entre 1 e 48.')
      return
    }

    if (
      (formaPagamento === 'Crédito' || formaPagamento === 'Boleto') &&
      !primeiroVencimento
    ) {
      window.alert('Informe a data do primeiro vencimento.')
      return
    }

    const produtosAtuais = lerLista<Produto>(chaveProdutos)
    const comprasAtuais = lerLista<Compra>(chaveCompras)
    const contasAtuais = lerLista<ContaCompra>(chaveContas)
    const lotesAtuais = lerLista<LoteEstoque>(chaveLotes)
    const movimentacoesAtuais =
      lerLista<MovimentacaoEstoque>(chaveMovimentacoes)

    const produtosAtualizados = [...produtosAtuais]
    const novosLotes: LoteEstoque[] = []
    const novaCompraId = Date.now()

    for (let i = 0; i < itens.length; i++) {
      const item = itens[i]

      const indice = produtosAtualizados.findIndex(
        (produto) => produto.id === item.produtoId,
      )

      if (indice === -1) {
        window.alert(
          `O produto "${item.nome}" não foi encontrado no cadastro.`,
        )
        return
      }

      const produtoAtual = produtosAtualizados[indice]

      produtosAtualizados[indice] = {
        ...produtoAtual,
        quantidade: produtoAtual.quantidade + item.quantidade,
        precoCusto: item.precoUnitario,
        fornecedor: fornecedor.nome,
      }

      novosLotes.push({
        id: novaCompraId + i + 1,
        produtoId: item.produtoId,
        compraId: novaCompraId,
        quantidadeInicial: item.quantidade,
        quantidadeDisponivel: item.quantidade,
        precoCusto: item.precoUnitario,
        lote: item.lote,
        validade: item.validade,
        dataEntrada: dataCompra,
        fornecedorNome: fornecedor.nome,
      })
    }

    const novaCompra: Compra = {
      id: novaCompraId,
      data: dataCompra,
      fornecedorId: fornecedor.id,
      fornecedorNome: fornecedor.nome,
      numeroNota: numeroNota.trim(),
      itens,
      total: totalCompra,
      formaPagamento,
      parcelas,
    }

    const novasContas: ContaCompra[] = []

    for (let i = 0; i < parcelas; i++) {
      const valorParcela =
        i === parcelas - 1
          ? Number(
              (totalCompra - (totalCompra / parcelas) * i).toFixed(2),
            )
          : Number((totalCompra / parcelas).toFixed(2))

      const pagamentoImediato =
        formaPagamento === 'Dinheiro' || formaPagamento === 'Débito'

      novasContas.push({
        id: novaCompraId + 100 + i,
        compraId: novaCompra.id,
        descricao:
          parcelas > 1
            ? `Compra ${numeroNota.trim() ? `- Nota ${numeroNota.trim()}` : ''} - Parcela ${i + 1}/${parcelas}`
            : `Compra ${numeroNota.trim() ? `- Nota ${numeroNota.trim()}` : ''}`,
        fornecedorId: fornecedor.id,
        fornecedorNome: fornecedor.nome,
        valor: valorParcela,
        vencimento: pagamentoImediato
          ? dataCompra
          : adicionarMes(primeiroVencimento, i),
        status: pagamentoImediato ? 'Pago' : 'Pendente',
        dataPagamento: pagamentoImediato ? dataCompra : '',
        formaPagamento,
      })
    }

    // Cada lote recebido gera uma movimentação de entrada.
    const novasMovimentacoes: MovimentacaoEstoque[] = novosLotes.map(
      (lote, indice) => {
        const item = itens[indice]

        return {
          id: lote.id,
          tipo: 'Entrada',
          produtoId: lote.produtoId,
          produtoNome: item.nome,
          quantidade: lote.quantidadeInicial,
          loteId: lote.id,
          lote: lote.lote || 'Não informado',
          data: `${dataCompra}T12:00:00`,
          origemId: novaCompra.id,
          origem: 'Compra',
          pessoaNome: fornecedor.nome,
        }
      },
    )

    // Guardamos os dados anteriores para restaurá-los se houver falha.
    const chavesParaSalvar = [
      chaveProdutos,
      chaveCompras,
      chaveContas,
      chaveLotes,
      chaveMovimentacoes,
    ]

    const dadosAnteriores = chavesParaSalvar.map((chave) => ({
      chave,
      valor: localStorage.getItem(chave),
    }))

    try {
      localStorage.setItem(
        chaveProdutos,
        JSON.stringify(produtosAtualizados),
      )

      localStorage.setItem(
        chaveCompras,
        JSON.stringify([...comprasAtuais, novaCompra]),
      )

      localStorage.setItem(
        chaveContas,
        JSON.stringify([...contasAtuais, ...novasContas]),
      )

      localStorage.setItem(
        chaveLotes,
        JSON.stringify([...lotesAtuais, ...novosLotes]),
      )

      localStorage.setItem(
        chaveMovimentacoes,
        JSON.stringify([
          ...movimentacoesAtuais,
          ...novasMovimentacoes,
        ]),
      )

      setProdutos(produtosAtualizados)
      setCompras([...comprasAtuais, novaCompra])
      setContasCompra([...contasAtuais, ...novasContas])
      setLotes([...lotesAtuais, ...novosLotes])

      window.dispatchEvent(new Event('norma-dados-atualizados'))

      window.alert(
        'Compra registrada com sucesso! O estoque, os lotes e o histórico de movimentações foram atualizados.',
      )

      limparFormulario()
    } catch {
      // Se alguma gravação falhar, restaura os valores anteriores.
      dadosAnteriores.forEach(({ chave, valor }) => {
        try {
          if (valor === null) {
            localStorage.removeItem(chave)
          } else {
            localStorage.setItem(chave, valor)
          }
        } catch {
          // Mantém a tentativa de restauração das demais informações.
        }
      })

      window.alert(
        'Não foi possível salvar a compra. O sistema tentou restaurar os dados anteriores. Verifique o espaço disponível no navegador.',
      )
    }
  }

  function formatarData(data: string) {
    if (!data) return 'Não informada'

    return new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR')
  }

  const parcelasSelecionadas = compraSelecionada
    ? contasCompra.filter(
        (conta) => conta.compraId === compraSelecionada.id,
      )
    : []

  const lotesDaCompraSelecionada = compraSelecionada
    ? lotes.filter((lote) => lote.compraId === compraSelecionada.id)
    : []

  return (
    <section className="compras-page">
      <div className="compras-header">
        <h2>Registro de compras</h2>
        <p>
          Registre as compras dos fornecedores e atualize seu estoque.
        </p>
      </div>

      <form className="compra-form" onSubmit={salvarCompra}>
        <h3>Nova compra</h3>

        <div className="campos-compra">
          <div className="campo-compra">
            <label htmlFor="fornecedor-compra">Fornecedor *</label>
            <select
              id="fornecedor-compra"
              value={fornecedorId}
              onChange={(event) => setFornecedorId(event.target.value)}
              required
            >
              <option value="">Selecione um fornecedor</option>

              {fornecedores.map((fornecedor) => (
                <option key={fornecedor.id} value={fornecedor.id}>
                  {fornecedor.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="campo-compra">
            <label htmlFor="data-compra">Data da compra *</label>
            <input
              id="data-compra"
              type="date"
              value={dataCompra}
              onChange={(event) => setDataCompra(event.target.value)}
              required
            />
          </div>

          <div className="campo-compra">
            <label htmlFor="nota-compra">Número da nota fiscal</label>
            <input
              id="nota-compra"
              value={numeroNota}
              onChange={(event) => setNumeroNota(event.target.value)}
              placeholder="Ex.: 12345"
            />
          </div>
        </div>

        <div className="compra-separador" />

        <h3>Produtos da compra</h3>

        <button
          type="button"
          className="botao-adicionar-item"
          onClick={() => setMostrarCadastroProduto(!mostrarCadastroProduto)}
        >
          + Cadastrar novo produto
        </button>

        {mostrarCadastroProduto && (
          <div className="compra-form">
            <h3>Cadastrar novo produto</h3>

            <div className="campos-compra">
              <div className="campo-compra">
                <label htmlFor="novo-codigo">Código do produto *</label>
                <input
                  id="novo-codigo"
                  value={produtoNovo.codigo}
                  onChange={(event) =>
                    setProdutoNovo((atual) => ({
                      ...atual,
                      codigo: event.target.value,
                    }))
                  }
                  placeholder="Ex.: 001"
                />
              </div>

              <div className="campo-compra">
                <label htmlFor="novo-nome">Nome do produto *</label>
                <input
                  id="novo-nome"
                  value={produtoNovo.nome}
                  onChange={(event) =>
                    setProdutoNovo((atual) => ({
                      ...atual,
                      nome: event.target.value,
                    }))
                  }
                  placeholder="Nome do produto"
                />
              </div>

              <div className="campo-compra">
                <label htmlFor="novo-marca">Marca</label>
                <input
                  id="novo-marca"
                  value={produtoNovo.marca}
                  onChange={(event) =>
                    setProdutoNovo((atual) => ({
                      ...atual,
                      marca: event.target.value,
                    }))
                  }
                  placeholder="Ex.: Natura"
                />
              </div>

              <div className="campo-compra">
                <label htmlFor="novo-categoria">Categoria</label>
                <input
                  id="novo-categoria"
                  value={produtoNovo.categoria}
                  onChange={(event) =>
                    setProdutoNovo((atual) => ({
                      ...atual,
                      categoria: event.target.value,
                    }))
                  }
                  placeholder="Ex.: Perfume"
                />
              </div>

              <div className="campo-compra">
                <label htmlFor="novo-preco-venda">Preço de venda (R$)</label>
                <input
                  id="novo-preco-venda"
                  type="number"
                  min="0"
                  step="0.01"
                  value={produtoNovo.precoVenda}
                  onChange={(event) =>
                    setProdutoNovo((atual) => ({
                      ...atual,
                      precoVenda: event.target.value,
                    }))
                  }
                  placeholder="0,00"
                />
              </div>

              <div className="campo-compra">
                <label htmlFor="novo-estoque-minimo">Estoque mínimo</label>
                <input
                  id="novo-estoque-minimo"
                  type="number"
                  min="0"
                  step="1"
                  value={produtoNovo.estoqueMinimo}
                  onChange={(event) =>
                    setProdutoNovo((atual) => ({
                      ...atual,
                      estoqueMinimo: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="acoes-compra">
              <button
                type="button"
                className="botao-salvar-compra"
                onClick={cadastrarNovoProduto}
              >
                Salvar produto
              </button>

              <button
                type="button"
                className="botao-cancelar-compra"
                onClick={() => setMostrarCadastroProduto(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="campos-compra">
          <div className="campo-compra">
            <label htmlFor="produto-compra">Produto *</label>
            <select
              id="produto-compra"
              value={itemFormulario.produtoId}
              onChange={(event) => handleProdutoChange(event.target.value)}
            >
              <option value="">Selecione um produto</option>

              {produtos.map((produto) => (
                <option key={produto.id} value={produto.id}>
                  {produto.codigo} - {produto.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="campo-compra">
            <label htmlFor="quantidade-compra">Quantidade *</label>
            <input
              id="quantidade-compra"
              type="number"
              min="1"
              step="1"
              value={itemFormulario.quantidade}
              onChange={(event) =>
                setItemFormulario((atual) => ({
                  ...atual,
                  quantidade: event.target.value,
                }))
              }
              placeholder="Ex.: 10"
            />
          </div>

          <div className="campo-compra">
            <label htmlFor="preco-compra">
              Preço unitário de compra (R$) *
            </label>
            <input
              id="preco-compra"
              type="number"
              min="0"
              step="0.01"
              value={itemFormulario.precoUnitario}
              onChange={(event) =>
                setItemFormulario((atual) => ({
                  ...atual,
                  precoUnitario: event.target.value,
                }))
              }
              placeholder="0,00"
            />
          </div>
        </div>

        <div className="campos-compra">
          <div className="campo-compra">
            <label htmlFor="lote-compra">Número do lote</label>
            <input
              id="lote-compra"
              value={loteFormulario}
              onChange={(event) => setLoteFormulario(event.target.value)}
              placeholder="Ex.: LOTE 001"
            />
          </div>

          <div className="campo-compra">
            <label htmlFor="validade-compra">Data de validade</label>
            <input
              id="validade-compra"
              type="date"
              value={validadeFormulario}
              onChange={(event) => setValidadeFormulario(event.target.value)}
            />
          </div>
        </div>

        {produtoSelecionado && (
          <p className="compra-dica">
            Estoque atual: {produtoSelecionado.quantidade} unidades. O preço
            informado será o novo preço de custo do produto.
          </p>
        )}

        <button
          className="botao-adicionar-item"
          type="button"
          onClick={adicionarItem}
        >
          + Adicionar produto à nota
        </button>

        {itens.length > 0 && (
          <div className="tabela-itens-compra">
            <h3>Produtos adicionados</h3>

            <div className="tabela-compras-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Quantidade</th>
                    <th>Preço unitário</th>
                    <th>Lote</th>
                    <th>Validade</th>
                    <th>Total</th>
                    <th>Ação</th>
                  </tr>
                </thead>

                <tbody>
                  {itens.map((item) => (
                    <tr key={item.produtoId}>
                      <td>{item.nome}</td>
                      <td>{item.quantidade}</td>
                      <td>{formatarMoeda(item.precoUnitario)}</td>
                      <td>{item.lote || 'Não informado'}</td>
                      <td>{formatarData(item.validade)}</td>
                      <td>{formatarMoeda(item.total)}</td>
                      <td>
                        <button
                          className="botao-remover-item"
                          type="button"
                          onClick={() => removerItem(item.produtoId)}
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="compra-total">
              <span>Total da compra</span>
              <strong>{formatarMoeda(totalCompra)}</strong>
            </div>
          </div>
        )}

        <div className="compra-separador" />

        <h3>Pagamento</h3>

        <div className="campos-compra">
          <div className="campo-compra">
            <label htmlFor="forma-pagamento-compra">
              Forma de pagamento *
            </label>

            <select
              id="forma-pagamento-compra"
              value={formaPagamento}
              onChange={(event) => setFormaPagamento(event.target.value)}
            >
              <option value="Dinheiro">Dinheiro</option>
              <option value="Débito">Cartão de débito</option>
              <option value="Crédito">Cartão de crédito</option>
              <option value="Boleto">Boleto</option>
            </select>
          </div>

          {(formaPagamento === 'Crédito' ||
            formaPagamento === 'Boleto') && (
            <>
              <div className="campo-compra">
                <label htmlFor="parcelas-compra">
                  Quantidade de parcelas *
                </label>

                <input
                  id="parcelas-compra"
                  type="number"
                  min="1"
                  max="48"
                  step="1"
                  value={quantidadeParcelas}
                  onChange={(event) =>
                    setQuantidadeParcelas(event.target.value)
                  }
                  required
                />
              </div>

              <div className="campo-compra">
                <label htmlFor="vencimento-compra">
                  Vencimento da primeira parcela *
                </label>

                <input
                  id="vencimento-compra"
                  type="date"
                  value={primeiroVencimento}
                  onChange={(event) =>
                    setPrimeiroVencimento(event.target.value)
                  }
                  required
                />
              </div>
            </>
          )}
        </div>

        {(formaPagamento === 'Crédito' ||
          formaPagamento === 'Boleto') && (
          <p className="compra-dica">
            As parcelas serão registradas individualmente no financeiro,
            com vencimentos mensais.
          </p>
        )}

        <div className="acoes-compra">
          <button
            className="botao-salvar-compra"
            type="submit"
            disabled={itens.length === 0}
          >
            Registrar compra
          </button>

          <button
            className="botao-cancelar-compra"
            type="button"
            onClick={limparFormulario}
          >
            Limpar formulário
          </button>
        </div>
      </form>

      <div className="lista-compras">
        <h2>Histórico de compras ({compras.length})</h2>

        {compras.length === 0 ? (
          <div className="compras-empty">
            <h3>Nenhuma compra registrada</h3>
            <p>As compras realizadas aparecerão aqui.</p>
          </div>
        ) : (
          <div className="tabela-compras-scroll">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Fornecedor</th>
                  <th>Nota fiscal</th>
                  <th>Produtos</th>
                  <th>Pagamento</th>
                  <th>Total</th>
                  <th>Ação</th>
                </tr>
              </thead>

              <tbody>
                {[...compras].reverse().map((compra) => (
                  <tr key={compra.id}>
                    <td>{formatarData(compra.data)}</td>
                    <td>{compra.fornecedorNome}</td>
                    <td>{compra.numeroNota || 'Não informada'}</td>
                    <td>{compra.itens.length}</td>
                    <td>
                      {compra.formaPagamento}
                      {compra.parcelas > 1 && ` (${compra.parcelas}x)`}
                    </td>
                    <td>{formatarMoeda(compra.total)}</td>
                    <td>
                      <button
                        type="button"
                        className="botao-adicionar-item"
                        onClick={() => setCompraSelecionada(compra)}
                      >
                        Ver detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {compraSelecionada && (
          <div className="compra-detalhes">
            <div className="compras-header">
              <div>
                <h2>Detalhes da nota fiscal</h2>
                <p>
                  Nota: {compraSelecionada.numeroNota || 'Não informada'}
                </p>
              </div>

              <button
                type="button"
                className="botao-cancelar-compra"
                onClick={() => setCompraSelecionada(null)}
              >
                Fechar detalhes
              </button>
            </div>

            <div className="campos-compra">
              <div className="campo-compra">
                <strong>Fornecedor</strong>
                <p>{compraSelecionada.fornecedorNome}</p>
              </div>

              <div className="campo-compra">
                <strong>Data da compra</strong>
                <p>{formatarData(compraSelecionada.data)}</p>
              </div>

              <div className="campo-compra">
                <strong>Valor total</strong>
                <p>{formatarMoeda(compraSelecionada.total)}</p>
              </div>

              <div className="campo-compra">
                <strong>Forma de pagamento</strong>
                <p>{compraSelecionada.formaPagamento}</p>
              </div>

              <div className="campo-compra">
                <strong>Parcelamento</strong>
                <p>
                  {compraSelecionada.parcelas === 1
                    ? 'À vista'
                    : `${compraSelecionada.parcelas} parcelas`}
                </p>
              </div>
            </div>

            <h3>Produtos da nota</h3>

            <div className="tabela-compras-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Quantidade</th>
                    <th>Preço unitário</th>
                    <th>Lote</th>
                    <th>Validade</th>
                    <th>Total</th>
                  </tr>
                </thead>

                <tbody>
                  {compraSelecionada.itens.map((item, indice) => (
                    <tr key={`${item.produtoId}-${indice}`}>
                      <td>{item.nome}</td>
                      <td>{item.quantidade}</td>
                      <td>{formatarMoeda(item.precoUnitario)}</td>
                      <td>{item.lote || 'Não informado'}</td>
                      <td>{formatarData(item.validade)}</td>
                      <td>{formatarMoeda(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3>Lotes registrados nesta compra</h3>

            {lotesDaCompraSelecionada.length === 0 ? (
              <p className="compra-dica">
                Não foram encontrados lotes registrados para esta compra.
              </p>
            ) : (
              <div className="tabela-compras-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Lote</th>
                      <th>Quantidade recebida</th>
                      <th>Validade</th>
                    </tr>
                  </thead>

                  <tbody>
                    {lotesDaCompraSelecionada.map((lote) => {
                      const produto = produtos.find(
                        (item) => item.id === lote.produtoId,
                      )

                      return (
                        <tr key={lote.id}>
                          <td>{produto?.nome || 'Produto não encontrado'}</td>
                          <td>{lote.lote || 'Não informado'}</td>
                          <td>{lote.quantidadeInicial}</td>
                          <td>{formatarData(lote.validade)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <h3>Parcelas e situação do pagamento</h3>

            {parcelasSelecionadas.length === 0 ? (
              <p className="compra-dica">
                Não foram encontradas parcelas cadastradas para esta compra.
              </p>
            ) : (
              <div className="tabela-compras-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Descrição</th>
                      <th>Forma de pagamento</th>
                      <th>Vencimento</th>
                      <th>Valor</th>
                      <th>Situação</th>
                    </tr>
                  </thead>

                  <tbody>
                    {parcelasSelecionadas.map((conta) => (
                      <tr key={conta.id}>
                        <td>{conta.descricao}</td>
                        <td>{conta.formaPagamento}</td>
                        <td>{formatarData(conta.vencimento)}</td>
                        <td>{formatarMoeda(conta.valor)}</td>
                        <td>
                          {conta.status === 'Pago' ? 'Paga' : 'Pendente'}

                          {conta.status === 'Pago' &&
                            conta.dataPagamento && (
                              <small>
                                {' '}
                                em {formatarData(conta.dataPagamento)}
                              </small>
                            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default Compras
