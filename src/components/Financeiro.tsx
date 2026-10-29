import { useEffect, useState } from 'react'

type VendaFinanceira = {
  id: number
  data: string
  clienteId: number
  clienteNome: string
  total: number
  formaPagamento: string
  statusPagamento: 'Pago' | 'Pendente'
  dataVencimento: string | null
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

function dataHoje() {
  const hoje = new Date()

  return [
    hoje.getFullYear(),
    String(hoje.getMonth() + 1).padStart(2, '0'),
    String(hoje.getDate()).padStart(2, '0'),
  ].join('-')
}

function Financeiro() {
  const [vendas, setVendas] = useState<VendaFinanceira[]>(() =>
    lerLista<VendaFinanceira>('norma-vendas'),
  )

  const [despesas, setDespesas] = useState<Despesa[]>(() =>
    lerLista<Despesa>('norma-despesas'),
  )

  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState('Fornecedor')
  const [valor, setValor] = useState('')
  const [vencimento, setVencimento] = useState(dataHoje())
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState(false)

  function atualizarDados() {
    setVendas(lerLista<VendaFinanceira>('norma-vendas'))
    setDespesas(lerLista<Despesa>('norma-despesas'))
  }

  useEffect(() => {
    window.addEventListener('norma-dados-atualizados', atualizarDados)
    window.addEventListener('storage', atualizarDados)

    return () => {
      window.removeEventListener('norma-dados-atualizados', atualizarDados)
      window.removeEventListener('storage', atualizarDados)
    }
  }, [])

  const contasReceber = vendas.filter(
    (venda) =>
      venda.formaPagamento === 'Fiado' &&
      venda.statusPagamento === 'Pendente',
  )

  const contasPagar = despesas.filter(
    (despesa) => despesa.status === 'Pendente',
  )

  const totalReceber = contasReceber.reduce(
    (total, venda) => total + (Number(venda.total) || 0),
    0,
  )

  const totalPagar = contasPagar.reduce(
    (total, despesa) => total + (Number(despesa.valor) || 0),
    0,
  )

  const hoje = dataHoje()
  const inicioMes = `${hoje.slice(0, 7)}-01`

  const recebidoNoMes = vendas
    .filter(
      (venda) =>
        venda.statusPagamento === 'Pago' &&
        venda.data >= inicioMes &&
        venda.data.slice(0, 10) <= hoje,
    )
    .reduce((total, venda) => total + (Number(venda.total) || 0), 0)

  const despesasPagasNoMes = despesas
    .filter(
      (despesa) =>
        despesa.status === 'Pago' &&
        despesa.dataPagamento &&
        despesa.dataPagamento >= inicioMes &&
        despesa.dataPagamento <= hoje,
    )
    .reduce((total, despesa) => total + (Number(despesa.valor) || 0), 0)

  function registrarDespesa(evento: React.FormEvent<HTMLFormElement>) {
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
      localStorage.setItem(
        'norma-despesas',
        JSON.stringify([...despesasAtuais, novaDespesa]),
      )

      setDespesas([...despesasAtuais, novaDespesa])
      setDescricao('')
      setCategoria('Fornecedor')
      setValor('')
      setVencimento(dataHoje())
      setMensagem('Despesa cadastrada com sucesso!')
      setErro(false)

      window.dispatchEvent(new Event('norma-dados-atualizados'))
    } catch {
      setMensagem('Não foi possível salvar a despesa.')
      setErro(true)
    }
  }

  function marcarVendaComoPaga(vendaId: number) {
    const vendasAtuais = lerLista<VendaFinanceira>('norma-vendas')

    const vendaExiste = vendasAtuais.some(
      (venda) => venda.id === vendaId,
    )

    if (!vendaExiste) {
      atualizarDados()
      setMensagem('Venda não encontrada. Atualize a tela.')
      setErro(true)
      return
    }

    const vendasAtualizadas = vendasAtuais.map((venda) =>
      venda.id === vendaId
        ? { ...venda, statusPagamento: 'Pago' as const }
        : venda,
    )

    try {
      localStorage.setItem(
        'norma-vendas',
        JSON.stringify(vendasAtualizadas),
      )

      setVendas(vendasAtualizadas)
      setMensagem('Pagamento do cliente registrado!')
      setErro(false)

      window.dispatchEvent(new Event('norma-dados-atualizados'))
    } catch {
      setMensagem('Não foi possível registrar o pagamento.')
      setErro(true)
    }
  }

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

      window.dispatchEvent(new Event('norma-dados-atualizados'))
    } catch {
      setMensagem('Não foi possível registrar o pagamento da despesa.')
      setErro(true)
    }
  }

  return (
    <div className="financeiro-page">
      <div className="financeiro-introducao">
        <h2>Controle financeiro</h2>
        <p>
          Acompanhe o dinheiro que a loja tem a receber e as contas que
          precisa pagar.
        </p>
      </div>

      <div className="financeiro-resumos">
        <article className="financeiro-card">
          <span>Contas a receber</span>
          <strong>{formatarMoeda(totalReceber)}</strong>
          <small>{contasReceber.length} venda(s) fiado pendente(s)</small>
        </article>

        <article className="financeiro-card">
          <span>Contas a pagar</span>
          <strong>{formatarMoeda(totalPagar)}</strong>
          <small>{contasPagar.length} despesa(s) pendente(s)</small>
        </article>

        <article className="financeiro-card">
          <span>Vendas pagas no mês</span>
          <strong>{formatarMoeda(recebidoNoMes)}</strong>
          <small>Vendas registradas como pagas</small>
        </article>

        <article className="financeiro-card">
          <span>Despesas pagas no mês</span>
          <strong>{formatarMoeda(despesasPagasNoMes)}</strong>
          <small>Despesas com pagamento registrado</small>
        </article>
      </div>

      <section className="financeiro-secao">
        <h3>Cadastrar despesa</h3>
        <p>Registre aluguel, energia, boletos e outras despesas da loja.</p>

        <form className="financeiro-formulario" onSubmit={registrarDespesa}>
          <div className="financeiro-campo">
            <label htmlFor="despesa-descricao">Descrição</label>
            <input
              id="despesa-descricao"
              value={descricao}
              onChange={(evento) => setDescricao(evento.target.value)}
              placeholder="Ex.: Conta de energia"
              required
            />
          </div>

          <div className="financeiro-campo">
            <label htmlFor="despesa-categoria">Categoria</label>
            <select
              id="despesa-categoria"
              value={categoria}
              onChange={(evento) => setCategoria(evento.target.value)}
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
            <label htmlFor="despesa-valor">Valor (R$)</label>
            <input
              id="despesa-valor"
              type="number"
              min="0.01"
              step="0.01"
              value={valor}
              onChange={(evento) => setValor(evento.target.value)}
              placeholder="0,00"
              required
            />
          </div>

          <div className="financeiro-campo">
            <label htmlFor="despesa-vencimento">Vencimento</label>
            <input
              id="despesa-vencimento"
              type="date"
              value={vencimento}
              onChange={(evento) => setVencimento(evento.target.value)}
              required
            />
          </div>

          <button className="financeiro-botao" type="submit">
            Cadastrar despesa
          </button>
        </form>

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
      </section>

      <section className="financeiro-secao">
        <h3>Contas a receber</h3>
        <p>Vendas fiado que ainda não foram pagas.</p>

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
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {contasReceber.map((venda) => (
                  <tr key={venda.id}>
                    <td>{venda.clienteNome}</td>
                    <td>
                      {venda.dataVencimento
                        ? venda.dataVencimento.split('-').reverse().join('/')
                        : 'Não informado'}
                    </td>
                    <td>{formatarMoeda(Number(venda.total) || 0)}</td>
                    <td>
                      <span className="financeiro-status-pendente">
                        Pendente
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="financeiro-botao-secundario"
                        onClick={() => marcarVendaComoPaga(venda.id)}
                      >
                        Registrar pagamento
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="financeiro-secao">
        <h3>Contas a pagar</h3>
        <p>Despesas registradas que ainda não foram pagas.</p>

        {contasPagar.length === 0 ? (
          <p className="financeiro-vazio">
            Nenhuma despesa pendente. Cadastre uma despesa acima.
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
                    <td>{despesa.vencimento.split('-').reverse().join('/')}</td>
                    <td>{formatarMoeda(despesa.valor)}</td>
                    <td>
                      <button
                        type="button"
                        className="financeiro-botao-secundario"
                        onClick={() => marcarDespesaComoPaga(despesa.id)}
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
    </div>
  )
}

export default Financeiro