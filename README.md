# 🌍 Interactive 3D Earth - WebGL Visualization

A high-performance, interactive 3D Earth built with Three.js that demonstrates advanced WebGL techniques with clean, maintainable code architecture.

<div align="center">
  <video src="https://raw.githubusercontent.com/dushyant4665/earth-visualization/assets/preview.mp4" controls width="800"></video>
</div>

## Why This Project Stands Out

This isn't just another Three.js demo. Here's what makes it special:

✅ **Visual Polish** - 8K textures with bump mapping, atmospheric scattering, and dynamic lighting  
✅ **Butter-Smooth** - 60fps animations using delta-time calculations  
✅ **Responsive Design** - Works flawlessly on mobile to 4K displays  
✅ **Optimized Loading** - Smart texture management with progress indicators  
✅ **Clean Architecture** - Modular, well-commented code ready for scaling  

## Technical Deep Dive

### Core Technologies
- **Three.js** (WebGL renderer, GLTF loader, OrbitControls)  
- **Vite** (Lightning-fast builds with ES modules)  
- **Math** (Spherical coordinates, quaternion rotations)  
- **Performance** (Frustum culling, efficient draw calls)  

### Clever Solutions I Implemented
1. **Seamless Texture Loading** - Priority queue for assets with fallbacks  
2. **GPU-Friendly Animations** - Shared materials for cloud/earth layers  
3. **Physics-Like Motion** - Damped camera movements with inertia  
4. **Adaptive Quality** - Dynamic resolution scaling based on device  

## Quick Start
```bash
git clone https://github.com/dushyant4665/earth-visualization.git
cd earth-visualization
npm install
npm run dev
