import * as THREE from 'three';

export class AnimationController {
  constructor() {
    // Animation state
    this.animations = new Map();
    this.isPlaying = false;
    this.lastUpdateTime = 0;

    // Performance optimization
    this.updateInterval = 1000 / 60; // Target 60 FPS
    this.timeScale = 1.0;

    // Animation smoothing
    this.smoothingFactor = 0.1;
    this.transitionQueue = [];

    // Initialize
    this.reset();
  }

  reset() {
    this.animations.clear();
    this.transitionQueue = [];
    this.lastUpdateTime = performance.now();
    this.isPlaying = false;
  }

  addAnimation(
    name,
    {
      startValue,
      endValue,
      duration,
      easing = 'linear',
      onUpdate = () => {},
      onComplete = () => {},
    }
  ) {
    const animation = {
      startTime: performance.now(),
      startValue: startValue,
      endValue: endValue,
      duration: duration,
      easing: this.getEasingFunction(easing),
      onUpdate,
      onComplete,
      isComplete: false,
    };

    this.animations.set(name, animation);
    return name;
  }

  addTransition(target, { property, startValue, endValue, duration, easing = 'easeInOutCubic' }) {
    const transition = {
      target,
      property,
      startValue,
      endValue,
      duration,
      easing: this.getEasingFunction(easing),
      startTime: performance.now(),
      isComplete: false,
    };

    this.transitionQueue.push(transition);
    return transition;
  }

  update() {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastUpdateTime;

    // Skip update if not enough time has passed
    if (deltaTime < this.updateInterval) {
      return;
    }

    this.lastUpdateTime = currentTime;

    // Update active animations
    this.animations.forEach((animation, name) => {
      if (animation.isComplete) return;

      const elapsed = currentTime - animation.startTime;
      const progress = Math.min(elapsed / animation.duration, 1);

      // Apply easing
      const easedProgress = animation.easing(progress);

      // Calculate current value
      let currentValue;
      if (typeof animation.startValue === 'number') {
        currentValue = THREE.MathUtils.lerp(
          animation.startValue,
          animation.endValue,
          easedProgress
        );
      } else if (animation.startValue instanceof THREE.Vector3) {
        currentValue = new THREE.Vector3().lerpVectors(
          animation.startValue,
          animation.endValue,
          easedProgress
        );
      } else if (animation.startValue instanceof THREE.Quaternion) {
        currentValue = new THREE.Quaternion().slerpQuaternions(
          animation.startValue,
          animation.endValue,
          easedProgress
        );
      }

      // Update animation
      animation.onUpdate(currentValue, easedProgress);

      // Check completion
      if (progress >= 1) {
        animation.isComplete = true;
        animation.onComplete();
        this.animations.delete(name);
      }
    });

    // Update transitions
    this.transitionQueue = this.transitionQueue.filter(transition => {
      if (transition.isComplete) return false;

      const elapsed = currentTime - transition.startTime;
      const progress = Math.min(elapsed / transition.duration, 1);
      const easedProgress = transition.easing(progress);

      // Update target property
      if (typeof transition.startValue === 'number') {
        transition.target[transition.property] = THREE.MathUtils.lerp(
          transition.startValue,
          transition.endValue,
          easedProgress
        );
      } else if (transition.startValue instanceof THREE.Vector3) {
        transition.target[transition.property].lerpVectors(
          transition.startValue,
          transition.endValue,
          easedProgress
        );
      }

      // Check completion
      if (progress >= 1) {
        transition.isComplete = true;
        return false;
      }

      return true;
    });
  }

  getEasingFunction(name) {
    const easings = {
      linear: t => t,
      easeInQuad: t => t * t,
      easeOutQuad: t => t * (2 - t),
      easeInOutQuad: t => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
      easeInCubic: t => t * t * t,
      easeOutCubic: t => --t * t * t + 1,
      easeInOutCubic: t => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
      easeInExpo: t => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
      easeOutExpo: t => (t === 1 ? 1 : -Math.pow(2, -10 * t) + 1),
      easeInOutExpo: t => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        if ((t *= 2) < 1) return 0.5 * Math.pow(2, 10 * (t - 1));
        return 0.5 * (-Math.pow(2, -10 * --t) + 2);
      },
    };

    return easings[name] || easings.linear;
  }

  setTimeScale(scale) {
    this.timeScale = Math.max(0, scale);
  }

  pause() {
    this.isPlaying = false;
  }

  play() {
    this.isPlaying = true;
  }

  stop() {
    this.reset();
  }

  dispose() {
    this.reset();
    this.animations.clear();
    this.transitionQueue = [];
  }
}
