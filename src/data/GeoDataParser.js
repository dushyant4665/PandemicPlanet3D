import { GeoMath } from '../core/MathUtils/GeoMath.js';
import * as THREE from 'three';

export class GeoDataParser {
    constructor(earthRadius) {
        this.earthRadius = earthRadius;
        this.points = new Map(); // Store points by ID
        this.connections = new Map(); // Store connections between points
    }

    /**
     * Add a point to the data set
     * @param {string} id - Unique identifier for the point
     * @param {Object} data - Point data
     * @param {number} data.lat - Latitude
     * @param {number} data.lon - Longitude
     * @param {string} [data.name] - Optional name for the point
     * @param {Object} [data.metadata] - Additional metadata
     * @returns {THREE.Vector3} The 3D position of the point
     */
    addPoint(id, { lat, lon, name, metadata = {} }) {
        const position = GeoMath.latLonToVector3(lat, lon, this.earthRadius);
        
        this.points.set(id, {
            id,
            position,
            lat,
            lon,
            name,
            metadata,
            connections: new Set()
        });

        return position;
    }

    /**
     * Create a connection between two points
     * @param {string} fromId - Source point ID
     * @param {string} toId - Destination point ID
     * @param {Object} [options] - Connection options
     * @param {number} [options.segments=50] - Number of segments in the arc
     * @param {Object} [options.metadata] - Additional connection metadata
     * @returns {Object} Connection data including arc points
     */
    createConnection(fromId, toId, options = {}) {
        const fromPoint = this.points.get(fromId);
        const toPoint = this.points.get(toId);

        if (!fromPoint || !toPoint) {
            throw new Error(`Points not found: ${fromId} -> ${toId}`);
        }

        const connectionId = `${fromId}-${toId}`;
        const segments = options.segments || 50;

        // Generate arc points
        const arcPoints = GeoMath.generateGreatCircleArc(
            fromPoint.position,
            toPoint.position,
            segments
        );

        // Calculate distance
        const distance = GeoMath.greatCircleDistance(
            fromPoint.lat,
            fromPoint.lon,
            toPoint.lat,
            toPoint.lon
        );

        // Calculate bearing
        const bearing = GeoMath.calculateBearing(
            fromPoint.lat,
            fromPoint.lon,
            toPoint.lat,
            toPoint.lon
        );

        const connection = {
            id: connectionId,
            from: fromId,
            to: toId,
            arcPoints,
            distance,
            bearing,
            metadata: options.metadata || {},
            segments
        };

        // Store connection
        this.connections.set(connectionId, connection);

        // Update point connections
        fromPoint.connections.add(connectionId);
        toPoint.connections.add(connectionId);

        return connection;
    }

    /**
     * Get all points within a radius of a given point
     * @param {string} pointId - Center point ID
     * @param {number} radiusKm - Search radius in kilometers
     * @returns {Array} Array of nearby points
     */
    getNearbyPoints(pointId, radiusKm) {
        const centerPoint = this.points.get(pointId);
        if (!centerPoint) return [];

        const nearby = [];
        for (const [id, point] of this.points) {
            if (id === pointId) continue;

            const distance = GeoMath.greatCircleDistance(
                centerPoint.lat,
                centerPoint.lon,
                point.lat,
                point.lon
            );

            if (distance <= radiusKm) {
                nearby.push({
                    ...point,
                    distance
                });
            }
        }

        return nearby.sort((a, b) => a.distance - b.distance);
    }

    /**
     * Get all connections for a point
     * @param {string} pointId - Point ID
     * @returns {Array} Array of connections
     */
    getPointConnections(pointId) {
        const point = this.points.get(pointId);
        if (!point) return [];

        return Array.from(point.connections)
            .map(connId => this.connections.get(connId))
            .filter(Boolean);
    }

    /**
     * Remove a point and all its connections
     * @param {string} pointId - Point ID to remove
     */
    removePoint(pointId) {
        const point = this.points.get(pointId);
        if (!point) return;

        // Remove all connections
        for (const connId of point.connections) {
            const connection = this.connections.get(connId);
            if (connection) {
                // Remove connection from other point
                const otherPointId = connection.from === pointId ? connection.to : connection.from;
                const otherPoint = this.points.get(otherPointId);
                if (otherPoint) {
                    otherPoint.connections.delete(connId);
                }
                this.connections.delete(connId);
            }
        }

        // Remove point
        this.points.delete(pointId);
    }

    /**
     * Remove a connection between two points
     * @param {string} fromId - Source point ID
     * @param {string} toId - Destination point ID
     */
    removeConnection(fromId, toId) {
        const connectionId = `${fromId}-${toId}`;
        const connection = this.connections.get(connectionId);
        if (!connection) return;

        // Remove connection from both points
        const fromPoint = this.points.get(fromId);
        const toPoint = this.points.get(toId);
        if (fromPoint) fromPoint.connections.delete(connectionId);
        if (toPoint) toPoint.connections.delete(connectionId);

        // Remove connection
        this.connections.delete(connectionId);
    }

    /**
     * Get all points
     * @returns {Array} Array of all points
     */
    getAllPoints() {
        return Array.from(this.points.values());
    }

    /**
     * Get all connections
     * @returns {Array} Array of all connections
     */
    getAllConnections() {
        return Array.from(this.connections.values());
    }
} 