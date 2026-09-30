import { Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { ToastContainer } from 'react-toastify';

import logo from "./assets/favicon.png";
import title2 from "./assets/Title2.png";
import account from "./assets/accountCircle.svg";
import styles from "../styles/dashboard.module.css";
import AccountOptions from '../Components/accountOptions';
import { handleError } from '../utils';

const CATEGORIES = [
  'All',
  'Electronics',
  'Furniture',
  'Vehicles',
  'Services',
  'Clothing & Fashion',
  'Books & Stationery',
  'Home & Garden',
  'Other'
];

function Dashboard() {
  const [isAccountOpen, setAccountOpen] = useState(false);
  const [listings, setListings] = useState([]);
  const [userLocation, setUserLocation] = useState({ pincode: '', city: '' });
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [locationScope, setLocationScope] = useState('pincode'); // 'pincode', 'city', 'all'

  // Selected item & Image Gallery Carousel state
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [showContact, setShowContact] = useState(false);

  const fetchFeed = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (locationScope) params.append('locationScope', locationScope);

      const response = await fetch(`http://localhost:9000/api/v1/listings/feed?${params.toString()}`, {
        method: 'GET',
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        setListings(data.listings || []);
        if (data.userLocation) {
          setUserLocation(data.userLocation);
        }
      } else {
        handleError(data.message || "Failed to load feed");
      }
    } catch (err) {
      console.error("Feed error:", err);
      handleError("Network error while loading feed");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, locationScope]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFeed();
    }, 300); // 300ms debounce for search query
    return () => clearTimeout(timer);
  }, [fetchFeed]);

  const handleOpenItem = (item) => {
    setSelectedItem(item);
    setActiveImgIndex(0);
    setShowContact(false);
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    if (!selectedItem || !selectedItem.images) return;
    setActiveImgIndex(prev =>
      prev === 0 ? selectedItem.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    if (!selectedItem || !selectedItem.images) return;
    setActiveImgIndex(prev =>
      prev === selectedItem.images.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <>
      {/* HEADER */}
      <div className={styles.mainHeader}>
        <Link to="/">
          <img alt='logo' src={logo} width='40px' height='40px' />
          &nbsp;
          <img alt='title' src={title2} className={styles.title} />
        </Link>
        <button className={styles.button} onClick={() => setAccountOpen(!isAccountOpen)}>
          <img alt='account' src={account} width='40px' height='40px' />
        </button>
        <AccountOptions open={isAccountOpen} onClose={() => setAccountOpen(false)} />
      </div>

      {/* BODY */}
      <div className={styles.container}>
        
        {/* CONTROLS BAR: SEARCH & SCOPE */}
        <div className={styles.controlsBar}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search items, electronics, furniture, area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className={styles.scopeGroup}>
            <button
              className={`${styles.scopeBtn} ${locationScope === 'pincode' ? styles.scopeBtnActive : ''}`}
              onClick={() => setLocationScope('pincode')}
            >
              📍 My Pincode ({userLocation.pincode || "Local"})
            </button>
            <button
              className={`${styles.scopeBtn} ${locationScope === 'city' ? styles.scopeBtnActive : ''}`}
              onClick={() => setLocationScope('city')}
            >
              🏙️ My City ({userLocation.city || "City"})
            </button>
            <button
              className={`${styles.scopeBtn} ${locationScope === 'all' ? styles.scopeBtnActive : ''}`}
              onClick={() => setLocationScope('all')}
            >
              🌐 All Locations
            </button>
          </div>
        </div>

        {/* CATEGORY CHIPS */}
        <div className={styles.categoryBar}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`${styles.catChip} ${selectedCategory === cat ? styles.catChipActive : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* META HEADER */}
        <div className={styles.metaBanner}>
          <h3>
            {locationScope === 'pincode' && `Items in Pincode ${userLocation.pincode || ''}`}
            {locationScope === 'city' && `Items in City ${userLocation.city || ''}`}
            {locationScope === 'all' && `All Hyperlocal Marketplace Listings`}
          </h3>
          <span className={styles.countTag}>{listings.length} item{listings.length === 1 ? '' : 's'} found</span>
        </div>

        {/* FEED GRID */}
        {isLoading ? (
          <p style={{ textAlign: 'center', padding: '40px' }}>Loading marketplace feed...</p>
        ) : listings.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>🛍️ No listings found</h2>
            <p style={{ marginTop: '8px' }}>
              Try searching with different keywords, switching to <strong>My City</strong> or <strong>All Locations</strong>, or clearing category filters.
            </p>
          </div>
        ) : (
          <div className={styles.feedGrid}>
            {listings.map(item => (
              <div
                key={item._id}
                className={styles.feedCard}
                onClick={() => handleOpenItem(item)}
              >
                <div className={styles.cardImgWrapper}>
                  <span className={styles.badgeCategory}>{item.category}</span>
                  <img
                    src={
                      item.images && item.images.length > 0
                        ? `http://localhost:9000${item.images[0]}`
                        : "https://via.placeholder.com/260x180?text=No+Image"
                    }
                    alt={item.title}
                    className={styles.cardImg}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/260x180?text=No+Image";
                    }}
                  />
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.itemTitle}>{item.title}</div>
                  <div className={styles.itemPrice}>₹{item.price}</div>
                  <div className={styles.itemLocation}>
                    📍 {item.area ? `${item.area}, ` : ''}{item.city} ({item.pincode})
                  </div>
                  <div className={styles.cardFooter}>
                    <span className={styles.sellerName}>Seller: {item.owner}</span>
                    <button className={styles.viewBtn}>View Details</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ITEM DETAILS MODAL WITH LEFT-RIGHT CAROUSEL */}
      {selectedItem && (
        <div className={styles.modalOverlay} onClick={() => setSelectedItem(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{selectedItem.title}</h2>
              <button className={styles.closeBtn} onClick={() => setSelectedItem(null)}>&times;</button>
            </div>

            <div className={styles.modalBody}>
              
              {/* IMAGE GALLERY CAROUSEL */}
              <div className={styles.galleryContainer}>
                <div className={styles.gallery}>
                  {selectedItem.images && selectedItem.images.length > 1 && (
                    <>
                      <button
                        className={`${styles.carouselNavBtn} ${styles.carouselLeft}`}
                        onClick={handlePrevImage}
                        title="Previous Image (Left)"
                      >
                        ‹
                      </button>
                      <button
                        className={`${styles.carouselNavBtn} ${styles.carouselRight}`}
                        onClick={handleNextImage}
                        title="Next Image (Right)"
                      >
                        ›
                      </button>
                    </>
                  )}

                  <img
                    src={
                      selectedItem.images && selectedItem.images.length > 0
                        ? `http://localhost:9000${selectedItem.images[activeImgIndex]}`
                        : "https://via.placeholder.com/600x280?text=No+Image"
                    }
                    alt={`${selectedItem.title} - photo ${activeImgIndex + 1}`}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/600x280?text=No+Image";
                    }}
                  />

                  {selectedItem.images && selectedItem.images.length > 0 && (
                    <span className={styles.imgCounterBadge}>
                      📷 {activeImgIndex + 1} / {selectedItem.images.length}
                    </span>
                  )}
                </div>

                {/* THUMBNAIL STRIP */}
                {selectedItem.images && selectedItem.images.length > 1 && (
                  <div className={styles.thumbnailStrip}>
                    {selectedItem.images.map((path, idx) => (
                      <button
                        key={idx}
                        className={`${styles.thumbBtn} ${activeImgIndex === idx ? styles.thumbBtnActive : ''}`}
                        onClick={() => setActiveImgIndex(idx)}
                      >
                        <img src={`http://localhost:9000${path}`} alt={`thumb ${idx + 1}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={styles.badgeCategory} style={{ position: 'static' }}>{selectedItem.category}</span>
                <span className={styles.itemPrice} style={{ fontSize: '1.5rem' }}>₹{selectedItem.price}</span>
              </div>

              <div>
                <strong style={{ color: '#0f172a' }}>Location:</strong>
                <p style={{ color: '#475569', marginTop: '4px' }}>
                  📍 {selectedItem.area ? `${selectedItem.area}, ` : ''}{selectedItem.city} (Pincode: {selectedItem.pincode})
                </p>
              </div>

              {selectedItem.description && (
                <div>
                  <strong style={{ color: '#0f172a' }}>Description:</strong>
                  <p style={{ color: '#334155', marginTop: '4px', lineHeight: '1.5' }}>
                    {selectedItem.description}
                  </p>
                </div>
              )}

              <div className={styles.contactBox}>
                <h4>Seller Information</h4>
                <p>👤 <strong>Owner:</strong> {selectedItem.owner}</p>
                
                {!showContact ? (
                  <button
                    className={styles.viewBtn}
                    style={{ marginTop: '12px', width: '100%', padding: '10px', fontSize: '0.95rem' }}
                    onClick={() => setShowContact(true)}
                  >
                    📞 View Seller Contact Details
                  </button>
                ) : (
                  <div style={{ marginTop: '12px', padding: '10px', background: '#e0f2fe', borderRadius: '8px', color: '#0369a1' }}>
                    <p>✅ Contact details unlocked!</p>
                    <p style={{ fontWeight: 'bold', marginTop: '4px' }}>
                      Posted in locality {selectedItem.area || selectedItem.city}. Connect directly with {selectedItem.owner}.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </>
  );
}

export default Dashboard;