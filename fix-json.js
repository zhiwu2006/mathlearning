const fs = require('fs');

// Read the file
let content = fs.readFileSync('data/periodic-problems.json', 'utf8');

// Fix common unescaped quote patterns
const fixes = [
    // Fix text fields with unescaped quotes
    /("text":\s*"[^"]*?)"([^"]*)"([^"]*")/g,
    // Fix feedback fields with unescaped quotes
    /("feedback":\s*"[^"]*?)"([^"]*)"([^"]*")/g,
    // Fix prompt fields with unescaped quotes
    /("prompt":\s*"[^"]*?)"([^"]*)"([^"]*")/g,
];

content = content.replace(/("text":\s*"[^"]*?)"([^"]*)"([^"]*")/g, '$1\\\"$2\\\"$3');
content = content.replace(/("feedback":\s*"[^"]*?)"([^"]*)"([^"]*")/g, '$1\\\"$2\\\"$3');
content = content.replace(/("prompt":\s*"[^"]*?)"([^"]*)"([^"]*")/g, '$1\\\"$2\\\"$3');

// Write back
fs.writeFileSync('data/periodic-problems.json', content, 'utf8');

console.log('JSON fix attempt completed');