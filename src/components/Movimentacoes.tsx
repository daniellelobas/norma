
import { useEffect, useState } from 'react'
import type { MovimentacaoEstoque } from '../types/estoque'

const CHAVE_MOVIMENTACOES = 'norma-movimentacoes'

type FiltroData =
  | 'Todas'
  | 'Hoje'
  | '7dias'
  | 'Mes'
  | 'Personalizado'

function lerMovimentacoes(): MovimentacaoEstoque[] {
  const dados = localStorage.getItem(CHAVE_MOVIMENTACOES)

  if (!dados) return []

  try {
    return JSON.parse(dados) as MovimentacaoEstoque[]
  } catch {
    return []
  }
}

function obterDataLocal(data: Date): string {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')

  return `${ano}-${mes}-${dia}`
}

function formatarData(data: string): string {
  if (!data) return '-'

  return new Date(data).toLocaleString('pt-BR')
}

function Movimentacoes() {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([])
  const [filtroTipo, setFiltroTipo] = useState('Todas')
  const [busca, setBusca] = useState('')

  const [filtroData, setFiltroData] = useState<FiltroData>('Todas')
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')

  useEffect(() => {
    function atualizarMovimentacoes() {
      setMovimentacoes(lerMovimentacoes())
    }

    atualizarMovimentacoes()

    window.addEventListener('storage', atualizarMovimentacoes)
    window.addEventListener('norma-dados-atualizados', atualizarMovimentacoes)

    return () => {
      window.removeEventListener('storage', atualizarMovimentacoes)
      window.removeEventListener('norma-dados-atualizados', atualizarMovimentacoes)
    }
  }, [])

  const hoje = obterDataLocal(new Date())

  const seteDiasAtras = new Date()
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 6)

  const inicioSeteDias = obterDataLocal(seteDiasAtras)

  const inicioMes = obterDataLocal(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  )

  const movimentacoesFiltradas = movimentacoes
    .filter((movimentacao) => {
      const correspondeTipo =
        filtroTipo === 'Todas' || movimentacao.tipo === filtroTipo

      const termo = busca.toLowerCase()

      const correspondeBusca =
        (movimentacao.produtoNome || '').toLowerCase().includes(termo) ||
        (movimentacao.lote || '').toLowerCase().includes(termo) ||
        (movimentacao.pessoaNome || '').toLowerCase().includes(termo) ||
        (movimentacao.origem || '').toLowerCase().includes(termo)

      const dataMovimentacao = obterDataLocal(
        new Date(movimentacao.data)
      )

      let correspondeData = true

      if (filtroData === 'Hoje') {
        correspondeData = dataMovimentacao === hoje
      }

      if (filtroData === '7dias') {
        correspondeData =
          dataMovimentacao >= inicioSeteDias &&
          dataMovimentacao <= hoje
      }

      if (filtroData === 'Mes') {
        correspondeData =
          dataMovimentacao >= inicioMes &&
          dataMovimentacao <= hoje
      }

      if (filtroData === 'Personalizado') {
        if (dataInicial) {
          correspondeData = correspondeData &&
            dataMovimentacao >= dataInicial
        }

        if (dataFinal) {
          correspondeData = correspondeData &&
            dataMovimentacao <= dataFinal
        }
      }

      return correspondeTipo && correspondeBusca && correspondeData
    })
    .sort(
      (a, b) =>
        new Date(b.data).getTime() - new Date(a.data).getTime()
    )

  const totalEntradas = movimentacoesFiltradas
    .filter((item) => item.tipo === 'Entrada')
    .reduce((total, item) => total + item.quantidade, 0)

  const totalSaidas = movimentacoesFiltradas
    .filter((item) => item.tipo === 'Saída')
    .reduce((total, item) => total + item.quantidade, 0)

  return (
    <div className="pagina-movimentacoes">
      <h1>Histórico de Movimentações</h1>

      <p>
        Acompanhe todas as entradas e saídas dos produtos do estoque.
      </p>

      <div className="resumo-movimentacoes">
        <div className="card-movimentacao">
          <span>Entradas no período</span>
          <strong>{totalEntradas}</strong>
        </div>

        <div className="card-movimentacao">
          <span>Saídas no período</span>
          <strong>{totalSaidas}</strong>
        </div>

        <div className="card-movimentacao">
          <span>Movimentações no período</span>
          <strong>{movimentacoesFiltradas.length}</strong>
        </div>
      </div>

      <div className="filtros-movimentacoes">
        <input
          type="text"
          placeholder="Buscar produto, lote ou pessoa..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
        >
          <option value="Todas">Todas as movimentações</option>
          <option value="Entrada">Somente entradas</option>
          <option value="Saída">Somente saídas</option>
        </select>

        <select
          value={filtroData}
          onChange={(e) => setFiltroData(e.target.value as FiltroData)}
        >
          <option value="Todas">Todas as datas</option>
          <option value="Hoje">Hoje</option>
          <option value="7dias">Últimos 7 dias</option>
          <option value="Mes">Este mês</option>
          <option value="Personalizado">Personalizado</option>
        </select>
      </div>

      {filtroData === 'Personalizado' && (
        <div className="movimentacoes-periodo">
          <label>
            Data inicial
            <input
              type="date"
              value={dataInicial}
              onChange={(e) => setDataInicial(e.target.value)}
            />
          </label>

          <label>
            Data final
            <input
              type="date"
              value={dataFinal}
              min={dataInicial || undefined}
              onChange={(e) => setDataFinal(e.target.value)}
            />
          </label>
        </div>
      )}

      <div className="tabela-movimentacoes">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Tipo</th>
              <th>Produto</th>
              <th>Quantidade</th>
              <th>Lote</th>
              <th>Origem</th>
              <th>Fornecedor / Cliente</th>
            </tr>
          </thead>

          <tbody>
            {movimentacoesFiltradas.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  Nenhuma movimentação encontrada.
                </td>
              </tr>
            ) : (
              movimentacoesFiltradas.map((movimentacao) => (
                <tr key={movimentacao.id}>
                  <td>{formatarData(movimentacao.data)}</td>

                  <td>
                    <span
                      className={
                        movimentacao.tipo === 'Entrada'
                          ? 'movimentacao-entrada'
                          : 'movimentacao-saida'
                      }
                    >
                      {movimentacao.tipo}
                    </span>
                  </td>

                  <td>{movimentacao.produtoNome}</td>
                  <td>{movimentacao.quantidade}</td>
                  <td>{movimentacao.lote || '-'}</td>
                  <td>{movimentacao.origem}</td>
                  <td>{movimentacao.pessoaNome || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Movimentacoes
