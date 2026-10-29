
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
  validade: string
  lote: string
  fornecedor: string
}

const produtoVazio = {
  codigo: '',
  nome: '',
  marca: '',
  categoria: '',
  precoCusto: '',
  precoVenda: '',
  quantidade: '',
  estoqueMinimo: '',
  validade: '',
  lote: '',
  fornecedor: '',
}

type FormularioProduto = typeof produtoVazio

function Produtos() {
  const [produtos, setProdutos] = useState<Produto[]>(() => {
    const produtosSalvos = localStorage.getItem('norma-produtos')

    if (produtosSalvos) {
      try {
        return JSON.parse(produtosSalvos) as Produto[]
      } catch {
        return []
      }
    }

    return []
  })

  const [formulario, setFormulario] =
    useState<FormularioProduto>(produtoVazio)

  const [busca, setBusca] = useState('')
  const [produtoEditando, setProdutoEditando] = useState<number | null>(null)

  useEffect(() => {
    localStorage.setItem('norma-produtos', JSON.stringify(produtos))
  }, [produtos])

  function handleCampoChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target

    setFormulario((formularioAtual) => ({
      ...formularioAtual,
      [name]: value,
    }))
  }

  function limparFormulario() {
    setFormulario({ ...produtoVazio })
    setProdutoEditando(null)
  }

  function handleSalvar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const codigo = formulario.codigo.trim()
    const nome = formulario.nome.trim()

    const codigoDuplicado = produtos.some(
      (produto) =>
        produto.codigo.toLowerCase() === codigo.toLowerCase() &&
        produto.id !== produtoEditando,
    )

    if (codigoDuplicado) {
      window.alert('Já existe um produto cadastrado com esse código.')
      return
    }

    const precoCusto = Number(formulario.precoCusto)
    const precoVenda = Number(formulario.precoVenda)
    const quantidade = Number(formulario.quantidade)
    const estoqueMinimo = Number(formulario.estoqueMinimo)

    if (
      precoCusto < 0 ||
      precoVenda < 0 ||
      quantidade < 0 ||
      estoqueMinimo < 0 ||
      formulario.precoCusto === '' ||
      formulario.precoVenda === '' ||
      formulario.quantidade === '' ||
      formulario.estoqueMinimo === '' ||
      !Number.isFinite(precoCusto) ||
      !Number.isFinite(precoVenda) ||
      !Number.isFinite(quantidade) ||
      !Number.isFinite(estoqueMinimo)
    ) {
      window.alert('Confira os preços e as quantidades informadas.')
      return
    }

    if (
      !Number.isInteger(quantidade) ||
      !Number.isInteger(estoqueMinimo)
    ) {
      window.alert('As quantidades devem ser números inteiros.')
      return
    }

    const dadosProduto = {
      codigo,
      nome,
      marca: formulario.marca.trim(),
      categoria: formulario.categoria.trim(),
      precoCusto,
      precoVenda,
      quantidade,
      estoqueMinimo,
      validade: formulario.validade,
      lote: formulario.lote.trim(),
      fornecedor: formulario.fornecedor.trim(),
    }

    if (produtoEditando !== null) {
      setProdutos((listaAtual) =>
        listaAtual.map((produto) =>
          produto.id === produtoEditando
            ? { ...produto, ...dadosProduto }
            : produto,
        ),
      )
    } else {
      const novoProduto: Produto = {
        id: Date.now(),
        ...dadosProduto,
      }

      setProdutos((listaAtual) => [...listaAtual, novoProduto])
    }

    limparFormulario()
  }

  function handleEditar(produto: Produto) {
    setProdutoEditando(produto.id)

    setFormulario({
      codigo: produto.codigo,
      nome: produto.nome,
      marca: produto.marca,
      categoria: produto.categoria,
      precoCusto: String(produto.precoCusto),
      precoVenda: String(produto.precoVenda),
      quantidade: String(produto.quantidade),
      estoqueMinimo: String(produto.estoqueMinimo),
      validade: produto.validade,
      lote: produto.lote,
      fornecedor: produto.fornecedor,
    })

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleExcluir(id: number) {
    const confirmou = window.confirm(
      'Tem certeza de que deseja excluir este produto?',
    )

    if (!confirmou) {
      return
    }

    setProdutos((listaAtual) =>
      listaAtual.filter((produto) => produto.id !== id),
    )

    if (produtoEditando === id) {
      limparFormulario()
    }
  }

  const produtosFiltrados = produtos.filter((produto) => {
    const termo = busca.trim().toLowerCase()

    return (
      produto.nome.toLowerCase().includes(termo) ||
      produto.codigo.toLowerCase().includes(termo) ||
      produto.marca.toLowerCase().includes(termo) ||
      produto.categoria.toLowerCase().includes(termo) ||
      produto.fornecedor.toLowerCase().includes(termo)
    )
  })

  function formatarMoeda(valor: number) {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  return (
    <section className="produtos-page">
      <div className="produtos-header">
        <h2>Cadastro de produtos</h2>
        <p>Cadastre e organize os produtos da Norma Cosméticos.</p>
      </div>

      <form className="produto-form" onSubmit={handleSalvar}>
        <h3>
          {produtoEditando !== null
            ? 'Editar produto'
            : 'Cadastrar novo produto'}
        </h3>

        <div className="campos-produto">
          <div className="campo-produto">
            <label htmlFor="codigo">Código do produto *</label>
            <input
              id="codigo"
              name="codigo"
              value={formulario.codigo}
              onChange={handleCampoChange}
              placeholder="Ex.: NOR001"
              required
            />
          </div>

          <div className="campo-produto">
            <label htmlFor="nome-produto">Nome do produto *</label>
            <input
              id="nome-produto"
              name="nome"
              value={formulario.nome}
              onChange={handleCampoChange}
              placeholder="Ex.: Perfume feminino"
              required
            />
          </div>

          <div className="campo-produto">
            <label htmlFor="marca">Marca *</label>
            <input
              id="marca"
              name="marca"
              value={formulario.marca}
              onChange={handleCampoChange}
              placeholder="Ex.: Natura"
              required
            />
          </div>

          <div className="campo-produto">
            <label htmlFor="categoria">Categoria *</label>
            <input
              id="categoria"
              name="categoria"
              value={formulario.categoria}
              onChange={handleCampoChange}
              placeholder="Ex.: Perfumes"
              required
            />
          </div>

          <div className="campo-produto">
            <label htmlFor="precoCusto">Preço de custo (R$) *</label>
            <input
              id="precoCusto"
              name="precoCusto"
              type="number"
              min="0"
              step="0.01"
              value={formulario.precoCusto}
              onChange={handleCampoChange}
              placeholder="0,00"
              required
            />
          </div>

          <div className="campo-produto">
            <label htmlFor="precoVenda">Preço de venda (R$) *</label>
            <input
              id="precoVenda"
              name="precoVenda"
              type="number"
              min="0"
              step="0.01"
              value={formulario.precoVenda}
              onChange={handleCampoChange}
              placeholder="0,00"
              required
            />
          </div>

          <div className="campo-produto">
            <label htmlFor="quantidade">Quantidade em estoque *</label>
            <input
              id="quantidade"
              name="quantidade"
              type="number"
              min="0"
              step="1"
              value={formulario.quantidade}
              onChange={handleCampoChange}
              placeholder="Ex.: 20"
              required
            />
          </div>

          <div className="campo-produto">
            <label htmlFor="estoqueMinimo">Estoque mínimo *</label>
            <input
              id="estoqueMinimo"
              name="estoqueMinimo"
              type="number"
              min="0"
              step="1"
              value={formulario.estoqueMinimo}
              onChange={handleCampoChange}
              placeholder="Ex.: 5"
              required
            />
          </div>

          <div className="campo-produto">
            <label htmlFor="validade">Data de validade</label>
            <input
              id="validade"
              name="validade"
              type="date"
              value={formulario.validade}
              onChange={handleCampoChange}
            />
          </div>

          <div className="campo-produto">
            <label htmlFor="lote">Lote</label>
            <input
              id="lote"
              name="lote"
              value={formulario.lote}
              onChange={handleCampoChange}
              placeholder="Ex.: LOTE2026"
            />
          </div>

          <div className="campo-produto">
            <label htmlFor="fornecedor">Fornecedor</label>
            <input
              id="fornecedor"
              name="fornecedor"
              value={formulario.fornecedor}
              onChange={handleCampoChange}
              placeholder="Nome do fornecedor"
            />
          </div>
        </div>

        <div className="acoes-formulario">
          <button className="botao-cadastrar" type="submit">
            {produtoEditando !== null
              ? 'Salvar alterações'
              : 'Cadastrar produto'}
          </button>

          {produtoEditando !== null && (
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

      <div className="lista-produtos">
        <h2>Produtos cadastrados ({produtos.length})</h2>

        <div className="produtos-search">
          <input
            type="search"
            placeholder="Buscar por código, nome, marca ou fornecedor..."
            aria-label="Buscar produtos"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
          />
        </div>

        {produtosFiltrados.length === 0 ? (
          <div className="produtos-empty">
            <h3>
              {produtos.length === 0
                ? 'Nenhum produto cadastrado'
                : 'Nenhum produto encontrado'}
            </h3>
            <p>
              {produtos.length === 0
                ? 'Preencha o formulário acima para cadastrar o primeiro produto.'
                : 'Tente pesquisar por outro código, nome, marca ou fornecedor.'}
            </p>
          </div>
        ) : (
          <div className="tabela-produtos">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Produto</th>
                  <th>Marca</th>
                  <th>Categoria</th>
                  <th>Custo</th>
                  <th>Venda</th>
                  <th>Estoque</th>
                  <th>Validade</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {produtosFiltrados.map((produto) => (
                  <tr key={produto.id}>
                    <td>{produto.codigo}</td>
                    <td>{produto.nome}</td>
                    <td>{produto.marca}</td>
                    <td>{produto.categoria}</td>
                    <td>{formatarMoeda(produto.precoCusto)}</td>
                    <td>{formatarMoeda(produto.precoVenda)}</td>
                    <td>
                      <span
                        className={
                          produto.quantidade <= produto.estoqueMinimo
                            ? 'estoque-baixo'
                            : ''
                        }
                      >
                        {produto.quantidade}
                      </span>
                    </td>
                    <td>
                      {produto.validade
                        ? new Date(
                            `${produto.validade}T12:00:00`,
                          ).toLocaleDateString('pt-BR')
                        : 'Não informada'}
                    </td>
                    <td>
                      <div className="acoes-cliente">
                        <button
                          className="botao-editar"
                          type="button"
                          onClick={() => handleEditar(produto)}
                        >
                          Editar
                        </button>

                        <button
                          className="botao-excluir"
                          type="button"
                          onClick={() => handleExcluir(produto.id)}
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

export default Produtos
