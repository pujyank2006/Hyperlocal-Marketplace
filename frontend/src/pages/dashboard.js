import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ToastContainer } from 'react-toastify';

import logo from "./assets/favicon.png";
import title2 from "./assets/Title2.png";
import account from "./assets/accountCircle.svg";
import styles from "../styles/dashboard.module.css";
import AccountOptions from '../Components/accountOptions';


function Dashboard() {
  const [ isAccountOpen, setAccountOpen ] = useState(false);

  return (
    <>
      <div className={styles.mainHeader}>
        <Link to="/">
          <img alt='pic' src={logo} width='40px' height='40px' />
          &nbsp;
          <img alt='pic' src={title2} className={styles.title} />
        </Link>
        <button className={styles.button} onClick={() => setAccountOpen(!isAccountOpen)}><img alt='pic' src={account} width='40px' height='40px' /></button>
        <AccountOptions open = {isAccountOpen} onClose = {() => setAccountOpen(false)}></AccountOptions>
      </div>
      <ToastContainer />
    </>
  )
}

export default Dashboard