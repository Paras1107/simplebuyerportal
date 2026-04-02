const express = require('express');
const db = require('../db');

const router = express.Router();

function formatProperty(row) {
  return {
    id: row.id,
    title: row.title,
    address: row.address,
    priceCents: row.price_cents,
    description: row.description,
    imageUrl: row.image_url,
    priceDisplay: (row.price_cents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    }),
  };
}

router.get('/', (req, res, next) => {
  try {
    const pageRaw = Number(req.query.page ?? 1);
    const limitRaw = Number(req.query.limit ?? 10);

    const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const limit =
      Number.isInteger(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 10) : 10;
    const offset = (page - 1) * limit;

    const total = db
      .prepare('SELECT COUNT(*) AS c FROM properties')
      .get().c;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const rows = db
      .prepare(
        `SELECT id, title, address, price_cents, description, image_url
         FROM properties
         ORDER BY id ASC
         LIMIT ? OFFSET ?`,
      )
      .all(limit, offset);

    res.json({
      properties: rows.map(formatProperty),
      page,
      limit,
      total,
      totalPages,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
