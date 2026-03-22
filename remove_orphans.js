const fs = require('fs');
const path = require('path');

// 1. Read all valid slugs from data.js
const dataContent = fs.readFileSync('c:/Users/RanQi/Desktop/web/assets/js/data.js', 'utf8');
const slugMatches = [...dataContent.matchAll(/\[\d+,\s*"[^"]+",\s*"([^"]+)",\s*"([^"]+)"/g)];
const validSlugs = new Set();
slugMatches.forEach(m => validSlugs.add(m[2]));

let removedCount = 0;

// 2. Scan tools directory
const toolsDir = 'c:/Users/RanQi/Desktop/web/tools';
if (fs.existsSync(toolsDir)) {
    const categories = fs.readdirSync(toolsDir);
    categories.forEach(cat => {
        const catPath = path.join(toolsDir, cat);
        if (fs.statSync(catPath).isDirectory()) {
            const files = fs.readdirSync(catPath);
            files.forEach(file => {
                if (file.endsWith('.html')) {
                    const slug = file.replace('.html', '');
                    if (!validSlugs.has(slug)) {
                        fs.unlinkSync(path.join(catPath, file));
                        console.log('Removed orphan file:', path.join(cat, file));
                        removedCount++;
                    }
                }
            });
        }
    });
}

console.log('Orphan cleanup complete. Removed:', removedCount, 'files.');
