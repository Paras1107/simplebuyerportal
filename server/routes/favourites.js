const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { parsePropertyId } = require('../validation');

const router = express.Router();

function favouriteRow(row) {
  return {
    favouriteId: row.favourite_id,
    property: {
      id: row.property_id,
      title: row.title,
      address: row.address,
      priceCents: row.price_cents,
      priceDisplay: (row.price_cents / 100).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      }),
    },
  };
}

router.use(requireAuth);

router.get('/', (req, res, next) => {
  try {
    const userId = req.user.id;
    const rows = db
      .prepare(
        `SELECT f.id AS favourite_id, p.id AS property_id, p.title, p.address, p.price_cents
         FROM favourites f
         JOIN properties p ON p.id = f.property_id
         WHERE f.user_id = ?
         ORDER BY f.id ASC`,
      )
      .all(userId);
    res.json({ favourites: rows.map(favouriteRow) });
  } catch (err) {
    next(err);
  }
});

router.post('/', (req, res, next) => {
  try {
    const parsed = parsePropertyId(req.body.propertyId);
    if (parsed.error) {
      return res.status(400).json({ error: parsed.error });
    }
    const userId = req.user.id;
    const property = db.prepare('SELECT id FROM properties WHERE id = ?').get(parsed.id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    const existing = db
      .prepare('SELECT id FROM favourites WHERE user_id = ? AND property_id = ?')
      .get(userId, parsed.id);
    if (existing) {
      return res.status(200).json({
        message: 'Already in favourites',
        favouriteId: existing.id,
      });
    }
    const info = db
      .prepare(
        'INSERT INTO favourites (user_id, property_id) VALUES (?, ?)',
      )
      .run(userId, parsed.id);
    return res.status(201).json({
      message: 'Added to favourites',
      favouriteId: Number(info.lastInsertRowid),
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:favouriteId', (req, res, next) => {
  try {
    const favId = Number(req.params.favouriteId);
    if (!Number.isInteger(favId) || favId < 1) {
      return res.status(400).json({ error: 'Invalid favourite id' });
    }
    const row = db
      .prepare('SELECT id FROM favourites WHERE id = ? AND user_id = ?')
      .get(favId, req.user.id);
    if (!row) {
      return res.status(404).json({ error: 'Favourite not found' });
    }
    db.prepare('DELETE FROM favourites WHERE id = ?').run(favId);
    return res.json({ message: 'Removed from favourites' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
