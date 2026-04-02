const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'portal.db');

function openDb() {
  const fs = require('fs');
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

const db = openDb();

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'buyer'
    );

    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      address TEXT NOT NULL,
      price_cents INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS favourites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      property_id INTEGER NOT NULL,
      UNIQUE (user_id, property_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    );
  `);

  // If the DB already existed from a previous run, add the new columns.
  const columns = db
    .prepare('PRAGMA table_info(properties)')
    .all()
    .map((c) => c.name);
  if (!columns.includes('description')) {
    db.exec('ALTER TABLE properties ADD COLUMN description TEXT');
  }
  if (!columns.includes('image_url')) {
    db.exec('ALTER TABLE properties ADD COLUMN image_url TEXT');
  }

  const count = db.prepare('SELECT COUNT(*) AS c FROM properties').get().c;
  if (count === 0) {
    const insert = db.prepare(
      'INSERT INTO properties (title, address, price_cents, description, image_url) VALUES (?, ?, ?, ?, ?)',
    );
    const seed = [
      [
        'Victorian terrace',
        '12 Maple St, Springfield',
        450_000_00,
        'Charming Victorian terrace with original features, bright bay windows, and a low-maintenance courtyard. Ideal for first-time buyers who want character and space.',
        '/images/property-1.svg',
      ],
      [
        'Modern loft',
        '88 River Rd, Springfield',
        320_000_00,
        'Contemporary loft with open-plan living, floor-to-ceiling windows, and a sleek kitchen. Walk to shops and transit; perfect for city-focused lifestyles.',
        '/images/property-2.svg',
      ],
      [
        'Family bungalow',
        '5 Oak Ave, Springfield',
        275_000_00,
        'Warm family bungalow with three bedrooms, a generous backyard, and an inviting living room. Great layout for family life with room to grow.',
        '/images/property-3.svg',
      ],
    ];
    const txn = db.transaction((rows) => {
      for (const row of rows) insert.run(...row);
    });
    txn(seed);
  } else {
    // Backfill new columns for existing seeded rows (best-effort).
    const backfill = db.transaction((rows) => {
      for (const row of rows) {
        db.prepare(
          `UPDATE properties
           SET
             description = COALESCE(NULLIF(description, ''), ?),
             image_url = COALESCE(NULLIF(image_url, ''), ?)
           WHERE title = ?`,
        ).run(row.description, row.imageUrl, row.title);
      }
    });

    backfill([
      {
        title: 'Victorian terrace',
        description:
          'Charming Victorian terrace with original features, bright bay windows, and a low-maintenance courtyard. Ideal for first-time buyers who want character and space.',
        imageUrl: '/images/property-1.svg',
      },
      {
        title: 'Modern loft',
        description:
          'Contemporary loft with open-plan living, floor-to-ceiling windows, and a sleek kitchen. Walk to shops and transit; perfect for city-focused lifestyles.',
        imageUrl: '/images/property-2.svg',
      },
      {
        title: 'Family bungalow',
        description:
          'Warm family bungalow with three bedrooms, a generous backyard, and an inviting living room. Great layout for family life with room to grow.',
        imageUrl: '/images/property-3.svg',
      },
    ]);
  }
}

initSchema();

module.exports = db;
