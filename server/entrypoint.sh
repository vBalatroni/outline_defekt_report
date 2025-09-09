#!/bin/sh
set -e

echo "Starting backend..."

if [ -n "$DATABASE_URL" ]; then
  echo "Waiting for database..."
  for i in $(seq 1 30); do
    node -e "const { Client } = require('pg'); const c = new Client({ connectionString: process.env.DATABASE_URL }); c.connect().then(()=>process.exit(0)).catch(()=>process.exit(1));" && break || sleep 2
  done
fi

echo "Running prisma migrate deploy..."
npx prisma migrate deploy

node dist/main.js


