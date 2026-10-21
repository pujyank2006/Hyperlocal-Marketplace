import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import styles from "../styles/dashboard.module.css";
import Navbar from '../Components/Navbar';
import ChatWidget from '../Components/ChatWidget';
import MapView from '../Components/MapView';
import PaymentModal from '../Components/PaymentModal';
import InvoiceModal from '../Components/InvoiceModal';
import { SkeletonGrid } from '../Components/SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import { listingService, wishlistService, savedSearchService } from '../services/api';
import { handleError, handleSuccess } from '../utils';

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
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [userLocation, setUserLocation] = useState({ pincode: '', city: '', latitude: null, longitude: null });
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [locationScope, setLocationScope] = useState(searchParams.get('scope') || 'pincode'); // 'pincode', 'city', 'all'
  const [maxDistance, setMaxDistance] = useState(''); // Distance radius filter in km ('', '5', '10', '25', '50')
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'

  // Save Search Alert Modal State
  const [showSaveAlertModal, setShowSaveAlertModal] = useState(false);
  const [alertLocationScope, setAlertLocationScope] = useState('all');
  const [alertCustomTitle, setAlertCustomTitle] = useState('');
  const [alertMaxPrice, setAlertMaxPrice] = useState('');
  const [isSavingAlert, setIsSavingAlert] = useState(false);

  // Selected item & Image Gallery Carousel state
  const [selectedItem, setSelectedItem] = useState(null);
  const [sellerDetails, setSellerDetails] = useState(null);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [showContact, setShowContact] = useState(false);

  // Chat Target State
  const [chatTarget, setChatTarget] = useState({ isOpen: false, listingId: null, sellerId: null });

  // Auth User & Payment Checkout State
  const { user } = useAuth();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState(null);

  // Sync incoming searchParams if applied from Saved Searches tab
  useEffect(() => {
    const q = searchParams.get('q');
    const cat = searchParams.get('category');
    const scope = searchParams.get('scope');
    if (q !== null) setSearchQuery(q);
    if (cat && CATEGORIES.includes(cat)) setSelectedCategory(cat);
    if (scope) setLocationScope(scope);
  }, [searchParams]);

  // Wishlist Toggle Handler with optimistic UI update
  const handleToggleWishlist = async (e, listingId) => {
    if (e) e.stopPropagation();

    // Optimistic toggle
    setListings(prev =>
      prev.map(item =>
        item._id === listingId
          ? {
              ...item,
              isWishlisted: !item.isWishlisted,
              wishlistCount: item.isWishlisted
                ? Math.max(0, (item.wishlistCount || 1) - 1)
                : (item.wishlistCount || 0) + 1
            }
          : item
      )
    );

    if (selectedItem && selectedItem._id === listingId) {
      setSelectedItem(prev => ({
        ...prev,
        isWishlisted: !prev.isWishlisted,
        wishlistCount: prev.isWishlisted
          ? Math.max(0, (prev.wishlistCount || 1) - 1)
          : (prev.wishlistCount || 0) + 1
      }));
    }

    try {
      const data = await wishlistService.toggle(listingId);
      if (data.success) {
        handleSuccess(data.isWishlisted ? "❤️ Saved to wishlist!" : "🤍 Removed from wishlist");
      }
    } catch (err) {
      console.error("Wishlist error:", err);
      handleError("Could not update wishlist");
      fetchFeed();
    }
  };

  // Save Search Alert Submission Handler
  const handleConfirmSaveAlert = async (e) => {
    e.preventDefault();
    try {
      setIsSavingAlert(true);
      const payload = {
        title: alertCustomTitle.trim() || undefined,
        query: searchQuery.trim(),
        category: selectedCategory,
        locationScope: alertLocationScope,
        pincode: alertLocationScope === 'pincode' ? (userLocation.pincode || '').trim() : undefined,
        city: alertLocationScope === 'city' ? (userLocation.city || '').trim() : undefined,
        maxPrice: alertMaxPrice ? Number(alertMaxPrice) : undefined
      };

      const res = await savedSearchService.saveSearch(payload);
      if (res.success) {
        handleSuccess("🔔 Search alert saved! You'll be notified when matching items appear.");
        setShowSaveAlertModal(false);
        setAlertCustomTitle('');
        setAlertMaxPrice('');
      } else {
        handleError(res.message || "Failed to save alert");
      }
    } catch (err) {
      console.error("Error saving search alert:", err);
      handleError(err.message || "Failed to save search alert");
    } finally {
      setIsSavingAlert(false);
    }
  };

  // Payment Success Handler
  const handlePaymentSuccess = (completedOrder) => {
    setListings(prev =>
      prev.map(item =>
        item._id === completedOrder.listing ? { ...item, status: 'Sold' } : item
      )
    );
    if (selectedItem && selectedItem._id === completedOrder.listing) {
      setSelectedItem(prev => ({ ...prev, status: 'Sold' }));
    }
    fetchFeed();
  };

  const fetchFeed = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = {};
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (locationScope) params.locationScope = locationScope;
      if (maxDistance) params.maxDistance = maxDistance;

      const data = await listingService.getFeed(params);
      if (data.success) {
        console.log(`%c[Dashboard Feed] Loaded ${data.listings?.length || 0} listings. User Location:`, 'color: #0284c7; font-weight: bold;', data.userLocation);
        (data.listings || []).forEach((item, idx) => {
          console.log(`  [#${idx + 1}] "${item.title}" | Distance: ${item.distanceKm} km | Coords: (${item.latitude}, ${item.longitude}) | Pincode: ${item.pincode}`);
        });
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
  }, [searchQuery, selectedCategory, locationScope, maxDistance]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFeed();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchFeed]);

  const handleOpenItem = async (item) => {
    setSelectedItem(item);
    setActiveImgIndex(0);
    setShowContact(false);
    setSellerDetails(null);

    try {
      const data = await listingService.getListingDetails(item._id);
      if (data.success && data.seller) {
        setSellerDetails(data.seller);
      }
    } catch (err) {
      console.error("Error fetching seller details:", err);
    }
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
      {/* UNIFIED MODERN HEADER */}
      <Navbar />

      {/* BODY */}
      <div className={styles.container}>
        
        {/* CONTROLS BAR: SEARCH, SCOPE & RADIUS FILTER */}
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

            {/* RADIUS FILTER DROPDOWN */}
            <select
              className={styles.scopeBtn}
              value={maxDistance}
              onChange={(e) => setMaxDistance(e.target.value)}
              style={{ background: maxDistance ? '#0284c7' : '#ffffff', color: maxDistance ? '#ffffff' : '#334155', fontWeight: '700', cursor: 'pointer' }}
              title="Filter by distance radius"
            >
              <option value="" style={{ background: '#ffffff', color: '#0f172a' }}>📏 Radius: All</option>
              <option value="5" style={{ background: '#ffffff', color: '#0f172a' }}>📏 Within 5 km</option>
              <option value="10" style={{ background: '#ffffff', color: '#0f172a' }}>📏 Within 10 km</option>
              <option value="25" style={{ background: '#ffffff', color: '#0f172a' }}>📏 Within 25 km</option>
              <option value="50" style={{ background: '#ffffff', color: '#0f172a' }}>📏 Within 50 km</option>
            </select>

            {/* SAVE SEARCH ALERT BUTTON */}
            <button
              type="button"
              className={styles.saveAlertBtn}
              onClick={() => {
                setAlertLocationScope('all');
                setShowSaveAlertModal(true);
              }}
              title="Save this search and receive alerts when new items match"
            >
              🔔 Save Alert
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

        {/* META HEADER WITH VIEW MODE TOGGLE */}
        <div className={styles.metaBanner} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0 }}>
              {locationScope === 'pincode' && `Items in Pincode ${userLocation.pincode || ''}`}
              {locationScope === 'city' && `Items in City ${userLocation.city || ''}`}
              {locationScope === 'all' && `All Hyperlocal Marketplace Listings`}
              {maxDistance && ` (Within ${maxDistance} km)`}
            </h3>
            <span className={styles.countTag}>{listings.length} item{listings.length === 1 ? '' : 's'} found</span>
          </div>

          {/* VIEW MODE TOGGLE SWITCH */}
          <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
            <button
              className={styles.scopeBtn}
              style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: viewMode === 'grid' ? '#0284c7' : 'transparent', color: viewMode === 'grid' ? '#ffffff' : '#475569', fontWeight: '700' }}
              onClick={() => setViewMode('grid')}
            >
              📱 Grid View
            </button>
            <button
              className={styles.scopeBtn}
              style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: viewMode === 'map' ? '#0284c7' : 'transparent', color: viewMode === 'map' ? '#ffffff' : '#475569', fontWeight: '700' }}
              onClick={() => setViewMode('map')}
            >
              🗺️ Map View
            </button>
          </div>
        </div>

        {/* FEED GRID OR MAP VIEW */}
        {isLoading ? (
          <div className={styles.feedGrid}>
            <SkeletonGrid count={6} />
          </div>
        ) : listings.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>🛍️ No listings found</h2>
            <p style={{ marginTop: '8px' }}>
              Try searching with different keywords, switching to <strong>My City</strong> or <strong>All Locations</strong>, expanding distance radius, or clearing category filters.
            </p>
          </div>
        ) : viewMode === 'map' ? (
          <MapView
            listings={listings}
            userLocation={userLocation}
            onItemClick={handleOpenItem}
          />
        ) : (
          <div className={styles.feedGrid}>
            {listings.map(item => (
              <div
                key={item._id}
                className={styles.feedCard}
                onClick={() => handleOpenItem(item)}
              >
                <div className={styles.cardImgWrapper}>
                  {/* FLOATING WISHLIST BUTTON */}
                  <button
                    className={styles.wishlistBtn}
                    onClick={(e) => handleToggleWishlist(e, item._id)}
                    title={item.isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
                  >
                    {item.isWishlisted ? "❤️" : "🤍"}
                  </button>

                  <span className={styles.badgeCategory}>{item.category}</span>
                  {item.status && item.status !== 'Active' && (
                    <span style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '8px',
                      background: item.status === 'Reserved' ? '#d97706' : '#dc2626',
                      color: '#ffffff',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      zIndex: 2,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                      {item.status === 'Reserved' ? '🟡 PENDING' : '🔴 SOLD'}
                    </span>
                  )}
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
                    {item.distanceKm !== undefined && item.distanceKm !== null && (
                      <span style={{ display: 'block', color: '#166534', fontWeight: '700', fontSize: '0.8rem', marginTop: '2px' }}>
                        📏 {item.distanceKm} km away
                      </span>
                    )}
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

      {/* ITEM DETAILS & SELLER CONTACT MODAL */}
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
                    alt={`${selectedItem.title} ${activeImgIndex + 1}`}
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
                <strong style={{ color: '#0f172a' }}>Location & Proximity:</strong>
                <p style={{ color: '#475569', marginTop: '4px' }}>
                  📍 {selectedItem.area ? `${selectedItem.area}, ` : ''}{selectedItem.city} (Pincode: {selectedItem.pincode})
                  {selectedItem.distanceKm !== undefined && selectedItem.distanceKm !== null && (
                    <span style={{ display: 'inline-block', marginLeft: '8px', color: '#166534', fontWeight: '700', background: '#dcfce7', padding: '2px 8px', borderRadius: '6px', fontSize: '0.82rem' }}>
                      📏 {selectedItem.distanceKm} km away from you
                    </span>
                  )}
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

              {/* SELLER INFORMATION & DIRECT CONTACT ACTION */}
              <div className={styles.contactBox}>
                <h4 style={{ fontSize: '1.05rem', color: '#0f172a', marginBottom: '8px' }}>👤 Seller Information</h4>
                <p style={{ color: '#334155', marginBottom: '4px' }}>
                  <strong>Owner:</strong> {sellerDetails?.name || selectedItem.owner}
                </p>
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                  📍 Locality: {sellerDetails?.area || selectedItem.area}, {sellerDetails?.city || selectedItem.city} (Pincode: {sellerDetails?.pincode || selectedItem.pincode})
                </p>
                {sellerDetails?.trustSummary && <div style={{ marginTop: 8, color: '#475569', fontSize: '0.85rem' }}>
                  <strong>{sellerDetails.trustSummary.averageRating ? `⭐ ${sellerDetails.trustSummary.averageRating}/5` : 'New member'}</strong>
                  <span> · {sellerDetails.trustSummary.reviewCount} reviews · {sellerDetails.trustSummary.completedOrders} completed trades</span>
                  {sellerDetails.trustSummary.badges.map((badge) => <span key={badge.id} title={badge.description} style={{ display: 'inline-block', margin: '5px 5px 0 0', background: '#ecfdf5', color: '#047857', borderRadius: 15, padding: '3px 8px', fontWeight: 700 }}>✓ {badge.label}</span>)}
                </div>}

                <button
                  className={styles.viewBtn}
                  style={{ marginTop: '14px', width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: '700', background: '#0284c7', color: '#fff' }}
                  onClick={() => {
                    setChatTarget({
                      isOpen: true,
                      listingId: selectedItem._id,
                      sellerId: selectedItem.relatedUser
                    });
                  }}
                >
                  💬 Chat with Seller & Make Offer
                </button>

                {/* BUY NOW / CHECKOUT ACTION */}
                {selectedItem.status === 'Sold' ? (
                  <div style={{
                    marginTop: '10px',
                    padding: '12px',
                    textAlign: 'center',
                    background: '#f1f5f9',
                    borderRadius: '8px',
                    color: '#64748b',
                    fontWeight: '700',
                    border: '1px solid #cbd5e1'
                  }}>
                    🔴 This item has been Sold
                  </div>
                ) : user && (selectedItem.relatedUser === (user._id || user.id)) ? (
                  <div style={{
                    marginTop: '10px',
                    padding: '12px',
                    textAlign: 'center',
                    background: '#f0fdf4',
                    borderRadius: '8px',
                    color: '#16a34a',
                    fontWeight: '700',
                    border: '1px solid #bbf7d0'
                  }}>
                    🏷️ Your Active Listing
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles.viewBtn}
                    style={{
                      marginTop: '10px',
                      width: '100%',
                      padding: '13px',
                      fontSize: '1rem',
                      fontWeight: '800',
                      background: 'linear-gradient(135deg, #16a34a, #15803d)',
                      color: '#fff',
                      boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    onClick={() => setIsPaymentOpen(true)}
                  >
                    💳 Buy Now — ₹{Number(selectedItem.price).toLocaleString('en-IN')}
                  </button>
                )}

                {/* MODAL WISHLIST ACTION */}
                <button
                  type="button"
                  className={styles.viewBtn}
                  style={{
                    marginTop: '8px',
                    width: '100%',
                    padding: '11px',
                    fontSize: '0.92rem',
                    fontWeight: '700',
                    background: selectedItem.isWishlisted ? '#fef2f2' : '#f8fafc',
                    color: selectedItem.isWishlisted ? '#e11d48' : '#334155',
                    border: selectedItem.isWishlisted ? '1.5px solid #fecdd3' : '1px solid #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onClick={(e) => handleToggleWishlist(e, selectedItem._id)}
                >
                  <span>{selectedItem.isWishlisted ? "❤️ Saved in Wishlist" : "🤍 Save to Wishlist"}</span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    ({selectedItem.wishlistCount || 0} saves)
                  </span>
                </button>

                {!showContact ? (
                  <button
                    className={styles.viewBtn}
                    style={{ marginTop: '8px', width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: '700', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}
                    onClick={() => {
                      setShowContact(true);
                      if (selectedItem?._id) {
                        listingService.trackContactClick(selectedItem._id).catch(err => console.error(err));
                      }
                    }}
                  >
                    📞 Click to View Seller Contact Details
                  </button>
                ) : (
                  <div style={{ marginTop: '14px', padding: '14px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.95rem', color: '#0369a1' }}>
                      <p>📱 <strong>Phone:</strong> {sellerDetails?.phone || "Contact via email below"}</p>
                      <p>✉️ <strong>Email:</strong> {sellerDetails?.email || "Email unavailable"}</p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      {sellerDetails?.phone && (
                        <>
                          <a
                            href={`tel:${sellerDetails.phone}`}
                            className={styles.viewBtn}
                            style={{ flex: 1, textAlign: 'center', textDecoration: 'none', background: '#16a34a', color: '#fff' }}
                          >
                            📞 Call Seller
                          </a>
                          <a
                            href={`https://wa.me/91${sellerDetails.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${sellerDetails.name}, I am interested in your listing: "${selectedItem.title}" on Hyperlocal Marketplace.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.viewBtn}
                            style={{ flex: 1, textAlign: 'center', textDecoration: 'none', background: '#25d366', color: '#fff' }}
                          >
                            💬 WhatsApp
                          </a>
                        </>
                      )}
                      {sellerDetails?.email && (
                        <a
                          href={`mailto:${sellerDetails.email}?subject=${encodeURIComponent(`Inquiry: ${selectedItem.title}`)}`}
                          className={styles.viewBtn}
                          style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}
                        >
                          ✉️ Email
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SAVE SEARCH ALERT MODAL */}
      {showSaveAlertModal && (
        <div className={styles.saveSearchModalOverlay} onClick={() => setShowSaveAlertModal(false)}>
          <div className={styles.saveSearchModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.saveSearchHeader}>
              <h3>🔔 Create Search Alert</h3>
              <button className={styles.closeBtn} onClick={() => setShowSaveAlertModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleConfirmSaveAlert}>
              <div className={styles.saveSearchBody}>
                <div className={styles.alertSummaryBox}>
                  <strong>Active Filter Criteria:</strong>
                  <div>Category: <strong>{selectedCategory}</strong></div>
                  {searchQuery && <div>Keywords: <strong>"{searchQuery}"</strong></div>}
                  {maxDistance && <div>Radius: <strong>Within {maxDistance} km</strong></div>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Location Coverage:
                  </label>
                  <select
                    className={styles.searchInput}
                    style={{ paddingLeft: '12px' }}
                    value={alertLocationScope}
                    onChange={(e) => setAlertLocationScope(e.target.value)}
                  >
                    <option value="all">🌐 Everywhere / All Locations (Recommended)</option>
                    <option value="city">🏙️ In My City {userLocation.city ? `(${userLocation.city})` : ''}</option>
                    <option value="pincode">📍 In My Pincode {userLocation.pincode ? `(${userLocation.pincode})` : ''}</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Alert Label (Optional):
                  </label>
                  <input
                    type="text"
                    className={styles.searchInput}
                    style={{ paddingLeft: '12px' }}
                    placeholder={searchQuery ? `"${searchQuery}" in ${selectedCategory}` : `${selectedCategory} items`}
                    value={alertCustomTitle}
                    onChange={(e) => setAlertCustomTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Max Price Filter (₹, Optional):
                  </label>
                  <input
                    type="number"
                    className={styles.searchInput}
                    style={{ paddingLeft: '12px' }}
                    placeholder="e.g. 5000"
                    value={alertMaxPrice}
                    onChange={(e) => setAlertMaxPrice(e.target.value)}
                  />
                </div>

                <div className={styles.saveSearchActions}>
                  <button type="button" className={styles.cancelSaveBtn} onClick={() => setShowSaveAlertModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.confirmSaveBtn} disabled={isSavingAlert}>
                    {isSavingAlert ? "Saving..." : "🔔 Save Alert"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT CHECKOUT MODAL */}
      <PaymentModal
        isOpen={isPaymentOpen}
        listing={selectedItem}
        onClose={() => setIsPaymentOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        onViewInvoice={(order) => setActiveInvoiceOrder(order)}
      />

      {/* TRANSACTION INVOICE MODAL */}
      <InvoiceModal
        isOpen={Boolean(activeInvoiceOrder)}
        order={activeInvoiceOrder}
        onClose={() => setActiveInvoiceOrder(null)}
      />

      <ChatWidget
        isOpen={chatTarget.isOpen}
        onClose={() => setChatTarget({ isOpen: false, listingId: null, sellerId: null })}
        initialListingId={chatTarget.listingId}
        initialSellerId={chatTarget.sellerId}
      />

      <ToastContainer />
    </>
  );
}

export default Dashboard;
