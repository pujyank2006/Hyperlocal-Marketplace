const jwt = require('jsonwebtoken');
const userDetails = require('../models/user');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization && req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("Decoded token: ", decoded);
        
            console.log("Decoded.Id: ", decoded.id);
            req.user = await userDetails.findById(decoded.id).select("-password");

            if(!req.user){
                return res.status(401).json({ message: "User not found" });
            }

            next();
        } catch (err) {
            return res.status(401).json({ message: "Not Authorized, token failed" })
        }
    }

    if(!token){
        return res.status(401).json({ message: "Not authorized, no token" });
    }
}

module.exports = protect;