import { Link, useNavigate } from 'react-router-dom';

import Footer from './footer';
import styles from '../ComponentStyles/authLayout.module.css';

function SignupLayout({ children }) {
    const navigate = useNavigate();

    function handleLoginClick() {
        navigate('/login');
    }

    return (
        <div className={styles.main}>
            <div className={styles.mainHeader}>
                <Link to="/" className={styles.brandLink}>
                    <div className={styles.logoBadge}>🛍️</div>
                    <span className={styles.brandTitle}>
                        Hyperlocal <span className={styles.brandAccent}>Marketplace</span>
                    </span>
                </Link>
                <button onClick={handleLoginClick} className={styles.button}>Login</button>
            </div>
            <div className={styles.container}>
                <div className={styles.left}></div>
                <div className={styles.right}>
                    <div>{children}</div>
                </div>
            </div>
            <div className={styles.footer}><Footer /></div>
        </div>
    );
}

export default SignupLayout;
