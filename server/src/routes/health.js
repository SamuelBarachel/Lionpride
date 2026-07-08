const express = require('express');
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Get all health records
router.get('/', async (req, res) => {
  try {
    const { goat_id, type, upcoming } = req.query;
    let q = `SELECT h.*, g.name AS goat_name, g.tag_number
             FROM health_records h JOIN goats g ON h.goat_id = g.id
             WHERE h.owner_id = $1`;
    const params = [req.user.id];
    let idx = 2;
    if (goat_id) { q += ` AND h.goat_id = $${idx++}`; params.push(goat_id); }
    if (type) { q += ` AND h.record_type = $${idx++}`; params.push(type); }
    if (upcoming === 'true') {
      q += ` AND h.next_due_date IS NOT NULL AND h.next_due_date >= NOW() AND h.next_due_date <= NOW() + INTERVAL '30 days'`;
    }
    q += ' ORDER BY h.record_date DESC';
    const result = await pool.query(q, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create health record
router.post('/', async (req, res) => {
  const { goat_id, record_date, record_type, description, treatment, medication, cost, vet_name, next_due_date } = req.body;
  if (!goat_id || !record_date || !record_type || !description) {
    return res.status(400).json({ error: 'goat_id, date, type, and description required' });
  }
  try {
    // Verify goat belongs to user
    const goat = await pool.query('SELECT id FROM goats WHERE id=$1 AND owner_id=$2', [goat_id, req.user.id]);
    if (!goat.rows[0]) return res.status(404).json({ error: 'Goat not found' });
    const result = await pool.query(
      `INSERT INTO health_records (goat_id, record_date, record_type, description, treatment, medication, cost, vet_name, next_due_date, owner_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [goat_id, record_date, record_type, description, treatment, medication, cost || null, vet_name, next_due_date || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update health record
router.put('/:id', async (req, res) => {
  const { record_date, record_type, description, treatment, medication, cost, vet_name, next_due_date } = req.body;
  try {
    const result = await pool.query(
      `UPDATE health_records SET record_date=COALESCE($1,record_date), record_type=COALESCE($2,record_type),
       description=COALESCE($3,description), treatment=COALESCE($4,treatment), medication=COALESCE($5,medication),
       cost=COALESCE($6,cost), vet_name=COALESCE($7,vet_name), next_due_date=COALESCE($8,next_due_date)
       WHERE id=$9 AND owner_id=$10 RETURNING *`,
      [record_date, record_type, description, treatment, medication, cost || null, vet_name, next_due_date || null, req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete health record
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM health_records WHERE id=$1 AND owner_id=$2 RETURNING id', [req.params.id, req.user.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
