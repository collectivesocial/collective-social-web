import { useState, useEffect } from 'react'
import { LoginButton } from './components/LoginButton'
import { Header } from './components/Header'
import './App.css'

interface UserProfile {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  description?: string;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const apiUrl = 'http://127.0.0.1:3000'

  useEffect(() => {
    // Check if user is authenticated
    fetch(`${apiUrl}/users/me`, {
      credentials: 'include',
    })
      .then((res) => {
        if (res.ok) {
          return res.json()
        }
        throw new Error('Not authenticated')
      })
      .then((data) => {
        setUser(data)
        setIsAuthenticated(true)
      })
      .catch(() => {
        setUser(null)
        setIsAuthenticated(false)
      })
  }, [])

  return (
    <>
      <Header user={user} isAuthenticated={!!isAuthenticated} apiUrl={apiUrl} />
      <main style={{
        marginTop: isAuthenticated ? '80px' : '20px',
        minHeight: 'calc(100vh - 80px)',
        transition: 'margin-top 0.3s ease',
      }}>
        <div className="card">
          {isAuthenticated === null ? (
            <div>Loading...</div>
          ) : isAuthenticated ? (
            <div>
              <h2>Welcome back, {user?.displayName || user?.handle}!</h2>
              <p>You're logged in.</p>
            </div>
          ) : (
            <>
              <h2>Welcome to Collective Social</h2>
              <p>Please log in to continue</p>
              <LoginButton apiUrl={apiUrl} />
            </>
          )}
        </div>
      </main>
    </>
  )
}

export default App
