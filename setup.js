import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create necessary directories
const dirs = ['public/assets/earth'];

// Async function to setup directories and check textures
async function setup() {
  try {
    // Create directories
    for (const dir of dirs) {
      try {
        await fs.access(dir);
        console.log(`Directory exists: ${dir}`);
      } catch {
        await fs.mkdir(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    }

    // List of required textures
    const requiredTextures = [
      '8k_earth_daymap1.jpg',
      '8k_earth_nightmap1.jpg',
      'earth-bump.jpg',
      'earth-specular.jpg',
      'earth-clouds.png',
    ];

    // Check if textures exist in public directory
    const publicDir = 'public';
    const earthDir = 'public/assets/earth';

    // Get list of files in public directory
    const files = await fs.readdir(publicDir);

    // Move textures if they exist in public directory
    for (const file of files) {
      const lowerFile = file.toLowerCase();
      if (lowerFile.includes('earth') || lowerFile.includes('cloud')) {
        const sourcePath = join(publicDir, file);
        const targetPath = join(earthDir, file);

        try {
          // Check if target file already exists
          await fs.access(targetPath);
          console.log(`Texture already exists: ${file}`);
        } catch {
          // Only move if it's a texture file
          if (lowerFile.endsWith('.jpg') || lowerFile.endsWith('.png')) {
            await fs.copyFile(sourcePath, targetPath);
            console.log(`Moved texture: ${file} to assets/earth/`);
          }
        }
      }
    }

    // Check for missing textures
    const missingTextures = [];
    for (const texture of requiredTextures) {
      try {
        await fs.access(join(earthDir, texture));
      } catch {
        missingTextures.push(texture);
      }
    }

    if (missingTextures.length > 0) {
      console.error('Missing required textures:');
      missingTextures.forEach(texture => {
        console.error(`- ${texture}`);
      });
      console.error('\nPlease ensure all required textures are present in public/assets/earth/');
      process.exit(1);
    } else {
      console.log('All required textures are present!');
    }
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

// Run setup
setup();
