import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import styles from "../styles/profile.module.css";

import Navbar from '../Components/Navbar';
import CreateListing from '../Components/createListing';
import EditListing from '../Components/editListing';
import { SkeletonGrid } from '../Components/SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import { userService, listingService, wishlistService, savedSearchService } from '../services/api';
import { handleError, handleSuccess } from '../utils';

function Profile() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { updateUserState } = useAuth();
  const [user, setUser] = useState(null);
  const [userListings, setUserListings] = useState([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);

  // Tabs state: 'listings', 'wishlist', 'alerts'
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'listings');
  const [wishlist, setWishlist] = useState([]);
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);

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
    latitude: null,
    longitude: null
  });

  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  function handleChange(e, type) {
    const { name, value } = e.target;
    if (type === "personal") {
      setPersonalDetails(prev => ({ ...prev, [name]: value }));
    } else {
      setAddressDetails(prev => ({ ...prev, [name]: value }));
    }
  }

  function validatePersonal(obj) {
    return Boolean(obj.name?.trim() && obj.email?.trim() && obj.phone?.trim());
  }

  function validateAddress(obj) {
    return Boolean(obj.area?.trim() && obj.pincode?.trim() && obj.address?.trim());
  }

  const handleDetectAddressLocation = () => {
    if (!navigator.geolocation) {
      return handleError("Geolocation is not supported by your browser");
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setAddressDetails(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng
        }));

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            setAddressDetails(prev => ({
              ...prev,
              latitude: lat,
              longitude: lng,
              area: addr.suburb || addr.neighbourhood || addr.residential || addr.road || prev.area,
              pincode: addr.postcode || prev.pincode,
              address: data.display_name || prev.address
            }));
          }
        } catch (err) {
          console.warn("Reverse geocode failed:", err);
        } finally {
          setIsDetectingLocation(false);
          handleSuccess("📍 Precise GPS coordinates captured!");
        }
      },
      (err) => {
        console.warn("GPS Access Error:", err);
        setIsDetectingLocation(false);
        handleError("Location access denied or unavailable. Falling back to pincode-based map view.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  async function updateUser(data) {
    try {
      const result = await userService.updateProfile(data);
      if (result.success) {
        setUser(prev => ({ ...prev, ...data }));
        if (updateUserState) updateUserState(data);
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.error(err);
      handleError(err.message || "Network error");
      return false;
    }
  }

  async function handlePersonalSubmit(e) {
    e.preventDefault();
    if (!validatePersonal(personalDetails)) {
      return handleError("Please fill all personal details");
    }
    const success = await updateUser(personalDetails);
    if (success) {
      handleSuccess("Details updated successfully");
      setIsEditingPersonal(false);
      fetchUserListings();
    }
  }

  async function handleAddressSubmit(e) {
    e.preventDefault();
    if (!validateAddress(addressDetails)) {
      return handleError("Please fill all address details");
    }
    const success = await updateUser(addressDetails);
    if (success) {
      handleSuccess("Address & Listings location updated successfully");
      setIsEditingAddress(false);
      fetchUserListings();
    }
  }

  const fetchUserListings = useCallback(async () => {
    try {
      setIsLoadingListings(true);
      const data = await listingService.getUserListings();
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

  const handleStatusChange = async (listingId, newStatus) => {
    try {
      const data = await listingService.updateListingStatus(listingId, newStatus);
      if (data.success) {
        handleSuccess(`Listing status updated to ${newStatus}!`);
        setUserListings(prev =>
          prev.map(item => (item._id === listingId ? { ...item, status: newStatus } : item))
        );
      }
    } catch (err) {
      console.error("Error updating status:", err);
      handleError(err.message || "Could not update status");
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) {
      return;
    }

    try {
      const data = await listingService.deleteListing(listingId);
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

  const fetchWishlist = useCallback(async () => {
    try {
      setIsLoadingWishlist(true);
      const data = await wishlistService.getWishlist();
      if (data.success) {
        setWishlist(data.wishlist || []);
      }
    } catch (err) {
      console.error("Error fetching wishlist:", err);
    } finally {
      setIsLoadingWishlist(false);
    }
  }, []);

  const fetchSavedSearches = useCallback(async () => {
    try {
      setIsLoadingAlerts(true);
      const data = await savedSearchService.getSavedSearches();
      if (data.success) {
        setSavedSearches(data.savedSearches || []);
      }
    } catch (err) {
      console.error("Error fetching saved searches:", err);
    } finally {
      setIsLoadingAlerts(false);
    }
  }, []);

  const handleRemoveWishlist = async (listingId) => {
    try {
      setWishlist(prev => prev.filter(item => item._id !== listingId));
      await wishlistService.toggle(listingId);
      handleSuccess("Item removed from wishlist");
    } catch (err) {
      console.error("Error removing from wishlist:", err);
      fetchWishlist();
    }
  };

  const handleDeleteSavedSearch = async (id) => {
    if (!window.confirm("Are you sure you want to delete this search alert?")) return;
    try {
      setSavedSearches(prev => prev.filter(item => item._id !== id));
      const res = await savedSearchService.deleteSavedSearch(id);
      if (res.success) {
        handleSuccess("Search alert deleted");
      }
    } catch (err) {
      console.error("Error deleting saved search:", err);
      handleError("Could not delete search alert");
      fetchSavedSearches();
    }
  };

  const handleApplySavedSearch = (alert) => {
    const params = new URLSearchParams();
    if (alert.query) params.set('q', alert.query);
    if (alert.category && alert.category !== 'All') params.set('category', alert.category);
    if (alert.locationScope) params.set('scope', alert.locationScope);
    navigate(`/dashboard?${params.toString()}`);
  };

  // Sync tab with URL searchParams
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['listings', 'wishlist', 'alerts'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Load appropriate data when tab changes
  useEffect(() => {
    if (activeTab === 'wishlist') {
      fetchWishlist();
    } else if (activeTab === 'alerts') {
      fetchSavedSearches();
    }
  }, [activeTab, fetchWishlist, fetchSavedSearches]);

  useEffect(() => {
    userService.getProfile()
      .then(data => {
        if (data.success && data.user) {
          setUser(data.user);
          setPersonalDetails({
            name: data.user.name || "",
            email: data.user.email || "",
            phone: data.user.phone || "",
          });
          setAddressDetails({
            area: data.user.area || "",
            pincode: data.user.pincode || "",
            address: data.user.address || "",
            latitude: data.user.latitude || null,
            longitude: data.user.longitude || null
          });
        }
      })
      .catch(err => console.error("Error fetching user:", err));

    fetchUserListings();
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

                  <div style={{ margin: '10px 0' }}>
                    <button
                      type="button"
                      style={{
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onClick={handleDetectAddressLocation}
                      disabled={isDetectingLocation}
                    >
                      {isDetectingLocation ? "⏳ Detecting GPS..." : "📍 Auto-Detect GPS Location"}
                    </button>
                    {addressDetails.latitude && addressDetails.longitude ? (
                      <div style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: '600', marginTop: '4px' }}>
                        ✅ GPS Captured: ({addressDetails.latitude.toFixed(4)}, {addressDetails.longitude.toFixed(4)})
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                        ℹ️ Map view will use exact GPS if available, else pincode center fallback.
                      </div>
                    )}
                  </div>

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
                    {user.latitude && user.longitude ? (
                      <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: '700', display: 'block', marginTop: '6px' }}>
                        📍 Precise GPS Location Active
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginTop: '6px' }}>
                        📍 Rough Pincode Map View Active
                      </span>
                    )}
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

        {/* TABS & CONTENT SECTION */}
        <div className={styles.listings}>
          {/* TAB SWITCHER */}
          <div className={styles.tabsContainer}>
            <button
              className={`${styles.tabBtn} ${activeTab === 'listings' ? styles.tabBtnActive : ''}`}
              onClick={() => { setActiveTab('listings'); setSearchParams({ tab: 'listings' }); }}
            >
              🛍️ My Listings ({userListings.length})
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'wishlist' ? styles.tabBtnActive : ''}`}
              onClick={() => { setActiveTab('wishlist'); setSearchParams({ tab: 'wishlist' }); }}
            >
              ❤️ Wishlist ({wishlist.length})
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'alerts' ? styles.tabBtnActive : ''}`}
              onClick={() => { setActiveTab('alerts'); setSearchParams({ tab: 'alerts' }); }}
            >
              🔔 Search Alerts ({savedSearches.length})
            </button>
          </div>

          {/* TAB 1: MY ACTIVE LISTINGS */}
          {activeTab === 'listings' && (
            <>
              <div className={styles.listingsHeader}>
                <h2>My Active Listings ({userListings.length})</h2>
                <CreateListing onListingCreated={handleListingCreated} />
              </div>

              {isLoadingListings ? (
                <div className={styles.listingsGrid}>
                  <SkeletonGrid count={4} />
                </div>
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

                        {/* Status Dropdown */}
                        <div style={{ margin: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                          <span style={{ fontWeight: '600', color: '#64748b' }}>Status:</span>
                          <select
                            value={item.status || 'Active'}
                            onChange={(e) => handleStatusChange(item._id, e.target.value)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontWeight: '700',
                              fontSize: '0.8rem',
                              background: item.status === 'Sold' ? '#fee2e2' : item.status === 'Reserved' ? '#fef3c7' : '#dcfce7',
                              color: item.status === 'Sold' ? '#991b1b' : item.status === 'Reserved' ? '#92400e' : '#166534',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="Active">🟢 Active</option>
                            <option value="Reserved">🟡 Reserved</option>
                            <option value="Sold">🔴 Sold</option>
                          </select>
                        </div>

                        {/* Seller Analytics Bar with Wishlists */}
                        <div style={{ display: 'flex', gap: '8px', background: '#f8fafc', padding: '6px 8px', borderRadius: '6px', margin: '4px 0 10px 0', fontSize: '0.78rem', color: '#475569', fontWeight: '600' }}>
                          <span>👁️ {item.views || 0}</span>
                          <span>📞 {item.contactClicks || 0}</span>
                          <span>❤️ {item.wishlistCount || 0} saves</span>
                        </div>

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
            </>
          )}

          {/* TAB 2: WISHLIST & SAVED ITEMS */}
          {activeTab === 'wishlist' && (
            <>
              <div className={styles.listingsHeader}>
                <h2>❤️ My Wishlist ({wishlist.length})</h2>
              </div>

              {isLoadingWishlist ? (
                <div className={styles.listingsGrid}>
                  <SkeletonGrid count={4} />
                </div>
              ) : wishlist.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>🤍 You haven't saved any listings yet.</p>
                  <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginTop: "6px" }}>
                    Browse items on the marketplace and tap the <strong>❤️ Heart</strong> icon on any card to save it here!
                  </p>
                </div>
              ) : (
                <div className={styles.listingsGrid}>
                  {wishlist.map(item => (
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
                        <div className={styles.cardLoc}>
                          📍 {item.area || item.city || "Local"}
                          {item.distanceKm !== undefined && item.distanceKm !== null && (
                            <span style={{ display: 'block', color: '#166534', fontWeight: '700', fontSize: '0.78rem' }}>
                              📏 {item.distanceKm} km away
                            </span>
                          )}
                        </div>

                        <div className={styles.cardActions} style={{ marginTop: 'auto' }}>
                          <button
                            className={styles.editCardBtn}
                            onClick={() => navigate('/dashboard')}
                          >
                            🔍 View in Market
                          </button>
                          <button
                            className={styles.deleteCardBtn}
                            onClick={() => handleRemoveWishlist(item._id)}
                            title="Remove from saved wishlist"
                          >
                            ❌ Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* TAB 3: SAVED SEARCH ALERTS */}
          {activeTab === 'alerts' && (
            <>
              <div className={styles.listingsHeader}>
                <h2>🔔 Saved Search Alerts ({savedSearches.length})</h2>
              </div>

              {isLoadingAlerts ? (
                <p style={{ padding: '20px', color: '#64748b' }}>Loading your search alerts...</p>
              ) : savedSearches.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>🔔 No active search alerts.</p>
                  <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginTop: "6px" }}>
                    Go to the Marketplace, choose your desired category or search keyword, and click <strong>"🔔 Save Alert"</strong> to get notified when new matching items are posted!
                  </p>
                </div>
              ) : (
                <div className={styles.alertsList}>
                  {savedSearches.map(alert => (
                    <div key={alert._id} className={styles.alertCard}>
                      <div className={styles.alertInfo}>
                        <div className={styles.alertTitle}>
                          🔔 {alert.title}
                        </div>
                        <div className={styles.alertCriteria}>
                          <span className={styles.criteriaTag}>📁 Category: {alert.category}</span>
                          {alert.query && <span className={styles.criteriaTag}>🔍 Keyword: "{alert.query}"</span>}
                          <span className={styles.criteriaTag}>
                            📍 Scope: {alert.locationScope === 'pincode' ? `Pincode (${alert.pincode || 'Local'})` : alert.locationScope === 'city' ? `City (${alert.city || 'Local'})` : 'All Locations'}
                          </span>
                          {alert.maxPrice && <span className={styles.criteriaTag}>💰 Max: ₹{alert.maxPrice}</span>}
                          <span className={styles.criteriaTag} style={{ background: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' }}>
                            🟢 Alert Active
                          </span>
                        </div>
                      </div>

                      <div className={styles.alertActions}>
                        <button
                          type="button"
                          className={styles.applySearchBtn}
                          onClick={() => handleApplySavedSearch(alert)}
                        >
                          🔍 View in Market
                        </button>
                        <button
                          type="button"
                          className={styles.deleteAlertBtn}
                          onClick={() => handleDeleteSavedSearch(alert._id)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
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