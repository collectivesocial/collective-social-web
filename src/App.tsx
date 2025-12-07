import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Box } from '@chakra-ui/react'
import { Provider } from './components/ui/provider'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'
import { CollectionsPage } from './pages/CollectionsPage'
import { CollectionDetailsPage } from './pages/CollectionDetailsPage'
import { GroupsPage } from './pages/GroupsPage'
import { ItemDetailsPage } from './pages/ItemDetailsPage'
import { SearchResultsPage } from './pages/SearchResultsPage'
import { TagSearchPage } from './pages/TagSearchPage'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'
import { AdminUserFeedbackPage } from './pages/admin/AdminUserFeedbackPage'
import { AdminMediaItemsPage } from './pages/admin/AdminMediaItemsPage'
import { AdminShareLinksPage } from './pages/admin/AdminShareLinksPage'
import { AdminTagsPage } from './pages/admin/AdminTagsPage'
import { AdminTagReportsPage } from './pages/admin/AdminTagReportsPage'
import { FeedbackPage } from './pages/FeedbackPage'
import { SettingsPage } from './pages/SettingsPage'
import { ShareRedirectPage } from './pages/ShareRedirectPage'
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
        
        // Check for pending share link after login
        const pendingShareLink = sessionStorage.getItem('pendingShareLink')
        if (pendingShareLink) {
          sessionStorage.removeItem('pendingShareLink')
          // Redirect to the share link page
          window.location.href = `/share/${pendingShareLink}`
        }
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
                path="/groups" 
                element={<GroupsPage apiUrl={apiUrl} />} 
              />
              <Route 
                path="/search" 
                element={<SearchResultsPage apiUrl={apiUrl} />} 
              />
              <Route 
                path="/tags/:tagSlug" 
                element={<TagSearchPage apiUrl={apiUrl} />} 
              />
              <Route 
                path="/items/:itemId" 
                element={<ItemDetailsPage apiUrl={apiUrl} />} 
              />
              <Route 
                path="/admin" 
                element={<AdminUsersPage apiUrl={apiUrl} />} 
              />
              <Route 
                path="/admin/users" 
                element={<AdminUsersPage apiUrl={apiUrl} />} 
              />
              <Route 
                path="/admin/user-feedback" 
                element={<AdminUserFeedbackPage apiUrl={apiUrl} />} 
              />
              <Route 
                path="/admin/media-items" 
                element={<AdminMediaItemsPage apiUrl={apiUrl} />} 
              />
              <Route 
                path="/admin/share-links" 
                element={<AdminShareLinksPage apiUrl={apiUrl} />} 
              />
              <Route 
                path="/admin/tags" 
                element={<AdminTagsPage apiUrl={apiUrl} />} 
              />
              <Route 
                path="/admin/tags" 
                element={<AdminTagsPage apiUrl={apiUrl} />} 
              />
              <Route 
                path="/admin/tag-reports" 
                element={<AdminTagReportsPage apiUrl={apiUrl} />} 
              />
              <Route 
                path="/feedback" 
                element={<FeedbackPage />} 
              />
              <Route 
                path="/settings" 
                element={<SettingsPage apiUrl={apiUrl} user={user} />} 
              />
              <Route 
                path="/share/:shortCode" 
                element={<ShareRedirectPage apiUrl={apiUrl} />} 
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
