
import { useEffect, useState } from 'react'

type Fornecedor = {
  id: number
  nome: string
  telefone: string
  whatsapp: string
  email: string
  endereco: string
  observacoes: string
}

function lerFornecedores(): Fornecedor[] {
  try {
    const dados = localStorage.getItem('norma-fornecedores')

    if (!dados) return []

    const resultado: unknown = JSON.parse(dados)

    return Array.isArray(resultado) ? (resultado as Fornecedor[]) : []
  } catch {
    return []
  }
}

function Fornecedores() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>(
    () => lerFornecedores(),
  )

  const [idEdicao, setIdEdicao] = useState<number | null>(null)
  const [busca, setBusca] = useState('')

  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [endereco, setEndereco] = useState('')
  const [observacoes, setObservacoes] = useState('')

  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState(false)

  useEffect(() => {
    function atualizarDados() {
      setFornecedores(lerFornecedores())
    }

    window.addEventListener('storage', atualizarDados)
    window.addEventListener('norma-dados-atualizados', atualizarDados)

    return () => {
      window.removeEventListener('storage', atualizarDados)
      window.removeEventListener('norma-dados-atualizados', atualizarDados)
    }
  }, [])

  const fornecedoresFiltrados = fornecedores.filter((fornecedor) =>
    fornecedor.nome.toLowerCase().includes(busca.trim().toLowerCase()),
  )

  function limparFormulario() {
    setIdEdicao(null)
    setNome('')
    setTelefone('')
    setWhatsapp('')
    setEmail('')
    setEndereco('')
    setObservacoes('')
  }

  function salvarFornecedor(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    if (!nome.trim()) {
      setMensagem('Informe o nome do fornecedor.')
      setErro(true)
      return
    }

    const fornecedoresAtuais = lerFornecedores()

    const fornecedorExistente = fornecedoresAtuais.some(
      (fornecedor) =>
        fornecedor.nome.trim().toLowerCase() === nome.trim().toLowerCase() &&
        fornecedor.id !== idEdicao,
    )

    if (fornecedorExistente) {
      setMensagem('Já existe um fornecedor cadastrado com esse nome.')
      setErro(true)
      return
    }

    const fornecedor: Fornecedor = {
      id: idEdicao ?? Date.now(),
      nome: nome.trim(),
      telefone: telefone.trim(),
      whatsapp: whatsapp.trim(),
      email: email.trim(),
      endereco: endereco.trim(),
      observacoes: observacoes.trim(),
    }

    const fornecedoresAtualizados =
      idEdicao === null
        ? [...fornecedoresAtuais, fornecedor]
        : fornecedoresAtuais.map((item) =>
            item.id === idEdicao ? fornecedor : item,
          )

    try {
      localStorage.setItem(
        'norma-fornecedores',
        JSON.stringify(fornecedoresAtualizados),
      )

      setFornecedores(fornecedoresAtualizados)
      limparFormulario()

      setMensagem(
        idEdicao === null
          ? 'Fornecedor cadastrado com sucesso!'
          : 'Fornecedor atualizado com sucesso!',
      )
      setErro(false)

      window.dispatchEvent(new Event('norma-dados-atualizados'))
    } catch {
      setMensagem('Não foi possível salvar o fornecedor.')
      setErro(true)
    }
  }

  function editarFornecedor(fornecedor: Fornecedor) {
    setIdEdicao(fornecedor.id)
    setNome(fornecedor.nome)
    setTelefone(fornecedor.telefone)
    setWhatsapp(fornecedor.whatsapp)
    setEmail(fornecedor.email)
    setEndereco(fornecedor.endereco)
    setObservacoes(fornecedor.observacoes)

    setMensagem('')
    setErro(false)

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function excluirFornecedor(id: number) {
    const fornecedor = fornecedores.find((item) => item.id === id)

    if (!fornecedor) return

    const confirmar = window.confirm(
      `Deseja realmente excluir o fornecedor "${fornecedor.nome}"?`,
    )

    if (!confirmar) return

    const fornecedoresAtuais = lerFornecedores()

    const fornecedoresAtualizados = fornecedoresAtuais.filter(
      (item) => item.id !== id,
    )

    try {
      localStorage.setItem(
        'norma-fornecedores',
        JSON.stringify(fornecedoresAtualizados),
      )

      setFornecedores(fornecedoresAtualizados)

      if (idEdicao === id) {
        limparFormulario()
      }

      setMensagem('Fornecedor excluído com sucesso.')
      setErro(false)

      window.dispatchEvent(new Event('norma-dados-atualizados'))
    } catch {
      setMensagem('Não foi possível excluir o fornecedor.')
      setErro(true)
    }
  }

  return (
    <div className="fornecedores-page">
      <div className="fornecedores-header">
        <h2>Cadastro de fornecedores</h2>
        <p>
          Cadastre e organize os fornecedores dos produtos da loja.
        </p>
      </div>

      <section className="fornecedor-form">
        <h3>
          {idEdicao === null ? 'Novo fornecedor' : 'Editar fornecedor'}
        </h3>

        <form onSubmit={salvarFornecedor}>
          <div className="campos-fornecedor">
            <div className="campo-fornecedor">
              <label htmlFor="fornecedor-nome">Nome do fornecedor *</label>
              <input
                id="fornecedor-nome"
                value={nome}
                onChange={(evento) => setNome(evento.target.value)}
                placeholder="Ex.: Natura"
                required
              />
            </div>

            <div className="campo-fornecedor">
              <label htmlFor="fornecedor-telefone">Telefone</label>
              <input
                id="fornecedor-telefone"
                value={telefone}
                onChange={(evento) => setTelefone(evento.target.value)}
                placeholder="(00) 0000-0000"
              />
            </div>

            <div className="campo-fornecedor">
              <label htmlFor="fornecedor-whatsapp">WhatsApp</label>
              <input
                id="fornecedor-whatsapp"
                value={whatsapp}
                onChange={(evento) => setWhatsapp(evento.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="campo-fornecedor">
              <label htmlFor="fornecedor-email">E-mail</label>
              <input
                id="fornecedor-email"
                type="email"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                placeholder="fornecedor@email.com"
              />
            </div>

            <div className="campo-fornecedor">
              <label htmlFor="fornecedor-endereco">Endereço</label>
              <input
                id="fornecedor-endereco"
                value={endereco}
                onChange={(evento) => setEndereco(evento.target.value)}
                placeholder="Endereço do fornecedor"
              />
            </div>

            <div className="campo-fornecedor">
              <label htmlFor="fornecedor-observacoes">Observações</label>
              <input
                id="fornecedor-observacoes"
                value={observacoes}
                onChange={(evento) => setObservacoes(evento.target.value)}
                placeholder="Informações adicionais"
              />
            </div>
          </div>

          <div className="acoes-formulario">
            <button className="botao-cadastrar" type="submit">
              {idEdicao === null ? 'Cadastrar fornecedor' : 'Salvar alterações'}
            </button>

            {idEdicao !== null && (
              <button
                className="botao-cancelar"
                type="button"
                onClick={limparFormulario}
              >
                Cancelar edição
              </button>
            )}
          </div>
        </form>
      </section>

      {mensagem && (
        <p
          className={
            erro
              ? 'fornecedor-mensagem fornecedor-mensagem-erro'
              : 'fornecedor-mensagem'
          }
          role="status"
          aria-live="polite"
        >
          {mensagem}
        </p>
      )}

      <section className="lista-fornecedores">
        <h2>Fornecedores cadastrados</h2>

        <div className="fornecedores-search">
          <input
            type="search"
            placeholder="Buscar fornecedor pelo nome..."
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
          />
        </div>

        {fornecedoresFiltrados.length === 0 ? (
          <div className="fornecedores-empty">
            <h3>Nenhum fornecedor encontrado.</h3>
            <p>Cadastre um fornecedor para começar a organizar suas compras.</p>
          </div>
        ) : (
          <div className="tabela-fornecedores">
            <table>
              <thead>
                <tr>
                  <th>Fornecedor</th>
                  <th>Telefone</th>
                  <th>WhatsApp</th>
                  <th>E-mail</th>
                  <th>Endereço</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {fornecedoresFiltrados.map((fornecedor) => (
                  <tr key={fornecedor.id}>
                    <td><strong>{fornecedor.nome}</strong></td>
                    <td>{fornecedor.telefone || '-'}</td>
                    <td>{fornecedor.whatsapp || '-'}</td>
                    <td>{fornecedor.email || '-'}</td>
                    <td>{fornecedor.endereco || '-'}</td>
                    <td>
                      <div className="acoes-cliente">
                        <button
                          type="button"
                          className="botao-editar"
                          onClick={() => editarFornecedor(fornecedor)}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="botao-excluir"
                          onClick={() => excluirFornecedor(fornecedor.id)}
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
      </section>
    </div>
  )
}

export default Fornecedores
