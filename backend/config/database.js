const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../blog-data.json');
let db = { users: [], posts: [], comments: [] };

const initDatabase = () => {
  // Load existing data if file exists
  if (fs.existsSync(dbPath)) {
    try {
      const data = fs.readFileSync(dbPath, 'utf8');
      db = JSON.parse(data);
      console.log('Loaded existing database');
    } catch (error) {
      console.log('Creating new database');
    }
  } else {
    console.log('Creating new database');
  }
};

const saveDatabase = () => {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
};

const getDb = () => db;

module.exports = { initDatabase, getDb, saveDatabase };
