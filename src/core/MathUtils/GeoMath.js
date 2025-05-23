import * as THREE from 'three';

export class GeoMath {
    static EARTH_RADIUS = 6371; // Earth's radius in kilometers

    /**
     * Convert latitude and longitude to 3D coordinates
     * @param {number} lat - Latitude in degrees
     * @param {number} lon - Longitude in degrees
     * @param {number} radius - Sphere radius
     * @returns {THREE.Vector3} 3D point on sphere
     */
    static latLonToVector3(lat, lon, radius) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);

        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);

        return new THREE.Vector3(x, y, z);
    }

    /**
     * Calculate great circle distance between two points
     * @param {number} lat1 - First point latitude
     * @param {number} lon1 - First point longitude
     * @param {number} lat2 - Second point latitude
     * @param {number} lon2 - Second point longitude
     * @returns {number} Distance in kilometers
     */
    static greatCircleDistance(lat1, lon1, lat2, lon2) {
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                 Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                 Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return this.EARTH_RADIUS * c;
    }

    /**
     * Generate points along a great circle arc
     * @param {THREE.Vector3} start - Start point
     * @param {THREE.Vector3} end - End point
     * @param {number} segments - Number of segments
     * @returns {THREE.Vector3[]} Array of points along the arc
     */
    static generateGreatCircleArc(start, end, segments = 50) {
        const points = [];
        const startNormal = start.clone().normalize();
        const endNormal = end.clone().normalize();

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const point = new THREE.Vector3().lerpVectors(startNormal, endNormal, t).normalize();
            points.push(point.multiplyScalar(start.length()));
        }

        return points;
    }

    /**
     * Calculate midpoint between two points on a sphere
     * @param {THREE.Vector3} start - Start point
     * @param {THREE.Vector3} end - End point
     * @returns {THREE.Vector3} Midpoint
     */
    static sphereMidpoint(start, end) {
        const midpoint = new THREE.Vector3().addVectors(start, end).normalize();
        return midpoint.multiplyScalar(start.length());
    }

    /**
     * Convert degrees to radians
     * @param {number} degrees 
     * @returns {number} radians
     */
    static toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Convert radians to degrees
     * @param {number} radians 
     * @returns {number} degrees
     */
    static toDegrees(radians) {
        return radians * (180 / Math.PI);
    }

    /**
     * Calculate bearing between two points
     * @param {number} lat1 - Start latitude
     * @param {number} lon1 - Start longitude
     * @param {number} lat2 - End latitude
     * @param {number} lon2 - End longitude
     * @returns {number} Bearing in degrees
     */
    static calculateBearing(lat1, lon1, lat2, lon2) {
        const φ1 = this.toRadians(lat1);
        const φ2 = this.toRadians(lat2);
        const λ1 = this.toRadians(lon1);
        const λ2 = this.toRadians(lon2);

        const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
        const x = Math.cos(φ1) * Math.sin(φ2) -
                 Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
        
        let bearing = Math.atan2(y, x);
        bearing = this.toDegrees(bearing);
        return (bearing + 360) % 360;
    }
} 