const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// In-memory cache for fast access and seamless serverless mutations
const memoryCache = {};

function readData(filename) {
  if (memoryCache[filename]) {
    return memoryCache[filename];
  }
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    memoryCache[filename] = data;
    return data;
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
    return [];
  }
}

function writeData(filename, data) {
  memoryCache[filename] = data;
  try {
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    // Graceful fallback for serverless read-only filesystems (such as Vercel)
    console.warn(`Disk persistence skipped for ${filename} (serverless environment):`, err.message);
  }
  return true;
}

module.exports = {
  readData,
  writeData
};
