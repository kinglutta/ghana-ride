/**
 * Ride types — JSDoc definitions adapted from adrianhajdin/uber patterns.
 * Used for type safety in JavaScript. All data flows through MongoDB.
 */

/**
 * @typedef {Object} Driver
 * @property {string} _id - MongoDB ObjectId
 * @property {Object} fullname - { firstname, lastname }
 * @property {string} fullname.firstname
 * @property {string} fullname.lastname
 * @property {string} email
 * @property {Object} vehicle - { color, plate, capacity, vehicleType, car_image_url? }
 * @property {number} vehicle.capacity - number of seats
 * @property {string} vehicle.vehicleType - 'car' | 'motorcycle' | 'auto'
 * @property {Object} location - { ltd, lng }
 * @property {number} rating - average driver rating 0-5
 * @property {number} totalRides - number of completed rides
 * @property {number} earnings - total earnings in GH₵
 * @property {string} socketId - Socket.IO socket id
 * @property {string} status - 'active' | 'inactive'
 */

/**
 * @typedef {Object} Ride
 * @property {string} _id - MongoDB ObjectId
 * @property {ObjectId} user - reference to User
 * @property {ObjectId} captain - reference to Captain (driver)
 * @property {string} pickup - pickup address string
 * @property {string} destination - destination address string
 * @property {number} fare - fare amount in GH₵
 * @property {number} duration - ride duration in seconds
 * @property {number} distance - ride distance in meters
 * @property {string} status - 'pending' | 'accepted' | 'ongoing' | 'completed' | 'cancelled'
 * @property {string} otp - 6-digit verification code
 * @property {number} rating - rider rating for driver 1-5 (after completion)
 * @property {string} paymentStatus - 'pending' | 'paid' | 'cash' | 'failed'
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} User
 * @property {string} _id
 * @property {Object} fullname - { firstname, lastname }
 * @property {string} email
 * @property {string} token - JWT auth token
 * @property {number} rating - average rider rating
 * @property {number} totalRides
 */
