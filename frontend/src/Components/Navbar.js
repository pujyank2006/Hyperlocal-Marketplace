import { Link } from 'react-router-dom';
import { useState } from 'react';
import styles from '../ComponentStyles/navbar.module.css';
import AccountOptions from './accountOptions';

function Navbar() {
  const [isAccountOpen, setAccountOpen] = useState(false);

  return (
    <header className={styles.navbar}>
      <Link to="/" className={styles.brandLink}>
        <div className={styles.logoBadge}>🛍️</div>
        <span className={styles.brandTitle}>
          Hyperlocal <span className={styles.brandAccent}>Marketplace</span>
          <span className={styles.taglineBadge}>LOCAL</span>
        </span>
      </Link>

      <div className={styles.rightGroup}>
        <button
          className={styles.accountBtn}
          onClick={() => setAccountOpen(!isAccountOpen)}
        >
          <div className={styles.avatarIcon}>👤</div>
          <span>Account</span>
        </button>

        <AccountOptions open={isAccountOpen} onClose={() => setAccountOpen(false)} />
      </div>
    </header>
  );
}

export default Navbar;
