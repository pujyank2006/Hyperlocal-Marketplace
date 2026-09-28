import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react'; 
// Pages
import Login from './pages/loginPage';
import Home from './pages/homePage';
import Signup from './pages/signupPage';
import Dashboard from './pages/dashboard';
import Profile from './pages/profile';
import ProtectedRoute from './Components/protectedRoute.js';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem('isLoggedIn') === 'true'
  );
  const location = useLocation();

  // Keep state in sync with localStorage on every route change or storage event
  useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, [location]);

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
