import { useEffect, useState } from 'react'

type Fornecedor = {
  id: number
  nome: string
  cnpj: string
  telefone: string
  email: string
  contato: string
}

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>(() => {
    try {
      const dados = localStorage.getItem('norma-fornecedores')
      return dados ? JSON.parse(dados) : []
    } catch {
      return []
    }
  })

  const [nome, setNome] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [contato, setContato] = useState('')
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    localStorage.setItem('norma-fornecedores', JSON.stringify(fornecedores))
  }, [fornecedores])

  function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return

    const novo: Fornecedor = {
      id: Date.now(),
      nome: nome.trim(),
      cnpj,
      telefone,
      email,
      contato,
    }

    setFornecedores([...fornecedores, novo])
    setNome('')
    setCnpj('')
    setTelefone('')
    setEmail('')
    setContato('')
    setMensagem('Fornecedor cadastrado com sucesso!')
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' }}>
      <div style={{ backgroundColor: '#581c87', borderRadius: '12px', padding: '16px 24px', color: 'white', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Cadastro de Fornecedores</h1>
        <span style={{ fontSize: '12px', opacity: 0.8 }}>Parceiros e distribuidores de cosméticos</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <form onSubmit={handleSalvar} style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px' }}>Novo Fornecedor</h3>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Empresa / Nome *</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>CNPJ</label>
              <input type="text" value={cnpj} onChange={(e) => setCnpj(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Telefone</label>
              <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
          </div>

          <button type="submit" style={{ backgroundColor: '#6d28d9', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>Salvar Fornecedor</button>
          {mensagem && <div style={{ marginTop: '10px', fontSize: '12px', color: '#16a34a' }}>{mensagem}</div>}
        </form>

        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px' }}>Fornecedores Cadastrados ({fornecedores.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
            {fornecedores.map(f => (
              <div key={f.id} style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <strong style={{ fontSize: '13px', color: '#1e293b', display: 'block' }}>{f.nome}</strong>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Tel: {f.telefone || 'Não inf.'} | E-mail: {f.email || 'Não inf.'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}