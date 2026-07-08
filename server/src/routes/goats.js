const express = require('express');
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Get all goats
router.get('/', async (req, res) => {
  try {
    const { status, gender, search } = req.query;
    let q = `SELECT g.*, p.name AS parent_name, p.tag_number AS parent_tag
             FROM goats g LEFT JOIN goats p ON g.parent_id = p.id
             WHERE g.owner_id = $1`;
    const params = [req.user.id];
    let idx = 2;
    if (status) { q += ` AND g.status = $${idx++}`; params.push(status); }
    if (gender) { q += ` AND g.gender = $${idx++}`; params.push(gender); }
    if (search) { q += ` AND (g.name ILIKE $${idx} OR g.tag_number ILIKE $${idx++})`; params.push(`%${search}%`); }
    q += ' ORDER BY g.created_at DESC';
    const result = await pool.query(q, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single goat with full details
router.get('/:id', async (req, res) => {
  try {
    const goat = await pool.query(
      `SELECT g.*, p.name AS parent_name, p.tag_number AS parent_tag
       FROM goats g LEFT JOIN goats p ON g.parent_id = p.id
       WHERE g.id = $1 AND g.owner_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!goat.rows[0]) return res.status(404).json({ error: 'Goat not found' });
    const health = await pool.query(
      'SELECT * FROM health_records WHERE goat_id=$1 ORDER BY record_date DESC LIMIT 10',
      [req.params.id]
    );
    const weights = await pool.query(
      'SELECT * FROM weight_records WHERE goat_id=$1 ORDER BY record_date DESC LIMIT 20',
      [req.params.id]
    );
    const offspring = await pool.query(
      'SELECT id, tag_number, name, gender, status FROM goats WHERE parent_id=$1 AND owner_id=$2',
      [req.params.id, req.user.id]
    );
    res.json({ ...goat.rows[0], health_records: health.rows, weight_records: weights.rows, offspring: offspring.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create goat
router.post('/', async (req, res) => {
  const { tag_number, name, breed, gender, date_of_birth, purchase_date, purchase_price, current_weight, color, notes, parent_id, status } = req.body;
  if (!tag_number || !gender) return res.status(400).json({ error: 'Tag number and gender are required' });
  try {
    // Validate parent_id belongs to the same owner
    let resolvedParentId = null;
    if (parent_id) {
      const parentCheck = await pool.query('SELECT id FROM goats WHERE id=$1 AND owner_id=$2', [parent_id, req.user.id]);
      if (!parentCheck.rows[0]) return res.status(400).json({ error: 'Invalid parent: goat not found or not yours' });
      resolvedParentId = parent_id;
    }

    const result = await pool.query(
      `INSERT INTO goats (tag_number, name, breed, gender, date_of_birth, purchase_date, purchase_price, current_weight, color, notes, parent_id, status, owner_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [tag_number, name, breed, gender, date_of_birth || null, purchase_date || null, purchase_price || null, current_weight || null, color, notes, resolvedParentId, status || 'active', req.user.id]
    );
    // Log weight if provided
    if (current_weight) {
      await pool.query(
        'INSERT INTO weight_records (goat_id, record_date, weight, owner_id) VALUES ($1, NOW(), $2, $3)',
        [result.rows[0].id, current_weight, req.user.id]
      );
    }
    // Log purchase as transaction if price given
    if (purchase_price && purchase_date) {
      await pool.query(
        `INSERT INTO transactions (type, goat_id, goat_tag, goat_name, amount, transaction_date, owner_id)
         VALUES ('buy', $1, $2, $3, $4, $5, $6)`,
        [result.rows[0].id, tag_number, name, purchase_price, purchase_date, req.user.id]
      );
    }
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Tag number already exists' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update goat
router.put('/:id', async (req, res) => {
  const { tag_number, name, breed, gender, date_of_birth, purchase_date, purchase_price, current_weight, color, notes, parent_id, status } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM goats WHERE id=$1 AND owner_id=$2', [req.params.id, req.user.id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Goat not found' });
    const old = existing.rows[0];
    const result = await pool.query(
      `UPDATE goats SET tag_number=COALESCE($1,tag_number), name=COALESCE($2,name), breed=COALESCE($3,breed),
       gender=COALESCE($4,gender), date_of_birth=COALESCE($5,date_of_birth), purchase_date=COALESCE($6,purchase_date),
       purchase_price=COALESCE($7,purchase_price), current_weight=COALESCE($8,current_weight), color=COALESCE($9,color),
       notes=COALESCE($10,notes), parent_id=COALESCE($11,parent_id), status=COALESCE($12,status), updated_at=NOW()
       WHERE id=$13 AND owner_id=$14 RETURNING *`,
      [tag_number, name, breed, gender, date_of_birth || null, purchase_date || null, purchase_price || null, current_weight || null, color, notes, parent_id || null, status, req.params.id, req.user.id]
    );
    // Log new weight if changed
    if (current_weight && current_weight !== old.current_weight) {
      await pool.query(
        'INSERT INTO weight_records (goat_id, record_date, weight, owner_id) VALUES ($1, NOW(), $2, $3)',
        [req.params.id, current_weight, req.user.id]
      );
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete goat
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM goats WHERE id=$1 AND owner_id=$2 RETURNING id', [req.params.id, req.user.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Goat not found' });
    res.json({ message: 'Goat deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
