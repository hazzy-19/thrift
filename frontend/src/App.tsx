import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/navbar/navbar.tsx'
import AccountPage from './pages/AccountPage.tsx'
import CartPage from './pages/CartPage.tsx'
import CategoryPage from './pages/CategoryPage.tsx'
import HomePage from './pages/HomePage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import WishlistPage from './pages/WishlistPage.tsx'
import { useAuth } from './context/auth-context.ts'

function AppContent() {
  const cartCount = 0
  const { user } = useAuth()

  return (
    <>
      <Navbar cartCount={cartCount} user={user} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<><HomePage /><LoginPage /></>} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/men" element={<CategoryPage title="Men" />} />
        <Route path="/women" element={<CategoryPage title="Women" />} />
        <Route path="/kids" element={<CategoryPage title="Kids" />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
