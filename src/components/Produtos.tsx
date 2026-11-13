import { useEffect, useState } from 'react'

type Produto = {
  id: number
  codigo: string
  nome: string
  marca: string
  categoria: string
  precoCusto: number
  precoVenda: number
  quantidade: number
  estoqueMinimo: number
}

const CHAVE_PRODUTOS = 'norma-produtos'

const formularioInicial = {
  codigo: '',
  nome: '',
  marca: '',
  categoria: 'Maquiagem',
  precoCusto: '',
  precoVenda: '',
  quantidade: '',
  estoqueMinimo: '5',
}

export default function Produtos() {
  const [produtos, setProdutos] = useState<Produto[]>(() => {
    try {
      const dados = localStorage.getItem(CHAVE_PRODUTOS)
      return dados ? JSON.parse(dados) : []
    } catch {
      return []
    }
  })

  const [formulario, setFormulario] = useState(formularioInicial)
  const [produtoEditando, setProdutoEditando] = useState<number | null>(null)
  const [busca, setBusca] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [abaAtiva, setAbaAtiva] = useState<'formulario' | 'listagem'>('formulario')

  useEffect(() => {
    localStorage.setItem(CHAVE_PRODUTOS, JSON.stringify(produtos))
    window.dispatchEvent(new Event('norma-dados-atualizados'))
  }, [produtos])

  function formatarMoeda(valor: number) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!formulario.nome.trim() || !formulario.precoVenda) {
      setMensagem('Preencha o nome e o preço de venda do produto.')
      return
    }

    const novoProduto: Produto = {
      id: produtoEditando ?? Date.now(),
      codigo: formulario.codigo || String(Date.now()).slice(-4),
      nome: formulario.nome.trim(),
      marca: formulario.marca.trim() || 'Norma Cosméticos',
      categoria: formulario.categoria,
      precoCusto: Number(formulario.precoCusto) || 0,
      precoVenda: Number(formulario.precoVenda) || 0,
      quantidade: Number(formulario.quantidade) || 0,
      estoqueMinimo: Number(formulario.estoqueMinimo) || 5,
    }

    if (produtoEditando !== null) {
      setProdutos(produtos.map(p => p.id === produtoEditando ? novoProduto : p))
      setMensagem('Produto atualizado com sucesso!')
    } else {
      setProdutos([...produtos, novoProduto])
      setMensagem('Produto cadastrado com sucesso!')
    }

    setFormulario(formularioInicial)
    setProdutoEditando(null)
  }

  function handleEditar(produto: Produto) {
    setProdutoEditando(produto.id)
    setFormulario({
      codigo: produto.codigo,
      nome: produto.nome,
      marca: produto.marca,
      categoria: produto.categoria || 'Maquiagem',
      precoCusto: String(produto.precoCusto),
      precoVenda: String(produto.precoVenda),
      quantidade: String(produto.quantidade),
      estoqueMinimo: String(produto.estoqueMinimo),
    })
    setAbaAtiva('formulario')
  }

  function handleExcluir(id: number) {
    if (!window.confirm('Deseja realmente excluir este produto?')) return
    setProdutos(produtos.filter(p => p.id !== id))
    setMensagem('Produto excluído com sucesso.')
  }

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase().trim()) ||
    p.codigo.toLowerCase().includes(busca.toLowerCase().trim()) ||
    p.marca.toLowerCase().includes(busca.toLowerCase().trim())
  )

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* Cabeçalho */}
      <div style={{ backgroundColor: '#581c87', borderRadius: '12px', padding: '16px 24px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Catálogo de Produtos | {produtoEditando !== null ? 'Editar' : 'Novo'}</h1>
          <span style={{ fontSize: '12px', opacity: 0.8 }}>Gestão de Itens e Cosméticos</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setAbaAtiva(abaAtiva === 'formulario' ? 'listagem' : 'formulario')}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            {abaAtiva === 'formulario' ? `Listagem (${produtos.length})` : 'Novo Produto'}
          </button>
        </div>
      </div>

      {abaAtiva === 'listagem' ? (
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Produtos Cadastrados</h2>
            <input
              type="text"
              placeholder="Buscar produto por nome, código ou marca..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{ width: '320px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            />
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '12px' }}>Código</th>
                <th style={{ padding: '12px' }}>Nome</th>
                <th style={{ padding: '12px' }}>Categoria</th>
                <th style={{ padding: '12px' }}>Preço Venda</th>
                <th style={{ padding: '12px' }}>Estoque</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtosFiltrados.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '12px', color: '#64748b' }}>{p.codigo}</td>
                  <td style={{ padding: '12px', fontWeight: 600, color: '#1e293b' }}>{p.nome} <span style={{ fontSize: '11px', color: '#94a3b8' }}>({p.marca})</span></td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{p.categoria}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#6d28d9' }}>{formatarMoeda(p.precoVenda)}</td>
                  <td style={{ padding: '12px', color: p.quantidade <= p.estoqueMinimo ? '#ef4444' : '#10b981', fontWeight: 600 }}>{p.quantidade} un.</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button onClick={() => handleEditar(p)} style={{ background: '#f3e8ff', color: '#6d28d9', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginRight: '6px' }}>Editar</button>
                    <button onClick={() => handleExcluir(p.id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <form onSubmit={handleSalvar} style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', maxWidth: '800px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>Informações do Produto</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Código</label>
              <input type="text" placeholder="Ex: COD001" value={formulario.codigo} onChange={(e) => setFormulario({ ...formulario, codigo: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Nome do Produto *</label>
              <input type="text" placeholder="Ex: Base Líquida Matte" value={formulario.nome} onChange={(e) => setFormulario({ ...formulario, nome: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Marca</label>
              <input type="text" placeholder="Ex: Natura, Avon..." value={formulario.marca} onChange={(e) => setFormulario({ ...formulario, marca: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Categoria</label>
              <select value={formulario.categoria} onChange={(e) => setFormulario({ ...formulario, categoria: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff' }}>
                <option value="Maquiagem">Maquiagem</option>
                <option value="Skincare">Skincare</option>
                <option value="Perfumes">Perfumes</option>
                <option value="Corpo e Banho">Corpo e Banho</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Preço Custo</label>
              <input type="number" step="0.01" value={formulario.precoCusto} onChange={(e) => setFormulario({ ...formulario, precoCusto: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Preço Venda *</label>
              <input type="number" step="0.01" value={formulario.precoVenda} onChange={(e) => setFormulario({ ...formulario, precoVenda: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Qtd. Inicial</label>
              <input type="number" value={formulario.quantidade} onChange={(e) => setFormulario({ ...formulario, quantidade: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Estoque Mínimo</label>
              <input type="number" value={formulario.estoqueMinimo} onChange={(e) => setFormulario({ ...formulario, estoqueMinimo: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" style={{ backgroundColor: '#6d28d9', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>Salvar Produto</button>
            {produtoEditando !== null && (
              <button type="button" onClick={() => { setProdutoEditando(null); setFormulario(formularioInicial); }} style={{ backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
            )}
          </div>

          {mensagem && <div style={{ marginTop: '14px', padding: '10px', borderRadius: '8px', fontSize: '12px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac' }}>{mensagem}</div>}
        </form>
      )}
    </div>
  )
}