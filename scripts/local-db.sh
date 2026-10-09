#!/usr/bin/env bash
# ------------------------------------------------------------------------------
# Local MySQL instance for MediOrder development.
#
# Runs a SEPARATE mysqld (port 3307, data dir .local-mysql/) so it never touches
# a MySQL server you may already have on 3306.
#
#   ./scripts/local-db.sh start    # init (first run) + start + create db/user
#   ./scripts/local-db.sh stop
#   ./scripts/local-db.sh status
#   ./scripts/local-db.sh shell    # mysql client logged in as the app user
#   ./scripts/local-db.sh reset    # stop, wipe data dir, start fresh
# ------------------------------------------------------------------------------
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="${ROOT_DIR}/.local-mysql/data"
RUN_DIR="${ROOT_DIR}/.local-mysql/run"
LOG_FILE="${ROOT_DIR}/.local-mysql/mysqld.log"
PORT="${MEDIORDER_DB_PORT:-3307}"
SOCKET="${RUN_DIR}/mysql.sock"
DB_NAME="medical_system_db"
DB_USER="mediorder"
DB_PASS="mediorder123"

MYSQLD="$(command -v mysqld || true)"
MYSQL="$(command -v mysql || true)"
if [[ -z "$MYSQLD" || -z "$MYSQL" ]]; then
  echo "mysqld/mysql not found. Install with: brew install mysql" >&2
  exit 1
fi

is_running() {
  "$MYSQL" --socket="$SOCKET" -uroot -e "SELECT 1" >/dev/null 2>&1
}

init_if_needed() {
  if [[ ! -d "$DATA_DIR/mysql" ]]; then
    echo "Initialising new data directory at $DATA_DIR ..."
    mkdir -p "$DATA_DIR" "$RUN_DIR"
    "$MYSQLD" --initialize-insecure --datadir="$DATA_DIR" --log-error="$LOG_FILE"
  fi
}

start() {
  mkdir -p "$RUN_DIR"
  if is_running; then
    echo "Local MySQL already running on port $PORT."
  else
    init_if_needed
    echo "Starting local MySQL on port $PORT ..."
    "$MYSQLD" --datadir="$DATA_DIR" --port="$PORT" --bind-address=127.0.0.1 \
      --socket="$SOCKET" --pid-file="$RUN_DIR/mysqld.pid" --mysqlx=OFF \
      --log-error="$LOG_FILE" >/dev/null 2>&1 &
    for _ in $(seq 1 30); do
      is_running && break
      sleep 1
    done
    is_running || { echo "MySQL failed to start, see $LOG_FILE" >&2; exit 1; }
  fi

  "$MYSQL" --socket="$SOCKET" -uroot <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
CREATE USER IF NOT EXISTS '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'127.0.0.1';
FLUSH PRIVILEGES;
SQL
  echo "Ready: jdbc:mysql://127.0.0.1:${PORT}/${DB_NAME}  (user=${DB_USER})"
}

stop() {
  if is_running; then
    "$MYSQL" --socket="$SOCKET" -uroot -e "SHUTDOWN"
    echo "Local MySQL stopped."
  else
    echo "Local MySQL is not running."
  fi
}

case "${1:-start}" in
  start)  start ;;
  stop)   stop ;;
  status) is_running && echo "running on port $PORT" || echo "stopped" ;;
  shell)  exec "$MYSQL" -h127.0.0.1 -P"$PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" ;;
  reset)  stop; sleep 2; rm -rf "${ROOT_DIR}/.local-mysql"; start ;;
  *) echo "usage: $0 {start|stop|status|shell|reset}" >&2; exit 1 ;;
esac
