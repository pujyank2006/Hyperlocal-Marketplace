import { Link, useNavigate } from 'react-router-dom';
import styles from './header.module.css';
import logo from "../assets/favicon.png";
import title from "../assets/title.png";

function Header() {
  const navigate = useNavigate();

  function handleSignupClick () {
    navigate('/signup');
  };

  return (
    <div className={styles.mainHeader}>
      <Link to="/">
        <img alt='pic' src={logo} width='40px' height='40px' />
        &nbsp;
        <img alt='pic' src={title} className = {styles.title} />
      </Link>
      <button onClick={ handleSignupClick } className={styles.button}>Signup</button>
    </div>
  )
}

export default Header