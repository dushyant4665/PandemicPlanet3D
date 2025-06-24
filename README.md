# Earth Visualization

A real-time 3D Earth visualization built with Three.js and Vite. This project creates an interactive, photorealistic model of Earth with dynamic lighting, clouds, and atmospheric effects.

## Features

-  High-resolution Earth textures (8K)
-  Dynamic cloud layer with transparency
-  Day/night cycle with city lights
-  Smooth camera controls
-  Realistic atmospheric effects
-  Responsive design

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 in your browser

3. **Build for Production**
   ```bash
   npm run build
   ```


## Project Structure

```
├── public/
│   └── assets/
│       └── earth/          # Earth textures
├── src/
│   ├── core/              # Core utilities
│   ├── entities/          # 3D objects
│   └── main.js           # Entry point
├── vite.config.js        # Build config
└── package.json
```

## Development

- **Code Style**: ESLint + Prettier
- **Build Tool**: Vite
- **3D Engine**: Three.js
- **Testing**: Vitest

## Deployment

The project is configured for deployment on Vercel. Run:
```bash
vercel --prod
```

## License

MIT License - feel free to use this project for learning or commercial purposes.
