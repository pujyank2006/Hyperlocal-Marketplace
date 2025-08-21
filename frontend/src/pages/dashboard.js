import { Link } from 'react-router-dom';
import logo from "./assets/favicon.png";
import title2 from "./assets/Title2.png";

import styles from "../styles/dashboard.module.css";


function Dashboard() {
  return (
    <>
      <div className={styles.mainHeader}>
        <Link to="/">
          <img alt='pic' src={logo} width='40px' height='40px' />
          &nbsp;
          <img alt='pic' src={title2} className={styles.title} />
        </Link>
        <button className={styles.button}>Profile</button>
      </div>
    </>
  )
}

export default Dashboard