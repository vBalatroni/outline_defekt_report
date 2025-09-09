#!/bin/sh
set -e

# Wait for Postgres if DATABASE_URL is provided
if [ -n "$DATABASE_URL" ]; then
  echo "Waiting for database..."
  # Basic wait loop
  for i in $(seq 1 30); do
    node -e "const { Client } = require('pg'); const c = new Client({ connectionString: process.env.DATABASE_URL }); c.connect().then(()=>{console.log('db ok'); process.exit(0)}).catch(()=>process.exit(1));" && break || sleep 2
  done
fi

# Run migrations (safe in dev/ci; in prod prefer migrate deploy)
if [ -n "$PRISMA_MIGRATE_DEPLOY" ]; then
  npx prisma migrate deploy
else
  npx prisma migrate deploy
fi

node dist/main.js


