
import { useEffect, useState } from 'react'

type Cliente = {
  id: number
  nome: string
  telefone: string
  email: string
}

function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>(() => {
    const clientesSalvos = localStorage.getItem('norma-clientes')

    if (clientesSalvos) {
      try {
        return JSON.parse(clientesSalvos) as Cliente[]
      } catch {
        return []
      }
    }

    return []
  })

  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [busca, setBusca] = useState('')
  const [clienteEditando, setClienteEditando] = useState<number | null>(null)

  useEffect(() => {
    localStorage.setItem('norma-clientes', JSON.stringify(clientes))
  }, [clientes])

  function limparFormulario() {
    setNome('')
    setTelefone('')
    setEmail('')
    setClienteEditando(null)
  }

  function handleCadastrar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!nome.trim()) {
      return
    }

    if (clienteEditando !== null) {
      setClientes((listaAtual) =>
        listaAtual.map((cliente) =>
          cliente.id === clienteEditando
            ? {
                ...cliente,
                nome: nome.trim(),
                telefone: telefone.trim(),
                email: email.trim(),
              }
            : cliente,
        ),
      )
    } else {
      const novoCliente: Cliente = {
        id: Date.now(),
        nome: nome.trim(),
        telefone: telefone.trim(),
        email: email.trim(),
      }

      setClientes((listaAtual) => [...listaAtual, novoCliente])
    }

    limparFormulario()
  }

  function handleEditar(cliente: Cliente) {
    setClienteEditando(cliente.id)
    setNome(cliente.nome)
    setTelefone(cliente.telefone)
    setEmail(cliente.email)

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleExcluir(id: number) {
    const confirmou = window.confirm(
      'Tem certeza de que deseja excluir este cliente?',
    )

    if (!confirmou) {
      return
    }

    setClientes((listaAtual) =>
      listaAtual.filter((cliente) => cliente.id !== id),
    )

    if (clienteEditando === id) {
      limparFormulario()
    }
  }

  const clientesFiltrados = clientes.filter((cliente) => {
    const termo = busca.toLowerCase().trim()

    return (
      cliente.nome.toLowerCase().includes(termo) ||
      cliente.telefone.includes(termo) ||
      cliente.email.toLowerCase().includes(termo)
    )
  })

  return (
    <section className="clientes-page">
      <div className="clientes-header">
        <h2>Cadastro de clientes</h2>
        <p>Gerencie os clientes da loja Norma Cosméticos.</p>
      </div>

      <form className="cliente-form" onSubmit={handleCadastrar}>
        <h3>
          {clienteEditando !== null
            ? 'Editar cliente'
            : 'Cadastrar novo cliente'}
        </h3>

        <div className="campo-cliente">
          <label htmlFor="nome">Nome completo *</label>
          <input
            id="nome"
            type="text"
            placeholder="Digite o nome do cliente"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            required
          />
        </div>

        <div className="campos-linha">
          <div className="campo-cliente">
            <label htmlFor="telefone">Telefone</label>
            <input
              id="telefone"
              type="tel"
              placeholder="(85) 99999-9999"
              value={telefone}
              onChange={(event) => setTelefone(event.target.value)}
            />
          </div>

          <div className="campo-cliente">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              placeholder="cliente@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
        </div>

        <div className="acoes-formulario">
          <button className="botao-cadastrar" type="submit">
            {clienteEditando !== null
              ? 'Salvar alterações'
              : 'Cadastrar cliente'}
          </button>

          {clienteEditando !== null && (
            <button
              className="botao-cancelar"
              type="button"
              onClick={limparFormulario}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="lista-clientes">
        <h2>Clientes cadastrados ({clientes.length})</h2>

        <div className="clientes-search">
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou e-mail..."
            aria-label="Buscar clientes"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
          />
        </div>

        {clientesFiltrados.length === 0 ? (
          <div className="clientes-empty">
            <h3>
              {clientes.length === 0
                ? 'Nenhum cliente cadastrado'
                : 'Nenhum cliente encontrado'}
            </h3>
            <p>
              {clientes.length === 0
                ? 'Preencha o formulário acima para cadastrar o primeiro cliente.'
                : 'Tente pesquisar por outro nome, telefone ou e-mail.'}
            </p>
          </div>
        ) : (
          <div className="tabela-clientes">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>E-mail</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>{cliente.nome}</td>
                    <td>{cliente.telefone || 'Não informado'}</td>
                    <td>{cliente.email || 'Não informado'}</td>
                    <td>
                      <div className="acoes-cliente">
                        <button
                          className="botao-editar"
                          type="button"
                          onClick={() => handleEditar(cliente)}
                        >
                          Editar
                        </button>

                        <button
                          className="botao-excluir"
                          type="button"
                          onClick={() => handleExcluir(cliente.id)}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

export default Clientes
