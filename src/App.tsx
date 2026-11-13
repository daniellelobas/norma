import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import Clientes from './components/Clientes'
import Produtos from './components/Produtos'
import Fornecedores from './components/Fornecedores'
import Estoque from './components/Estoque'
import Vendas from './components/Vendas'
import Financeiro from './components/Financeiro'
import Compras from './components/Compras'
import Movimentacoes from './components/Movimentacoes'
import './App.css'
import './dashboard-financeiro.css'

type ModalTipo = 'produtos' | 'pagamentos' | 'despesas' | 'lucro' | null

// --- DASHBOARD FIEL AO DESIGN NORMA COSMÉTICOS ---
function DashboardIntegrado({ onNavegar }: { onNavegar: (pagina: string) => void }) {
  const [vendas, setVendas] = useState<any[]>([])
  const [produtos, setProdutos] = useState<any[]>([])
  const [contas, setContas] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [modalAtivo, setModalAtivo] = useState<ModalTipo>(null)

  useEffect(() => {
    carregarDados()
    window.addEventListener('norma-dados-atualizados', carregarDados)
    return () => window.removeEventListener('norma-dados-atualizados', carregarDados)
  }, [])

  function carregarDados() {
    try {
      setVendas(JSON.parse(localStorage.getItem('norma-vendas') || '[]'))
      setProdutos(JSON.parse(localStorage.getItem('norma-produtos') || '[]'))
      setContas(JSON.parse(localStorage.getItem('norma-contas-compras') || '[]'))
      setClientes(JSON.parse(localStorage.getItem('norma-clientes') || '[]'))
    } catch {
      // Ignora erro
    }
  }

  function formatarMoeda(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  // --- CÁLCULOS DINÂMICOS ---
  const faturamentoTotal = vendas.reduce((acc, v) => acc + (Number(v.total) || 0), 0)
  const totalDespesas = contas.reduce((acc, c) => acc + (Number(c.valor) || 0), 0)
  const contasPendenteTotal = contas.filter(c => c.status === 'Pendente').reduce((acc, c) => acc + Number(c.valor || 0), 0)

  // Lucro Estimado Geral
  let lucroTotalEstimado = 0
  vendas.forEach(v => {
    v.itens?.forEach((item: any) => {
      const prodOriginal = produtos.find(p => Number(p.id) === Number(item.produtoId))
      const custo = prodOriginal ? Number(prodOriginal.precoCusto || 0) : 0
      const lucroItem = (Number(item.precoUnitario) - custo) * Number(item.quantidade)
      lucroTotalEstimado += lucroItem
    })
  })

  // Produtos mais vendidos
  const mapaProdutos: Record<string, { nome: string; marca: string; qtd: number; total: number }> = {}
  vendas.forEach(v => {
    v.itens?.forEach((item: any) => {
      const id = item.produtoId || item.codigo
      if (!mapaProdutos[id]) {
        mapaProdutos[id] = { nome: item.nome, marca: item.marca || 'Norma', qtd: 0, total: 0 }
      }
      mapaProdutos[id].qtd += Number(item.quantidade) || 0
      mapaProdutos[id].total += (Number(item.precoUnitario) || 0) * (Number(item.quantidade) || 0)
    })
  })
  const produtosMaisVendidosLista = Object.values(mapaProdutos).sort((a, b) => b.qtd - a.qtd)

  // Formas de Pagamento
  const mapaPagamentos: Record<string, { qtd: number; total: number }> = {}
  vendas.forEach(v => {
    const forma = v.formaPagamento || 'PIX'
    if (!mapaPagamentos[forma]) {
      mapaPagamentos[forma] = { qtd: 0, total: 0 }
    }
    mapaPagamentos[forma].qtd += 1
    mapaPagamentos[forma].total += Number(v.total) || 0
  })

  // Despesas por Categoria
  const mapaDespesas: Record<string, number> = {}
  contas.forEach(c => {
    const cat = c.categoria || 'Despesas Eventuais'
    mapaDespesas[cat] = (mapaDespesas[cat] || 0) + (Number(c.valor) || 0)
  })

  return (
    <div style={{ padding: '32px 40px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* CABEÇALHO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            Olá, Norma <span style={{ fontSize: '20px' }}>💜</span>
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>Aqui está o resumo do seu negócio hoje.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'white', padding: '8px 12px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
            NB <strong>Norma</strong> <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Administradora</span>
          </div>
        </div>
      </div>

      {/* BLOCO SUPERIOR: Vendas de Hoje + Ações Urgentes */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '28px' }}>
        
        {/* Card Roxo Principal: Vendas de Hoje (Texto em Branco) */}
        <div style={{ backgroundColor: '#3b0764', borderRadius: '20px', padding: '28px', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(59, 7, 100, 0.3)' }}>
          <span style={{ fontSize: '12px', letterSpacing: '0.5px', textTransform: 'uppercase', opacity: 0.8, fontWeight: 600 }}>Vendas de Hoje</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '8px', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>{formatarMoeda(faturamentoTotal)}</h2>
              <span style={{ fontSize: '12px', color: '#4ade80', fontWeight: 600, display: 'inline-block', marginTop: '4px' }}>▲ 12,5% comparado a ontem</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '16px', fontSize: '24px' }}>
              🛍️
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '16px' }}>
            <div>
              <span style={{ fontSize: '11px', opacity: 0.7 }}>Pedidos</span>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', margin: '2px 0 0 0' }}>{vendas.length}</p>
            </div>
            <div>
              <span style={{ fontSize: '11px', opacity: 0.7 }}>Ticket médio</span>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', margin: '2px 0 0 0' }}>{formatarMoeda(vendas.length ? faturamentoTotal / vendas.length : 0)}</p>
            </div>
            <div>
              <span style={{ fontSize: '11px', opacity: 0.7 }}>Novos clientes</span>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', margin: '2px 0 0 0' }}>{clientes.length}</p>
            </div>
          </div>

          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <button
              onClick={() => onNavegar('Vendas')}
              style={{ background: 'transparent', border: 'none', color: '#e9d5ff', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              Ver detalhes de vendas →
            </button>
          </div>
        </div>

        {/* Card Lateral: Ações Urgentes */}
        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '20px 24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#ef4444' }}>🚨</span> Ações Urgentes
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f8fafc', fontSize: '12px' }}>
              <div>
                <strong style={{ color: '#1e293b', display: 'block' }}>Cobranças em aberto</strong>
                <span style={{ color: '#ef4444' }}>{formatarMoeda(contasPendenteTotal)}</span>
              </div>
              <span style={{ color: '#94a3b8' }}>›</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f8fafc', fontSize: '12px' }}>
              <div>
                <strong style={{ color: '#1e293b', display: 'block' }}>Produtos cadastrados</strong>
                <span style={{ color: '#3b82f6' }}>{produtos.length} itens no estoque</span>
              </div>
              <span style={{ color: '#94a3b8' }}>›</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: '12px' }}>
              <div>
                <strong style={{ color: '#1e293b', display: 'block' }}>Clientes cadastrados</strong>
                <span style={{ color: '#10b981' }}>{clientes.length} ativos</span>
              </div>
              <span style={{ color: '#94a3b8' }}>›</span>
            </div>
          </div>
        </div>

      </div>

      {/* BLOCO DO MEIO: Como está o negócio + Ações principais */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '28px' }}>
        
        {/* Como está o negócio */}
        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px' }}>COMO ESTÁ O NEGÓCIO</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            
            <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '16px', border: '1px solid #dcfce7' }}>
              <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>Entradas Caixa</span>
              <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#166534', margin: '6px 0 2px 0' }}>{formatarMoeda(faturamentoTotal)}</p>
              <span style={{ fontSize: '10px', color: '#15803d' }}>Total faturado</span>
            </div>

            <div style={{ backgroundColor: '#fef2f2', padding: '16px', borderRadius: '16px', border: '1px solid #fee2e2' }}>
              <span style={{ fontSize: '11px', color: '#b91c1c', fontWeight: 600 }}>Despesas Mês</span>
              <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#991b1b', margin: '6px 0 2px 0' }}>{formatarMoeda(totalDespesas)}</p>
              <span style={{ fontSize: '10px', color: '#b91c1c' }}>Contas/Custos</span>
            </div>

            <div style={{ backgroundColor: '#faf5ff', padding: '16px', borderRadius: '16px', border: '1px solid #f3e8ff' }}>
              <span style={{ fontSize: '11px', color: '#7e22ce', fontWeight: 600 }}>Vendas do Mês</span>
              <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#6b21a8', margin: '6px 0 2px 0' }}>{formatarMoeda(faturamentoTotal)}</p>
              <span style={{ fontSize: '10px', color: '#15803d' }}>▲ 18,3%</span>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>Clientes ativos</span>
              <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', margin: '6px 0 2px 0' }}>{clientes.length}</p>
              <span style={{ fontSize: '10px', color: '#64748b' }}>Total cadastrados</span>
            </div>

          </div>
        </div>

        {/* Ações Principais */}
        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px' }}>AÇÕES PRINCIPAIS</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <button
              onClick={() => onNavegar('Vendas')}
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', textAlign: 'center', cursor: 'pointer', fontWeight: 600, fontSize: '12px', color: '#475569' }}
            >
              🛒 Nova venda
            </button>
            <button
              onClick={() => onNavegar('Financeiro')}
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', textAlign: 'center', cursor: 'pointer', fontWeight: 600, fontSize: '12px', color: '#475569' }}
            >
              💰 Financeiro
            </button>
            <button
              onClick={() => onNavegar('Clientes')}
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', textAlign: 'center', cursor: 'pointer', fontWeight: 600, fontSize: '12px', color: '#475569' }}
            >
              👤 Clientes
            </button>
            <button
              onClick={() => onNavegar('Produtos')}
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', textAlign: 'center', cursor: 'pointer', fontWeight: 600, fontSize: '12px', color: '#475569' }}
            >
              📦 Produtos
            </button>
          </div>
        </div>

      </div>

      {/* BLOCO INFERIOR: POR QUE ISSO ACONTECEU? (GRÁFICOS) */}
      <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px', letterSpacing: '0.5px' }}>
          — POR QUE ISSO ACONTECEU?
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
          
          {/* 1. Produtos mais vendidos */}
          <div
            onClick={() => setModalAtivo('produtos')}
            style={{ border: '1px solid #f1f5f9', borderRadius: '16px', padding: '16px', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: '#fafafa' }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = '#c084fc'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = '#f1f5f9'}
          >
            <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px' }}>Produtos mais vendidos</h4>
            {produtosMaisVendidosLista.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>Sem vendas registradas.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {produtosMaisVendidosLista.slice(0, 3).map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ color: '#475569', fontWeight: 600 }}>{idx + 1}. {p.nome}</span>
                    <strong style={{ color: '#7c3aed' }}>{p.qtd} un.</strong>
                  </div>
                ))}
              </div>
            )}
            <span style={{ fontSize: '11px', color: '#9333ea', fontWeight: 'bold', display: 'block', marginTop: '14px' }}>Ver ranking completo →</span>
          </div>

          {/* 2. Formas de pagamento */}
          <div
            onClick={() => setModalAtivo('pagamentos')}
            style={{ border: '1px solid #f1f5f9', borderRadius: '16px', padding: '16px', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: '#fafafa' }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = '#c084fc'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = '#f1f5f9'}
          >
            <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px' }}>Formas de pagamento</h4>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px', marginBottom: '8px' }}>
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'conic-gradient(#a855f7 0% 40%, #3b82f6 40% 70%, #f59e0b 70% 85%, #cbd5e1 85% 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '45px', height: '45px', background: '#fafafa', borderRadius: '50%' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
              <span>● PIX 40%</span>
              <span>● Cartão 30%</span>
              <span>● Outros 30%</span>
            </div>
            <span style={{ fontSize: '11px', color: '#9333ea', fontWeight: 'bold', display: 'block', marginTop: '10px' }}>Ver detalhes →</span>
          </div>

          {/* 3. Despesas do mês */}
          <div
            onClick={() => setModalAtivo('despesas')}
            style={{ border: '1px solid #f1f5f9', borderRadius: '16px', padding: '16px', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: '#fafafa' }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = '#c084fc'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = '#f1f5f9'}
          >
            <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Despesas do mês</h4>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '4px 0 12px 0' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>{formatarMoeda(totalDespesas)}</span>
              <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold' }}>▲ 8,5%</span>
            </div>
            <svg viewBox="0 0 100 30" style={{ width: '100%', height: '35px', overflow: 'visible' }}>
              <path d="M 0 25 Q 25 15, 50 20 T 100 5" fill="none" stroke="#a855f7" strokeWidth="2.5" />
              <circle cx="100" cy="5" r="3" fill="#9333ea" />
            </svg>
            <span style={{ fontSize: '11px', color: '#9333ea', fontWeight: 'bold', display: 'block', marginTop: '8px' }}>Ver detalhes →</span>
          </div>

          {/* 4. Lucro estimado */}
          <div
            onClick={() => setModalAtivo('lucro')}
            style={{ border: '1px solid #f1f5f9', borderRadius: '16px', padding: '16px', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: '#fafafa' }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = '#10b981'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = '#f1f5f9'}
          >
            <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Lucro estimado</h4>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '4px 0 12px 0' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#16a34a' }}>{formatarMoeda(lucroTotalEstimado)}</span>
              <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold' }}>▲ 15,7%</span>
            </div>
            <svg viewBox="0 0 100 30" style={{ width: '100%', height: '35px', overflow: 'visible' }}>
              <path d="M 0 25 Q 30 22, 60 12 T 100 2" fill="none" stroke="#22c55e" strokeWidth="2.5" />
              <circle cx="100" cy="2" r="3" fill="#16a34a" />
            </svg>
            <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold', display: 'block', marginTop: '8px' }}>Ver detalhes →</span>
          </div>

        </div>
      </div>

      {/* ================= MODAIS DE RELATÓRIO DETALHADO ================= */}
      {modalAtivo && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '700px', maxHeight: '80vh', overflowY: 'auto', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                {modalAtivo === 'produtos' && '📊 Relatório Detalhado: Produtos Mais Vendidos'}
                {modalAtivo === 'pagamentos' && '💳 Detalhamento de Formas de Pagamento'}
                {modalAtivo === 'despesas' && '📉 Relatório Analítico de Despesas e Custos'}
                {modalAtivo === 'lucro' && '💰 Detalhamento de Lucro por Produto e Margem'}
              </h2>
              <button
                type="button"
                onClick={() => setModalAtivo(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', width: '30px', height: '30px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {modalAtivo === 'produtos' && (
              <div>
                {produtosMaisVendidosLista.length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>Nenhuma venda registrada ainda.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', color: '#475569' }}>
                        <th style={{ padding: '8px' }}>Produto</th>
                        <th style={{ padding: '8px' }}>Marca</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>Qtd. Vendida</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Total Gerado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {produtosMaisVendidosLista.map((p, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                          <td style={{ padding: '8px', fontWeight: 600, color: '#1e293b' }}>{p.nome}</td>
                          <td style={{ padding: '8px', color: '#64748b' }}>{p.marca}</td>
                          <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#7c3aed' }}>{p.qtd} un.</td>
                          <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: '#16a34a' }}>{formatarMoeda(p.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {modalAtivo === 'pagamentos' && (
              <div>
                {Object.keys(mapaPagamentos).length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>Nenhum pagamento registrado.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', color: '#475569' }}>
                        <th style={{ padding: '8px' }}>Forma de Pagamento</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>Qtd. de Vendas</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Volume Financeiro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(mapaPagamentos).map(([forma, dados], idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                          <td style={{ padding: '8px', fontWeight: 600, color: '#1e293b' }}>{forma}</td>
                          <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{dados.qtd} vendas</td>
                          <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: '#16a34a' }}>{formatarMoeda(dados.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {modalAtivo === 'despesas' && (
              <div>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                  Detalhamento de custos e despesas cadastradas agrupadas por categoria:
                </p>
                {Object.keys(mapaDespesas).length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>Nenhuma despesa cadastrada.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', color: '#475569' }}>
                        <th style={{ padding: '8px' }}>Categoria de Custo</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Valor Total Gasto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(mapaDespesas).map(([cat, total], idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                          <td style={{ padding: '8px', fontWeight: 600, color: '#1e293b' }}>{cat}</td>
                          <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: '#ef4444' }}>{formatarMoeda(total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {modalAtivo === 'lucro' && (
              <div>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                  Cálculo de margem de lucro estimada baseada no preço de custo e preço de venda praticados:
                </p>
                <div style={{ background: '#f3e8ff', padding: '16px', borderRadius: '10px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: '#581c87' }}>Lucro Bruto Total Acumulado:</span>
                  <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#16a34a' }}>{formatarMoeda(lucroTotalEstimado)}</span>
                </div>

                <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>Margem por Produto Vendido:</h4>
                {produtosMaisVendidosLista.length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '10px' }}>Sem dados de vendas.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', color: '#475569' }}>
                        <th style={{ padding: '8px' }}>Produto</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>Qtd</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Lucro Estimado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {produtosMaisVendidosLista.map((p, idx) => {
                        const prodCatalogo = produtos.find((prod: any) => prod.nome === p.nome)
                        const custoUnit = prodCatalogo ? Number(prodCatalogo.precoCusto || 0) : 0
                        const vendaUnit = p.total / (p.qtd || 1)
                        const lucroItem = (vendaUnit - custoUnit) * p.qtd

                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                            <td style={{ padding: '8px', fontWeight: 600, color: '#1e293b' }}>{p.nome}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>{p.qtd} un.</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: '#16a34a' }}>{formatarMoeda(lucroItem)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setModalAtivo(null)}
                style={{ backgroundColor: '#581c87', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Fechar Relatório
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

// --- APP PRINCIPAL ---
export default function App() {
  const [paginaAtiva, setPaginaAtiva] = useState('Dashboard')

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Sidebar onMenuClick={setPaginaAtiva} />
      
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {paginaAtiva === 'Dashboard' && <DashboardIntegrado onNavegar={setPaginaAtiva} />}
        {paginaAtiva === 'Clientes' && <Clientes />}
        {paginaAtiva === 'Produtos' && <Produtos />}
        {paginaAtiva === 'Fornecedores' && <Fornecedores />}
        {paginaAtiva === 'Compras' && <Compras />}
        {paginaAtiva === 'Estoque' && <Estoque />}
        {paginaAtiva === 'Vendas' && <Vendas />}
        {paginaAtiva === 'Financeiro' && <Financeiro />}
        {paginaAtiva === 'Movimentacoes' && <Movimentacoes />}
      </main>
    </div>
  )
}
