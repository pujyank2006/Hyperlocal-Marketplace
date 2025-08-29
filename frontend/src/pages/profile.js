import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

import logo from "./assets/favicon.png";
import title2 from "./assets/Title2.png";
import account from "./assets/accountCircle.svg";
import styles from "../styles/profile.module.css";
import AccountDetails from './Components/accountDetails';

function Profile() {
  const [isAccountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      return;
    }
    const url = "http://localhost:9000/api/loggedInUser";
    fetch(url, {
      method: 'GET',
      headers: {
        "Content-type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch(err => console.error("Error fetching user: ", err));
  }, []);

  if (!user) {
    return <p>Loading...</p>
  }

  return (
    <>
      <div className={styles.mainHeader}>
        <Link to="/">
          <img alt='pic' src={logo} width='40px' height='40px' />
          &nbsp;
          <img alt='pic' src={title2} className={styles.title} />
        </Link>
        <button className={styles.button} onClick={() => setAccountOpen(!isAccountOpen)}><img alt='pic' src={account} width='40px' height='40px' /></button>
        <AccountDetails open={isAccountOpen} onClose={() => setAccountOpen(false)}></AccountDetails>
      </div>

      <div className={styles.information}>
        <div className={styles.detailsPage}>
          <div className={styles.personalDetails}>
            Image will be set
            <h1>{user.name}</h1>
            <p>{user.email}</p>
            <p>{user.phone}</p>
          </div>
          <div className={styles.locationDetails}>
            <label>Add your full address: </label>
            <input type='text' placeholder='Full address' />
            <h2>{user.area}, {user.city}</h2>
            <h2>{user.pincode}</h2>
          </div>
        </div>
        <div className={styles.listings}>
          Currently empty
        </div>
      </div>
    </>
  )
}

export default Profile
