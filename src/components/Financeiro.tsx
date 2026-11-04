
import { useEffect, useState } from 'react'

type Pagamento = {
  id: number
  valor: number
  data: string
}

type VendaFinanceira = {
  id: number
  data: string
  clienteId: number
  clienteNome: string
  total: number
  formaPagamento: string
  statusPagamento: 'Pago' | 'Pendente'
  dataVencimento: string | null
  valorPago?: number
  pagamentos?: Pagamento[]
}

type Despesa = {
  id: number
  descricao: string
  categoria: string
  valor: number
  vencimento: string
  status: 'Pendente' | 'Pago'
  dataPagamento: string | null
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

type MovimentoCaixa = {
  id: string
  data: string
  descricao: string
  tipo: 'Entrada' | 'Saída'
  valor: number
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
  return (Number(valor) || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function dataHoje() {
  const hoje = new Date()

  return [
    hoje.getFullYear(),
    String(hoje.getMonth() + 1).padStart(2, '0'),
    String(hoje.getDate()).padStart(2, '0'),
  ].join('-')
}

function formatarData(data: string | null | undefined) {
  if (!data) return 'Não informada'

  const partes = data.slice(0, 10).split('-')

  if (partes.length !== 3) return data

  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function valorPagoDaVenda(venda: VendaFinanceira) {
  if (venda.statusPagamento === 'Pago' && !venda.pagamentos?.length) {
    return Number(venda.total) || 0
  }

  if (typeof venda.valorPago === 'number') {
    return venda.valorPago
  }

  return (venda.pagamentos || []).reduce(
    (total, pagamento) =>
      total + (Number(pagamento.valor) || 0),
    0,
  )
}

function valorRestanteDaVenda(venda: VendaFinanceira) {
  return Math.max(
    0,
    (Number(venda.total) || 0) - valorPagoDaVenda(venda),
  )
}

function Financeiro() {
  const [vendas, setVendas] = useState<VendaFinanceira[]>(() =>
    lerLista<VendaFinanceira>('norma-vendas'),
  )

  const [despesas, setDespesas] = useState<Despesa[]>(() =>
    lerLista<Despesa>('norma-despesas'),
  )

  // Contas das compras feitas aos fornecedores.
  const [contasCompra, setContasCompra] = useState<ContaCompra[]>(() =>
    lerLista<ContaCompra>('norma-contas-compras'),
  )

  const [saldoInicial, setSaldoInicial] = useState(() => {
    const salvo = localStorage.getItem('norma-saldo-inicial')

    return salvo !== null ? Number(salvo) : 500
  })

  const [novoSaldoInicial, setNovoSaldoInicial] = useState(() => {
    const salvo = localStorage.getItem('norma-saldo-inicial')

    return salvo !== null ? salvo : '500'
  })

  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState('Fornecedor')
  const [valor, setValor] = useState('')
  const [vencimento, setVencimento] = useState(dataHoje())

  const [vendaSelecionada, setVendaSelecionada] = useState<number | null>(null)
  const [valorPagamento, setValorPagamento] = useState('')

  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState(false)

  function atualizarDados() {
    setVendas(lerLista<VendaFinanceira>('norma-vendas'))
    setDespesas(lerLista<Despesa>('norma-despesas'))
    setContasCompra(lerLista<ContaCompra>('norma-contas-compras'))
  }

  useEffect(() => {
    window.addEventListener('norma-dados-atualizados', atualizarDados)
    window.addEventListener('storage', atualizarDados)

    return () => {
      window.removeEventListener('norma-dados-atualizados', atualizarDados)
      window.removeEventListener('storage', atualizarDados)
    }
  }, [])

  // SALVAR SALDO INICIAL

  function salvarSaldoInicial(
    evento: React.FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault()

    const valorNumerico = Number(novoSaldoInicial.replace(',', '.'))

    if (!Number.isFinite(valorNumerico) || valorNumerico < 0) {
      setMensagem('Informe um saldo inicial válido.')
      setErro(true)
      return
    }

    try {
      localStorage.setItem(
        'norma-saldo-inicial',
        String(valorNumerico),
      )

      setSaldoInicial(valorNumerico)
      setMensagem('Saldo inicial atualizado com sucesso!')
      setErro(false)
    } catch {
      setMensagem('Não foi possível salvar o saldo inicial.')
      setErro(true)
    }
  }

  // CONTAS A RECEBER

  const vendasFiado = vendas.filter(
    (venda) => venda.formaPagamento === 'Fiado',
  )

  const contasReceber = vendasFiado.filter(
    (venda) => valorRestanteDaVenda(venda) > 0,
  )

  const totalReceber = contasReceber.reduce(
    (total, venda) => total + valorRestanteDaVenda(venda),
    0,
  )

  // CONTAS A PAGAR: DESPESAS E COMPRAS

  const contasPagar = despesas.filter(
    (despesa) => despesa.status === 'Pendente',
  )

  const contasCompraPendentes = contasCompra.filter(
    (conta) => conta.status === 'Pendente',
  )

  const despesasPagas = despesas.filter(
    (despesa) => despesa.status === 'Pago',
  )

  const contasCompraPagas = contasCompra.filter(
    (conta) => conta.status === 'Pago',
  )

  const totalDespesasPendentes = contasPagar.reduce(
    (total, despesa) => total + (Number(despesa.valor) || 0),
    0,
  )

  const totalComprasPendentes = contasCompraPendentes.reduce(
    (total, conta) => total + (Number(conta.valor) || 0),
    0,
  )

  const totalPagar = totalDespesasPendentes + totalComprasPendentes

  const totalContasPendentes =
    contasPagar.length + contasCompraPendentes.length

  const contasVencidas =
    contasPagar.filter(
      (despesa) => despesa.vencimento < dataHoje(),
    ).length +
    contasCompraPendentes.filter(
      (conta) => conta.vencimento < dataHoje(),
    ).length

  // HISTÓRICO DE RECEBIMENTOS DE FIADO

  const recebimentosHistorico = vendasFiado.flatMap((venda) => {
    const pagamentos = venda.pagamentos || []

    if (pagamentos.length > 0) {
      return pagamentos.map((pagamento) => ({
        id: `${venda.id}-${pagamento.id}`,
        cliente: venda.clienteNome,
        valor: Number(pagamento.valor) || 0,
        data: pagamento.data,
        vendaId: venda.id,
        legado: false,
      }))
    }

    if (venda.statusPagamento === 'Pago') {
      return [
        {
          id: `${venda.id}-antigo`,
          cliente: venda.clienteNome,
          valor: Number(venda.total) || 0,
          data: '',
          vendaId: venda.id,
          legado: true,
        },
      ]
    }

    return []
  })

  // DESPESAS E COMPRAS PAGAS NO MÊS

  const hoje = dataHoje()
  const inicioMes = `${hoje.slice(0, 7)}-01`

  const despesasPagasNoMes = despesasPagas
    .filter(
      (despesa) =>
        despesa.dataPagamento &&
        despesa.dataPagamento.slice(0, 10) >= inicioMes &&
        despesa.dataPagamento.slice(0, 10) <= hoje,
    )
    .reduce(
      (total, despesa) =>
        total + (Number(despesa.valor) || 0),
      0,
    )

  const comprasPagasNoMes = contasCompraPagas
    .filter(
      (conta) =>
        conta.dataPagamento &&
        conta.dataPagamento.slice(0, 10) >= inicioMes &&
        conta.dataPagamento.slice(0, 10) <= hoje,
    )
    .reduce(
      (total, conta) =>
        total + (Number(conta.valor) || 0),
      0,
    )

  const totalPagamentosNoMes =
    despesasPagasNoMes + comprasPagasNoMes

  // FLUXO DE CAIXA

  const movimentosCaixa: MovimentoCaixa[] = [
    // Vendas recebidas em dinheiro, Pix ou débito.
    ...vendas
      .filter(
        (venda) =>
          venda.formaPagamento !== 'Fiado' &&
          venda.formaPagamento !== 'Cartão' &&
          venda.statusPagamento === 'Pago',
      )
      .map((venda) => ({
        id: `venda-${venda.id}`,
        data: venda.data.slice(0, 10),
        descricao: `Venda - ${venda.clienteNome}`,
        tipo: 'Entrada' as const,
        valor: Number(venda.total) || 0,
      })),

    // Cada pagamento de uma venda fiado é uma entrada.
    ...vendas.flatMap((venda) =>
      (venda.pagamentos || []).map((pagamento) => ({
        id: `fiado-${venda.id}-${pagamento.id}`,
        data: pagamento.data.slice(0, 10),
        descricao: `Fiado recebido - ${venda.clienteNome}`,
        tipo: 'Entrada' as const,
        valor: Number(pagamento.valor) || 0,
      })),
    ),

    // Despesas comuns efetivamente pagas.
    ...despesas
      .filter(
        (despesa) =>
          despesa.status === 'Pago' &&
          Boolean(despesa.dataPagamento),
      )
      .map((despesa) => ({
        id: `despesa-${despesa.id}`,
        data: (despesa.dataPagamento || '').slice(0, 10),
        descricao: despesa.descricao,
        tipo: 'Saída' as const,
        valor: Number(despesa.valor) || 0,
      })),

    // Parcelas de compras efetivamente pagas.
    ...contasCompra
      .filter(
        (conta) =>
          conta.status === 'Pago' &&
          Boolean(conta.dataPagamento),
      )
      .map((conta) => ({
        id: `compra-${conta.id}`,
        data: conta.dataPagamento.slice(0, 10),
        descricao: `Compra - ${conta.fornecedorNome} - ${conta.descricao}`,
        tipo: 'Saída' as const,
        valor: Number(conta.valor) || 0,
      })),
  ].sort((a, b) => b.data.localeCompare(a.data))

  const totalEntradas = movimentosCaixa.reduce(
    (total, movimento) =>
      movimento.tipo === 'Entrada'
        ? total + movimento.valor
        : total,
    0,
  )

  const totalSaidas = movimentosCaixa.reduce(
    (total, movimento) =>
      movimento.tipo === 'Saída'
        ? total + movimento.valor
        : total,
    0,
  )

  const saldoAtual = saldoInicial + totalEntradas - totalSaidas

  const saldoNegativo = saldoAtual < 0

  const recebimentosDoMes = movimentosCaixa
    .filter(
      (movimento) =>
        movimento.tipo === 'Entrada' &&
        movimento.data >= inicioMes &&
        movimento.data <= hoje,
    )
    .reduce(
      (total, movimento) => total + movimento.valor,
      0,
    )

  // CADASTRAR DESPESA COMUM

  function registrarDespesa(
    evento: React.FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault()

    const valorNumerico = Number(valor)

    if (!descricao.trim()) {
      setMensagem('Informe a descrição da despesa.')
      setErro(true)
      return
    }

    if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
      setMensagem('Informe um valor maior que zero.')
      setErro(true)
      return
    }

    if (!vencimento) {
      setMensagem('Informe a data de vencimento.')
      setErro(true)
      return
    }

    const novaDespesa: Despesa = {
      id: Date.now(),
      descricao: descricao.trim(),
      categoria,
      valor: valorNumerico,
      vencimento,
      status: 'Pendente',
      dataPagamento: null,
    }

    const despesasAtuais = lerLista<Despesa>('norma-despesas')

    try {
      const despesasAtualizadas = [
        ...despesasAtuais,
        novaDespesa,
      ]

      localStorage.setItem(
        'norma-despesas',
        JSON.stringify(despesasAtualizadas),
      )

      setDespesas(despesasAtualizadas)
      setDescricao('')
      setCategoria('Fornecedor')
      setValor('')
      setVencimento(dataHoje())

      setMensagem('Despesa cadastrada com sucesso!')
      setErro(false)

      window.dispatchEvent(
        new Event('norma-dados-atualizados'),
      )
    } catch {
      setMensagem('Não foi possível salvar a despesa.')
      setErro(true)
    }
  }

  // REGISTRAR PAGAMENTO TOTAL OU PARCIAL DO FIADO

  function registrarPagamento(vendaId: number) {
    const valorNumerico = Number(
      valorPagamento.replace(',', '.'),
    )

    if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
      setMensagem('Informe um valor de pagamento maior que zero.')
      setErro(true)
      return
    }

    const vendasAtuais = lerLista<VendaFinanceira>('norma-vendas')

    const venda = vendasAtuais.find(
      (item) => item.id === vendaId,
    )

    if (!venda) {
      atualizarDados()
      setMensagem('Venda não encontrada. Atualize a tela.')
      setErro(true)
      return
    }

    const restante = valorRestanteDaVenda(venda)

    if (valorNumerico > restante) {
      setMensagem(
        `O pagamento não pode ser maior que o restante de ${formatarMoeda(restante)}.`,
      )
      setErro(true)
      return
    }

    const pagamentosAnteriores = venda.pagamentos || []

    const novoPagamento: Pagamento = {
      id: Date.now(),
      valor: valorNumerico,
      data: dataHoje(),
    }

    const novoValorPago =
      valorPagoDaVenda(venda) + valorNumerico

    const novoRestante = Math.max(
      0,
      Number(venda.total) - novoValorPago,
    )

    const vendasAtualizadas = vendasAtuais.map((item) =>
      item.id === vendaId
        ? {
            ...item,
            valorPago: novoValorPago,
            pagamentos: [
              ...pagamentosAnteriores,
              novoPagamento,
            ],
            statusPagamento:
              novoRestante <= 0
                ? ('Pago' as const)
                : ('Pendente' as const),
          }
        : item,
    )

    try {
      localStorage.setItem(
        'norma-vendas',
        JSON.stringify(vendasAtualizadas),
      )

      setVendas(vendasAtualizadas)
      setVendaSelecionada(null)
      setValorPagamento('')

      setMensagem(
        novoRestante <= 0
          ? 'Venda quitada! Pagamento registrado com sucesso.'
          : `Pagamento registrado! Ainda restam ${formatarMoeda(novoRestante)}.`,
      )

      setErro(false)

      window.dispatchEvent(
        new Event('norma-dados-atualizados'),
      )
    } catch {
      setMensagem('Não foi possível registrar o pagamento.')
      setErro(true)
    }
  }

  // MARCAR DESPESA COMUM COMO PAGA

  function marcarDespesaComoPaga(despesaId: number) {
    const despesasAtuais = lerLista<Despesa>('norma-despesas')

    const despesaExiste = despesasAtuais.some(
      (despesa) => despesa.id === despesaId,
    )

    if (!despesaExiste) {
      atualizarDados()
      setMensagem('Despesa não encontrada. Atualize a tela.')
      setErro(true)
      return
    }

    const despesasAtualizadas = despesasAtuais.map((despesa) =>
      despesa.id === despesaId
        ? {
            ...despesa,
            status: 'Pago' as const,
            dataPagamento: dataHoje(),
          }
        : despesa,
    )

    try {
      localStorage.setItem(
        'norma-despesas',
        JSON.stringify(despesasAtualizadas),
      )

      setDespesas(despesasAtualizadas)

      setMensagem('Despesa marcada como paga!')
      setErro(false)

      window.dispatchEvent(
        new Event('norma-dados-atualizados'),
      )
    } catch {
      setMensagem(
        'Não foi possível registrar o pagamento da despesa.',
      )
      setErro(true)
    }
  }

  // MARCAR PARCELA DE COMPRA COMO PAGA

  function marcarCompraComoPaga(contaId: number) {
    const contasAtuais = lerLista<ContaCompra>('norma-contas-compras')

    const contaExiste = contasAtuais.some(
      (conta) => conta.id === contaId,
    )

    if (!contaExiste) {
      atualizarDados()
      setMensagem('Parcela não encontrada. Atualize a tela.')
      setErro(true)
      return
    }

    const contasAtualizadas = contasAtuais.map((conta) =>
      conta.id === contaId
        ? {
            ...conta,
            status: 'Pago' as const,
            dataPagamento: dataHoje(),
          }
        : conta,
    )

    try {
      localStorage.setItem(
        'norma-contas-compras',
        JSON.stringify(contasAtualizadas),
      )

      setContasCompra(contasAtualizadas)

      setMensagem('Parcela da compra marcada como paga!')
      setErro(false)

      window.dispatchEvent(
        new Event('norma-dados-atualizados'),
      )
    } catch {
      setMensagem('Não foi possível registrar o pagamento da parcela.')
      setErro(true)
    }
  }

  // NAVEGAR ATÉ AS CONTAS DE COMPRAS DOS FORNECEDORES

  function irParaContasCompras() {
    document
      .getElementById('contas-pagar-compras')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // TELA

  return (
    <div className="financeiro-page">
      <div className="financeiro-introducao">
        <h2>Controle financeiro</h2>

        <p>
          Acompanhe o dinheiro que a loja tem a receber e as contas
          que precisa pagar.
        </p>
      </div>

      {/* FLUXO DE CAIXA */}

      <section className="financeiro-secao">
        <h3>Fluxo de Caixa</h3>

        <p>
          Acompanhe todas as entradas, saídas e o saldo disponível
          da loja.
        </p>

        <form
          className="financeiro-formulario"
          onSubmit={salvarSaldoInicial}
        >
          <div className="financeiro-campo">
            <label htmlFor="saldo-inicial">
              Saldo inicial do caixa (R$)
            </label>

            <input
              id="saldo-inicial"
              type="number"
              min="0"
              step="0.01"
              value={novoSaldoInicial}
              onChange={(evento) =>
                setNovoSaldoInicial(evento.target.value)
              }
              required
            />
          </div>

          <button
            className="financeiro-botao"
            type="submit"
          >
            Salvar saldo inicial
          </button>
        </form>

        <div className="financeiro-resumos">
          <article className="financeiro-card">
            <span>Saldo inicial</span>
            <strong>{formatarMoeda(saldoInicial)}</strong>
            <small>Valor inicial informado pela loja</small>
          </article>

          <article className="financeiro-card">
            <span>Total de entradas</span>

            <strong style={{ color: '#15803d' }}>
              {formatarMoeda(totalEntradas)}
            </strong>

            <small>Dinheiro efetivamente recebido</small>
          </article>

          <article className="financeiro-card">
            <span>Total de saídas</span>

            <strong style={{ color: '#dc2626' }}>
              {formatarMoeda(totalSaidas)}
            </strong>

            <small>Despesas e compras efetivamente pagas</small>
          </article>

          <article className="financeiro-card">
            <span>Saldo atual do caixa</span>

            <strong
              style={{
                color: saldoNegativo ? '#dc2626' : '#15803d',
              }}
            >
              {formatarMoeda(saldoAtual)}
            </strong>

            <small>
              {saldoNegativo
                ? 'Atenção: o caixa está negativo.'
                : 'O caixa está positivo.'}
            </small>
          </article>
        </div>
      </section>

      {/* RESUMOS DO FINANCEIRO */}

      <div className="financeiro-resumos">
        <article className="financeiro-card">
          <span>Contas a receber</span>

          <strong>{formatarMoeda(totalReceber)}</strong>

          <small>
            {contasReceber.length} venda(s) fiado pendente(s)
          </small>
        </article>

        <article
          className="financeiro-card"
          role="button"
          tabIndex={0}
          onClick={irParaContasCompras}
          onKeyDown={(evento) => {
            if (evento.key === 'Enter' || evento.key === ' ') {
              evento.preventDefault()
              irParaContasCompras()
            }
          }}
          style={{ cursor: 'pointer' }}
          title="Clique para visualizar as contas de compras dos fornecedores"
        >
          <span>Contas a pagar</span>

          <strong>{formatarMoeda(totalPagar)}</strong>

          <small>
            {totalContasPendentes} conta(s) pendente(s)
            {' — Clique para visualizar'}
          </small>
        </article>

        <article className="financeiro-card">
          <span>Contas vencidas</span>

          <strong style={{ color: contasVencidas > 0 ? '#dc2626' : '#15803d' }}>
            {contasVencidas}
          </strong>

          <small>Despesas e parcelas após o vencimento</small>
        </article>

        <article className="financeiro-card">
          <span>Recebimentos no mês</span>

          <strong style={{ color: '#15803d' }}>
            {formatarMoeda(recebimentosDoMes)}
          </strong>

          <small>Entradas registradas neste mês</small>
        </article>

        <article className="financeiro-card">
          <span>Pagamentos no mês</span>

          <strong style={{ color: '#dc2626' }}>
            {formatarMoeda(totalPagamentosNoMes)}
          </strong>

          <small>Despesas e compras pagas neste mês</small>
        </article>
      </div>

      {mensagem && (
        <p
          className={
            erro
              ? 'financeiro-mensagem financeiro-mensagem-erro'
              : 'financeiro-mensagem'
          }
          role="status"
        >
          {mensagem}
        </p>
      )}

      {/* HISTÓRICO DO CAIXA */}

      <section className="financeiro-secao">
        <h3>Histórico do fluxo de caixa</h3>

        <p>
          Consulte todas as movimentações que alteraram o saldo
          disponível da loja.
        </p>

        {movimentosCaixa.length === 0 ? (
          <p className="financeiro-vazio">
            Nenhuma movimentação registrada.
          </p>
        ) : (
          <div className="financeiro-tabela-container">
            <table className="financeiro-tabela">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                </tr>
              </thead>

              <tbody>
                {movimentosCaixa.map((movimento) => (
                  <tr key={movimento.id}>
                    <td>{formatarData(movimento.data)}</td>

                    <td>{movimento.descricao}</td>

                    <td>
                      <span
                        style={{
                          color:
                            movimento.tipo === 'Entrada'
                              ? '#15803d'
                              : '#dc2626',
                          fontWeight: 600,
                        }}
                      >
                        {movimento.tipo}
                      </span>
                    </td>

                    <td>
                      <strong
                        style={{
                          color:
                            movimento.tipo === 'Entrada'
                              ? '#15803d'
                              : '#dc2626',
                        }}
                      >
                        {movimento.tipo === 'Entrada' ? '+' : '-'}
                        {formatarMoeda(movimento.valor)}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* CADASTRAR DESPESA */}

      <section className="financeiro-secao">
        <h3>Cadastrar despesa</h3>

        <p>
          Registre aluguel, energia, água e outras despesas da loja.
          Compras de mercadorias devem ser registradas no módulo Compras.
        </p>

        <form
          className="financeiro-formulario"
          onSubmit={registrarDespesa}
        >
          <div className="financeiro-campo">
            <label htmlFor="despesa-descricao">
              Descrição
            </label>

            <input
              id="despesa-descricao"
              value={descricao}
              onChange={(evento) =>
                setDescricao(evento.target.value)
              }
              placeholder="Ex.: Conta de energia"
              required
            />
          </div>

          <div className="financeiro-campo">
            <label htmlFor="despesa-categoria">
              Categoria
            </label>

            <select
              id="despesa-categoria"
              value={categoria}
              onChange={(evento) =>
                setCategoria(evento.target.value)
              }
            >
              <option value="Fornecedor">Fornecedor</option>
              <option value="Aluguel">Aluguel</option>
              <option value="Energia">Energia</option>
              <option value="Água">Água</option>
              <option value="Internet">Internet</option>
              <option value="Transporte">Transporte</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div className="financeiro-campo">
            <label htmlFor="despesa-valor">
              Valor (R$)
            </label>

            <input
              id="despesa-valor"
              type="number"
              min="0.01"
              step="0.01"
              value={valor}
              onChange={(evento) =>
                setValor(evento.target.value)
              }
              placeholder="0,00"
              required
            />
          </div>

          <div className="financeiro-campo">
            <label htmlFor="despesa-vencimento">
              Vencimento
            </label>

            <input
              id="despesa-vencimento"
              type="date"
              value={vencimento}
              onChange={(evento) =>
                setVencimento(evento.target.value)
              }
              required
            />
          </div>

          <button
            className="financeiro-botao"
            type="submit"
          >
            Cadastrar despesa
          </button>
        </form>
      </section>

      {/* CONTAS A RECEBER */}

      <section className="financeiro-secao">
        <h3>Contas a receber</h3>

        <p>
          Vendas fiado que ainda possuem algum valor pendente.
        </p>

        {contasReceber.length === 0 ? (
          <p className="financeiro-vazio">
            Nenhuma conta a receber pendente.
          </p>
        ) : (
          <div className="financeiro-tabela-container">
            <table className="financeiro-tabela">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Vencimento</th>
                  <th>Total</th>
                  <th>Já pago</th>
                  <th>Restante</th>
                  <th>Ação</th>
                </tr>
              </thead>

              <tbody>
                {contasReceber.map((venda) => (
                  <tr key={venda.id}>
                    <td>{venda.clienteNome}</td>

                    <td>
                      {formatarData(venda.dataVencimento)}
                    </td>

                    <td>{formatarMoeda(venda.total)}</td>

                    <td>
                      {formatarMoeda(valorPagoDaVenda(venda))}
                    </td>

                    <td>
                      {formatarMoeda(valorRestanteDaVenda(venda))}
                    </td>

                    <td>
                      {vendaSelecionada === venda.id ? (
                        <div className="financeiro-pagamento-form">
                          <input
                            type="number"
                            min="0.01"
                            max={valorRestanteDaVenda(venda)}
                            step="0.01"
                            value={valorPagamento}
                            onChange={(evento) =>
                              setValorPagamento(evento.target.value)
                            }
                            placeholder="Valor recebido"
                          />

                          <button
                            type="button"
                            className="financeiro-botao-secundario"
                            onClick={() =>
                              registrarPagamento(venda.id)
                            }
                          >
                            Confirmar
                          </button>

                          <button
                            type="button"
                            className="financeiro-botao-secundario"
                            onClick={() => {
                              setVendaSelecionada(null)
                              setValorPagamento('')
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="financeiro-botao-secundario"
                          onClick={() => {
                            setVendaSelecionada(venda.id)
                            setValorPagamento('')
                            setMensagem('')
                          }}
                        >
                          Registrar pagamento
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* RECEBIMENTOS REALIZADOS */}

      <section className="financeiro-secao">
        <h3>Recebimentos realizados</h3>

        <p>
          Histórico dos valores recebidos dos clientes em vendas fiado.
        </p>

        {recebimentosHistorico.length === 0 ? (
          <p className="financeiro-vazio">
            Nenhum recebimento de fiado registrado.
          </p>
        ) : (
          <div className="financeiro-tabela-container">
            <table className="financeiro-tabela">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Venda</th>
                  <th>Data do recebimento</th>
                  <th>Valor recebido</th>
                </tr>
              </thead>

              <tbody>
                {recebimentosHistorico.map((pagamento) => (
                  <tr key={pagamento.id}>
                    <td>{pagamento.cliente}</td>

                    <td>#{pagamento.vendaId}</td>

                    <td>
                      {pagamento.legado
                        ? 'Data não registrada (venda antiga)'
                        : formatarData(pagamento.data)}
                    </td>

                    <td>
                      {formatarMoeda(pagamento.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* CONTAS A PAGAR: DESPESAS COMUNS */}

      <section className="financeiro-secao">
        <h3>Contas a pagar - Despesas da loja</h3>

        <p>
          Despesas como aluguel, energia, água e internet que ainda
          não foram pagas.
        </p>

        {contasPagar.length === 0 ? (
          <p className="financeiro-vazio">
            Nenhuma despesa pendente.
          </p>
        ) : (
          <div className="financeiro-tabela-container">
            <table className="financeiro-tabela">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Vencimento</th>
                  <th>Valor</th>
                  <th>Ação</th>
                </tr>
              </thead>

              <tbody>
                {contasPagar.map((despesa) => (
                  <tr key={despesa.id}>
                    <td>{despesa.descricao}</td>

                    <td>{despesa.categoria}</td>

                    <td>
                      {formatarData(despesa.vencimento)}
                    </td>

                    <td>
                      {formatarMoeda(despesa.valor)}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="financeiro-botao-secundario"
                        onClick={() =>
                          marcarDespesaComoPaga(despesa.id)
                        }
                      >
                        Marcar como paga
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* CONTAS A PAGAR: COMPRAS DE FORNECEDORES */}

      <section
        className="financeiro-secao"
        id="contas-pagar-compras"
      >
        <h3>Contas a pagar - Compras de fornecedores</h3>

        <p>
          Parcelas de compras registradas no módulo Compras.
          Cada parcela pode ser paga individualmente.
        </p>

        {contasCompraPendentes.length === 0 ? (
          <p className="financeiro-vazio">
            Nenhuma parcela de compra pendente.
          </p>
        ) : (
          <div className="financeiro-tabela-container">
            <table className="financeiro-tabela">
              <thead>
                <tr>
                  <th>Fornecedor</th>
                  <th>Descrição</th>
                  <th>Pagamento</th>
                  <th>Vencimento</th>
                  <th>Valor</th>
                  <th>Ação</th>
                </tr>
              </thead>

              <tbody>
                {contasCompraPendentes.map((conta) => (
                  <tr key={conta.id}>
                    <td>{conta.fornecedorNome}</td>

                    <td>{conta.descricao}</td>

                    <td>{conta.formaPagamento}</td>

                    <td>{formatarData(conta.vencimento)}</td>

                    <td>{formatarMoeda(conta.valor)}</td>

                    <td>
                      <button
                        type="button"
                        className="financeiro-botao-secundario"
                        onClick={() =>
                          marcarCompraComoPaga(conta.id)
                        }
                      >
                        Marcar como paga
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* DESPESAS PAGAS */}

      <section className="financeiro-secao">
        <h3>Despesas pagas</h3>

        <p>
          Histórico de despesas comuns que já foram quitadas.
        </p>

        {despesasPagas.length === 0 ? (
          <p className="financeiro-vazio">
            Nenhuma despesa paga registrada.
          </p>
        ) : (
          <div className="financeiro-tabela-container">
            <table className="financeiro-tabela">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Vencimento</th>
                  <th>Data do pagamento</th>
                  <th>Valor pago</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {despesasPagas.map((despesa) => (
                  <tr key={despesa.id}>
                    <td>{despesa.descricao}</td>

                    <td>{despesa.categoria}</td>

                    <td>
                      {formatarData(despesa.vencimento)}
                    </td>

                    <td>
                      {formatarData(despesa.dataPagamento)}
                    </td>

                    <td>
                      {formatarMoeda(despesa.valor)}
                    </td>

                    <td>
                      <span className="financeiro-status-pendente">
                        Pago
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* COMPRAS PAGAS */}

      <section className="financeiro-secao">
        <h3>Parcelas de compras pagas</h3>

        <p>
          Histórico dos pagamentos realizados aos fornecedores.
        </p>

        {contasCompraPagas.length === 0 ? (
          <p className="financeiro-vazio">
            Nenhuma parcela de compra paga registrada.
          </p>
        ) : (
          <div className="financeiro-tabela-container">
            <table className="financeiro-tabela">
              <thead>
                <tr>
                  <th>Fornecedor</th>
                  <th>Descrição</th>
                  <th>Forma de pagamento</th>
                  <th>Vencimento</th>
                  <th>Data do pagamento</th>
                  <th>Valor pago</th>
                </tr>
              </thead>

              <tbody>
                {contasCompraPagas.map((conta) => (
                  <tr key={conta.id}>
                    <td>{conta.fornecedorNome}</td>

                    <td>{conta.descricao}</td>

                    <td>{conta.formaPagamento}</td>

                    <td>{formatarData(conta.vencimento)}</td>

                    <td>{formatarData(conta.dataPagamento)}</td>

                    <td>{formatarMoeda(conta.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default Financeiro
