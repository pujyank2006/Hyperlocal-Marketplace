# 🛒 Hyperlocal Marketplace

A modern, full-stack **MERN (MongoDB, Express, React, Node.js)** web application designed to connect local community members. Buy, sell, or share pre-owned items and services within your exact pincode, area, or city.

---

## ✨ Features

- 📍 **Hyperlocal Neighborhood Discovery**: Filter marketplace items by **My Pincode**, **My City**, or **All Locations**.
- 🔍 **Live Search & Category Filtering**: Instantly search items with debounced text search across categories (*Electronics, Furniture, Vehicles, Services, Clothing, Books, Home & Garden, Other*).
- 🖼️ **Multi-Image Upload & Photo Gallery**: Post listings with up to 10 photos featuring an interactive left-right carousel viewer and thumbnail strip.
- 💬 **Direct Seller Contact**: Unlock seller phone & email with one-click **Call**, **WhatsApp**, and **Email** quick action links.
- 🔐 **Secure Authentication**: Multi-step registration flow, JWT cookie-based session security, bcrypt password hashing, and server-side Joi validation.
- ⚙️ **User Profile & Listing Management**: View, edit personal/address details, and manage active listings (create, edit, delete).

---

## 🛠️ Tech Stack

### **Backend**
- **Node.js & Express.js** (v5) - RESTful API framework
- **MongoDB & Mongoose** (v8) - Database & object modeling
- **JSON Web Tokens (JWT)** & **Cookie-Parser** - Secure HTTP-only authentication
- **Multer** - Multipart file upload handling
- **Joi** - Server-side request validation
- **bcrypt** - Password hashing

### **Frontend**
- **React** (v19) - UI Library
- **React Router DOM** (v7) - Client-side routing & protected route guards
- **CSS Modules** (`*.module.css`) - Scoped component styling
- **React-Toastify** - User notification toasts

---

## 📁 Project Structure

```text
Hyperlocal-Marketplace/
├── Backend/
│   ├── controllers/         # Request logic (auth, userDetails, listings)
│   ├── middlewares/         # JWT verification, Joi validation, Multer storage
│   ├── models/              # Mongoose data schemas (user, listings)
│   ├── routes/              # Express API endpoints (/api/v1/...)
│   ├── uploads/             # Locally hosted image upload directory
│   ├── connectDb.js         # MongoDB connection helper
│   └── server.js            # Express server entry point
├── frontend/
│   ├── public/              # Static public assets
│   └── src/
│       ├── Components/      # Reusable UI components (Create/Edit Listing, Modals)
│       ├── ComponentStyles/ # Component-level CSS modules
│       ├── pages/           # Page routes (Home, Login, Signup, Dashboard, Profile)
│       ├── styles/          # Page CSS modules
│       ├── App.js           # App routing & auth listener
│       └── index.js         # React DOM entry point
├── .env                     # Server environment variables
├── .gitignore               # Ignored files (uploads, node_modules, .env)
└── package.json             # Backend dependencies & scripts
```

---

## 🚀 Getting Started

### **Prerequisites**
- **Node.js** (v16+ recommended)
- **MongoDB** running locally on default port `27017` (or remote MongoDB URI)

### **1. Clone the Repository**
```bash
git clone https://github.com/your-username/Hyperlocal-Marketplace.git
cd Hyperlocal-Marketplace
```

### **2. Setup Environment Variables**
Create a `.env` file in the root directory:
```env
PORT=9000
MONGO_URL=mongodb://localhost:27017
JWT_SECRET=your_jwt_secret_key_here
```

### **3. Install Dependencies**
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### **4. Run the Application**

**Start Backend Server:**
```bash
# From the root directory
npm start
```
*Backend runs at: `http://localhost:9000`*

**Start Frontend React App:**
```bash
# From the frontend directory
cd frontend
npm start
```
*Frontend runs at: `http://localhost:3000`*

---

## 🔌 API Reference Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/v1/auth/signup` | Register new user | ❌ |
| `POST` | `/api/v1/auth/login` | Authenticate user & set JWT cookie | ❌ |
| `POST` | `/api/v1/auth/logout` | Clear auth cookie | ❌ |
| `GET` | `/api/v1/users/me` | Fetch logged-in user profile | ✅ |
| `PATCH` | `/api/v1/users/me` | Update user details & location | ✅ |
| `GET` | `/api/v1/listings/feed` | Hyperlocal feed with search & location scope | ✅ |
| `GET` | `/api/v1/listings/get-listing` | Fetch user's own active listings | ✅ |
| `GET` | `/api/v1/listings/detail/:id` | Fetch item detail with seller contact | ✅ |
| `POST` | `/api/v1/listings/create-listing` | Post new listing with photos | ✅ |
| `PUT` | `/api/v1/listings/:id` | Update listing & photos | ✅ |
| `DELETE` | `/api/v1/listings/:id` | Remove a listing | ✅ |

---

## 📝 License

Distributed under the ISC License. See `LICENSE` for more information.
