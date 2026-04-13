import { Route, Routes } from 'react-router-dom'
import AdminLayout from '@/layouts/AdminLayout'
import StoreLayout from '@/layouts/StoreLayout'
import AdminOrdersPage from '@/pages/Admin/AdminOrdersPage'
import AdminPage from '@/pages/Admin/AdminPage'
import AdminProductsPage from '@/pages/Admin/AdminProductsPage'
import CartPage from '@/pages/CartPage'
import CheckoutPage from '@/pages/CheckoutPage'
import AboutPage from '@/pages/AboutPage'
import BlogPage from '@/pages/BlogPage'
import BlogPostPage from '@/pages/BlogPostPage'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import OrderDetailPage from '@/pages/OrderDetailPage'
import OrderSuccessPage from '@/pages/OrderSuccessPage'
import OrdersPage from '@/pages/OrdersPage'
import ProductDetailPage from '@/pages/ProductDetailPage'
import ProductRegisterPage from '@/pages/ProductRegisterPage'
import RegisterPage from '@/pages/RegisterPage'

export default function App() {
  return (
    <Routes>
      <Route element={<StoreLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order/success" element={<OrderSuccessPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Route>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="products/new" element={<ProductRegisterPage />} />
        <Route path="products" element={<AdminProductsPage />} />
      </Route>
    </Routes>
  )
}
