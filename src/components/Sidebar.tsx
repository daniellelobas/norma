
import { useState } from 'react'

type SidebarProps = {
  onMenuClick: (menu: string) => void
}

function Sidebar({ onMenuClick }: SidebarProps) {
  const [menuAtivo, setMenuAtivo] = useState('Dashboard')

 const menus = [
  'Dashboard',
  'Clientes',
  'Produtos',
  'Fornecedores',
  'Compras',
  'Estoque',
  'Histórico de Movimentações',
  'Vendas',
  'Financeiro'
]

  function handleMenuClick(menu: string) {
    setMenuAtivo(menu)
    onMenuClick(menu)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>Norma</h2>
        <span>Cosméticos</span>
      </div>

      <nav>
        <p className="menu-title">MENU PRINCIPAL</p>

        <ul className="menu-list">
          {menus.map((menu) => (
            <li
              key={menu}
              className={menuAtivo === menu ? 'active' : ''}
              onClick={() => handleMenuClick(menu)}
            >
              {menu}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
