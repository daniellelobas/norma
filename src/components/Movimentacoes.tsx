import { useEffect, useState } from 'react'

type Movimentacao = {
  id: number
  tipo: 'Entrada' | 'Saída'
  produtoNome: string
  quantidade: number
  lote?: string
  data: string
  origem: string
  pessoaNome?: string
}

export default function Movimentacoes() {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([])
  const [busca, setBusca] = useState('')

  useEffect(() => {
    try {
      const dados = JSON.parse(localStorage.getItem('norma-movimentacoes') || '[]')
      setMovimentacoes(dados)
    } catch {
      setMovimentacoes([])
    }
  }, [])

  const movimentacoesFiltradas = movimentacoes.filter((m) =>
    m.produtoNome.toLowerCase().includes(busca.toLowerCase().trim()) ||
    m.origem.toLowerCase().includes(busca.toLowerCase().trim()) ||
    (m.pessoaNome && m.pessoaNome.toLowerCase().includes(busca.toLowerCase().trim()))
  )

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* Cabeçalho */}
      <div style={{ backgroundColor: '#581c87', borderRadius: '12px', padding: '16px 24px', color: 'white', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Histórico de Movimentações de Estoque</h1>
        <span style={{ fontSize: '12px', opacity: 0.8 }}>Rastreabilidade completa de entradas e saídas de produtos</span>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        
        {/* Barra de Pesquisa */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
            Registro de Auditoria ({movimentacoes.length})
          </h2>
          <input
            type="text"
            placeholder="Buscar por produto, origem ou cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{ width: '320px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
          />
        </div>

        {movimentacoesFiltradas.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0', fontSize: '13px' }}>
            Nenhuma movimentação registrada no estoque ainda.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '12px' }}>Data / Hora</th>
                  <th style={{ padding: '12px' }}>Tipo</th>
                  <th style={{ padding: '12px' }}>Produto</th>
                  <th style={{ padding: '12px' }}>Quantidade</th>
                  <th style={{ padding: '12px' }}>Origem</th>
                  <th style={{ padding: '12px' }}>Pessoa / Envolvido</th>
                </tr>
              </thead>
              <tbody>
                {movimentacoesFiltradas.slice().reverse().map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '12px', color: '#64748b' }}>
                      {m.data ? new Date(m.data).toLocaleString('pt-BR') : 'Data não informada'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          backgroundColor: m.tipo === 'Entrada' ? '#dcfce7' : '#fee2e2',
                          color: m.tipo === 'Entrada' ? '#16a34a' : '#dc2626',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}
                      >
                        {m.tipo}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600, color: '#1e293b' }}>{m.produtoNome}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#0f172a' }}>{m.quantidade} un.</td>
                    <td style={{ padding: '12px', color: '#64748b' }}>{m.origem}</td>
                    <td style={{ padding: '12px', color: '#64748b' }}>{m.pessoaNome || 'Geral'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  )
}