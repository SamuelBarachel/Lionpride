const express = require('express');
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const uid = req.user.id;

    const [herd, transactions, alerts, monthly, feed] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status='active') AS total_active,
          COUNT(*) FILTER (WHERE gender='male' AND status='active') AS total_bucks,
          COUNT(*) FILTER (WHERE gender='female' AND status='active') AS total_does,
          COUNT(*) FILTER (WHERE status='sold') AS total_sold,
          AVG(current_weight) FILTER (WHERE status='active') AS avg_weight
        FROM goats WHERE owner_id=$1
      `, [uid]),
      pool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN type='sell' THEN amount END), 0) AS total_income,
          COALESCE(SUM(CASE WHEN type='buy' THEN amount END), 0) AS total_spend,
          COUNT(CASE WHEN type='sell' THEN 1 END) AS sell_count,
          COUNT(CASE WHEN type='buy' THEN 1 END) AS buy_count
        FROM transactions WHERE owner_id=$1
      `, [uid]),
      pool.query(`
        SELECT h.*, g.name AS goat_name, g.tag_number
        FROM health_records h JOIN goats g ON h.goat_id=g.id
        WHERE h.owner_id=$1 AND h.next_due_date IS NOT NULL
          AND h.next_due_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'
        ORDER BY h.next_due_date ASC LIMIT 5
      `, [uid]),
      pool.query(`
        SELECT
          DATE_TRUNC('month', transaction_date) AS month,
          COALESCE(SUM(CASE WHEN type='sell' THEN amount END),0) AS income,
          COALESCE(SUM(CASE WHEN type='buy' THEN amount END),0) AS spend
        FROM transactions WHERE owner_id=$1
          AND transaction_date >= NOW() - INTERVAL '6 months'
        GROUP BY 1 ORDER BY 1
      `, [uid]),
      pool.query(`
        SELECT COALESCE(SUM(cost),0) AS total_feed_cost
        FROM feed_records WHERE owner_id=$1
          AND record_date >= DATE_TRUNC('month', NOW())
      `, [uid]),
    ]);

    const recentGoats = await pool.query(
      'SELECT id, tag_number, name, breed, gender, status, current_weight, created_at FROM goats WHERE owner_id=$1 ORDER BY created_at DESC LIMIT 5',
      [uid]
    );

    res.json({
      herd: herd.rows[0],
      finance: {
        ...transactions.rows[0],
        net_profit: transactions.rows[0].total_income - transactions.rows[0].total_spend,
        monthly_feed_cost: feed.rows[0].total_feed_cost,
      },
      alerts: alerts.rows,
      monthly_chart: monthly.rows,
      recent_goats: recentGoats.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
