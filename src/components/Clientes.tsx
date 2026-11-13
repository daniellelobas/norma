import { useEffect, useState } from 'react'

type Cliente = {
  id: number
  nome: string
  cpf?: string
  dataNascimento?: string
  telefone: string
  email: string
  cep?: string
  endereco?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  tipoPele?: string
  tomBase?: string
  limiteCrediario?: string
  situacao?: string
  observacoes?: string
  foto?: string
  dataCadastro?: string
}

const CHAVE_CLIENTES = 'norma-clientes'

const formularioInicial = {
  nome: '',
  cpf: '',
  dataNascimento: '',
  telefone: '',
  email: '',
  cep: '',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  tipoPele: 'Normal',
  tomBase: '',
  limiteCrediario: '',
  situacao: 'Ativo',
  observacoes: '',
  foto: '',
}

type FormularioCliente = typeof formularioInicial

function lerClientes(): Cliente[] {
  try {
    const dados = localStorage.getItem(CHAVE_CLIENTES)
    if (!dados) return []

    const resultado: unknown = JSON.parse(dados)
    return Array.isArray(resultado) ? (resultado as Cliente[]) : []
  } catch {
    return []
  }
}

function aplicarMascaraCPF(valor: string) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function aplicarMascaraTelefone(valor: string) {
  const numeros = valor.replace(/\D/g, '').slice(0, 11)

  if (numeros.length <= 10) {
    return numeros
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }

  return numeros
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

function aplicarMascaraCEP(valor: string) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, '$1-$2')
}

