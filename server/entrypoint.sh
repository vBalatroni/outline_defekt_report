#!/bin/sh
set -e

echo "Starting backend..."

# Optional small wait to give Postgres time to accept connections
sleep 3

node dist/main.js


