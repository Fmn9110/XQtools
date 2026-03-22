const fs = require('fs');
const path = require('path');

const toolsDir = path.join(__dirname, 'tools');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else if (filePath.endsWith('.html')) {
            results.push(filePath);
        }
    });
    return results;
}

const allHtmlFiles = walk(toolsDir);
let brokenLinks = [];

allHtmlFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check href="..."
    const hrefRegex = /href=["']([^"']+)["']/g;
    let match;
    while ((match = hrefRegex.exec(content)) !== null) {
        const link = match[1];
        if (link.startsWith('http') || link.startsWith('mailto:') || link.startsWith('#') || link.startsWith('data:')) continue;
        
        const targetPath = path.resolve(path.dirname(file), link.split('?')[0].split('#')[0]);
        if (!fs.existsSync(targetPath)) {
            brokenLinks.push({ source: file, target: link, resolved: targetPath });
        }
    }

    // Check location.href='...'
    const locRegex = /location\.href=["']([^"']+)["']/g;
    while ((match = locRegex.exec(content)) !== null) {
        const link = match[1];
        if (link.startsWith('http')) continue;
        
        const targetPath = path.resolve(path.dirname(file), link.split('?')[0].split('#')[0]);
        if (!fs.existsSync(targetPath)) {
            brokenLinks.push({ source: file, target: link, resolved: targetPath });
        }
    }
});

if (brokenLinks.length > 0) {
    console.log(`Found ${brokenLinks.length} broken links:`);
    brokenLinks.forEach(b => {
        const relSource = path.relative(__dirname, b.source);
        console.log(`[${relSource}] -> ${b.target}`);
    });
} else {
    console.log('No broken links found!');
}
