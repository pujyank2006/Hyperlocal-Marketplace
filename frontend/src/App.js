import { Route, Routes } from 'react-router-dom';


// Pages
import Login from './pages/loginPage';
import Home from './pages/homePage';
import Signup from './pages/signupPage';

function App() {
  return (
    <div className='App'>
        <Routes>
            <Route path = '/' element = { <Home /> } />
            <Route path = '/login' element = { <Login /> } />
            <Route path = '/signup' element = { <Signup /> } />
        </Routes>
    </div>
  )
}

export default App
