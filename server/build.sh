#!/usr/bin/env bash
# Render build script — installs deps and applies DB schema
set -e

echo "Installing dependencies..."
npm install

echo "Applying database schema..."
node -e "
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.query(fs.readFileSync(path.join(__dirname, 'config', 'schema.sql'), 'utf8'))
  .then(() => {
    console.log('✅  Schema applied successfully.');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌  Schema migration failed:', err.message);
    process.exit(1);
  });
"
