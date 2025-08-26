const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userDetails = require("../models/user");

// Logical method to handle Signup
async function handleSignup(req, res) {
    try {
        const { name, email, phone, state, city, area, pincode, password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).json({ error: "Password doesn't match!" });
        }

        const user = await userDetails.findOne({ email });
        if (user) {
            return res.status(409).json({ message: "User already exists!", success: false });
        };

        const presentUser = new userDetails({ name, email, phone, state, city, area, pincode, password });
        presentUser.password = await bcrypt.hash(password, 10);
        await presentUser.save();

        res.status(201).json({ message: 'Signup success', success: true })
    } catch {
        res.status(500).json({ message: "Internal server error ", success: false })
    }
};

// logical method to handle login
async function handleLogin (req, res) {
    try {
        const { email, password } = req.body;
        const user = await userDetails.findOne({ email });
        
        if(!user){
            return res.status(403).json({ message: "User doesn't exits, create an account", success: false });
        }

        const isPasswordEqual = await bcrypt.compare(password, user.password);

        if(!isPasswordEqual) {
            return res.status(403).json({ message: "Incorrect password!", success: false });
        }

        const jwtToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({ message: "Login Successfull", success: true, jwtToken, name: user.name, email: user.email, city: user.city, area: user.area });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

// export the required functions
module.exports = {
    handleSignup,
    handleLogin,
}