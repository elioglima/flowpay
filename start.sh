#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

API_PORT="${API_PORT:-3001}"
FRONT_PORT="${FRONT_PORT:-3000}"

stopListenersOnPort() {
  local port="$1"
  local pids
  pids=$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null || true)
  if [ -z "$pids" ]; then
    return 0
  fi
  echo "Encerrando processo(s) na porta ${port}: $(echo "$pids" | tr '\n' ' ')"
  kill $pids 2>/dev/null || true
  sleep 0.4
  pids=$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null || true)
  if [ -n "$pids" ]; then
    kill -9 $pids 2>/dev/null || true
  fi
}

MONGO_CONTAINER_NAME="flowpay-mongo"
MONGO_IMAGE="mongo:7"
MONGO_VOLUME="flowpay_mongo_data"

if ! docker info >/dev/null 2>&1; then
  echo "Docker não está em execução ou não está acessível."
  exit 1
fi

if docker ps -a --format '{{.Names}}' | grep -qx "$MONGO_CONTAINER_NAME"; then
  if docker ps --format '{{.Names}}' | grep -qx "$MONGO_CONTAINER_NAME"; then
    :
  else
    docker start "$MONGO_CONTAINER_NAME" >/dev/null
  fi
else
  docker run -d \
    --name "$MONGO_CONTAINER_NAME" \
    -p 27017:27017 \
    -v "${MONGO_VOLUME}:/data/db" \
    "$MONGO_IMAGE" >/dev/null
fi

sleep 1

stopListenersOnPort "$API_PORT"
stopListenersOnPort "$FRONT_PORT"

export NODE_ENV=development
export MONGODB_URI="mongodb://127.0.0.1:27017/flowpay"
export PORT="$API_PORT"
export NEXT_PUBLIC_API_URL="http://localhost:${API_PORT}"

echo "Dev com auto-reload: API (tsx watch) e front (next dev --turbo)."
(cd "$ROOT/api" && exec npm run dev) &
API_PID=$!
(cd "$ROOT/front" && exec npm run dev -- --turbo -p "$FRONT_PORT") &
FRONT_PID=$!

cleanup() {
  kill "$API_PID" "$FRONT_PID" 2>/dev/null || true
  wait "$API_PID" "$FRONT_PID" 2>/dev/null || true
}

trap cleanup INT TERM

wait "$API_PID" "$FRONT_PID"
