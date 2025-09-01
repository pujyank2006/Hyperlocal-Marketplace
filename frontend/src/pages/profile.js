import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';

import logo from "./assets/favicon.png";
import title2 from "./assets/Title2.png";
import account from "./assets/accountCircle.svg";
import styles from "../styles/profile.module.css";
import AccountDetails from './Components/accountDetails';
import { handleError, handleSuccess } from '../utils';

function Profile() {
  const [isAccountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showInput, setShowInput] = useState(false);
  const [address, setAddress] = useState("");

  const handleAddressChange = (e) => {
    setAddress(e.target.value);
  };

  async function handleAddress(req, res) {
    if(address.trim() === ""){
      handleError("empty address cannot be updated!");
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const url = "http://localhost:9000/api/addDetails";
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          "Content-type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ address })
      })
      const result = await response.json();
      const { message, success, error } = result;
      if (success) {
        handleSuccess(message);
      } else if (error) {
        const details = error.details[0].message;
        handleError(details);
      } else if (!success) {
        handleError(message);
      }
    } catch (error) {
      console.log(error);
    }
  };

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
            <p>Image will be set <button>edit</button></p>
            <h1>{user.name}</h1>
            <p>{user.email}</p>
            <p>{user.phone}</p>
          </div>
          <div className={styles.locationDetails}>
            {!showInput ? (
              <p>Add address <button onClick={() => setShowInput(true)}>Add</button></p>
            ) : (
              <>
                <label>Add your full address: </label>
                <input type='text' placeholder='Full address' name="address" onChange={handleAddressChange} />
                <button onClick={handleAddress}>Confirm</button>
              </>
            )}
            <h2>{user.area}, {user.city}</h2>
            <h2>{user.pincode}</h2>
          </div>
        </div>
        <div className={styles.listings}>
          Currently empty
        </div>
      </div>
      <ToastContainer />
    </>
  )
}

export default Profile