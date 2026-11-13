import { useEffect, useState } from 'react'

type ModalTipo = 'produtos' | 'pagamentos' | 'despesas' | 'lucro' | null

type DashboardNormaProps = {
  onNavegar?: (pagina: string) => void
}

export default function DashboardNorma({ onNavegar }: DashboardNormaProps) {
  const [vendas, setVendas] = useState<any[]>([])
  const [produtos, setProdutos] = useState<any[]>([])
  const [contas, setContas] = useState<any[]>([])
  const [modalAtivo, setModalAtivo] = useState<ModalTipo>(null)

  useEffect(() => {
    carregarDadosDashboard()
    window.addEventListener('norma-dados-atualizados', carregarDadosDashboard)
    return () => window.removeEventListener('norma-dados-atualizados', carregarDadosDashboard)
  }, [])

  function carregarDadosDashboard() {
    try {
      setVendas(JSON.parse(localStorage.getItem('norma-vendas') || '[]'))
      setProdutos(JSON.parse(localStorage.getItem('norma-produtos') || '[]'))
      setContas(JSON.parse(localStorage.getItem('norma-contas-compras') || '[]'))
    } catch {
      // Ignora erro de parse
    }
  }

  function formatarMoeda(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  // --- CÁLCULOS GERAIS PARA OS CARDS ---
  const faturamentoTotal = vendas.reduce((acc, v) => acc + (Number(v.total) || 0), 0)
  const totalDespesas = contas.reduce((acc, c) => acc + (Number(c.valor) || 0), 0)

  // Lucro Estimado Geral (Preço Venda - Preço Custo dos itens vendidos)
  let lucroTotalEstimado = 0
  vendas.forEach(v => {
    v.itens?.forEach((item: any) => {
      const prodOriginal = produtos.find(p => Number(p.id) === Number(item.produtoId))
      const custo = prodOriginal ? Number(prodOriginal.precoCusto || 0) : 0
      const lucroItem = (Number(item.precoUnitario) - custo) * Number(item.quantidade)
      lucroTotalEstimado += lucroItem
    })
  })

  // Produtos mais vendidos (Agrupados)
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
    const forma = v.formaPagamento || 'Pix'
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
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* Cabeçalho */}
      <div style={{ backgroundColor: '#581c87', borderRadius: '12px', padding: '20px 24px', color: 'white', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Dashboard Gerencial — Norma Cosméticos</h1>
        <span style={{ fontSize: '13px', opacity: 0.85 }}>Clique nos cards abaixo para abrir os relatórios detalhados.</span>
      </div>

      {/* Cards de Resumo Interativos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        
        {/* Card 1: Produtos Mais Vendidos */}
        <div
          onClick={() => setModalAtivo('produtos')}
          style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = '#a855f7'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
        >
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>📦 Produtos Mais Vendidos</span>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: '8px 0 4px 0' }}>
            {produtosMaisVendidosLista[0]?.nome || 'Nenhum ainda'}
          </h3>
          <span style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 600 }}>Clique para ver ranking completo →</span>
        </div>

        {/* Card 2: Formas de Pagamento */}
        <div
          onClick={() => setModalAtivo('pagamentos')}
          style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = '#a855f7'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
        >
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>💳 Formas de Pagamento</span>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: '8px 0 4px 0' }}>
            {Object.keys(mapaPagamentos).length} Modalidades
          </h3>
          <span style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 600 }}>Clique para detalhar uso →</span>
        </div>

        {/* Card 3: Despesas do Mês */}
        <div
          onClick={() => setModalAtivo('despesas')}
          style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = '#a855f7'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
        >
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>📉 Despesas & Contas</span>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444', margin: '8px 0 4px 0' }}>
            {formatarMoeda(totalDespesas)}
          </h3>
          <span style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 600 }}>Clique para ver categorias →</span>
        </div>

        {/* Card 4: Lucro Estimado */}
        <div
          onClick={() => setModalAtivo('lucro')}
          style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = '#a855f7'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
        >
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>💰 Lucro Estimado</span>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#16a34a', margin: '8px 0 4px 0' }}>
            {formatarMoeda(lucroTotalEstimado)}
          </h3>
          <span style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 600 }}>Clique para ver margens →</span>
        </div>

      </div>

      {/* Seção inferior com prévia rápida */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px' }}>Faturamento vs Despesas</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
            <span style={{ color: '#64748b' }}>Faturamento Total Entradas:</span>
            <strong style={{ color: '#16a34a' }}>{formatarMoeda(faturamentoTotal)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
            <span style={{ color: '#64748b' }}>Total Contas/Despesas:</span>
            <strong style={{ color: '#ef4444' }}>{formatarMoeda(totalDespesas)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '13px' }}>
            <span style={{ color: '#64748b' }}>Saldo Líquido Estimado:</span>
            <strong style={{ color: '#7c3aed' }}>{formatarMoeda(faturamentoTotal - totalDespesas)}</strong>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px' }}>Atalhos Rápidos de Análise</h3>
          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
            Utilize os cartões superiores para abrir relatórios detalhados de produtos, divisão exata de recebimentos por Pix/Cartão, histórico de despesas e margens de lucro.
          </p>
          {onNavegar && (
            <button
              type="button"
              onClick={() => onNavegar('Vendas')}
              style={{ marginTop: '12px', backgroundColor: '#581c87', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Ir para Tela de Vendas →
            </button>
          )}
        </div>
      </div>

      {/* ================= MODAIS DE RELATÓRIO DETALHADO ================= */}
      {modalAtivo && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '700px', maxHeight: '80vh', overflowY: 'auto', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            
            {/* Cabeçalho do Modal */}
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

            {/* Conteúdo: Produtos Mais Vendidos */}
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

            {/* Conteúdo: Formas de Pagamento */}
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

            {/* Conteúdo: Despesas do Mês */}
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

            {/* Conteúdo: Lucro Estimado */}
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

            {/* Rodapé do Modal */}
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