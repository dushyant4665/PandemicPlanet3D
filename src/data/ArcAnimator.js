import * as THREE from 'three';
import { GeoMath } from '../core/MathUtils/GeoMath.js';

export class ArcAnimator {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.arcs = new Map(); // Store active arcs
        this.options = {
            arcHeight: 0.5, // Height of arc as percentage of distance
            arcColor: 0x00ffff, // Default arc color
            arcWidth: 2, // Default arc width
            animationDuration: 2000, // Duration in milliseconds
            dashSize: 0.1, // Size of dash in arc
            gapSize: 0.1, // Size of gap in arc
            ...options
        };

        // Create shared material for all arcs
        this.material = new THREE.LineBasicMaterial({
            color: this.options.arcColor,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
    }

    /**
     * Create an animated arc between two points
     * @param {Object} fromPoint - Starting point
     * @param {Object} toPoint - Ending point
     * @param {Object} [options] - Arc options
     * @returns {string} Arc ID
     */
    createArc(fromPoint, toPoint, options = {}) {
        const arcId = `${fromPoint.id}-${toPoint.id}`;
        if (this.arcs.has(arcId)) {
            return arcId;
        }

        const arcOptions = {
            ...this.options,
            ...options
        };

        // Create curved path
        const curve = this.createCurvedPath(
            fromPoint.position,
            toPoint.position,
            arcOptions.arcHeight
        );

        // Create geometry
        const points = curve.getPoints(50);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        // Create line
        const line = new THREE.Line(geometry, this.material.clone());
        line.material.color.setHex(arcOptions.arcColor);
        line.material.opacity = 0;

        // Store arc data
        this.arcs.set(arcId, {
            id: arcId,
            line,
            curve,
            fromPoint,
            toPoint,
            options: arcOptions,
            progress: 0,
            startTime: Date.now(),
            visible: false
        });

        // Add to scene
        this.scene.add(line);

        // Start animation
        this.animateArc(arcId);

        return arcId;
    }

    /**
     * Create a curved path between two points
     * @private
     */
    createCurvedPath(start, end, heightFactor) {
        const distance = start.distanceTo(end);
        const height = distance * heightFactor;
        const mid = GeoMath.sphereMidpoint(start, end);
        const control = mid.clone().normalize().multiplyScalar(start.length() + height);

        return new THREE.QuadraticBezierCurve3(start, control, end);
    }

    /**
     * Animate an arc
     * @private
     */
    animateArc(arcId) {
        const arc = this.arcs.get(arcId);
        if (!arc) return;

        const now = Date.now();
        const elapsed = now - arc.startTime;
        const progress = Math.min(elapsed / arc.options.animationDuration, 1);

        // Update arc visibility
        if (progress > 0 && !arc.visible) {
            arc.visible = true;
            arc.line.material.opacity = 0.8;
        }

        // Update arc progress
        arc.progress = progress;

        // Update dash pattern
        const dashPattern = this.calculateDashPattern(progress, arc.options);
        arc.line.material.dashSize = dashPattern.dashSize;
        arc.line.material.gapSize = dashPattern.gapSize;
        arc.line.material.dashOffset = dashPattern.offset;

        // Continue animation if not complete
        if (progress < 1) {
            requestAnimationFrame(() => this.animateArc(arcId));
        }
    }

    /**
     * Calculate dash pattern for arc animation
     * @private
     */
    calculateDashPattern(progress, options) {
        const totalLength = 1;
        const dashSize = options.dashSize;
        const gapSize = options.gapSize;
        const patternLength = dashSize + gapSize;
        const offset = -progress * totalLength;

        return {
            dashSize,
            gapSize,
            offset
        };
    }

    /**
     * Remove an arc
     * @param {string} arcId - Arc ID to remove
     */
    removeArc(arcId) {
        const arc = this.arcs.get(arcId);
        if (!arc) return;

        // Fade out animation
        const fadeOut = () => {
            const opacity = arc.line.material.opacity;
            if (opacity > 0) {
                arc.line.material.opacity = Math.max(0, opacity - 0.1);
                requestAnimationFrame(fadeOut);
            } else {
                this.scene.remove(arc.line);
                arc.line.geometry.dispose();
                arc.line.material.dispose();
                this.arcs.delete(arcId);
            }
        };

        fadeOut();
    }

    /**
     * Update all active arcs
     * @param {number} delta - Time since last update
     */
    update(delta) {
        for (const [arcId, arc] of this.arcs) {
            if (arc.visible) {
                // Rotate arc with Earth
                arc.line.rotation.y += delta * 0.1;
            }
        }
    }

    /**
     * Set arc color
     * @param {string} arcId - Arc ID
     * @param {number} color - Hex color
     */
    setArcColor(arcId, color) {
        const arc = this.arcs.get(arcId);
        if (arc) {
            arc.line.material.color.setHex(color);
        }
    }

    /**
     * Set arc opacity
     * @param {string} arcId - Arc ID
     * @param {number} opacity - Opacity value (0-1)
     */
    setArcOpacity(arcId, opacity) {
        const arc = this.arcs.get(arcId);
        if (arc) {
            arc.line.material.opacity = Math.max(0, Math.min(1, opacity));
        }
    }

    /**
     * Get all active arcs
     * @returns {Array} Array of active arcs
     */
    getAllArcs() {
        return Array.from(this.arcs.values());
    }

    /**
     * Clear all arcs
     */
    clearAllArcs() {
        for (const arcId of this.arcs.keys()) {
            this.removeArc(arcId);
        }
    }
} 