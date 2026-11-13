import { useState } from 'react'

type SidebarProps = {
  onMenuClick: (menu: string) => void
}

export default function Sidebar({ onMenuClick }: SidebarProps) {
  const [menuAtivo, setMenuAtivo] = useState('Dashboard')

  const menus = [
    { nome: 'Dashboard', icone: '💜' },
    { nome: 'Vendas', icone: '🛒' },
    { nome: 'Clientes', icone: '👤' },
    { nome: 'Produtos', icone: '📦' },
    { nome: 'Estoque', icone: '📊' },
    { nome: 'Financeiro', icone: '💰' },
    { nome: 'Fornecedores', icone: '🤝' },
    { nome: 'Compras', icone: '🛍️' },
    { nome: 'Movimentacoes', icone: '🔄' },
  ]

  function handleMenuClick(menu: string) {
    setMenuAtivo(menu)
    onMenuClick(menu)
  }

  return (
    <aside style={{
      width: '260px',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #f1f5f9',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100vh',
      fontFamily: 'Segoe UI, sans-serif'
    }}>
      <div>
        {/* Logo / Título */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #f8fafc' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#6d28d9', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🌸</span> NORMA
          </h2>
          <span style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>Cosméticos</span>
        </div>

        {/* Lista de Menus */}
        <nav style={{ padding: '16px 12px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', paddingLeft: '12px', marginBottom: '12px', letterSpacing: '0.5px' }}>
            MENU PRINCIPAL
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {menus.map((item) => {
              const ativo = menuAtivo === item.nome
              return (
                <li
                  key={item.nome}
                  onClick={() => handleMenuClick(item.nome)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: ativo ? 600 : 500,
                    backgroundColor: ativo ? '#f3e8ff' : 'transparent',
                    color: ativo ? '#6d28d9' : '#64748b',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{item.icone}</span>
                  <span>{item.nome}</span>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      {/* Rodapé da Sidebar */}
      <div style={{ padding: '20px', borderTop: '1px solid #f8fafc', fontSize: '12px', color: '#94a3b8' }}>
        <p style={{ margin: 0, fontWeight: 600, color: '#475569' }}>Sistema da Loja</p>
        <p style={{ margin: '2px 0 0 0' }}>Versão 1.0.0</p>
      </div>
    </aside>
  )
}