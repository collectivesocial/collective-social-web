import { useState, useEffect } from 'react'
import { LoginButton } from './components/LoginButton'
import { AuthenticatedUser } from './components/AuthenticatedUser'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const apiUrl = 'http://127.0.0.1:3000'

  useEffect(() => {
    // Check if user is authenticated
    fetch(`${apiUrl}/users/me`, {
      credentials: 'include',
    })
      .then((res) => {
        setIsAuthenticated(res.ok)
      })
      .catch(() => {
        setIsAuthenticated(false)
      })
  }, [])

  return (
    <>
      <h1>Collective Social</h1>
      <div className="card">
        {isAuthenticated === null ? (
          <div>Loading...</div>
        ) : isAuthenticated ? (
          <AuthenticatedUser apiUrl={apiUrl} />
        ) : (
          <LoginButton apiUrl={apiUrl} />
        )}
      </div>
    </>
  )
}

export default App
