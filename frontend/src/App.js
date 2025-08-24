import { Route, Routes } from 'react-router-dom';


// Pages
import Login from './pages/loginPage';
import Home from './pages/homePage';
import Signup from './pages/signupPage';
import Dashboard from './pages/dashboard';
import Profile from './pages/profile';

function App() {
  return (
    <div className='App'>
        <Routes>
            <Route path = '/' element = { <Home /> } />
            <Route path = '/login' element = { <Login /> } />
            <Route path = '/signup' element = { <Signup /> } />
            <Route path = '/dashboard' element = { <Dashboard /> } />
            <Route path = '/profile' element = { <Profile /> } />
        </Routes>
    </div>
  )
}

export default App
