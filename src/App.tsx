
import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import DashboardCard from './components/DashboardCard'
import Clientes from './components/Clientes'
import Produtos from './components/Produtos'
import Fornecedores from './components/Fornecedores'
import Estoque from './components/Estoque'
import Vendas from './components/Vendas'
import Financeiro from './components/Financeiro'
import Compras from './components/Compras'
import Movimentacoes from './components/Movimentacoes'
import './App.css'

type ClienteResumo = {
  id: number
}

type ProdutoResumo = {
  id: number
  nome: string
  quantidade: number
  estoqueMinimo: number
  validade?: string
}

type ContaCompra = {
  id: number
  descricao: string
  fornecedorNome: string
  valor: number
  vencimento: string
  status: 'Pendente' | 'Pago'
}

type Resumo = {
  clientes: number
  produtos: number
  unidades: number
  estoqueBaixo: number
}

type AlertaFinanceiro = {
  quantidade: number
  total: number
  contas: ContaCompra[]
}

type ResumoAlertas = {
  vencemHoje: AlertaFinanceiro
  emAtraso: AlertaFinanceiro
  produtosAVencer: ProdutoResumo[]
  produtosVencidos: ProdutoResumo[]
}

const CHAVE_CLIENTES = 'norma-clientes'
const CHAVE_PRODUTOS = 'norma-produtos'
const CHAVE_CONTAS = 'norma-contas-compras'

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

function obterDataHoje(): string {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const dia = String(hoje.getDate()).padStart(2, '0')

  return `${ano}-${mes}-${dia}`
}

function obterDataLimite(): string {
  const data = new Date()
  data.setHours(12, 0, 0, 0)
  data.setDate(data.getDate() + 30)

  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')

  return `${ano}-${mes}-${dia}`
}

function calcularResumo(): Resumo {
  const clientes = lerLista<ClienteResumo>(CHAVE_CLIENTES)
  const produtos = lerLista<ProdutoResumo>(CHAVE_PRODUTOS)

  const unidades = produtos.reduce((total, produto) => {
    return total + (Number(produto.quantidade) || 0)
  }, 0)

  const estoqueBaixo = produtos.filter((produto) => {
    const quantidade = Number(produto.quantidade) || 0
    const estoqueMinimo = Number(produto.estoqueMinimo) || 0

    return quantidade > 0 && quantidade <= estoqueMinimo
  }).length

  return {
    clientes: clientes.length,
    produtos: produtos.length,
    unidades,
    estoqueBaixo,
  }
}

