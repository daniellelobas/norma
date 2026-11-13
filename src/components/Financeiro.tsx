import { useEffect, useState } from 'react'

type ContaPagar = {
  id: number
  descricao: string
  categoria?: string
  fornecedorNome?: string
  valor: number
  vencimento: string
  status: 'Pendente' | 'Pago'
}

export default function Financeiro() {
  const [vendas, setVendas] = useState<any[]>([])
  const [contas, setContas] = useState<ContaPagar[]>([])
  
  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState('Custos Operacionais')
  const [valor, setValor] = useState('')
  const [vencimento, setVencimento] = useState('')
  const [fornecedorNome, setFornecedorNome] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [abaInterna, setAbaInterna] = useState<'geral' | 'cadastrar'>('geral')

  useEffect(() => {
    carregarDados()
  }, [])

  function carregarDados() {
    try {
      const v = JSON.parse(localStorage.getItem('norma-vendas') || '[]')
      const c = JSON.parse(localStorage.getItem('norma-contas-compras') || '[]')
      setVendas(v)
      setContas(c)
    } catch {
      // Ignora erro
    }
  }

  function formatarMoeda(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  function exportarRelatorioCSV() {
    if (vendas.length === 0) {
      alert('Não há vendas registradas para exportar.')
      return
    }

    let csvContent = 'data:text/csv;charset=utf-8,ID Venda;Data;Cliente;Forma Pagamento;Total\n'
    vendas.forEach((v) => {
      const dataFormatada = new Date(v.data).toLocaleDateString('pt-BR')
      csvContent += `${v.id};${dataFormatada};"${v.clienteNome}";${v.formaPagamento};${v.total}\n`
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `relatorio_vendas_norma_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function handleSalvarConta(e: React.FormEvent) {
    e.preventDefault()
    if (!descricao.trim() || !valor) {
      setMensagem('Preencha a descrição e o valor da conta.')
      return
    }

    const novaConta: ContaPagar = {
      id: Date.now(),
      descricao: descricao.trim(),
      categoria,
      valor: Number(valor) || 0,
      vencimento: vencimento || new Date().toISOString().split('T')[0],
      status: 'Pendente',
      fornecedorNome: fornecedorNome.trim() || 'Não informado',
    }

    const atualizadas = [...contas, novaConta]
    setContas(atualizadas)
    localStorage.setItem('norma-contas-compras', JSON.stringify(atualizadas))

    setDescricao('')
    setValor('')
    setVencimento('')
    setFornecedorNome('')
    setMensagem('Conta / Despesa cadastrada com sucesso!')
    setAbaInterna('geral')
    window.dispatchEvent(new Event('norma-dados-atualizados'))
  }

  function alternarStatusPagamento(id: number) {
    const atualizadas = contas.map(c => {
      if (c.id === id) {
        return { ...c, status: (c.status === 'Pendente' ? 'Pago' : 'Pendente') as 'Pendente' | 'Pago' }
      }
      return c
    })
    setContas(atualizadas)
    localStorage.setItem('norma-contas-compras', JSON.stringify(atualizadas))
  }

  const faturamentoTotal = vendas.reduce((acc, v) => acc + (Number(v.total) || 0), 0)
  const totalContasPendente = contas.filter(c => c.status === 'Pendente').reduce((acc, c) => acc + (Number(c.valor) || 0), 0)
  const totalPagas = contas.filter(c => c.status === 'Pago').reduce((acc, c) => acc + (Number(c.valor) || 0), 0)

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* Cabeçalho */}
      <div style={{ backgroundColor: '#581c87', borderRadius: '12px', padding: '16px 24px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Gestão Financeira & Contas a Pagar</h1>
          <span style={{ fontSize: '12px', opacity: 0.8 }}>Controle de custos, despesas eventuais e fluxo de caixa</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={exportarRelatorioCSV}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: 'white', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            📥 Exportar Relatório (CSV)
          </button>

          <button
            type="button"
            onClick={() => setAbaInterna(abaInterna === 'geral' ? 'cadastrar' : 'geral')}
            style={{ background: 'white', color: '#581c87', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {abaInterna === 'geral' ? '+ Nova Conta / Despesa' : 'Ver Painel Financeiro'}
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Faturamento Total (Entradas)</span>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a', margin: '8px 0 0 0' }}>{formatarMoeda(faturamentoTotal)}</h3>
        </div>
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Contas a Pagar (Pendentes)</span>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444', margin: '8px 0 0 0' }}>{formatarMoeda(totalContasPendente)}</h3>
        </div>
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Despesas / Contas Pagas</span>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#6d28d9', margin: '8px 0 0 0' }}>{formatarMoeda(totalPagas)}</h3>
        </div>
      </div>

      {abaInterna === 'cadastrar' ? (
        <form onSubmit={handleSalvarConta} style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            Nova Conta a Pagar / Despesa Eventual
          </h2>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Descrição da Conta *</label>
            <input
              type="text"
              placeholder="Ex: Aluguel da Loja, Conta de Luz..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Categoria / Tipo de Custo</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff' }}
              >
                <option value="Custos Operacionais">Custos Operacionais</option>
                <option value="Despesas Eventuais">Despesas Eventuais</option>
                <option value="Fornecedores / Mercadorias">Fornecedores / Mercadorias</option>
                <option value="Impostos e Taxas">Impostos e Taxas</option>
                <option value="Manutenção">Manutenção</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Fornecedor / Credor</label>
              <input
                type="text"
                placeholder="Nome do credor"
                value={fornecedorNome}
                onChange={(e) => setFornecedorNome(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Valor (R$) *</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Data de Vencimento</label>
              <input
                type="date"
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              style={{ backgroundColor: '#6d28d9', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Salvar Conta a Pagar
            </button>
            <button
              type="button"
              onClick={() => setAbaInterna('geral')}
              style={{ backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
            >
              Cancelar
            </button>
          </div>

          {mensagem && (
            <div style={{ marginTop: '14px', padding: '10px', borderRadius: '8px', fontSize: '12px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac' }}>
              {mensagem}
            </div>
          )}
        </form>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px' }}>
              Contas a Pagar, Custos e Despesas Eventuais ({contas.length})
            </h2>

            {contas.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', padding: '30px 0', fontSize: '13px' }}>Nenhuma conta ou despesa cadastrada.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '10px' }}>Descrição</th>
                    <th style={{ padding: '10px' }}>Categoria</th>
                    <th style={{ padding: '10px' }}>Fornecedor</th>
                    <th style={{ padding: '10px' }}>Vencimento</th>
                    <th style={{ padding: '10px' }}>Valor</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contas.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '10px', fontWeight: 600, color: '#1e293b' }}>{c.descricao}</td>
                      <td style={{ padding: '10px', color: '#64748b' }}>{c.categoria}</td>
                      <td style={{ padding: '10px', color: '#64748b' }}>{c.fornecedorNome || '-'}</td>
                      <td style={{ padding: '10px', color: '#64748b' }}>{c.vencimento ? c.vencimento.split('-').reverse().join('/') : '-'}</td>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: '#ef4444' }}>{formatarMoeda(c.valor)}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => alternarStatusPagamento(c.id)}
                          style={{
                            backgroundColor: c.status === 'Pago' ? '#dcfce7' : '#fee2e2',
                            color: c.status === 'Pago' ? '#16a34a' : '#dc2626',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          {c.status === 'Pago' ? 'Pago' : 'Pendente (Marcar Pago)'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px' }}>Últimas Vendas Registradas (Entradas)</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '10px' }}>Data</th>
                  <th style={{ padding: '10px' }}>Cliente</th>
                  <th style={{ padding: '10px' }}>Forma Pagamento</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {vendas.slice(-5).reverse().map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '10px', color: '#64748b' }}>{new Date(v.data).toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding: '10px', fontWeight: 600, color: '#1e293b' }}>{v.clienteNome}</td>
                    <td style={{ padding: '10px', color: '#64748b' }}>{v.formaPagamento}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#16a34a' }}>{formatarMoeda(v.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  )
}