#!/bin/bash

cleanup() {
  if [ ! -z "$BOT_PID" ]; then
    echo "Stopping Bot (PID: $BOT_PID)..."
    kill $BOT_PID 2>/dev/null
  fi
  if [ ! -z "$WEBUI_PID" ]; then
    echo "Stopping WebUI (PID: $WEBUI_PID)..."
    kill $WEBUI_PID 2>/dev/null
  fi
  if [ ! -z "$CLEANUP_PID" ]; then
    echo "Stopping Valkey cleanup service (PID: $CLEANUP_PID)..."
    kill $CLEANUP_PID 2>/dev/null
  fi
  echo -e "\nDone! Thanks for using Kowalski"
  exit 0
}

trap cleanup SIGINT

cd webui
echo "Building WEBUI..."
bun run build
echo "Starting WEBUI..."
bun run start 2>&1 | sed "s/^/[WEBUI] /" &
WEBUI_PID=$!
echo "WEBUI started with PID $WEBUI_PID"

echo "Starting BOT..."
cd ..
bun start 2>&1 | sed "s/^/[BOT] /" &
BOT_PID=$!
echo "BOT started with PID $BOT_PID"

echo "Starting Valkey cleanup service..."
(
  MAIN_DIR="$(pwd)"
  while true; do
    sleep 300  # 5m loop
    cd "$MAIN_DIR/webui"
    bun run valkey:clean 2>&1
    cd "$MAIN_DIR"
  done
) &
CLEANUP_PID=$!
echo "Valkey cleanup service started with PID $CLEANUP_PID"

echo "Services started:"
echo "  • Bot PID: $BOT_PID"
echo "  • WebUI PID: $WEBUI_PID"
echo "  • Valkey Cleanup PID: $CLEANUP_PID"

wait $BOT_PID $WEBUI_PID $CLEANUP_PID