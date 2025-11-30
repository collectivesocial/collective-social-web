import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Box } from '@chakra-ui/react'
import { Provider } from './components/ui/provider'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'
import { PublicProfilePage } from './pages/PublicProfilePage'
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
    <Provider>
      <BrowserRouter>
        <Box minH="100vh" bg="bg">
          <Header user={user} isAuthenticated={!!isAuthenticated} apiUrl={apiUrl} />
          <Box
            as="main"
            mt={isAuthenticated ? '80px' : '20px'}
            minH="calc(100vh - 80px)"
            transition="margin-top 0.3s ease"
          >
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
                path="/profile/:handle" 
                element={<PublicProfilePage apiUrl={apiUrl} />} 
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
          </Box>
          <Footer />
        </Box>
      </BrowserRouter>
    </Provider>
  )
}

export default App
