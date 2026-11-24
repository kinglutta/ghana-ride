const userModel = require('../models/user.model');
const userService = require('../services/user.service');
const { validationResult } = require('express-validator');
const blacklistTokenModel = require('../models/blacklistToken.model');
const adminAccess = require('../utils/adminAccess');

module.exports.registerUser = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { fullname, email, password, role, adminCode } = req.body;

        // Only a valid invite code can promote an account to admin. Everyone
        // else is forced to the safe rider role, even if they send `role`.
        const requestedRole = role === 'admin' ? 'admin' : 'rider';
        if (requestedRole === 'admin' && !adminAccess.matches(adminCode)) {
            return res.status(403).json({ message: 'Invalid or missing admin access code' });
        }

        const isUserAlreadyExist = await userModel.findOne({ email });

        if (isUserAlreadyExist) {
            return res.status(400).json({ message: 'User already exist' });
        }

        const hashedPassword = await userModel.hashPassword(password);

        const user = await userService.createUser(
            fullname.firstname,
            fullname.lastname,
            email,
            hashedPassword,
            requestedRole
        );

        const token = await user.generateAuthToken();

        res.status(201).json(
            {
                message: requestedRole === 'admin'
                    ? 'Admin account registered successfully'
                    : 'User registered successfully',
                user,
                token
            }
        );
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong' });
    }
}

module.exports.loginUser = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        const user = await userModel.findOne({ email }).select('+password');

        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = await user.generateAuthToken();

        res.cookie('authToken', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        })

        user.password = undefined;
        user.token = token;

        return res.status(200).json(
            {
                message: 'Login successful',
                user,
                token
            }
        );
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Something went wrong' });
    }
}

module.exports.getUserProfile = async (req, res, next) => {
    try {
        const user = req.user;
        res.status(200).json(
            {
                message: 'User profile',
                user
            }
        );
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Something went wrong' });
    }
}

module.exports.logoutUser = async (req, res, next) => {
    try {
        const token = req.cookies.authToken || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(400).json({ message: 'Invalid request' });
        }

        await blacklistTokenModel.create({ token });

        res.clearCookie('authToken');

        return res.status(200).json(
            {
                message: 'Logout successful'
            }
        );
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Something went wrong' });
    }
}