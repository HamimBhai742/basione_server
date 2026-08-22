const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const folder = "c:\\Projects\\basione\\basione-client\\public\\business-templte-mockups";

async function analyzeHole(file) {
  const filePath = path.join(folder, file);
  const image = sharp(filePath);
  const { width, height } = await image.metadata();
  
  const { data } = await image.raw().toBuffer({ resolveWithObject: true });
  
  // Find bounding box of pixels that are COMPLETELY transparent (alpha === 0)
  let minX = width;
  let maxX = -1;
  let minY = height;
  let maxY = -1;
  let transparentCount = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3];
      if (alpha === 0) {
        transparentCount++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (transparentCount === 0) {
    console.log(`${file}: Size ${width}x${height}. No completely transparent pixels (alpha=0) found.`);
    
    // Let's count alpha threshold distributions
    let alphaCounts = {};
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i+3];
      alphaCounts[a] = (alphaCounts[a] || 0) + 1;
    }
    console.log(`  Alpha values distribution (top 5):`, Object.entries(alphaCounts).sort((a,b)=>b[1]-a[1]).slice(0, 5));
  } else {
    const boxWidth = maxX - minX + 1;
    const boxHeight = maxY - minY + 1;
    const topPct = ((minY / height) * 100).toFixed(2);
    const leftPct = ((minX / width) * 100).toFixed(2);
    const rightPct = (((width - maxX - 1) / width) * 100).toFixed(2);
    const bottomPct = (((height - maxY - 1) / height) * 100).toFixed(2);
    
    console.log(`${file}: Size ${width}x${height}. Transparent hole (alpha=0):`);
    console.log(`  Pixels: x=${minX}..${maxX} (${boxWidth}px), y=${minY}..${maxY} (${boxHeight}px)`);
    console.log(`  Percentages: top=${topPct}%, left=${leftPct}%, right=${rightPct}%, bottom=${bottomPct}%`);
  }
}

async function run() {
  const files = fs.readdirSync(folder).filter(f => f.endsWith('.png'));
  for (const file of files) {
    await analyzeHole(file);
  }
}

run().catch(console.error);
