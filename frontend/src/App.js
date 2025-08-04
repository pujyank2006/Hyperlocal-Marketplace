import { Route, Routes } from 'react-router-dom';


// Pages
import Login from './pages/loginPage';
import Home from './pages/homePage';

function App() {
  return (
    <div className='App'>
        <Routes>
            <Route path = '/' element = { <Home /> } />
            <Route path = '/login' element = { <Login /> } />
        </Routes>
    </div>
  )
}

export default App
