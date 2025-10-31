import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout.tsx';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { CatalogPage } from './pages/CatalogPage.tsx';
import { BookDetailPage } from './pages/BookDetailPage.tsx';
import { CartPage } from './pages/CartPage.tsx';
import { CheckoutPage } from './pages/CheckoutPage.tsx';
import { WishlistPage } from './pages/WishlistPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { LendingPage } from './pages/LendingPage.tsx';
import { OrdersPage } from './pages/OrdersPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { AdminDashboardPage } from './pages/AdminDashboardPage.tsx';
import { AdminBooksPage } from './pages/AdminBooksPage.tsx';
import { AdminLendingPage } from './pages/AdminLendingPage.tsx';
import { AdminOrdersPage } from './pages/AdminOrdersPage.tsx';
import { AdminUsersPage } from './pages/AdminUsersPage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';

const App = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route index element={<HomePage />} />
      <Route path="catalog" element={<CatalogPage />} />
      <Route path="books/:id" element={<BookDetailPage />} />
      <Route path="cart" element={<CartPage />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="wishlist" element={<WishlistPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="lending" element={<LendingPage />} />
        <Route path="orders" element={<OrdersPage />} />
      </Route>

      <Route element={<ProtectedRoute requireAdmin />}> 
        <Route path="admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="admin/books" element={<AdminBooksPage />} />
        <Route path="admin/lending" element={<AdminLendingPage />} />
        <Route path="admin/orders" element={<AdminOrdersPage />} />
        <Route path="admin/users" element={<AdminUsersPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>
);

export default App;
