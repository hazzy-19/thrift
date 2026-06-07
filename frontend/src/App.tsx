import { useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/navbar/navbar.tsx'
import AccountPage from './pages/AccountPage.tsx'
import CartPage from './pages/CartPage.tsx'
import CategoryPage from './pages/CategoryPage.tsx'
import HomePage from './pages/HomePage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import WishlistPage from './pages/WishlistPage.tsx'
import { useAuth } from './context/auth-context.ts'
import { useCart } from './context/cart-context.ts'

function AppContent() {
  const { user } = useAuth()
  const { itemCount } = useCart()
  const location = useLocation()
  const [pageSearchQueries, setPageSearchQueries] = useState<Record<string, string>>({})
  const searchQuery = pageSearchQueries[location.pathname] ?? ''
  const setSearchQuery = (query: string) => {
    setPageSearchQueries((current) => ({ ...current, [location.pathname]: query }))
  }

  return (
    <>
      <Navbar
        cartCount={itemCount}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
        user={user}
      />
      <Routes>
        <Route path="/" element={<HomePage searchQuery={searchQuery} />} />
        <Route path="/login" element={<><HomePage searchQuery={searchQuery} /><LoginPage /></>} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/men" element={<CategoryPage category="men" searchQuery={searchQuery} title="Men" />} />
        <Route path="/women" element={<CategoryPage category="women" searchQuery={searchQuery} title="Women" />} />
        <Route path="/kids" element={<CategoryPage category="kid" searchQuery={searchQuery} title="Kids" />} />
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
