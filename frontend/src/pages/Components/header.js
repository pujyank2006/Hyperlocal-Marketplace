import { Link } from 'react-router-dom';
import styles from './header.module.css';
import logo from "../assets/favicon.png";
import title from "../assets/Title.png";

function Header() {
  return (
    <div className={styles.mainHeader}>
      <Link to="/">
        <img alt='pic' src={logo} width='40px' height='40px' />
        &nbsp;
        <img alt='pic' src={title} className = {styles.title} />
      </Link>
      <Link to="/signup">Signup</Link>
    </div>
  )
}

export default Header