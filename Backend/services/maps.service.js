const axios = require('axios');
const captainModel = require('../models/captain.model');

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

// Free geocoding via OpenStreetMap Nominatim (no API key required)
module.exports.getAddressCoordinate = async (address) => {
    if (!address) {
        throw new Error('Address is required');
    }

    const url = `${NOMINATIM_BASE_URL}/search`;
    const response = await axios.get(url, {
        params: {
            format: 'json',
            limit: 1,
            q: address
        },
        headers: {
            'User-Agent': 'YENKO RIDE'
        },
        timeout: 10000
    });

    if (response.data && response.data.length > 0) {
        const location = response.data[0];
        return {
            ltd: parseFloat(location.lat),
            lng: parseFloat(location.lon)
        };
    }

    throw new Error('Address not found');
}

module.exports.getDistanceTime = async (origin, destination) => {
    if (!origin || !destination) {
        throw new Error('Origin and destination are required');
    }

    // Geocode the addresses to coordinates using free Nominatim service
    const pickupCoords = await module.exports.getAddressCoordinate(origin);
    const destinationCoords = await module.exports.getAddressCoordinate(destination);

    const osrmUrl = `${OSRM_BASE_URL}/${pickupCoords.lng},${pickupCoords.ltd};${destinationCoords.lng},${destinationCoords.ltd}?overview=false`;

    const response = await axios.get(osrmUrl, {
        timeout: 10000
    });

    if (response.data && response.data.code === 'Ok' && response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        return {
            distance: {
                value: route.distance // in meters
            },
            duration: {
                value: route.duration // in seconds
            }
        };
    }

    throw new Error('No routes found');
}

module.exports.getAutoCompleteSuggestions = async (input) => {
    if (!input) {
        throw new Error('query is required');
    }

    const url = `${NOMINATIM_BASE_URL}/search`;
    const response = await axios.get(url, {
        params: {
            format: 'json',
            limit: 5,
            q: input
        },
        headers: {
            'User-Agent': 'YENKO RIDE'
        },
        timeout: 10000
    });

    const suggestions = (response.data || [])
        .map(item => item.display_name)
        .filter(value => value);

    if (suggestions.length === 0) {
        throw new Error('No suggestions found');
    }

    return suggestions;
}

module.exports.getCaptainsInTheRadius = async (ltd, lng, radius) => {
    console.log('🔍 Searching for captains near:', { ltd, lng, radius: radius + 'km' });

    try {
        // Only verified, active captains may receive ride offers.
        const allActiveCaptains = await captainModel.find({
            status: 'active',
            isVerified: true,
            onRide: { $ne: true },
            location: { $exists: true }
        });

        console.log('📍 Total active captains with location:', allActiveCaptains.length);

        // Use distance calculator for precise filtering
        const { filterCaptainsByRadius } = require('../utils/distanceCalculator');
        const captainsInRadius = filterCaptainsByRadius(allActiveCaptains, ltd, lng, radius);

        console.log('📍 Captains within', radius + 'km radius:', captainsInRadius.length);

        // Also try MongoDB geospatial query as backup
        try {
            const geoQueryCaptains = await captainModel.find({
                location: {
                    $geoWithin: {
                        $centerSphere: [[lng, ltd], radius / 6371] // Note: lng first, then ltd
                    }
                },
                status: 'active',
                isVerified: true,
                onRide: { $ne: true }
            });
            console.log('📍 MongoDB geo query found:', geoQueryCaptains.length, 'captains');
        } catch (geoError) {
            console.log('⚠️ MongoDB geo query failed:', geoError.message);
        }

        return captainsInRadius;
    } catch (error) {
        console.error('❌ Error finding captains in radius:', error);
        return [];
    }
}
