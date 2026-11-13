import { useState, useEffect, useCallback } from 'react'

export function useLocalStorage<T>(chave: string, valorInicial: T) {
  const lerValor = useCallback((): T => {
    try {
      const item = window.localStorage.getItem(chave)
      return item ? (JSON.parse(item) as T) : valorInicial
    } catch (error) {
      console.warn(`Erro ao ler a chave "${chave}" do localStorage:`, error)
      return valorInicial
    }
  }, [chave, valorInicial])

  const [valorArmazenado, setValorArmazenado] = useState<T>(lerValor)

  const setValor = (valor: T | ((val: T) => T)) => {
    try {
      const valorParaSalvar =
        valor instanceof Function ? valor(valorArmazenado) : valor
      setValorArmazenado(valorParaSalvar)
      window.localStorage.setItem(chave, JSON.stringify(valorParaSalvar))
      window.dispatchEvent(new Event('norma-dados-atualizados'))
    } catch (error) {
      console.warn(`Erro ao salvar a chave "${chave}" no localStorage:`, error)
    }
  }

  useEffect(() => {
    const atualizarDados = () => {
      setValorArmazenado(lerValor())
    }

    window.addEventListener('storage', atualizarDados)
    window.addEventListener('norma-dados-atualizados', atualizarDados)

    return () => {
      window.removeEventListener('storage', atualizarDados)
      window.removeEventListener('norma-dados-atualizados', atualizarDados)
    }
  }, [lerValor])

  return [valorArmazenado, setValor] as const
}