// Telefone: (17) 99999-9999
export const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
}

// CPF: 123.456.789-09
export const maskCPF = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`
}

// CEP: 17280-000
export const maskCEP = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0,5)}-${d.slice(5)}`
}

// Somente letras e espaços
export const maskName = (v: string) => v.replace(/[^a-zA-ZÀ-ÿ\s]/g, '').slice(0, 60)

// Validações
export const isValidPhone = (v: string) => v.replace(/\D/g, '').length >= 10
export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
export const isValidCPF = (v: string) => v.replace(/\D/g, '').length === 11
export const isValidCEP = (v: string) => v.replace(/\D/g, '').length === 8
export const isValidName = (v: string) => v.trim().length >= 3
