// Speed of light in vacuum (m/s)
export const SPEED_OF_LIGHT = 299_792_458;

// Average Earth–Moon distance (m)
export const EARTH_MOON_DISTANCE = 3.844e8;

/**
 * Round-trip time for a signal traveling distance L and back at speed c.
 * @param {number} distanceMeters one-way distance in meters
 * @returns {number} RTT in seconds
 */
export function rtt(distanceMeters) {
  return (2 * distanceMeters) / SPEED_OF_LIGHT;
}

export function moonRTT() {
  return rtt(EARTH_MOON_DISTANCE);
}
