const Joi = require('joi');
const jwt = require('jsonwebtoken');

// server-side validation by joi for signup page
function signupValidation (req, res, next) {
    const schema = Joi.object({
        name: Joi.string().min(3).max(100).required(),
        email: Joi.string().email().required(),
        phone: Joi.string().length(10).required(),
        state: Joi.string().min(3).max(100).required(),
        city: Joi.string().min(3).max(100).required(),
        area: Joi.string().min(3).max(100).required(),
        pincode: Joi.string().length(6).required(),
        password: Joi.string().min(4).max(100).required(),
        confirmPassword: Joi.string().min(4).max(100).required(),
    });
    const { error } = schema.validate(req.body);
    if(error){
        return res.status(400).json({ message: "Bad Inputs", error: error });
    }
    next();
};

// server-side validation for login page
function loginValidation (req, res, next) {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(4).max(100).required(),
    });

    const { error } = schema.validate(req.body);
    if(error) {
        return res.status(400).json({ message: "Bad Inputs", error: error });
    };
    next();
};

// JWT token verification middleware
function verifyToken(req, res, next) {
    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    if (!token) {
        return res.status(401).json({ success: false, error: "Unauthorized access: Token not provided!" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id: user._id }
        next();
    } catch (err) {
        return res.status(401).json({ success: false, error: "Unauthorized access: Invalid or expired token!" });
    }
};

// export the required functions
module.exports = {
    signupValidation,
    loginValidation,
    verifyToken,
};