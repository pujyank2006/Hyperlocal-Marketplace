import { Navigate, Route, Routes } from 'react-router-dom';

// Pages
import Login from './pages/loginPage';
import Home from './pages/homePage';
import Signup from './pages/signupPage';
import Dashboard from './pages/dashboard';
import Profile from './pages/profile';
import Images from './pages/images';
import ProtectedRoute from './Components/protectedRoute.js';

function App() {
  const isLoggedIn = localStorage.getItem('isLoggedIn');

  return (
    <div className='App'>
      <Routes>
        {/* unauthorized routes */}
        {!isLoggedIn && (
          <>
            <Route path='/' element={ <Home /> } />
            <Route path='/login' element={ <Login /> } />
            <Route path='/signup' element={ <Signup /> } />
          </>
        )}

        {/* Protected routes */}
        <Route element={ <ProtectedRoute /> }>
          <Route path='/login' element={ <Navigate to="/dashboard" />} />
          <Route path='/signup' element={ <Navigate to="/dashboard" /> } />
          <Route path="/dashboard" element={ <Dashboard /> } />
          <Route path="/profile" element={ <Profile /> } />
        </Route>
        <Route path='/images' element = { <Images /> } />
      </Routes>
    </div>
  )
}

export default App
