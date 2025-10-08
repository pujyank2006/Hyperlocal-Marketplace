const jwt = require('jsonwebtoken');
const userDetails = require('../models/user');

const protect = async (req, res, next) => {
    try {
        const token = req.cookies.token;


        if (!token) {
            return res.status(401).json({ message: "Not authorized, no token" });
        }


        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await userDetails.findById(decoded.id).select("-password");

        if (!req.user) {
            return res.status(401).json({ message: "User not found" });
        }

        next();
    } catch (err) {
        return res.status(401).json({ message: "Not Authorized, token failed" })
    }
}
module.exports = protect;