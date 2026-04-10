#!/bin/bash
# Permanent server watcher with auto-restart

cd "/home/caramaschi/Área de trabalho/Projetos/A(i)gency/qwen-paperclip/apps/web"

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   Qwen Paperclip Server Watcher                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

while true; do
  TIMESTAMP=$(date '+%H:%M:%S')
  echo "[$TIMESTAMP] Starting server..."
  tsx src/server/index.ts 2>&1
  
  EXIT_CODE=$?
  TIMESTAMP=$(date '+%H:%M:%S')
  echo "[$TIMESTAMP] Server exited (code $EXIT_CODE). Restarting in 1s..."
  sleep 1
done
