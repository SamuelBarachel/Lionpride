const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const initDb = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS goats (
        id SERIAL PRIMARY KEY,
        tag_number VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100),
        breed VARCHAR(100),
        gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
        date_of_birth DATE,
        purchase_date DATE,
        purchase_price DECIMAL(10, 2),
        current_weight DECIMAL(6, 2),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'deceased', 'transferred')),
        color VARCHAR(50),
        notes TEXT,
        parent_id INTEGER REFERENCES goats(id) ON DELETE SET NULL,
        owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        type VARCHAR(10) NOT NULL CHECK (type IN ('buy', 'sell')),
        goat_id INTEGER REFERENCES goats(id) ON DELETE SET NULL,
        goat_tag VARCHAR(50),
        goat_name VARCHAR(100),
        amount DECIMAL(10, 2) NOT NULL,
        transaction_date DATE NOT NULL,
        counterparty VARCHAR(100),
        payment_method VARCHAR(50),
        notes TEXT,
        owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS health_records (
        id SERIAL PRIMARY KEY,
        goat_id INTEGER NOT NULL REFERENCES goats(id) ON DELETE CASCADE,
        record_date DATE NOT NULL,
        record_type VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        treatment TEXT,
        medication VARCHAR(200),
        cost DECIMAL(8, 2),
        vet_name VARCHAR(100),
        next_due_date DATE,
        owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS feed_records (
        id SERIAL PRIMARY KEY,
        record_date DATE NOT NULL,
        feed_type VARCHAR(100) NOT NULL,
        quantity DECIMAL(8, 2),
        unit VARCHAR(20),
        cost DECIMAL(8, 2),
        supplier VARCHAR(100),
        notes TEXT,
        owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS weight_records (
        id SERIAL PRIMARY KEY,
        goat_id INTEGER NOT NULL REFERENCES goats(id) ON DELETE CASCADE,
        record_date DATE NOT NULL,
        weight DECIMAL(6, 2) NOT NULL,
        notes TEXT,
        owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Database schema initialized');
  } finally {
    client.release();
  }
};

module.exports = { pool, initDb };
