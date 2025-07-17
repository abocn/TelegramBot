#!/bin/bash

echo "Starting BOT..."
cd /usr/src/app
bun start 2>&1 | sed "s/^/[BOT] /" &
BOT_PID=$!
echo "BOT started with PID $BOT_PID"

echo "Starting WEBUI..."
cd /usr/src/app/webui
bun run start 2>&1 | sed "s/^/[WEBUI] /" &
WEBUI_PID=$!
echo "WEBUI started with PID $WEBUI_PID"

echo "Starting Valkey cleanup service..."
cd /usr/src/app/webui
(
  while true; do
    sleep 300  # 5m loop
    bun run cleanup 2>&1
  done
) &
CLEANUP_PID=$!
echo "Valkey cleanup service started with PID $CLEANUP_PID"

echo "Services started:"
echo "  Bot PID: $BOT_PID"
echo "  WebUI PID: $WEBUI_PID"
echo "  Cleanup PID: $CLEANUP_PID"

wait $BOT_PID $WEBUI_PID $CLEANUP_PID