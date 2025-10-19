import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';

import logo from "./assets/favicon.png";
import title2 from "./assets/Title2.png";
import account from "./assets/accountCircle.svg";
import styles from "../styles/profile.module.css";

import AccountOptions from '../Components/accountOptions';
import { handleError, handleSuccess } from '../utils';

function Profile() {
  const [isAccountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState(null);

  const [personalDetails, setPersonalDetails] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [addressDetails, setAddressDetails] = useState({
    area: "",
    pincode: "",
    address: "",
  });

  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  function handleChange(e, type) {
    const { name, value } = e.target;
    if (type === "personal") {
      setPersonalDetails(prev => ({ ...prev, [name]: value }));
    } else {
      setAddressDetails(prev => ({ ...prev, [name]: value }));
    }
  }

  function validateInputs(obj) {
    return Object.values(obj).every(field => field.trim() !== "");
  }

  async function updateUser(data) {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn) return handleError("No token found");

    try {
      const response = await fetch("http://localhost:9000/api/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = await response.json();
      const { success } = result;

      if (success) {
        setUser(prev => ({ ...prev, ...data }));
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.error(err);
      handleError("Network error");
    }
  }

  async function handlePersonalSubmit(e) {
    e.preventDefault();
    if (!validateInputs(personalDetails)) {
      return handleError("Please fill all personal details");
    }
    const success = await updateUser(personalDetails);
    if (success) {
      handleSuccess("Details updated successfully");
      setIsEditingPersonal(false);
    } else {
      handleError("Server error!!");
    }
  }

  async function handleAddressSubmit(e) {
    e.preventDefault();
    if (!validateInputs(addressDetails)) {
      return handleError("Please fill all address details");
    }
    const success = await updateUser(addressDetails);
    if (success) {
      handleSuccess("Details updated successfully");
      setIsEditingAddress(false);
    } else {
      handleError("Server Error");
    }
  }

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn) return;

    try {
      fetch("http://localhost:9000/api/loggedInUser", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })
        .then(res => res.json())
        .then(data => {
          setUser(data.user);
          setPersonalDetails({
            name: data.user?.name || "",
            email: data.user?.email || "",
            phone: data.user?.phone || "",
          });
          setAddressDetails({
            area: data.user?.area || "",
            pincode: data.user?.pincode || "",
            address: data.user?.address || "",
          });
        })
        .catch(err => console.error("Error fetching user:", err));
    } catch (error) {
      console.log(error);
    }
  }, []);

  if (!user) return <p>Loading...</p>;

  return (
    <>
      {/* HEADER */}
      <div className={styles.mainHeader}>
        <Link to="/">
          <img alt="logo" src={logo} width="40" height="40" />
          &nbsp;
          <img alt="title" src={title2} className={styles.title} />
        </Link>
        <button
          className={styles.Accountbutton}
          onClick={() => setAccountOpen(!isAccountOpen)}
        >
          <img alt="account" src={account} width="40" height="40" />
        </button>
        <AccountOptions open={isAccountOpen} onClose={() => setAccountOpen(false)} />
      </div>

      {/* BODY */}
      <div className={styles.information}>
        <div className={styles.detailsPage}>

          {/* PERSONAL DETAILS */}
          <div className={styles.personalDetails}>
            {isEditingPersonal ? (
              <form onSubmit={handlePersonalSubmit}>
                <div className={styles.editDetails}>
                  <h2>Edit your details</h2>

                  <input
                    className={styles.inputSpaces}
                    type="text"
                    name="name"
                    placeholder="Name"
                    value={personalDetails.name}
                    onChange={(e) => handleChange(e, "personal")}
                  />
                  <input
                    className={styles.inputSpaces}
                    type="text"
                    name="email"
                    placeholder="Email"
                    value={personalDetails.email}
                    onChange={(e) => handleChange(e, "personal")}
                  />
                  <input
                    className={styles.inputSpaces}
                    type="text"
                    name="phone"
                    placeholder="Phone"
                    value={personalDetails.phone}
                    onChange={(e) => handleChange(e, "personal")}
                  />

                  <div className={styles.buttonBox} >
                    <button type="submit" className={styles.otherButton} >Save</button>
                    <button type="button" className={styles.otherButton} onClick={() => setIsEditingPersonal(false)}>Cancel</button>
                  </div>
                </div>
              </form>
            ) : (
              <>
                <div>
                  <button className={styles.editButton} onClick={() => setIsEditingPersonal(true)}>Edit</button>
                </div>
                <h1>{user.name}</h1>
                <p>{user.email}</p>
                <p>{user.phone}</p>
              </>
            )}
          </div>

          {/* ADDRESS DETAILS */}
          <div className={styles.locationDetails}>
            {isEditingAddress ? (
              <form onSubmit={handleAddressSubmit}>
                <div className={styles.editDetails}>
                  <h2>{user.address ? "Edit Address" : "Add Address"}</h2>

                  <input
                    className={styles.inputSpaces}
                    type="text"
                    name="area"
                    placeholder="Area"
                    value={addressDetails.area}
                    onChange={(e) => handleChange(e, "address")}
                  />
                  <input
                    className={styles.inputSpaces}
                    type="text"
                    name="pincode"
                    placeholder="Pincode"
                    value={addressDetails.pincode}
                    onChange={(e) => handleChange(e, "address")}
                  />
                  <input
                    className={styles.inputSpaces}
                    type="text"
                    name="address"
                    placeholder="Full Address"
                    value={addressDetails.address}
                    onChange={(e) => handleChange(e, "address")}
                  />

                  <div className={styles.buttonBox}>
                    <button type="submit" className={styles.otherButton} >Save</button>
                    <button type="button" className={styles.otherButton} onClick={() => setIsEditingAddress(false)}>Cancel</button>
                  </div>
                </div>
              </form>
            ) : (
              <>
                {user.address ? (
                  <>
                    <h1>{user.area}</h1>
                    <h2>{user.pincode}</h2>
                    <p>{user.address}</p>
                    <button className={styles.editButton} onClick={() => setIsEditingAddress(true)}>Edit</button>
                  </>
                ) : (
                  <>
                    <p>No address found.</p>
                    <button onClick={() => setIsEditingAddress(true)}>Add Address</button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <div className={styles.listings}>Currently empty</div>
      </div>
      <ToastContainer />
    </>
  );
}

export default Profile;