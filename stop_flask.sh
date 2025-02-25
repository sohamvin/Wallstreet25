#!/bin/bash

echo "🛑 Stopping FastAPI server..."

# Find process running uvicorn
PIDS=$(ps aux | grep 'uvicorn server:app' | grep -v grep | awk '{print $2}')

if [ -n "$PIDS" ]; then
    echo "🔍 Found server processes: $PIDS"
    # Kill all matching processes
    kill -9 $PIDS
    echo "✅ Server stopped successfully!"
else
    echo "⚠️ No running FastAPI server found."
fi

# Double-check if anything is still running on port 8000
PORT_PID=$(lsof -t -i:8000)
if [ -n "$PORT_PID" ]; then
    echo "🔍 Found process using port 8000: $PORT_PID"
    kill -9 $PORT_PID
    echo "✅ Forcefully stopped process on port 8000!"
fi
