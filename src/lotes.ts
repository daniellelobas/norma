
import type { LoteEstoque } from './types/estoque'

const CHAVE_LOTES = 'norma-lotes'

export function lerLotesSalvos(): LoteEstoque[] {
  const dados = localStorage.getItem(CHAVE_LOTES)

  if (!dados) {
    return []
  }

  try {
    return JSON.parse(dados) as LoteEstoque[]
  } catch {
    return []
  }
}

export function salvarLotes(lotes: LoteEstoque[]): void {
  localStorage.setItem(CHAVE_LOTES, JSON.stringify(lotes))

  window.dispatchEvent(new Event('norma-dados-atualizados'))
}
