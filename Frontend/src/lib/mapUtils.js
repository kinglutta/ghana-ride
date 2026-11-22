/**
 * Map utilities — adapted from adrianhajdin/uber patterns
 * Works with Leaflet coordinates [lat, lng] and OSRM responses.
 * 100% free — no Google Maps API keys required.
 */

/**
 * Calculate the map region/bounds to fit two points with padding.
 * Returns { latitude, longitude, latitudeDelta, longitudeDelta } for Leaflet fitBounds.
 */
export const calculateRegion = ({
    lat1, lng1, lat2, lng2, padding = 0.15,
}) => {
    if (!lat1 || !lng1) {
        return {
            center: [5.6037, -0.1870], // Kumasi, Ghana default
            zoom: 13,
        };
    }

    if (!lat2 || !lng2) {
        return {
            center: [lat1, lng1],
            zoom: 15,
        };
    }

    const minLat = Math.min(lat1, lat2);
    const maxLat = Math.max(lat1, lat2);
    const minLng = Math.min(lng1, lng2);
    const maxLng = Math.max(lng1, lng2);

    const latDelta = (maxLat - minLat) * (1 + padding);
    const lngDelta = (maxLng - minLng) * (1 + padding);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Convert delta to approximate Leaflet zoom level
    const zoom = calculateZoomFromDelta(Math.max(latDelta, lngDelta));

    return {
        center: [centerLat, centerLng],
        zoom,
        bounds: [[minLat, minLng], [maxLat, maxLng]],
    };
};

/**
 * Estimate Leaflet zoom level from coordinate delta.
 */
export const calculateZoomFromDelta = (delta) => {
    if (delta > 2) return 5;
    if (delta > 1) return 6;
    if (delta > 0.5) return 7;
    if (delta > 0.25) return 8;
    if (delta > 0.1) return 9;
    if (delta > 0.05) return 10;
    if (delta > 0.025) return 11;
    if (delta > 0.0125) return 12;
    if (delta > 0.006) return 13;
    if (delta > 0.003) return 14;
    if (delta > 0.0015) return 15;
    return 16;
};

/**
 * Haversine distance between two points in meters.
 */
export const getDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000; // Earth radius in meters
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Format duration seconds into human readable time.
 */
export const formatTime = (seconds) => {
    if (!seconds) return '0 min';
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
};

/**
 * Format price for display (Ghana Cedis).
 */
export const formatFare = (amount) => {
    if (amount == null) return 'GH₵0';
    return `GH₵${Number(amount).toLocaleString()}`;
};
