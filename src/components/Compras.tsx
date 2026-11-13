import { useEffect, useState } from 'react'

type Compra = {
  id: number
  fornecedorNome: string
  descricao: string
  valor: number
  vencimento: string
  status: 'Pendente' | 'Pago'
  dataCompra: string
}

type FornecedorCadastrado = {
  id: number
  nome?: string
  razaoSocial?: string
  nomeFantasia?: string
}

export default function Compras() {
  const [compras, setCompras] = useState<Compra[]>(() => {
    try {
      const dados = localStorage.getItem('norma-contas-compras')
      return dados ? JSON.parse(dados) : []
    } catch {
      return []
    }
  })

  const [fornecedores, setFornecedores] = useState<FornecedorCadastrado[]>([])
  const [fornecedorNome, setFornecedorNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [vencimento, setVencimento] = useState('')
  const [status, setStatus] = useState<'Pendente' | 'Pago'>('Pendente')
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    function carregarFornecedores() {
      try {
        const dados =
          localStorage.getItem('norma-fornecedores') ||
          localStorage.getItem('fornecedores')
        setFornecedores(dados ? JSON.parse(dados) : [])
      } catch {
        setFornecedores([])
      }
    }

    carregarFornecedores()
    window.addEventListener('norma-dados-atualizados', carregarFornecedores)
    window.addEventListener('storage', carregarFornecedores)

    return () => {
      window.removeEventListener('norma-dados-atualizados', carregarFornecedores)
      window.removeEventListener('storage', carregarFornecedores)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('norma-contas-compras', JSON.stringify(compras))
    window.dispatchEvent(new Event('norma-dados-atualizados'))
  }, [compras])

  function obterNomeFornecedor(f: FornecedorCadastrado) {
    return f.nomeFantasia || f.nome || f.razaoSocial || `Fornecedor #${f.id}`
  }

  function formatarMoeda(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!fornecedorNome.trim() || !valor) {
      setMensagem('Selecione o fornecedor e informe o valor da compra.')
      return
    }

    const novaCompra: Compra = {
      id: Date.now(),
      fornecedorNome: fornecedorNome.trim(),
      descricao: descricao.trim() || 'Aquisição de produtos',
      valor: Number(valor) || 0,
      vencimento: vencimento || new Date().toISOString().split('T')[0],
      status,
      dataCompra: new Date().toISOString(),
    }

    setCompras([...compras, novaCompra])
    setFornecedorNome('')
    setDescricao('')
    setValor('')
    setVencimento('')
    setStatus('Pendente')
    setMensagem('Compra registrada com sucesso!')
  }

  function alternarStatus(id: number) {
    setCompras(
      compras.map((c) => {
        if (c.id === id) {
          const novoStatus = c.status === 'Pendente' ? 'Pago' : 'Pendente'
          return { ...c, status: novoStatus }
        }
        return c
      })
    )
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* Cabeçalho */}
      <div style={{ backgroundColor: '#581c87', borderRadius: '12px', padding: '16px 24px', color: 'white', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Gestão de Compras & Contas</h1>
        <span style={{ fontSize: '12px', opacity: 0.8 }}>Controle de aquisições de fornecedores e pagamentos</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px', alignItems: 'start' }}>
        
        {/* Formulário de Nova Compra */}
        <form onSubmit={handleSalvar} style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
            Registrar Nova Compra
          </h3>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Fornecedor *</label>
            <select
              value={fornecedorNome}
              onChange={(e) => setFornecedorNome(e.target.value)}
              required
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff' }}
            >
              <option value="">
                {fornecedores.length === 0
                  ? 'Nenhum fornecedor cadastrado'
                  : 'Selecione um fornecedor...'}
              </option>
              {fornecedores.map((f) => {
                const nomeExibicao = obterNomeFornecedor(f)
                return (
                  <option key={f.id} value={nomeExibicao}>
                    {nomeExibicao}
                  </option>
                )
              })}
            </select>
            {fornecedores.length === 0 && (
              <span style={{ fontSize: '11px', color: '#dc2626', display: 'block', marginTop: '4px' }}>
                Cadastre um fornecedor na aba Fornecedores antes de lançar a compra.
              </span>
            )}
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Descrição / Itens</label>
            <input
              type="text"
              placeholder="Ex: Lote de batons e perfumes"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Valor Total *</label>
              <input
                type="number"
                step="0.01"
                placeholder="R$ 0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Vencimento</label>
              <input
                type="date"
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Status do Pagamento</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Pendente' | 'Pago')}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff' }}
            >
              <option value="Pendente">Pendente</option>
              <option value="Pago">Pago</option>
            </select>
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              backgroundColor: '#6d28d9',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Salvar Compra
          </button>

          {mensagem && (
            <div style={{ marginTop: '12px', padding: '8px', borderRadius: '6px', fontSize: '12px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac' }}>
              {mensagem}
            </div>
          )}
        </form>

        {/* Listagem de Compras */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
            Histórico de Compras ({compras.length})
          </h3>

          {compras.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '30px 0', fontSize: '13px' }}>Nenhuma compra registrada.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
              {compras.slice().reverse().map((c) => (
                <div key={c.id} style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '13px', color: '#1e293b', display: 'block' }}>{c.fornecedorNome}</strong>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>
                      {c.descricao} • Vencimento: {c.vencimento ? c.vencimento.split('-').reverse().join('/') : 'N/I'}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#6d28d9', display: 'block', marginTop: '4px' }}>{formatarMoeda(c.valor)}</span>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => alternarStatus(c.id)}
                      style={{
                        backgroundColor: c.status === 'Pago' ? '#dcfce7' : '#fee2e2',
                        color: c.status === 'Pago' ? '#16a34a' : '#dc2626',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      {c.status}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}