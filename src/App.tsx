
import { useState } from 'react'
import Sidebar from './components/Sidebar'
import DashboardCard from './components/DashboardCard'
import Clientes from './components/Clientes'
import Produtos from './components/Produtos'
import Estoque from './components/Estoque'
import Vendas from './components/Vendas'
import Financeiro from './components/Financeiro'
import './App.css'

type ClienteResumo = {
  id: number
}

type ProdutoResumo = {
  id: number
  quantidade: number
  estoqueMinimo: number
}

type Resumo = {
  clientes: number
  produtos: number
  unidades: number
  estoqueBaixo: number
}

function lerLista<T>(chave: string): T[] {
  const dados = localStorage.getItem(chave)

  if (!dados) {
    return []
  }

  try {
    const resultado: unknown = JSON.parse(dados)

    return Array.isArray(resultado) ? (resultado as T[]) : []
  } catch {
    return []
  }
}

function calcularResumo(): Resumo {
  const clientes = lerLista<ClienteResumo>('norma-clientes')
  const produtos = lerLista<ProdutoResumo>('norma-produtos')

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

function App() {
  const [paginaAtiva, setPaginaAtiva] = useState('Dashboard')
  const [resumo, setResumo] = useState<Resumo>(() => calcularResumo())

  function handleMenuClick(menu: string) {
    setPaginaAtiva(menu)
    setResumo(calcularResumo())
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
        ) : paginaAtiva === 'Estoque' ? (
          <Estoque />
        ) : paginaAtiva === 'Vendas' ? (
          <Vendas />
        ) : paginaAtiva === 'Financeiro' ? (
          <Financeiro />
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
