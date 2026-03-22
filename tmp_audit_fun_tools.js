const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\RanQi\\Desktop\\web\\tools\\fun';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const results = [];

files.forEach(file => {
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    const hasViewport = content.includes('name="viewport"');
    const hasTailwind = content.includes('cdn.tailwindcss.com');
    const hasMainCss = content.includes('assets/css/main.css');
    
    // Check for potential non-responsive patterns
    // e.g., width: [large number]px or style="width: [large number]px"
    const fixedWidthMatch = content.match(/width:\s*([4-9]\d{2,}|[1-9]\d{3,})px/g);
    
    results.push({
        file,
        hasViewport,
        hasTailwind,
        hasMainCss,
        fixedWidths: fixedWidthMatch ? fixedWidthMatch.join(', ') : 'none'
    });
});

console.log(JSON.stringify(results, null, 2));
