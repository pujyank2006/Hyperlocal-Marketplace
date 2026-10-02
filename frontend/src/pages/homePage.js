import { useNavigate } from 'react-router-dom';

import Footer from '../Components/footer';
import styles from '../styles/homePage.module.css';
import favicon from './assets/favicon.png';

function Home() {
  const navigate = useNavigate();

  function directLogin() {
    navigate('/login');
  }

  function directSignup() {
    navigate('/signup');
  }

  return (
    <>
      <div className={styles.main}>
        <div className={styles.display}>
          <img src={favicon} alt='Hyperlocal Marketplace Logo' />
          <h1 className={styles.titleText}>Hyperlocal Marketplace</h1>
          <p className={styles.subText}>
            Connect with verified neighbors in your pincode to buy, sell, or trade items & services.
          </p>
          
          <div className={styles.buttonClass}>
            <button className={styles.primaryBtn} onClick={directLogin}>Login</button>
            <button className={styles.secondaryBtn} onClick={directSignup}>Signup</button>
          </div>

          <div className={styles.featuresList}>
            <span>📍 Pincode Filter</span>
            <span>•</span>
            <span>⚡ Direct WhatsApp</span>
            <span>•</span>
            <span>🛡️ Verified Locals</span>
          </div>
        </div>
      </div>
      <div className={styles.footer}><Footer /></div>
    </>
  );
}

export default Home;