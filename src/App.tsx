import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'
import { CollectionsPage } from './pages/CollectionsPage'
import { CollectionDetailsPage } from './pages/CollectionDetailsPage'
import { ItemDetailsPage } from './pages/ItemDetailsPage'
import { AdminPage } from './pages/AdminPage'
import { FeedbackPage } from './pages/FeedbackPage'
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
    <BrowserRouter>
      <Header user={user} isAuthenticated={!!isAuthenticated} apiUrl={apiUrl} />
      <main style={{
        marginTop: isAuthenticated ? '80px' : '20px',
        minHeight: 'calc(100vh - 80px)',
        transition: 'margin-top 0.3s ease',
      }}>
        {isAuthenticated === null ? (
          <div className="card">Loading...</div>
        ) : (
          <Routes>
            <Route 
              path="/" 
              element={
                <HomePage 
                  isAuthenticated={!!isAuthenticated} 
                  user={user} 
                  apiUrl={apiUrl} 
                />
              } 
            />
            <Route 
              path="/profile" 
              element={<ProfilePage apiUrl={apiUrl} />} 
            />
            <Route 
              path="/collections" 
              element={<CollectionsPage apiUrl={apiUrl} />} 
            />
            <Route 
              path="/collections/:collectionUri" 
              element={<CollectionDetailsPage apiUrl={apiUrl} />} 
            />
            <Route 
              path="/items/:itemId" 
              element={<ItemDetailsPage apiUrl={apiUrl} />} 
            />
            <Route 
              path="/admin" 
              element={<AdminPage apiUrl={apiUrl} />} 
            />
            <Route 
              path="/feedback" 
              element={<FeedbackPage />} 
            />
          </Routes>
        )}
      </main>
      <Footer />
    </BrowserRouter>
  )
}

export default App
