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
      const errorMsg = data.message || data.error || `HTTP Error ${response.status}`;
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
  deleteListing: (id) => request(`/listings/${id}`, { method: 'DELETE' }),
};