function calcularAlertas(): ResumoAlertas {
  const hoje = obterDataHoje()
  const limite = obterDataLimite()

  const contas = lerLista<ContaCompra>(CHAVE_CONTAS)
  const produtos = lerLista<ProdutoResumo>(CHAVE_PRODUTOS)

  const contasPendentes = contas.filter(
    (conta) =>
      conta.status === 'Pendente' &&
      /^\d{4}-\d{2}-\d{2}$/.test(conta.vencimento),
  )

  const contasHoje = contasPendentes.filter(
    (conta) => conta.vencimento === hoje,
  )

  const contasAtrasadas = contasPendentes.filter(
    (conta) => conta.vencimento < hoje,
  )

  const produtosAVencer = produtos.filter((produto) => {
    const quantidade = Number(produto.quantidade) || 0

    return (
      quantidade > 0 &&
      Boolean(produto.validade) &&
      /^\d{4}-\d{2}-\d{2}$/.test(produto.validade || '') &&
      produto.validade! >= hoje &&
      produto.validade! <= limite
    )
  })

  const produtosVencidos = produtos.filter((produto) => {
    const quantidade = Number(produto.quantidade) || 0

    return (
      quantidade > 0 &&
      Boolean(produto.validade) &&
      /^\d{4}-\d{2}-\d{2}$/.test(produto.validade || '') &&
      produto.validade! < hoje
    )
  })

  return {
    vencemHoje: {
      quantidade: contasHoje.length,
      total: contasHoje.reduce(
        (soma, conta) => soma + (Number(conta.valor) || 0),
        0,
      ),
      contas: contasHoje,
    },

    emAtraso: {
      quantidade: contasAtrasadas.length,
      total: contasAtrasadas.reduce(
        (soma, conta) => soma + (Number(conta.valor) || 0),
        0,
      ),
      contas: contasAtrasadas,
    },

    produtosAVencer,
    produtosVencidos,
  }
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatarData(data: string): string {
  if (!data) return 'Não informada'

  const [ano, mes, dia] = data.split('-')

  return `${dia}/${mes}/${ano}`
}

function App() {
  const [paginaAtiva, setPaginaAtiva] = useState('Dashboard')
  const [resumo, setResumo] = useState<Resumo>(() => calcularResumo())
  const [alertas, setAlertas] = useState<ResumoAlertas>(() =>
    calcularAlertas(),
  )

  function atualizarDashboard() {
    setResumo(calcularResumo())
    setAlertas(calcularAlertas())
  }

  useEffect(() => {
    function atualizarDados() {
      atualizarDashboard()
    }

    window.addEventListener('storage', atualizarDados)
    window.addEventListener('norma-dados-atualizados', atualizarDados)

    const intervalo = window.setInterval(atualizarDados, 60000)

    return () => {
      window.removeEventListener('storage', atualizarDados)
      window.removeEventListener('norma-dados-atualizados', atualizarDados)
      window.clearInterval(intervalo)
    }
  }, [])

  function handleMenuClick(menu: string) {
    setPaginaAtiva(menu)
    atualizarDashboard()
  }

  return (
    <div className="app-layout">
      <Sidebar onMenuClick={handleMenuClick} />

      <main className="main-content">
        <h1>{paginaAtiva}</h1>

        {paginaAtiva === 'Dashboard' ? (
          <>
            <p>Bem-vinda ao sistema Norma Cosméticos.</p>

            <div className="dashboard-cards">
              <DashboardCard
                title="Clientes cadastrados"
                value={String(resumo.clientes)}
              />

              <DashboardCard
                title="Produtos cadastrados"
                value={String(resumo.produtos)}
              />

              <DashboardCard title="Vendas" value="R$ 0,00" />

              <DashboardCard
                title="Unidades em estoque"
                value={String(resumo.unidades)}
              />

              <DashboardCard
                title="Produtos com estoque baixo"
                value={String(resumo.estoqueBaixo)}
              />
            </div>

            <section className="dashboard-alertas">
              <h2>Alertas e vencimentos</h2>

              <div className="dashboard-cards">
                <article
                  className="dashboard-card"
                  style={{
                    borderLeft: '5px solid #e5a000',
                    backgroundColor: '#fff9e8',
                  }}
                >
                  <h3>Contas que vencem hoje</h3>

                  <strong>{alertas.vencemHoje.quantidade}</strong>

                  <p>{formatarMoeda(alertas.vencemHoje.total)}</p>

                  {alertas.vencemHoje.contas.length > 0 ? (
                    <ul>
                      {alertas.vencemHoje.contas.map((conta) => (
                        <li key={conta.id}>
                          {conta.fornecedorNome} — {formatarMoeda(conta.valor)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <small>Nenhuma conta vencendo hoje.</small>
                  )}
                </article>

                <article
                  className="dashboard-card"
                  style={{
                    borderLeft: '5px solid #d93025',
                    backgroundColor: '#fff0ef',
                  }}
                >
                  <h3>Contas em atraso</h3>

                  <strong>{alertas.emAtraso.quantidade}</strong>

                  <p>{formatarMoeda(alertas.emAtraso.total)}</p>

                  {alertas.emAtraso.contas.length > 0 ? (
                    <ul>
                      {alertas.emAtraso.contas.map((conta) => (
                        <li key={conta.id}>
                          {conta.fornecedorNome} — {formatarMoeda(conta.valor)}
                          <small>
                            {' '}| Venceu em {formatarData(conta.vencimento)}
                          </small>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <small>Nenhuma conta em atraso.</small>
                  )}
                </article>

                <article
                  className="dashboard-card"
                  style={{
                    borderLeft: '5px solid #e5a000',
                    backgroundColor: '#fff9e8',
                  }}
                >
                  <h3>Produtos próximos do vencimento</h3>

                  <strong>{alertas.produtosAVencer.length}</strong>

                  <small>Vencimento nos próximos 30 dias.</small>

                  {alertas.produtosAVencer.length > 0 ? (
                    <ul>
                      {alertas.produtosAVencer.map((produto) => (
                        <li key={produto.id}>
                          {produto.nome} — {formatarData(produto.validade || '')}
                          {' '}— Estoque: {produto.quantidade}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <small>Nenhum produto próximo do vencimento.</small>
                  )}
                </article>

                <article
                  className="dashboard-card"
                  style={{
                    borderLeft: '5px solid #d93025',
                    backgroundColor: '#fff0ef',
                  }}
                >
                  <h3 style={{ color: '#d93025' }}>
                    Produtos vencidos
                  </h3>

                  <strong style={{ color: '#d93025' }}>
                    {alertas.produtosVencidos.length}
                  </strong>

                  <small>
                    Produtos com validade já ultrapassada e ainda em estoque.
                  </small>

                  {alertas.produtosVencidos.length > 0 ? (
                    <ul>
                      {alertas.produtosVencidos.map((produto) => (
                        <li key={produto.id}>
                          {produto.nome} — Venceu em{' '}
                          {formatarData(produto.validade || '')}
                          {' '}— Estoque: {produto.quantidade}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <small>Nenhum produto vencido em estoque.</small>
                  )}
                </article>
              </div>
            </section>

            <section>
              <h2>Visão geral</h2>
              <p>
                Aqui vamos acompanhar as principais informações da loja.
              </p>
            </section>
          </>
        ) : paginaAtiva === 'Clientes' ? (
          <Clientes />
        ) : paginaAtiva === 'Produtos' ? (
          <Produtos />
        ) : paginaAtiva === 'Fornecedores' ? (
          <Fornecedores />
        ) : paginaAtiva === 'Estoque' ? (
          <Estoque />
        ) : paginaAtiva === 'Histórico de Movimentações' ? (
          <Movimentacoes />
        ) : paginaAtiva === 'Vendas' ? (
          <Vendas />
        ) : paginaAtiva === 'Financeiro' ? (
          <Financeiro />
        ) : paginaAtiva === 'Compras' ? (
          <Compras />
        ) : (
          <section>
            <h2>Área de {paginaAtiva}</h2>
            <p>Esta tela será desenvolvida nas próximas etapas.</p>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
