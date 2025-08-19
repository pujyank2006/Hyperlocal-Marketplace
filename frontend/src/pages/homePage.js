import { useNavigate } from 'react-router-dom';

import Footer from './Components/footer';
import styles from '../styles/homePage.module.css';
import favicon from './assets/favicon.png';

function Home() {
  const navigate = useNavigate();

  function directLogin() {
    setTimeout(() => {
      navigate('/login');
    }, 750);
  };

  function directSignup() {
    setTimeout(() => {
      navigate('/signup');
    }, 750);
  };

  return (
    <>
      <div className={styles.main}>
        <div className={styles.display}>
          <img src={favicon} alt='logo' />
          <p>Welcome to Hyperlocal Marketplace</p>
          <div className={styles.buttonClass}>
            <button className={styles.button} onClick={directLogin}>Login</button>
            <button className={styles.button} onClick={directSignup}>Signup</button>
          </div>
        </div>
      </div>
        <div className={styles.footer}><Footer /></div>
    </>

  )
}

export default Home