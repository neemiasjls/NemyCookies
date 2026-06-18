import { Navigate } from 'react-router-dom'
import { ReactNode } from 'react'

function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem('admin_token')
  if (!token || !isTokenValid(token)) {
    localStorage.removeItem('admin_token')
    return <Navigate to="/admin" replace />
  }
  return <>{children}</>
}
