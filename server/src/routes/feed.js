const express = require('express');
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let q = 'SELECT * FROM feed_records WHERE owner_id=$1';
    const params = [req.user.id];
    let idx = 2;
    if (start_date) { q += ` AND record_date >= $${idx++}`; params.push(start_date); }
    if (end_date) { q += ` AND record_date <= $${idx++}`; params.push(end_date); }
    q += ' ORDER BY record_date DESC';
    const result = await pool.query(q, params);
    const summary = await pool.query(
      'SELECT COALESCE(SUM(cost), 0) AS total_cost, COUNT(*) AS count FROM feed_records WHERE owner_id=$1',
      [req.user.id]
    );
    res.json({ records: result.rows, summary: summary.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  const { record_date, feed_type, quantity, unit, cost, supplier, notes } = req.body;
  if (!record_date || !feed_type) return res.status(400).json({ error: 'Date and feed type required' });
  try {
    const result = await pool.query(
      'INSERT INTO feed_records (record_date, feed_type, quantity, unit, cost, supplier, notes, owner_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [record_date, feed_type, quantity || null, unit, cost || null, supplier, notes, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM feed_records WHERE id=$1 AND owner_id=$2 RETURNING id', [req.params.id, req.user.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
