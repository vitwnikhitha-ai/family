import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// JSON database file configuration
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

let useMockDb = false;

// Mock database initial state
const defaultDbState = {
  users: [],
  members: [],
  documents: []
};

// Load JSON db helper
function loadJsonDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDbState, null, 2));
    return defaultDbState;
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read mock database file, using empty state:', error);
    return defaultDbState;
  }
}

// Save JSON db helper
function saveJsonDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to write mock database file:', error);
  }
}

// Generate MongoDB-like Object ID
function generateId() {
  return crypto.randomBytes(12).toString('hex');
}

// Helper to filter items based on object matching
function matchQuery(item, query) {
  if (!query) return true;
  for (const key in query) {
    if (query[key] && typeof query[key] === 'object' && !Array.isArray(query[key])) {
      // Handle operators like $or, $regex
      if (key === '$or') {
        return query.$or.some(q => matchQuery(item, q));
      }
      // Check nested objects
      continue;
    }
    
    // Exact match or Regex match
    if (query[key] instanceof RegExp) {
      if (!query[key].test(item[key])) return false;
    } else if (typeof query[key] === 'string' && query[key].startsWith('/') && query[key].endsWith('/')) {
      // Parse string regex
      const cleanRegex = query[key].slice(1, -1);
      const re = new RegExp(cleanRegex, 'i');
      if (!re.test(item[key])) return false;
    } else if (item[key] !== query[key]) {
      // Cast to string for IDs
      if (item[key]?.toString() !== query[key]?.toString()) {
        return false;
      }
    }
  }
  return true;
}

// Setup standard mock model
class MockModel {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  async find(query = {}) {
    const db = loadJsonDb();
    const items = db[this.collectionName].filter(item => matchQuery(item, query));
    return new QueryChain(items, this.collectionName);
  }

  async findOne(query = {}) {
    const db = loadJsonDb();
    const item = db[this.collectionName].find(item => matchQuery(item, query));
    return item ? { ...item } : null;
  }

  async findById(id) {
    const db = loadJsonDb();
    const item = db[this.collectionName].find(item => item._id === id.toString());
    return item ? new QueryDocument(item, this.collectionName) : null;
  }

  async create(data) {
    const db = loadJsonDb();
    const newItem = {
      _id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    db[this.collectionName].push(newItem);
    saveJsonDb(db);
    return new QueryDocument(newItem, this.collectionName);
  }

  async findByIdAndUpdate(id, updateData, options = { new: true }) {
    const db = loadJsonDb();
    const index = db[this.collectionName].findIndex(item => item._id === id.toString());
    if (index === -1) return null;

    const currentItem = db[this.collectionName][index];
    const updatedItem = {
      ...currentItem,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    db[this.collectionName][index] = updatedItem;
    saveJsonDb(db);
    return new QueryDocument(updatedItem, this.collectionName);
  }

  async findByIdAndDelete(id) {
    const db = loadJsonDb();
    const index = db[this.collectionName].findIndex(item => item._id === id.toString());
    if (index === -1) return null;
    const item = db[this.collectionName][index];
    db[this.collectionName].splice(index, 1);
    saveJsonDb(db);
    return item;
  }

  async countDocuments(query = {}) {
    const db = loadJsonDb();
    return db[this.collectionName].filter(item => matchQuery(item, query)).length;
  }
}

// Wrapper for documents returned from Mock DB to mimic mongoose .save() and JSON conversion
class QueryDocument {
  constructor(data, collectionName) {
    Object.assign(this, data);
    this._collectionName = collectionName;
  }

  async populate(fields) {
    const db = loadJsonDb();
    const fieldList = typeof fields === 'string' ? fields.split(' ') : fields;
    
    fieldList.forEach(field => {
      if (!this[field]) return;

      if (Array.isArray(this[field])) {
        this[field] = this[field].map(id => {
          const targetCol = field === 'children' ? 'members' : field;
          return db[targetCol]?.find(item => item._id === id.toString()) || id;
        });
      } else {
        const targetCol = field === 'memberProfile' ? 'users' : 'members';
        this[field] = db[targetCol]?.find(item => item._id === this[field].toString()) || this[field];
      }
    });
    return this;
  }

  toObject() {
    const obj = { ...this };
    delete obj._collectionName;
    return obj;
  }

  toJSON() {
    return this.toObject();
  }

  async save() {
    const db = loadJsonDb();
    const index = db[this._collectionName].findIndex(item => item._id === this._id);
    const plainObject = this.toObject();
    plainObject.updatedAt = new Date().toISOString();
    
    if (index === -1) {
      db[this._collectionName].push(plainObject);
    } else {
      db[this._collectionName][index] = plainObject;
    }
    saveJsonDb(db);
    return this;
  }
}

// Wrapper for array returned from Mock DB to support .populate(), .sort(), .lean()
class QueryChain extends Array {
  constructor(items, collectionName) {
    if (typeof items === 'number') {
      super(items);
    } else {
      super(...(items || []));
    }
    this.collectionName = collectionName;
  }

  populate(fields) {
    const db = loadJsonDb();
    const fieldList = typeof fields === 'string' ? fields.split(' ') : fields;
    
    const populated = this.map(item => {
      const copy = { ...item };
      fieldList.forEach(field => {
        if (!copy[field]) return;

        // If field is an array of IDs (like children)
        if (Array.isArray(copy[field])) {
          copy[field] = copy[field].map(id => {
            const targetCol = field === 'children' ? 'members' : field;
            return db[targetCol]?.find(item => item._id === id.toString()) || id;
          });
        } else {
          // Single ID (father, mother, spouse, memberProfile)
          const targetCol = field === 'memberProfile' ? 'users' : 'members';
          copy[field] = db[targetCol]?.find(item => item._id === copy[field].toString()) || copy[field];
        }
      });
      return copy;
    });

    return new QueryChain(populated, this.collectionName);
  }

  sort(sortOption) {
    // Basic sorting mock: sorts by key ascending/descending
    if (!sortOption || typeof sortOption !== 'object') return this;
    const key = Object.keys(sortOption)[0];
    const direction = sortOption[key];

    const sorted = [...this].sort((a, b) => {
      if (a[key] < b[key]) return direction === -1 ? 1 : -1;
      if (a[key] > b[key]) return direction === -1 ? -1 : 1;
      return 0;
    });
    return new QueryChain(sorted, this.collectionName);
  }

  lean() {
    return this.map(item => {
      if (item instanceof QueryDocument) return item.toObject();
      return item;
    });
  }
}

// Exports DB interface
const db = {
  isMock: false,
  Member: null,
  User: null,
  Document: null,
  
  async connect() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.log('⚠️  No MONGODB_URI environment variable detected. Falling back to local JSON database.');
      this.setupMockDb();
      return;
    }

    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000 // fail quickly
      });
      console.log('✅ Connected to MongoDB successfully.');
      
      // Load real Mongoose models
      const Member = (await import('../models/Member.js')).default;
      const User = (await import('../models/User.js')).default;
      const Document = (await import('../models/Document.js')).default;

      this.Member = Member;
      this.User = User;
      this.Document = Document;
      this.isMock = false;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      console.log('⚠️ Falling back to local JSON database.');
      this.setupMockDb();
    }
  },

  setupMockDb() {
    this.isMock = true;
    this.Member = new MockModel('members');
    this.User = new MockModel('users');
    this.Document = new MockModel('documents');
    
    // Ensure mock DB is initialized
    loadJsonDb();
    console.log(`📂 Mock DB initialized at: ${DB_FILE}`);
  }
};

export default db;
