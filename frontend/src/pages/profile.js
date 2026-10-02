import { Link } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { ToastContainer } from 'react-toastify';

import styles from "../styles/profile.module.css";

import Navbar from '../Components/Navbar';
import CreateListing from '../Components/createListing';
import EditListing from '../Components/editListing';
import { handleError, handleSuccess } from '../utils';

function Profile() {
  const [isAccountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userListings, setUserListings] = useState([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);

  // Edit Modal State
  const [editingListing, setEditingListing] = useState(null);

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
      const response = await fetch("http://localhost:9000/api/v1/users/me", {
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

  const fetchUserListings = useCallback(async () => {
    try {
      setIsLoadingListings(true);
      const res = await fetch("http://localhost:9000/api/v1/listings/get-listing", {
        method: "GET",
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        setUserListings(data.listing || []);
      }
    } catch (err) {
      console.error("Error fetching listings:", err);
    } finally {
      setIsLoadingListings(false);
    }
  }, []);

  const handleListingCreated = (newListing) => {
    setUserListings(prev => [newListing, ...prev]);
  };

  const handleListingUpdated = (updatedListing) => {
    setUserListings(prev =>
      prev.map(item => (item._id === updatedListing._id ? updatedListing : item))
    );
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:9000/api/v1/listings/${listingId}`, {
        method: "DELETE",
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        handleSuccess("Listing deleted successfully!");
        setUserListings(prev => prev.filter(item => item._id !== listingId));
      } else {
        handleError(data.message || "Failed to delete listing");
      }
    } catch (err) {
      console.error("Error deleting listing:", err);
      handleError("Network error while deleting listing");
    }
  };

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn) return;

    try {
      fetch("http://localhost:9000/api/v1/users/me", {
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

      fetchUserListings();
    } catch (error) {
      console.log(error);
    }
  }, [fetchUserListings]);

  if (!user) return <p style={{ padding: "40px", textAlign: "center" }}>Loading user profile...</p>;

  return (
    <>
      {/* UNIFIED MODERN HEADER */}
      <Navbar />

      {/* BODY */}
      <div className={styles.information}>
        <div className={styles.detailsPage}>

          {/* PERSONAL DETAILS */}
          <div className={styles.personalDetails}>
            {isEditingPersonal ? (
              <form onSubmit={handlePersonalSubmit}>
                <div className={styles.editDetails}>
                  <h2>Edit Personal Info</h2>

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
                <button className={styles.editButton} onClick={() => setIsEditingPersonal(true)}>Edit</button>
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
                    <h2>Pincode: {user.pincode}</h2>
                    <p>{user.address}</p>
                    <button className={styles.editButton} onClick={() => setIsEditingAddress(true)}>Edit</button>
                  </>
                ) : (
                  <>
                    <p>No address found.</p>
                    <button className={styles.otherButton} onClick={() => setIsEditingAddress(true)}>Add Address</button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* LISTINGS SECTION */}
        <div className={styles.listings}>
          <div className={styles.listingsHeader}>
            <h2>My Active Listings ({userListings.length})</h2>
            <CreateListing onListingCreated={handleListingCreated} />
          </div>

          {isLoadingListings ? (
            <p>Loading your listings...</p>
          ) : userListings.length === 0 ? (
            <div className={styles.emptyState}>
              <p>🛍️ You haven't posted any listings yet.</p>
              <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginTop: "6px" }}>
                Click <strong>+ Post New Listing</strong> above to start selling to your local community!
              </p>
            </div>
          ) : (
            <div className={styles.listingsGrid}>
              {userListings.map(item => (
                <div key={item._id} className={styles.listingCard}>
                  <img
                    src={
                      item.images && item.images.length > 0
                        ? `http://localhost:9000${item.images[0]}`
                        : "https://via.placeholder.com/220x140?text=No+Image"
                    }
                    alt={item.title}
                    className={styles.cardImg}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/220x140?text=No+Image";
                    }}
                  />
                  <div className={styles.cardBody}>
                    <span className={styles.cardCategory}>{item.category}</span>
                    <div className={styles.cardTitle}>{item.title}</div>
                    <div className={styles.cardPrice}>₹{item.price}</div>
                    <div className={styles.cardLoc}>📍 {item.area || item.city || "Local"}</div>

                    <div className={styles.cardActions}>
                      <button
                        className={styles.editCardBtn}
                        onClick={() => setEditingListing(item)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className={styles.deleteCardBtn}
                        onClick={() => handleDeleteListing(item._id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Listing Modal */}
      <EditListing
        listing={editingListing}
        isOpen={Boolean(editingListing)}
        onClose={() => setEditingListing(null)}
        onListingUpdated={handleListingUpdated}
      />

      <ToastContainer />
    </>
  );
}

export default Profile;