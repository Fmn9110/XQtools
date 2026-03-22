const fs = require('fs');
const path = require('path');
const dataContent = fs.readFileSync('c:/Users/RanQi/Desktop/web/assets/js/data.js', 'utf8');
const toolMatches = [...dataContent.matchAll(/\[(\d+),\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\]/g)];
const results = { implemented: [], placeholder: [], missing: [] };
toolMatches.forEach(match => {
    const id = parseInt(match[1]);
    const name = match[2];
    const cat = match[3];
    const slug = match[4];
    const filePath = path.join('c:/Users/RanQi/Desktop/web', 'tools', cat, slug + '.html');
    if (!fs.existsSync(filePath)) {
        results.missing.push({id, cat, slug, name});
    } else {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('填充交互功能')) {
            results.placeholder.push({id, cat, slug, name});
        } else {
            results.implemented.push({id, cat, slug, name});
        }
    }
});
fs.writeFileSync('c:/Users/RanQi/Desktop/web/status_report.json', JSON.stringify(results, null, 2));
console.log('Report saved to status_report.json');
console.log('Missing:', results.missing.length);
console.log('Placeholder:', results.placeholder.length);
console.log('Implemented:', results.implemented.length);