function validarCPF(cpf: string): boolean {
  const numeros = cpf.replace(/\D/g, '')

  if (numeros.length !== 11 || /^(\d)\1{10}$/.test(numeros)) {
    return false
  }

  for (let tamanho = 9; tamanho <= 10; tamanho++) {
    let soma = 0

    for (let i = 0; i < tamanho; i++) {
      soma += Number(numeros[i]) * (tamanho + 1 - i)
    }

    const resto = (soma * 10) % 11
    const digito = resto === 10 ? 0 : resto

    if (digito !== Number(numeros[tamanho])) {
      return false
    }
  }

  return true
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>(() => lerClientes())
  const [formulario, setFormulario] =
    useState<FormularioCliente>(formularioInicial)

  const [busca, setBusca] = useState('')
  const [buscaLateral, setBuscaLateral] = useState('')
  const [clienteEditando, setClienteEditando] = useState<number | null>(null)
  const [mensagem, setMensagem] = useState('')
  const [consultandoCep, setConsultandoCep] = useState(false)

  const [abaAtiva, setAbaAtiva] = useState<
    'formulario' | 'listagem'
  >('formulario')

  useEffect(() => {
    localStorage.setItem(CHAVE_CLIENTES, JSON.stringify(clientes))
    window.dispatchEvent(new Event('norma-dados-atualizados'))
  }, [clientes])

  function alterarCampo(campo: keyof FormularioCliente, valor: string) {
    setFormulario((atual) => ({
      ...atual,
      [campo]: valor,
    }))
  }

  // CONSULTA AUTOMÁTICA DO CEP
  async function consultarCEP() {
    const cepNumeros = formulario.cep.replace(/\D/g, '')

    if (cepNumeros.length === 0) return

    if (cepNumeros.length !== 8) {
      setMensagem('O CEP precisa ter 8 números.')
      return
    }

    setConsultandoCep(true)
    setMensagem('Consultando CEP...')

    try {
      const resposta = await fetch(
        `https://viacep.com.br/ws/${cepNumeros}/json/`,
      )

      if (!resposta.ok) {
        throw new Error('Falha na consulta')
      }

      const dados = await resposta.json()

      if (dados.erro) {
        setMensagem('CEP não encontrado. Confira os números digitados.')
        return
      }

      setFormulario((atual) => ({
        ...atual,
        cep: dados.cep || atual.cep,
        endereco: dados.logradouro || atual.endereco,
        complemento: dados.complemento || atual.complemento,
        bairro: dados.bairro || atual.bairro,
        cidade: dados.localidade || atual.cidade,
        estado: dados.uf || atual.estado,
      }))

      setMensagem(
        'Endereço preenchido pelo CEP! Confira o número e o complemento.',
      )
    } catch {
      setMensagem(
        'Não foi possível consultar o CEP agora. Verifique sua conexão e tente novamente.',
      )
    } finally {
      setConsultandoCep(false)
    }
  }

  // SELECIONAR FOTO DO CLIENTE
  function handleSelecionarFoto(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const arquivo = event.target.files?.[0]
    if (!arquivo) return

    if (!arquivo.type.startsWith('image/')) {
      setMensagem('Selecione um arquivo de imagem.')
      event.target.value = ''
      return
    }

    const leitor = new FileReader()

    leitor.onload = () => {
      const imagem = new Image()

      imagem.onload = () => {
        const tamanhoMaximo = 700
        const maiorLado = Math.max(imagem.width, imagem.height)
        const escala = Math.min(1, tamanhoMaximo / maiorLado)

        const canvas = document.createElement('canvas')

        canvas.width = Math.max(
          1,
          Math.round(imagem.width * escala),
        )

        canvas.height = Math.max(
          1,
          Math.round(imagem.height * escala),
        )

        const contexto = canvas.getContext('2d')

        if (!contexto) {
          setMensagem('Não foi possível preparar essa imagem.')
          return
        }

        contexto.drawImage(
          imagem,
          0,
          0,
          canvas.width,
          canvas.height,
        )

        const fotoRedimensionada = canvas.toDataURL(
          'image/jpeg',
          0.78,
        )

        setFormulario((atual) => ({
          ...atual,
          foto: fotoRedimensionada,
        }))

        setMensagem(
          'Foto selecionada! Salve o cadastro para guardar a imagem.',
        )
      }

      imagem.onerror = () => {
        setMensagem('Não foi possível abrir essa imagem.')
      }

      imagem.src = String(leitor.result)
    }

    leitor.onerror = () => {
      setMensagem('Não foi possível carregar a foto.')
    }

    leitor.readAsDataURL(arquivo)
    event.target.value = ''
  }

  function removerFoto() {
    setFormulario((atual) => ({
      ...atual,
      foto: '',
    }))

    setMensagem('Foto removida. Salve o cadastro para confirmar.')
  }

  function limparFormulario() {
    setFormulario(formularioInicial)
    setClienteEditando(null)
    setMensagem('')
  }

  // CADASTRAR OU ATUALIZAR CLIENTE
  function handleCadastrar(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!formulario.nome.trim()) {
      setMensagem('Informe o nome completo do cliente.')
      return
    }

    const cpfNumeros = formulario.cpf.replace(/\D/g, '')

    if (cpfNumeros && !validarCPF(formulario.cpf)) {
      setMensagem('CPF inválido. Confira os números informados.')
      return
    }

    if (cpfNumeros) {
      const cpfDuplicado = clientes.some(
        (cliente) =>
          cliente.id !== clienteEditando &&
          cliente.cpf?.replace(/\D/g, '') === cpfNumeros,
      )

      if (cpfDuplicado) {
        setMensagem('Este CPF já está cadastrado para outro cliente.')
        return
      }
    }

    const dadosCliente: Cliente = {
      id: clienteEditando ?? Date.now(),
      ...formulario,
      nome: formulario.nome.trim(),
      telefone: formulario.telefone.trim(),
      email: formulario.email.trim(),
      cpf: formulario.cpf.trim(),
      dataCadastro:
        clientes.find(
          (cliente) => cliente.id === clienteEditando,
        )?.dataCadastro ?? new Date().toISOString().slice(0, 10),
    }

    if (clienteEditando !== null) {
      setClientes((lista) =>
        lista.map((cliente) =>
          cliente.id === clienteEditando
            ? { ...cliente, ...dadosCliente }
            : cliente,
        ),
      )

      setMensagem('Cliente atualizado com sucesso!')
    } else {
      setClientes((lista) => [...lista, dadosCliente])
      setMensagem('Cliente cadastrado com sucesso!')
    }

    setFormulario(formularioInicial)
    setClienteEditando(null)
  }

  // EDITAR CLIENTE
  function handleEditar(cliente: Cliente) {
    setClienteEditando(cliente.id)

    setFormulario({
      nome: cliente.nome || '',
      cpf: cliente.cpf || '',
      dataNascimento: cliente.dataNascimento || '',
      telefone: cliente.telefone || '',
      email: cliente.email || '',
      cep: cliente.cep || '',
      endereco: cliente.endereco || '',
      numero: cliente.numero || '',
      complemento: cliente.complemento || '',
      bairro: cliente.bairro || '',
      cidade: cliente.cidade || '',
      estado: cliente.estado || '',
      tipoPele: cliente.tipoPele || 'Normal',
      tomBase: cliente.tomBase || '',
      limiteCrediario: cliente.limiteCrediario || '',
      situacao: cliente.situacao || 'Ativo',
      observacoes: cliente.observacoes || '',
      foto: cliente.foto || '',
    })

    setAbaAtiva('formulario')
    setMensagem('')

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // EXCLUIR CLIENTE
  function handleExcluir(id: number) {
    if (
      !window.confirm(
        'Tem certeza de que deseja excluir este cliente?',
      )
    ) {
      return
    }

    setClientes((lista) =>
      lista.filter((cliente) => cliente.id !== id),
    )

    if (clienteEditando === id) {
      limparFormulario()
    }

    setMensagem('Cliente excluído com sucesso.')
  }

  const clientesFiltrados = clientes.filter((cliente) => {
    const termo = busca.toLowerCase().trim()

    return (
      cliente.nome.toLowerCase().includes(termo) ||
      (cliente.cpf || '').includes(termo) ||
      (cliente.telefone || '').includes(termo) ||
      (cliente.email || '').toLowerCase().includes(termo)
    )
  })

  const clientesRecentes = clientes.slice(-4).reverse()

  const clientesPesquisaLateral = clientes.filter(
    (cliente) =>
      cliente.nome
        .toLowerCase()
        .includes(buscaLateral.toLowerCase().trim()) ||
      (cliente.cpf || '').includes(buscaLateral),
  )

  const estiloInput: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    boxSizing: 'border-box',
  }

  const estiloLabel: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: '#475569',
    marginBottom: '4px',
  }

  const estiloCard: React.CSSProperties = {
    background: 'white',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
  }

  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
        fontFamily: 'Segoe UI, sans-serif',
      }}
    >
      {/* CABEÇALHO */}
      <div
        style={{
          backgroundColor: '#581c87',
          borderRadius: '12px',
          padding: '16px 24px',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '18px', margin: 0 }}>
            Cadastro de Clientes
          </h1>

          <span style={{ fontSize: '12px', opacity: 0.8 }}>
            {clienteEditando !== null
              ? 'Editando Cliente'
              : 'Gestão da Base de Clientes'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() =>
              setAbaAtiva(
                abaAtiva === 'formulario'
                  ? 'listagem'
                  : 'formulario',
              )
            }
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            {abaAtiva === 'formulario'
              ? `Listagem de Clientes (${clientes.length})`
              : 'Novo Cadastro'}
          </button>

          {abaAtiva === 'formulario' && (
            <button
              type="submit"
              form="form-cliente-principal"
              style={{
                backgroundColor: 'white',
                color: '#581c87',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              {clienteEditando !== null
                ? 'Salvar Alterações'
                : 'Salvar Cadastro'}
            </button>
          )}
        </div>
      </div>

      {/* LISTAGEM DE CLIENTES */}
      {abaAtiva === 'listagem' ? (
        <div style={estiloCard}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '20px',
            }}
          >
            <h2 style={{ fontSize: '16px', color: '#1e293b' }}>
              Clientes Cadastrados
            </h2>

            <input
              type="text"
              placeholder="Buscar por nome, CPF, telefone ou e-mail..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{ ...estiloInput, maxWidth: '350px' }}
            />
          </div>

          {clientesFiltrados.length === 0 ? (
            <p
              style={{
                textAlign: 'center',
                color: '#94a3b8',
                padding: '40px 0',
              }}
            >
              Nenhum cliente encontrado.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '13px',
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: '2px solid #f1f5f9',
                      textAlign: 'left',
                      color: '#475569',
                    }}
                  >
                    <th style={{ padding: '12px' }}>Foto</th>
                    <th style={{ padding: '12px' }}>Nome</th>
                    <th style={{ padding: '12px' }}>CPF</th>
                    <th style={{ padding: '12px' }}>Telefone</th>
                    <th style={{ padding: '12px' }}>E-mail</th>
                    <th style={{ padding: '12px' }}>Cidade/UF</th>
                    <th style={{ padding: '12px' }}>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {clientesFiltrados.map((cliente) => (
                    <tr
                      key={cliente.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    >
                      <td style={{ padding: '8px 12px' }}>
                        {cliente.foto ? (
                          <img
                            src={cliente.foto}
                            alt={`Foto de ${cliente.nome}`}
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <span>👤</span>
                        )}
                      </td>

                      <td style={{ padding: '12px', fontWeight: 600 }}>
                        {cliente.nome}
                      </td>

                      <td style={{ padding: '12px' }}>
                        {cliente.cpf || 'Não informado'}
                      </td>

                      <td style={{ padding: '12px' }}>
                        {cliente.telefone || 'Não informado'}
                      </td>

                      <td style={{ padding: '12px' }}>
                        {cliente.email || 'Não informado'}
                      </td>

                      <td style={{ padding: '12px' }}>
                        {cliente.cidade
                          ? `${cliente.cidade}/${cliente.estado || ''}`
                          : 'Não informado'}
                      </td>

                      <td style={{ padding: '12px' }}>
                        <button
                          type="button"
                          onClick={() => handleEditar(cliente)}
                          style={{
                            background: '#f3e8ff',
                            color: '#6d28d9',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            marginRight: '6px',
                          }}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExcluir(cliente.id)}
                          style={{
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* FORMULÁRIO DE CADASTRO */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 300px',
            gap: '20px',
            alignItems: 'start',
          }}
        >
          <form
            id="form-cliente-principal"
            onSubmit={handleCadastrar}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* DADOS PESSOAIS E ENDEREÇO */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
              }}
            >
              {/* DADOS PESSOAIS */}
              <div style={estiloCard}>
                <h3
                  style={{
                    fontSize: '14px',
                    color: '#1e293b',
                    marginTop: 0,
                    borderBottom: '1px solid #f1f5f9',
                    paddingBottom: '8px',
                  }}
                >
                  Dados Pessoais
                </h3>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    marginBottom: '16px',
                    flexWrap: 'wrap',
                  }}
                >
                  {formulario.foto ? (
                    <img
                      src={formulario.foto}
                      alt="Foto do cliente"
                      style={{
                        width: '76px',
                        height: '76px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid #d8b4fe',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '76px',
                        height: '76px',
                        borderRadius: '50%',
                        background: '#f3e8ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '28px',
                      }}
                    >
                      👤
                    </div>
                  )}

                  <div>
                    <label style={estiloLabel}>Foto do Cliente</label>

                    <label
                      htmlFor="foto-cliente"
                      style={{
                        display: 'inline-block',
                        background: '#6d28d9',
                        color: 'white',
                        padding: '7px 11px',
                        borderRadius: '7px',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      {formulario.foto
                        ? 'Trocar foto'
                        : 'Selecionar foto'}
                    </label>

                    <input
                      id="foto-cliente"
                      type="file"
                      accept="image/*"
                      onChange={handleSelecionarFoto}
                      style={{ display: 'none' }}
                    />

                    {formulario.foto && (
                      <button
                        type="button"
                        onClick={removerFoto}
                        style={{
                          display: 'block',
                          border: 'none',
                          background: 'transparent',
                          color: '#dc2626',
                          padding: '6px 0',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        Remover foto
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={estiloLabel}>Nome Completo *</label>
                  <input
                    type="text"
                    placeholder="Digite o nome completo"
                    value={formulario.nome}
                    onChange={(e) =>
                      alterarCampo('nome', e.target.value)
                    }
                    required
                    style={estiloInput}
                  />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    marginBottom: '12px',
                  }}
                >
                  <div>
                    <label style={estiloLabel}>CPF</label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      maxLength={14}
                      value={formulario.cpf}
                      onChange={(e) =>
                        alterarCampo(
                          'cpf',
                          aplicarMascaraCPF(e.target.value),
                        )
                      }
                      style={estiloInput}
                    />
                  </div>

                  <div>
                    <label style={estiloLabel}>
                      Data de Nascimento
                    </label>
                    <input
                      type="date"
                      value={formulario.dataNascimento}
                      onChange={(e) =>
                        alterarCampo('dataNascimento', e.target.value)
                      }
                      style={estiloInput}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                  }}
                >
                  <div>
                    <label style={estiloLabel}>
                      Telefone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      placeholder="(85) 99999-9999"
                      value={formulario.telefone}
                      onChange={(e) =>
                        alterarCampo(
                          'telefone',
                          aplicarMascaraTelefone(e.target.value),
                        )
                      }
                      style={estiloInput}
                    />
                  </div>

                  <div>
                    <label style={estiloLabel}>E-mail</label>
                    <input
                      type="email"
                      placeholder="cliente@email.com"
                      value={formulario.email}
                      onChange={(e) =>
                        alterarCampo('email', e.target.value)
                      }
                      style={estiloInput}
                    />
                  </div>
                </div>
              </div>

              {/* ENDEREÇO E CONTATO */}
              <div style={estiloCard}>
                <h3
                  style={{
                    fontSize: '14px',
                    color: '#1e293b',
                    marginTop: 0,
                    borderBottom: '1px solid #f1f5f9',
                    paddingBottom: '8px',
                  }}
                >
                  Endereço e Contato
                </h3>

                <div style={{ marginBottom: '12px' }}>
                  <label style={estiloLabel}>CEP</label>

                  <input
                    type="text"
                    placeholder="00000-000"
                    maxLength={9}
                    value={formulario.cep}
                    onChange={(e) =>
                      alterarCampo(
                        'cep',
                        aplicarMascaraCEP(e.target.value),
                      )
                    }
                    onBlur={consultarCEP}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        consultarCEP()
                      }
                    }}
                    style={estiloInput}
                  />

                  <small
                    style={{
                      display: 'block',
                      marginTop: '5px',
                      color: '#64748b',
                      fontSize: '11px',
                    }}
                  >
                    {consultandoCep
                      ? 'Buscando endereço...'
                      : 'Digite os 8 números do CEP e saia do campo para preencher o endereço automaticamente.'}
                  </small>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={estiloLabel}>
                    Endereço (Rua / Av)
                  </label>
                  <input
                    type="text"
                    placeholder="Nome da rua ou avenida"
                    value={formulario.endereco}
                    onChange={(e) =>
                      alterarCampo('endereco', e.target.value)
                    }
                    style={estiloInput}
                  />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    marginBottom: '12px',
                  }}
                >
                  <div>
                    <label style={estiloLabel}>Número</label>
                    <input
                      type="text"
                      placeholder="Nº"
                      value={formulario.numero}
                      onChange={(e) =>
                        alterarCampo('numero', e.target.value)
                      }
                      style={estiloInput}
                    />
                  </div>

                  <div>
                    <label style={estiloLabel}>Bairro</label>
                    <input
                      type="text"
                      placeholder="Bairro"
                      value={formulario.bairro}
                      onChange={(e) =>
                        alterarCampo('bairro', e.target.value)
                      }
                      style={estiloInput}
                    />
                  </div>
                </div>

                {/* NOVO CAMPO: COMPLEMENTO */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={estiloLabel}>Complemento</label>
                  <input
                    type="text"
                    placeholder="Ex: Bloco B, Apartamento 302, Casa 2..."
                    value={formulario.complemento}
                    onChange={(e) =>
                      alterarCampo('complemento', e.target.value)
                    }
                    style={estiloInput}
                  />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr',
                    gap: '10px',
                  }}
                >
                  <div>
                    <label style={estiloLabel}>Cidade</label>
                    <input
                      type="text"
                      placeholder="Cidade"
                      value={formulario.cidade}
                      onChange={(e) =>
                        alterarCampo('cidade', e.target.value)
                      }
                      style={estiloInput}
                    />
                  </div>

                  <div>
                    <label style={estiloLabel}>Estado</label>
                    <input
                      type="text"
                      placeholder="UF"
                      maxLength={2}
                      value={formulario.estado}
                      onChange={(e) =>
                        alterarCampo(
                          'estado',
                          e.target.value.toUpperCase(),
                        )
                      }
                      style={estiloInput}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* PREFERÊNCIAS E INFORMAÇÕES FINANCEIRAS */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
              }}
            >
              {/* PREFERÊNCIAS */}
              <div style={estiloCard}>
                <h3
                  style={{
                    fontSize: '14px',
                    color: '#1e293b',
                    marginTop: 0,
                    borderBottom: '1px solid #f1f5f9',
                    paddingBottom: '8px',
                  }}
                >
                  Preferências do Cliente
                </h3>

                <div style={{ marginBottom: '12px' }}>
                  <label style={estiloLabel}>Tipo de Pele</label>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['Seca', 'Oleosa', 'Mista', 'Normal'].map(
                      (tipo) => (
                        <button
                          key={tipo}
                          type="button"
                          onClick={() =>
                            alterarCampo('tipoPele', tipo)
                          }
                          style={{
                            flex: 1,
                            padding: '8px 0',
                            borderRadius: '8px',
                            border:
                              formulario.tipoPele === tipo
                                ? '2px solid #7c3aed'
                                : '1px solid #cbd5e1',
                            backgroundColor:
                              formulario.tipoPele === tipo
                                ? '#f3e8ff'
                                : '#fff',
                            color:
                              formulario.tipoPele === tipo
                                ? '#6d28d9'
                                : '#475569',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          {tipo}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={estiloLabel}>
                    Tom de Base Habitual
                  </label>

                  <select
                    value={formulario.tomBase}
                    onChange={(e) =>
                      alterarCampo('tomBase', e.target.value)
                    }
                    style={estiloInput}
                  >
                    <option value="">Selecione o tom...</option>
                    <option value="Claro / Frio">Claro / Frio</option>
                    <option value="Médio / Neutro">
                      Médio / Neutro
                    </option>
                    <option value="Escuro / Quente">
                      Escuro / Quente
                    </option>
                  </select>
                </div>

                <div>
                  <label style={estiloLabel}>
                    Alergias / Observações Cosméticas
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Alergia a parabenos..."
                    value={formulario.observacoes}
                    onChange={(e) =>
                      alterarCampo('observacoes', e.target.value)
                    }
                    style={estiloInput}
                  />
                </div>
              </div>

              {/* INFORMAÇÕES FINANCEIRAS */}
              <div style={estiloCard}>
                <h3
                  style={{
                    fontSize: '14px',
                    color: '#1e293b',
                    marginTop: 0,
                    borderBottom: '1px solid #f1f5f9',
                    paddingBottom: '8px',
                  }}
                >
                  Informações Financeiras
                </h3>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    marginBottom: '16px',
                  }}
                >
                  <div>
                    <label style={estiloLabel}>
                      Limite Crediário
                    </label>
                    <input
                      type="text"
                      placeholder="R$ 0,00"
                      value={formulario.limiteCrediario}
                      onChange={(e) =>
                        alterarCampo(
                          'limiteCrediario',
                          e.target.value,
                        )
                      }
                      style={estiloInput}
                    />
                  </div>

                  <div>
                    <label style={estiloLabel}>Situação</label>
                    <select
                      value={formulario.situacao}
                      onChange={(e) =>
                        alterarCampo('situacao', e.target.value)
                      }
                      style={estiloInput}
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                      <option value="Bloqueado">
                        Bloqueado (Fiado)
                      </option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      backgroundColor: '#6d28d9',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    {clienteEditando !== null
                      ? 'Salvar Alterações'
                      : 'Cadastrar Cliente'}
                  </button>

                  {clienteEditando !== null && (
                    <button
                      type="button"
                      onClick={limparFormulario}
                      style={{
                        backgroundColor: '#f1f5f9',
                        color: '#64748b',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px',
                        cursor: 'pointer',
                      }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                {mensagem && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      backgroundColor: '#f0fdf4',
                      color: '#16a34a',
                      border: '1px solid #86efac',
                    }}
                  >
                    {mensagem}
                  </div>
                )}
              </div>
            </div>
          </form>

          {/* COLUNA LATERAL */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* PESQUISA RÁPIDA */}
            <div style={estiloCard}>
              <h3
                style={{
                  fontSize: '14px',
                  color: '#1e293b',
                  marginTop: 0,
                }}
              >
                Lista Rápida (Pesquisa)
              </h3>

              <input
                type="text"
                placeholder="Pesquisar cliente (Nome/CPF)..."
                value={buscaLateral}
                onChange={(e) => setBuscaLateral(e.target.value)}
                style={{ ...estiloInput, marginBottom: '12px' }}
              />

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              >
                {clientesPesquisaLateral.length === 0 ? (
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#94a3b8',
                      textAlign: 'center',
                      padding: '10px 0',
                    }}
                  >
                    Nenhum cliente.
                  </span>
                ) : (
                  clientesPesquisaLateral.map((cliente) => (
                    <button
                      key={cliente.id}
                      type="button"
                      onClick={() => handleEditar(cliente)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <strong
                        style={{
                          fontSize: '12px',
                          color: '#1e293b',
                          display: 'block',
                        }}
                      >
                        {cliente.nome}
                      </strong>

                      <span
                        style={{
                          fontSize: '10px',
                          color: '#64748b',
                        }}
                      >
                        CPF: {cliente.cpf || 'Não informado'}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* CLIENTES RECENTES */}
            <div style={estiloCard}>
              <h3
                style={{
                  fontSize: '14px',
                  color: '#1e293b',
                  marginTop: 0,
                }}
              >
                Nossos Clientes Recentes
              </h3>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {clientesRecentes.length === 0 ? (
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#94a3b8',
                      textAlign: 'center',
                      padding: '10px 0',
                    }}
                  >
                    Sem cadastros recentes.
                  </span>
                ) : (
                  clientesRecentes.map((cliente) => (
                    <button
                      key={cliente.id}
                      type="button"
                      onClick={() => handleEditar(cliente)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        backgroundColor: '#fdf4ff',
                        border: '1px solid #f5d0fe',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <strong
                        style={{
                          fontSize: '12px',
                          color: '#6b21a8',
                          display: 'block',
                        }}
                      >
                        {cliente.nome}
                      </strong>

                      <span
                        style={{
                          fontSize: '10px',
                          color: '#7e22ce',
                        }}
                      >
                        Cadastrado recentemente
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RODAPÉ */}
      <div
        style={{
          marginTop: '24px',
          backgroundColor: '#581c87',
          borderRadius: '8px',
          padding: '10px 16px',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '12px',
        }}
      >
        <span>
          Status do Cadastro:{' '}
          {clienteEditando !== null
            ? `Editando Cliente ID #${clienteEditando}`
            : 'Novo Cliente'}
        </span>

        <span>
          Última Atualização:{' '}
          {new Date().toLocaleDateString('pt-BR')}{' '}
          {new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  )
}