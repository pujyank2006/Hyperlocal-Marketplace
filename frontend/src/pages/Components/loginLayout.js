import { Link, useNavigate } from 'react-router-dom';
import logo from "../assets/favicon.png";
import title from "../assets/Title.png";


import Footer from './footer';
import styles from '../ComponentStyles/authLayout.module.css';

function Layout({ children }) {
    const navigate = useNavigate();

    function handleSignupClick() {
        setTimeout(() => {
            navigate('/signup');
        }, 750);
    };

    return (
        <>
            <div className={styles.mainHeader}>
                <Link to="/">
                    <img alt='pic' src={logo} width='40px' height='40px' />
                    &nbsp;
                    <img alt='pic' src={title} className={styles.title} />
                </Link>
                <button onClick={handleSignupClick} className={styles.button}>Signup</button>
            </div>
            <div className={styles.container}>
                <div className={styles.left}></div> {/* Image section */}
                <div className={styles.right}>
                    <div className={styles.main}>{children}</div>
                    <div className={styles.footer}><Footer /></div>
                </div>
            </div>
        </>
    );
}

export default Layout;
