# 🌍 Interactive 3D Earth Visualization

A high-performance, interactive 3D Earth visualization built with Three.js. Features smooth Earth rotation, realistic cloud layers, and optimized rendering for the best visual experience.

## 🚀 Features

- Smooth Earth rotation with realistic axial tilt (23.44°)
- Dynamic cloud layer with optimized transparency
- High-quality Earth textures
- Optimized performance with WebGL
- Smooth camera controls
- Responsive design
- No lag, butter-smooth animation

## 🛠️ Tech Stack

- Three.js for 3D rendering
- WebGL for hardware acceleration
- Modern JavaScript (ES6+)
- Optimized for performance

## 🎯 Live Demo

[View Live Demo](https://dushyant4665.github.io/earth-visualization)

## 🏗️ Installation

1. Clone the repository:
```bash
git clone https://github.com/dushyant4665/earth-visualization.git
```

2. Install dependencies:
```bash
cd earth-visualization
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

## 📁 Project Structure

```
earth-visualization/
├── src/
│   ├── core/           # Core rendering and scene management
│   ├── entities/       # 3D entities (Earth, clouds, etc.)
│   ├── utils/          # Utility functions
│   └── main.js         # Application entry point
├── assets/
│   └── earth/          # Earth textures and resources
├── public/             # Static assets
└── index.html          # Main HTML file
```

## 🎨 Customization

You can customize the Earth visualization by modifying these parameters in `src/entities/Earth/Earth.js`:

- `rotationSpeed`: Earth's rotation speed
- `radius`: Earth's size
- `axialTilt`: Earth's tilt angle
- Cloud layer opacity and speed

## ⚡ Performance Optimizations

- Optimized WebGL renderer settings
- Efficient texture loading
- Smooth animation with requestAnimationFrame
- Hardware-accelerated transforms
- Optimized geometry and materials
- Efficient event handling

## 📝 License

MIT License - feel free to use this project for your own purposes!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgments

- Three.js for the amazing 3D engine
- NASA for Earth textures
- The open-source community

## 📧 Contact

Dushyant - [@dushyant4665](https://github.com/dushyant4665)

Project Link: [https://github.com/dushyant4665/earth-visualization](https://github.com/dushyant4665/earth-visualization) 