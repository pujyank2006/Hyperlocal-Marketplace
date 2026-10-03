import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Login from './pages/loginPage';
import Home from './pages/homePage';
import Signup from './pages/signupPage';
import Dashboard from './pages/dashboard';
import Profile from './pages/profile';
import ProtectedRoute from './Components/protectedRoute.js';

function App() {
  const { isLoggedIn, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#0f172a', color: '#fff' }}>
        <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>🛍️ Loading Hyperlocal Marketplace...</p>
      </div>
    );
  }

  return (
    <div className='App'>
      <Routes>
        {/* Public / Auth routes */}
        <Route path='/' element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Home />} />
        <Route path='/login' element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path='/signup' element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Signup />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to={isLoggedIn ? "/dashboard" : "/"} replace />} />
      </Routes>
    </div>
  );
}

export default App;
