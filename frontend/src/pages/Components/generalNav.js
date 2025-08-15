import { Link } from 'react-router-dom';
import styles from '../ComponentStyles/generalNav.module.css';

function GeneralNav() {
  return (
    <div className={styles.mainNav}>
        <ul className={styles.lists}>
            <li className={styles.eachList}>
                <Link to="/">Home</Link>
            </li>
            <li className={styles.eachList}>
                <Link to="/about">About</Link>
            </li>
        </ul>
    </div>
  )
}

export default GeneralNav
