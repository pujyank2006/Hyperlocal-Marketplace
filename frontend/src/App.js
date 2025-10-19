import { Navigate, Route, Routes } from 'react-router-dom';
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
    localStorage.getItem('isLoggedIn') === 'true'
  );

  // Keep state in sync with localStorage (e.g., in case of manual clearing)
  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (

    <div className='App'>
      <Routes>
        {/* unauthorized routes */}
        {!isLoggedIn && (
          <>
            <Route path='/' element={<Home />} />
            <Route path='/login' element={<Login />} />
            <Route path='/signup' element={<Signup />} />
          </>
        )}

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path='/login' element={<Navigate to="/dashboard" />} />
          <Route path='/signup' element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
