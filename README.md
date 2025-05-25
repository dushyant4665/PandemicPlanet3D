# 🌍 Interactive Earth Visualization

A stunning, high-performance 3D Earth visualization built with Three.js and Vite. Experience our planet in space with realistic textures, smooth animations, and interactive controls.

![Earth Visualization](https://raw.githubusercontent.com/dushyant4665/earth-visualization/main/preview.png)

## ✨ Features

- **Realistic Earth Rendering**

  - High-resolution 8K textures for day and night views
  - Detailed bump mapping for terrain visualization
  - Dynamic cloud layer with smooth animation
  - Atmospheric effects and realistic lighting

- **Interactive Controls**

  - Smooth orbit controls for Earth rotation
  - Intuitive zoom and pan functionality
  - Responsive touch controls for mobile devices
  - Auto-rotation with adjustable speed

- **Performance Optimized**

  - Efficient texture loading with progress tracking
  - Optimized 3D rendering with WebGL
  - Smooth animations using delta time
  - Responsive design for all devices

- **Production Ready**
  - Clean, modern UI with loading screen
  - Error handling with recovery options
  - Mobile-responsive design
  - SEO optimized

## 🚀 Live Demo

Experience the visualization live: [Earth in Space](https://dushyant4665.github.io/earth-visualization)

## 🛠️ Technologies

- [Three.js](https://threejs.org/) - 3D graphics library
- [Vite](https://vitejs.dev/) - Next-generation frontend tooling
- [WebGL](https://www.khronos.org/webgl/) - 3D graphics for the web
- Modern JavaScript (ES6+)

## 📦 Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/dushyant4665/earth-visualization.git
   cd earth-visualization
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Build for production:

   ```bash
   npm run build
   ```

5. Preview production build:
   ```bash
   npm run preview
   ```

## 🎮 Usage

- **Mouse Controls**

  - Left Click + Drag: Rotate Earth
  - Right Click + Drag: Pan view
  - Scroll: Zoom in/out
  - Double Click: Reset view

- **Touch Controls**
  - One finger drag: Rotate Earth
  - Two finger drag: Pan view
  - Pinch: Zoom in/out
  - Double tap: Reset view

## 🎨 Customization

The visualization can be customized by modifying the following parameters in `src/main.js`:

```javascript
// Animation speeds
const EARTH_ROTATION_SPEED = 0.001;
const CLOUD_ROTATION_SPEED = 0.0006;
const STAR_ROTATION_SPEED = 0.00003;

// Camera settings
const CAMERA_DAMPING = 0.05;
const CONTROLS_ROTATION_SPEED = 0.4;
const CONTROLS_ZOOM_SPEED = 0.8;

// Visual quality
const EARTH_SEGMENTS = 128;
const STAR_COUNT = 15000;
const SHADOW_MAP_SIZE = 2048;
```

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Android Chrome)

## 🎯 Performance

The visualization is optimized for performance with:

- Efficient texture loading and management
- Optimized 3D geometry
- Smart camera controls
- Responsive design
- Hardware acceleration

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Dushyant**

- GitHub: [@dushyant4665](https://github.com/dushyant4665)
- Project Link: [https://github.com/dushyant4665/earth-visualization](https://github.com/dushyant4665/earth-visualization)

## 🙏 Acknowledgments

- Earth textures from [Solar System Scope](https://www.solarsystemscope.com/)
- Three.js community for their excellent documentation
- All contributors who have helped improve this project

---

⭐️ If you like this project, please give it a star on GitHub!
