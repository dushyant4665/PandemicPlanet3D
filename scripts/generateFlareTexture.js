const fs = require('fs');
const { createCanvas } = require('canvas');

// Create a canvas
const canvas = createCanvas(512, 512);
const ctx = canvas.getContext('2d');

// Create radial gradient
const gradient = ctx.createRadialGradient(
    256, 256, 0,    // Inner circle center and radius
    256, 256, 256   // Outer circle center and radius
);

// Add color stops
gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');    // Bright center
gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)'); // Bright inner glow
gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)'); // Medium glow
gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.2)'); // Outer glow
gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');    // Transparent edge

// Fill with gradient
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 512, 512);

// Add some noise for more realistic look
for (let i = 0; i < 1000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const radius = Math.random() * 2;
    const opacity = Math.random() * 0.1;
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.fill();
}

// Save the image
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('public/assets/sun/flare.png', buffer);

console.log('Flare texture generated successfully!'); 