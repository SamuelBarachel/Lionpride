const express = require('express');
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Get transactions
router.get('/', async (req, res) => {
  try {
    const { type, start_date, end_date, limit = 50, offset = 0 } = req.query;
    let q = `SELECT t.*, g.breed, g.gender FROM transactions t LEFT JOIN goats g ON t.goat_id = g.id
             WHERE t.owner_id = $1`;
    const params = [req.user.id];
    let idx = 2;
    if (type) { q += ` AND t.type = $${idx++}`; params.push(type); }
    if (start_date) { q += ` AND t.transaction_date >= $${idx++}`; params.push(start_date); }
    if (end_date) { q += ` AND t.transaction_date <= $${idx++}`; params.push(end_date); }
    q += ` ORDER BY t.transaction_date DESC, t.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(parseInt(limit), parseInt(offset));
    const result = await pool.query(q, params);

    const totals = await pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN type='buy' THEN amount END), 0) AS total_spent,
        COALESCE(SUM(CASE WHEN type='sell' THEN amount END), 0) AS total_earned,
        COUNT(*) AS count
       FROM transactions WHERE owner_id=$1`,
      [req.user.id]
    );
    res.json({ transactions: result.rows, summary: totals.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create transaction
router.post('/', async (req, res) => {
  const { type, goat_id, goat_tag, goat_name, amount, transaction_date, counterparty, payment_method, notes } = req.body;
  if (!type || !amount || !transaction_date) {
    return res.status(400).json({ error: 'Type, amount, and date are required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO transactions (type, goat_id, goat_tag, goat_name, amount, transaction_date, counterparty, payment_method, notes, owner_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [type, goat_id || null, goat_tag, goat_name, amount, transaction_date, counterparty, payment_method, notes, req.user.id]
    );
    // If selling, update goat status
    if (type === 'sell' && goat_id) {
      await pool.query('UPDATE goats SET status=$1, updated_at=NOW() WHERE id=$2 AND owner_id=$3', ['sold', goat_id, req.user.id]);
    }
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete transaction
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM transactions WHERE id=$1 AND owner_id=$2 RETURNING id', [req.params.id, req.user.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
