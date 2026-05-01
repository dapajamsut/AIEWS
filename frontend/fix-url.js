const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'app');

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = fs.statSync(dirFile).isDirectory() ? walkSync(dirFile, filelist) : filelist.concat(dirFile);
    } catch (err) {
      if (err.code === 'ENOENT' || err.code === 'EACCES') {
        console.log(`Skipping file/directory due to permission or not found: ${dirFile}`);
      } else {
        throw err;
      }
    }
  });
  return filelist;
}

const files = walkSync(directoryPath);

files.forEach(file => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Replace hardcoded variables
    if (content.includes('const BACKEND_URL = "http://localhost:8002";')) {
      content = content.replace(
        /const BACKEND_URL = "http:\/\/localhost:8002";/g,
        'const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002";'
      );
      changed = true;
    }

    // Replace inline fetch URLs
    if (content.includes('"http://localhost:8002')) {
      content = content.replace(
        /"http:\/\/localhost:8002([^"]*)"/g,
        '`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002"}$1`'
      );
      changed = true;
    }

    // Replace backtick fetch URLs (e.g. `http://localhost:8002/api/weather?region=${regionId}`)
    if (content.includes('`http://localhost:8002')) {
      content = content.replace(
        /`http:\/\/localhost:8002([^`]*)`/g,
        '`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002"}$1`'
      );
      changed = true;
    }

    // Replace 127.0.0.1:8000
    if (content.includes('"http://127.0.0.1:8000')) {
      content = content.replace(
        /"http:\/\/127\.0\.0\.1:8000([^"]*)"/g,
        '`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}$1`'
      );
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Updated ${file}`);
    }
  }
});
