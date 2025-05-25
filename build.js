import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REQUIRED_TEXTURES = [
  '8k_earth_daymap1.jpg',
  '8k_earth_nightmap1.jpg',
  'earth-bump.jpg',
  'earth-specular.jpg',
  'earth-normal.jpg',
  'earth-roughness.jpg',
  'earth-clouds.png',
  'earth-clouds-alpha.png',
];

async function validateAssets() {
  const sourceDir = 'public/assets/earth';
  try {
    const files = await fs.readdir(sourceDir);
    const missingTextures = REQUIRED_TEXTURES.filter(texture => !files.includes(texture));

    if (missingTextures.length > 0) {
      console.error('Missing required textures:', missingTextures);
      throw new Error('Missing required texture files');
    }

    console.log('✓ All required textures found');
    return true;
  } catch (error) {
    console.error('Error validating assets:', error.message);
    return false;
  }
}

async function copyAssets() {
  try {
    console.log('Starting asset copy process...');

    // Validate assets first
    const isValid = await validateAssets();
    if (!isValid) {
      throw new Error('Asset validation failed');
    }

    // Ensure directories exist
    const dirs = ['dist', 'dist/assets', 'dist/assets/earth'];

    for (const dir of dirs) {
      try {
        await fs.access(dir);
        console.log(`✓ Directory exists: ${dir}`);
      } catch {
        await fs.mkdir(dir, { recursive: true });
        console.log(`✓ Created directory: ${dir}`);
      }
    }

    // Copy only required textures
    const sourceDir = 'public/assets/earth';
    const targetDir = 'dist/assets/earth';

    for (const texture of REQUIRED_TEXTURES) {
      const sourcePath = join(sourceDir, texture);
      const targetPath = join(targetDir, texture);

      try {
        await fs.copyFile(sourcePath, targetPath);
        console.log(`✓ Copied: ${texture}`);
      } catch (err) {
        console.error(`✗ Failed to copy ${texture}:`, err.message);
        throw err;
      }
    }

    console.log('✓ Asset copy process completed successfully!');
  } catch (error) {
    console.error('Asset copy failed:', error);
    process.exit(1);
  }
}

// Run the build process
copyAssets();
