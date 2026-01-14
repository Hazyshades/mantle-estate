const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const docsBuildPath = path.join(__dirname, '../../frontend/docusaurus-docs/build');
const distDocsPath = path.join(__dirname, '../frontend/dist/docs');

// Check if docs build exists
if (!fs.existsSync(docsBuildPath)) {
  console.error('Error: Docusaurus build not found at', docsBuildPath);
  console.error('Please run: cd frontend/docusaurus-docs && bun run build');
  process.exit(1);
}

// Create dist/docs directory if it doesn't exist
if (!fs.existsSync(distDocsPath)) {
  fs.mkdirSync(distDocsPath, { recursive: true });
}

// Copy files recursively
function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const files = fs.readdirSync(src);
    files.forEach(file => {
      copyRecursive(
        path.join(src, file),
        path.join(dest, file)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log('Copying Docusaurus docs from', docsBuildPath, 'to', distDocsPath);
copyRecursive(docsBuildPath, distDocsPath);
console.log('Docs copied successfully!');
