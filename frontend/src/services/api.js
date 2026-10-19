const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:9000/api/v1";

/**
 * Universal fetch wrapper handling API calls, credentials, and JSON parsing
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = { ...options.headers };

  // Set Content-Type to application/json unless body is FormData (file upload)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers,
    credentials: 'include' // Always include HTTP-only cookies
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error?.details?.[0]?.message || data.message || data.error || `HTTP Error ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error(`❌ API Request Error [${options.method || 'GET'} ${endpoint}]:`, error.message);
    throw error;
  }
}

// Auth API Services
export const authService = {
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  signup: (userData) => request('/auth/signup', { method: 'POST', body: JSON.stringify(userData) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
};

// User Profile Services
export const userService = {
  getProfile: () => request('/users/me', { method: 'GET' }),
  updateProfile: (data) => request('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
};

// Marketplace Listings Services
export const listingService = {
  getFeed: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/listings/feed?${query}`, { method: 'GET' });
  },
  getUserListings: () => request('/listings/get-listing', { method: 'GET' }),
  getListingDetails: (id) => request(`/listings/detail/${id}`, { method: 'GET' }),
  createListing: (formData) => request('/listings/create-listing', { method: 'POST', body: formData }),
  updateListing: (id, formData) => request(`/listings/${id}`, { method: 'PUT', body: formData }),
  updateListingStatus: (id, status) => request(`/listings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  trackContactClick: (id) => request(`/listings/${id}/track-contact`, { method: 'POST' }),
  deleteListing: (id) => request(`/listings/${id}`, { method: 'DELETE' }),
};

// Chat & Negotiation API Services
export const chatService = {
  startConversation: (listingId, sellerId) => request('/chat/start', { method: 'POST', body: JSON.stringify({ listingId, sellerId }) }),
  getConversations: () => request('/chat/conversations', { method: 'GET' }),
  getMessages: (conversationId) => request(`/chat/messages/${conversationId}`, { method: 'GET' }),
  sendMessage: (conversationId, text, offerPrice) => request('/chat/message', { method: 'POST', body: JSON.stringify({ conversationId, text, offerPrice }) }),
  respondOffer: (messageId, status) => request(`/chat/offer/${messageId}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

// Wishlist Services
export const wishlistService = {
  toggle: (listingId) => request(`/wishlist/toggle/${listingId}`, { method: 'POST' }),
  getWishlist: () => request('/wishlist', { method: 'GET' }),
  getWishlistIds: () => request('/wishlist/ids', { method: 'GET' }),
};

// Saved Search & Alert Services
export const savedSearchService = {
  saveSearch: (data) => request('/saved-searches', { method: 'POST', body: JSON.stringify(data) }),
  getSavedSearches: () => request('/saved-searches', { method: 'GET' }),
  deleteSavedSearch: (id) => request(`/saved-searches/${id}`, { method: 'DELETE' }),
};

// Notification Services
export const notificationService = {
  getNotifications: () => request('/notifications', { method: 'GET' }),
  getUnreadCount: () => request('/notifications/unread-count', { method: 'GET' }),
  markAsRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: () => request('/notifications/read-all', { method: 'PATCH' }),
};

// Payment & Order Ledger Services
export const paymentService = {
  createOrder: (listingId, deliveryType = 'local_pickup') =>
    request('/payments/create-order', { method: 'POST', body: JSON.stringify({ listingId, deliveryType }) }),
  verifyPayment: (payload) =>
    request('/payments/verify-payment', { method: 'POST', body: JSON.stringify(payload) }),
  getMyOrders: () =>
    request('/payments/my-orders', { method: 'GET' }),
  getOrderInvoice: (orderId) =>
    request(`/payments/orders/${orderId}`, { method: 'GET' }),
};


