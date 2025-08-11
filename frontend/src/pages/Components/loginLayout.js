import Footer from './footer';
import Header from './header';
import styles from './loginLayout.module.css';

function Layout({ children }) {
    return (
        <>
        <div className={styles.nav}><Header /></div>
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
