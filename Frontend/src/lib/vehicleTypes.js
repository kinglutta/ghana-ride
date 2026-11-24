/**
 * Shared vehicle catalogue for YENKO RIDE.
 *
 * Motor, Okada and Pragya are Ghanaian-local ride choices:
 * - Motor: a quick motorcycle ride
 * - Okada: a motorcycle taxi (one passenger)
 * - Pragya: a passenger tricycle (up to three passengers)
 */
import car from '../assets/car.png'
import bike from '../assets/bike.png'
import auto from '../assets/auto.png'

export const VEHICLE_TYPES = {
    car: {
        id: 'car',
        name: 'YenkoGo',
        label: 'Car',
        icon: car,
        emoji: '🚗',
        seats: 4,
        desc: 'Affordable, compact rides',
    },
    bike: {
        id: 'bike',
        name: 'YenkoBike',
        label: 'Bike',
        icon: bike,
        emoji: '🏍️',
        seats: 1,
        desc: 'Fast motorcycle rides',
    },
    auto: {
        id: 'auto',
        name: 'YenkoAuto',
        label: 'Auto',
        icon: auto,
        emoji: '🛺',
        seats: 3,
        desc: 'Affordable auto rides',
    },
    comfort: {
        id: 'comfort',
        name: 'YenkoComfort',
        label: 'Comfort',
        icon: car,
        emoji: '✨',
        seats: 4,
        desc: 'Premium sedans, more legroom',
    },
    xl: {
        id: 'xl',
        name: 'YenkoXL',
        label: 'XL',
        icon: car,
        emoji: '🚙',
        seats: 6,
        desc: 'Spacious SUVs for groups',
    },
    motor: {
        id: 'motor',
        name: 'YenkoMotor',
        label: 'Motor',
        icon: bike,
        emoji: '🏍️',
        seats: 1,
        desc: 'Quick motorcycle rides',
    },
    moto: {
        id: 'moto',
        name: 'YenkoMoto',
        label: 'Moto',
        icon: bike,
        emoji: '🏍️',
        seats: 1,
        desc: 'Motorcycle rides',
    },
    okada: {
        id: 'okada',
        name: 'YenkoOkada',
        label: 'Okada',
        icon: bike,
        emoji: '🛵',
        seats: 1,
        desc: 'Ghana motorcycle taxi',
    },
    pragya: {
        id: 'pragya',
        name: 'YenkoPragya',
        label: 'Pragya',
        icon: auto,
        emoji: '🛺',
        seats: 3,
        desc: 'Passenger tricycle rides',
    },
}

/** Rider booking order — local favourites first, then the original categories. */
export const RIDER_VEHICLE_ORDER = [
    'car', 'okada', 'pragya', 'motor', 'bike', 'auto', 'comfort', 'xl',
]

/** Captain signup order — vehicle types a Captain can register. */
export const CAPTAIN_VEHICLE_ORDER = [
    'car', 'auto', 'motor', 'okada', 'pragya', 'bike', 'moto',
]

export const vehicleConfig = (type) => VEHICLE_TYPES[type] || VEHICLE_TYPES.car
