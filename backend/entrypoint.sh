#!/bin/sh
set -e

attempt=1
max_attempts=5

while [ "$attempt" -le "$max_attempts" ]; do
  if alembic upgrade head; then
    exec gunicorn -c gunicorn_conf.py app.main:app
  fi
  attempt=$((attempt + 1))
  sleep 2
done

echo "alembic upgrade head failed after ${max_attempts} attempts" >&2
exit 1
