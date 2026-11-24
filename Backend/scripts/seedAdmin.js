/**
 * Seeds one admin rider account for local development.
 * Override credentials with ADMIN_EMAIL / ADMIN_PASSWORD in Backend/.env.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const userModel = require('../models/user.model');

const email = String(process.env.ADMIN_EMAIL || 'admin@yenko.test').toLowerCase();
const password = process.env.ADMIN_PASSWORD || 'Admin12345';

const run = async () => {
    if (!process.env.MONGODB_URL) {
        throw new Error('MONGODB_URL is not configured');
    }

    await mongoose.connect(process.env.MONGODB_URL);

    const hashedPassword = await userModel.hashPassword(password);
    const admin = await userModel.findOneAndUpdate(
        { email },
        {
            $set: {
                role: 'admin',
                email,
                password: hashedPassword,
                fullname: { firstname: 'Yenko', lastname: 'Admin' },
            },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`Admin ready: ${admin.email} (${admin.role})`);
    await mongoose.disconnect();
};

run().catch((error) => {
    console.error('Admin seed failed:', error.message);
    process.exit(1);
});
