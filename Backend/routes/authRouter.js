const { handleSignup, handleLogin, handleLogout } = require('../controllers/authController'); // Auth Controllers
const { signupValidation, loginValidation } = require('../middlewares/authMiddleware'); // Auth Middlewares

const express = require('express');
const router = express.Router();

// Login validation and controller
router.post('/login', loginValidation, handleLogin);

// Signup validation and controller
router.post('/signup', signupValidation, handleSignup);

// Logout controller
router.post('/logout', handleLogout);

module.exports = router;