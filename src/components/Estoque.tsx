import { useEffect, useState } from 'react'

export default function Estoque() {
  const [produtos, setProdutos] = useState<any[]>([])
  const [lotes, setLotes] = useState<any[]>([])
  const [busca, setBusca] = useState('')

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem('norma-produtos') || '[]')
      const l = JSON.parse(localStorage.getItem('norma-lotes') || '[]')
      setProdutos(p)
      setLotes(l)
    } catch {
      // Ignora erro
    }
  }, [])

  function exportarEstoqueCSV() {
    if (produtos.length === 0) {
      alert('Não há produtos no estoque para exportar.')
      return
    }

    let csvContent = 'data:text/csv;charset=utf-8,Codigo;Nome;Marca;Categoria;Preco Venda;Quantidade;Estoque Minimo\n'
    produtos.forEach((p) => {
      csvContent += `${p.codigo};"${p.nome}";"${p.marca}";"${p.categoria || 'Geral'}";${p.precoVenda};${p.quantidade};${p.estoqueMinimo || 5}\n`
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `inventario_estoque_norma_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const produtosBaixos = produtos.filter(p => Number(p.quantidade) <= Number(p.estoqueMinimo || 5))

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* Cabeçalho */}
      <div style={{ backgroundColor: '#581c87', borderRadius: '12px', padding: '16px 24px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Controle de Estoque & Lotes</h1>
          <span style={{ fontSize: '12px', opacity: 0.8 }}>Monitore níveis críticos e validades</span>
        </div>
        <button
          type="button"
          onClick={exportarEstoqueCSV}
          style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: 'white', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
        >
          📥 Exportar Inventário (CSV)
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px' }}>🚨 Alerta de Estoque Baixo ({produtosBaixos.length})</h2>
          {produtosBaixos.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#10b981' }}>Tudo em ordem! Nenhum produto abaixo do mínimo.</p>
          ) : (
            produtosBaixos.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>{p.nome}</span>
                <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{p.quantidade} un. (Mín: {p.estoqueMinimo || 5})</span>
              </div>
            ))
          )}
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px' }}>📦 Resumo Geral do Estoque</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
            <span style={{ color: '#64748b' }}>Total de Produtos no Catálogo:</span>
            <strong style={{ color: '#0f172a' }}>{produtos.length}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '13px' }}>
            <span style={{ color: '#64748b' }}>Lotes Cadastrados:</span>
            <strong style={{ color: '#0f172a' }}>{lotes.length}</strong>
          </div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px' }}>Saldo Atual de Produtos</h2>
        <input
          type="text"
          placeholder="Filtrar produtos..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ width: '300px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', marginBottom: '16px' }}
        />

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', color: '#475569' }}>
              <th style={{ padding: '10px' }}>Código</th>
              <th style={{ padding: '10px' }}>Produto</th>
              <th style={{ padding: '10px' }}>Quantidade Total</th>
              <th style={{ padding: '10px' }}>Estoque Mínimo</th>
              <th style={{ padding: '10px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {produtos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase())).map(p => {
              const minimo = Number(p.estoqueMinimo || 5)
              const atual = Number(p.quantidade || 0)
              const baixo = atual <= minimo

              return (
                <tr key={p.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px', color: '#64748b' }}>{p.codigo}</td>
                  <td style={{ padding: '10px', fontWeight: 600, color: '#1e293b' }}>{p.nome}</td>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>{atual} un.</td>
                  <td style={{ padding: '10px', color: '#64748b' }}>{minimo} un.</td>
                  <td style={{ padding: '10px' }}>
                    {baixo ? (
                      <span style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>Repor Estoque</span>
                    ) : (
                      <span style={{ backgroundColor: '#dcfce7', color: '#16a34a', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>Normal</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}