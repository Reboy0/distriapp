#!/bin/sh
set -e

# Always bring the schema up to date before serving traffic — this runs on
# every container start (local docker-compose and production alike), so a
# fresh deploy on Railway/Fly never forgets a migration.
alembic upgrade head

if [ "$#" -eq 0 ]; then
  # No explicit command (production default): honor the platform-assigned
  # $PORT (Railway/Fly/Render all set this) instead of a hardcoded port.
  exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
else
  # docker-compose passes its own `command:` (e.g. --reload for local dev) —
  # run that instead of the production default.
  exec "$@"
fi
