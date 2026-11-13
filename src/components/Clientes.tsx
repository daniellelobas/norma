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
  if (numeros.length !== 11 || /^(\d)\1{10}$/.test(numeros)) return false

  for (let tamanho = 9; tamanho <= 10; tamanho++) {
    let soma = 0
    for (let i = 0; i < tamanho; i++) {
      soma += Number(numeros[i]) * (tamanho + 1 - i)
    }
    const resto = (soma * 10) % 11
    const digito = resto === 10 ? 0 : resto
    if (digito !== Number(numeros[tamanho])) return false
  }
  return true
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>(() => lerClientes())
  const [formulario, setFormulario] = useState<FormularioCliente>(formularioInicial)
  const [busca, setBusca] = useState('')
  const [buscaLateral, setBuscaLateral] = useState('')
  const [clienteEditando, setClienteEditando] = useState<number | null>(null)
  const [mensagem, setMensagem] = useState('')
  const [abaAtiva, setAbaAtiva] = useState<'formulario' | 'listagem'>('formulario')

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

  function limparFormulario() {
    setFormulario(formularioInicial)
    setClienteEditando(null)
    setMensagem('')
  }

  function handleCadastrar(event: React.FormEvent<HTMLFormElement>) {
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
        clientes.find((cliente) => cliente.id === clienteEditando)?.dataCadastro ??
        new Date().toISOString().slice(0, 10),
    }

    if (clienteEditando !== null) {
      setClientes((lista) =>
        lista.map((cliente) =>
          cliente.id === clienteEditando ? { ...cliente, ...dadosCliente } : cliente,
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
    })
    setAbaAtiva('formulario')
    setMensagem('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleExcluir(id: number) {
    if (!window.confirm('Tem certeza de que deseja excluir este cliente?')) return

    setClientes((lista) => lista.filter((cliente) => cliente.id !== id))
    if (clienteEditando === id) limparFormulario()
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
  const clientesPesquisaLateral = clientes.filter((c) =>
    c.nome.toLowerCase().includes(buscaLateral.toLowerCase().trim()) ||
    (c.cpf || '').includes(buscaLateral)
  )

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* CABEÇALHO SUPERIOR DA TELA */}
      <div style={{
        backgroundColor: '#581c87',
        borderRadius: '12px',
        padding: '16px 24px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
            Cadastro de Clientes | {clienteEditando !== null ? 'Editar Cliente' : 'Novo Cliente'}
          </h1>
          <span style={{ fontSize: '12px', opacity: 0.8 }}>Gestão da Base de Clientes</span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setAbaAtiva(abaAtiva === 'formulario' ? 'listagem' : 'formulario')}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {abaAtiva === 'formulario' ? `Listagem de Clientes (${clientes.length})` : 'Novo Cadastro'}
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
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {clienteEditando !== null ? 'Salvar Alterações' : 'Salvar Cadastro (F12)'}
            </button>
          )}
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL: ABAS */}
      {abaAtiva === 'listagem' ? (
        /* ABA DE LISTAGEM DE CLIENTES */
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Clientes Cadastrados</h2>
            <input
              type="text"
              placeholder="Buscar por nome, CPF, telefone ou e-mail..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{ width: '320px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            />
          </div>

          {clientesFiltrados.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>Nenhum cliente encontrado.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '12px' }}>Nome</th>
                    <th style={{ padding: '12px' }}>CPF</th>
                    <th style={{ padding: '12px' }}>Telefone</th>
                    <th style={{ padding: '12px' }}>E-mail</th>
                    <th style={{ padding: '12px' }}>Cidade/UF</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.map((cli) => (
                    <tr key={cli.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '12px', fontWeight: 600, color: '#1e293b' }}>{cli.nome}</td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{cli.cpf || 'Não informado'}</td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{cli.telefone || 'Não informado'}</td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{cli.email || 'Não informado'}</td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{cli.cidade ? `${cli.cidade}/${cli.estado || ''}` : 'Não informado'}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleEditar(cli)}
                          style={{ background: '#f3e8ff', color: '#6d28d9', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginRight: '6px' }}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExcluir(cli.id)}
                          style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
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
        /* ABA DE FORMULÁRIO (LAYOUT DE CARDS + PAINEL LATERAL) */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>
          
          {/* COLUNA ESQUERDA: FORMULÁRIO EM 4 BLOCOS */}
          <form id="form-cliente-principal" onSubmit={handleCadastrar} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* LINHA DE BLOCOS SUPERIORES: DADOS PESSOAIS & ENDEREÇO */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              {/* 1. Dados Pessoais */}
              <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  Dados Pessoais
                </h3>

                {/* Avatar / Foto fictícia */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#f3e8ff', border: '2px dashed #d8b4fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#7c3aed' }}>
                    ⬆️
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block' }}>Foto do Cliente</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Clique para enviar imagem</span>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Nome Completo *</label>
                  <input
                    type="text"
                    placeholder="Digite o nome completo"
                    value={formulario.nome}
                    onChange={(e) => alterarCampo('nome', e.target.value)}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>CPF</label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      maxLength={14}
                      value={formulario.cpf}
                      onChange={(e) => alterarCampo('cpf', aplicarMascaraCPF(e.target.value))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Data de Nascimento</label>
                    <input
                      type="date"
                      value={formulario.dataNascimento}
                      onChange={(e) => alterarCampo('dataNascimento', e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Telefone / WhatsApp</label>
                    <input
                      type="tel"
                      placeholder="(85) 99999-9999"
                      value={formulario.telefone}
                      onChange={(e) => alterarCampo('telefone', aplicarMascaraTelefone(e.target.value))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>E-mail</label>
                    <input
                      type="email"
                      placeholder="cliente@email.com"
                      value={formulario.email}
                      onChange={(e) => alterarCampo('email', e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Endereço e Contato */}
              <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  Endereço e Contato
                </h3>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>CEP</label>
                  <input
                    type="text"
                    placeholder="00000-000"
                    maxLength={9}
                    value={formulario.cep}
                    onChange={(e) => alterarCampo('cep', aplicarMascaraCEP(e.target.value))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Endereço (Rua / Av)</label>
                  <input
                    type="text"
                    placeholder="Nome da rua ou avenida"
                    value={formulario.endereco}
                    onChange={(e) => alterarCampo('endereco', e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Número</label>
                    <input
                      type="text"
                      placeholder="Nº"
                      value={formulario.numero}
                      onChange={(e) => alterarCampo('numero', e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Bairro</label>
                    <input
                      type="text"
                      placeholder="Bairro"
                      value={formulario.bairro}
                      onChange={(e) => alterarCampo('bairro', e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Cidade</label>
                    <input
                      type="text"
                      placeholder="Cidade"
                      value={formulario.cidade}
                      onChange={(e) => alterarCampo('cidade', e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Estado</label>
                    <input
                      type="text"
                      placeholder="UF"
                      maxLength={2}
                      value={formulario.estado}
                      onChange={(e) => alterarCampo('estado', e.target.value.toUpperCase())}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', textAlign: 'center' }}
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* LINHA DE BLOCOS INFERIORES: PREFERÊNCIAS & FINANCEIRO */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              {/* 3. Preferências do Cliente */}
              <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  Preferências do Cliente
                </h3>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Tipo de Pele</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['Seca', 'Oleosa', 'Mista', 'Normal'].map((tipo) => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => alterarCampo('tipoPele', tipo)}
                        style={{
                          flex: 1,
                          padding: '8px 0',
                          borderRadius: '8px',
                          border: formulario.tipoPele === tipo ? '2px solid #7c3aed' : '1px solid #cbd5e1',
                          backgroundColor: formulario.tipoPele === tipo ? '#f3e8ff' : '#fff',
                          color: formulario.tipoPele === tipo ? '#6d28d9' : '#475569',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {tipo}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Tom de Base Habitual</label>
                  <select
                    value={formulario.tomBase}
                    onChange={(e) => alterarCampo('tomBase', e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff' }}
                  >
                    <option value="">Selecione o tom...</option>
                    <option value="Claro / Frio">Claro / Frio</option>
                    <option value="Médio / Neutro">Médio / Neutro</option>
                    <option value="Escuro / Quente">Escuro / Quente</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Alergias / Observações Cosméticas</label>
                  <input
                    type="text"
                    placeholder="Ex: Alergia a parabenos..."
                    value={formulario.observacoes}
                    onChange={(e) => alterarCampo('observacoes', e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* 4. Informações Financeiras */}
              <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  Informações Financeiras
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Limite Crediário</label>
                    <input
                      type="text"
                      placeholder="R$ 0,00"
                      value={formulario.limiteCrediario}
                      onChange={(e) => alterarCampo('limiteCrediario', e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Situação</label>
                    <select
                      value={formulario.situacao}
                      onChange={(e) => alterarCampo('situacao', e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff' }}
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                      <option value="Bloqueado">Bloqueado (Fiado)</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
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
                    {clienteEditando !== null ? 'Salvar Alterações' : 'Cadastrar Cliente'}
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
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                {mensagem && (
                  <div style={{ marginTop: '12px', padding: '8px', borderRadius: '6px', fontSize: '12px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac' }}>
                    {mensagem}
                  </div>
                )}
              </div>

            </div>

          </form>

          {/* COLUNA DIREITA: LISTA RÁPIDA DE CLIENTES & RECENTES */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Lista Rápida / Pesquisa */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '10px' }}>
                Lista Rápida (Pesquisa)
              </h3>
              <input
                type="text"
                placeholder="Pesquisar cliente (Nome/CPF)..."
                value={buscaLateral}
                onChange={(e) => setBuscaLateral(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', marginBottom: '12px' }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {clientesPesquisaLateral.length === 0 ? (
                  <span style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '10px 0' }}>Nenhum cliente.</span>
                ) : (
                  clientesPesquisaLateral.map((cli) => (
                    <div
                      key={cli.id}
                      onClick={() => handleEditar(cli)}
                      style={{ padding: '8px 10px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <span style={{ fontSize: '16px' }}>👤</span>
                      <div style={{ overflow: 'hidden' }}>
                        <strong style={{ fontSize: '12px', color: '#1e293b', display: 'block', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{cli.nome}</strong>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>CPF: {cli.cpf || 'Não inf.'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Nossos Clientes Recentes */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '10px' }}>
                Nossos Clientes Recentes
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {clientesRecentes.length === 0 ? (
                  <span style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '10px 0' }}>Sem cadastros recentes.</span>
                ) : (
                  clientesRecentes.map((cli) => (
                    <div
                      key={cli.id}
                      onClick={() => handleEditar(cli)}
                      style={{ padding: '8px 10px', borderRadius: '8px', backgroundColor: '#fdf4ff', border: '1px solid #f5d0fe', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <span style={{ fontSize: '16px' }}>💜</span>
                      <div style={{ overflow: 'hidden' }}>
                        <strong style={{ fontSize: '12px', color: '#6b21a8', display: 'block', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{cli.nome}</strong>
                        <span style={{ fontSize: '10px', color: '#7e22ce' }}>Cadastrado recentemente</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* RODAPÉ DO CADASTRO */}
      <div style={{ marginTop: '24px', backgroundColor: '#581c87', borderRadius: '8px', padding: '10px 16px', color: 'white', display: 'flex', justifyContent: 'space-between', fontSize: '12px', opacity: 0.9 }}>
        <span>Status do Cadastro: {clienteEditando !== null ? 'Editando Cliente ID #' + clienteEditando : 'Novo Cliente'}</span>
        <span>Última Atualização: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

    </div>
  )
}