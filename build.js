import { promises as fs } from 'fs';
import { join, dirname, basename } from 'path';
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
    'earth-clouds-alpha.png'
];

async function copyAssets() {
    try {
        console.log('Starting asset copy process...');

        // Ensure directories exist
        const dirs = [
            'dist',
            'dist/assets',
            'dist/assets/earth'
        ];

        for (const dir of dirs) {
            try {
                await fs.access(dir);
                console.log(`✓ Directory exists: ${dir}`);
            } catch {
                await fs.mkdir(dir, { recursive: true });
                console.log(`✓ Created directory: ${dir}`);
            }
        }

        // Copy assets from public to dist
        const sourceDir = 'public/assets/earth';
        const targetDir = 'dist/assets/earth';

        try {
            const files = await fs.readdir(sourceDir);
            console.log(`Found ${files.length} files in ${sourceDir}`);

            // Verify required textures
            const missingTextures = REQUIRED_TEXTURES.filter(
                texture => !files.includes(texture)
            );

            if (missingTextures.length > 0) {
                console.warn('⚠️ Missing required textures:', missingTextures);
                console.warn('Please ensure all required textures are present in public/assets/earth/');
            }

            // Copy all files
            for (const file of files) {
                const sourcePath = join(sourceDir, file);
                const targetPath = join(targetDir, file);

                try {
                    const stats = await fs.stat(sourcePath);
                    if (stats.isFile()) {
                        await fs.copyFile(sourcePath, targetPath);
                        console.log(`✓ Copied: ${file} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
                    }
                } catch (err) {
                    console.error(`✗ Failed to copy ${file}:`, err.message);
                }
            }

            // Verify copied files
            const copiedFiles = await fs.readdir(targetDir);
            console.log(`\nVerification: ${copiedFiles.length} files copied to ${targetDir}`);
            
            // Check for any missing required textures after copy
            const stillMissing = REQUIRED_TEXTURES.filter(
                texture => !copiedFiles.includes(texture)
            );
            
            if (stillMissing.length > 0) {
                throw new Error(`Missing required textures after copy: ${stillMissing.join(', ')}`);
            }

        } catch (err) {
            console.error('Error during asset copy:', err.message);
            throw err;
        }

        console.log('\n✓ Asset copy process completed successfully!');
    } catch (error) {
        console.error('\n✗ Asset copy failed:', error);
        process.exit(1);
    }
}

// Run the copy process
copyAssets(); 