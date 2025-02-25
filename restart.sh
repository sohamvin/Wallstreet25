#!/bin/bash

# Stop any running daemon for WorkerTwo.py
# pkill -f WorkerTwo.py

chmod +x stop.sh

# Start the bots again
./stop.sh

# Pull the latest version from the 'Server' branch
git fetch origin
git reset --hard origin/Server


chmod +x start.sh

# Start the bots again
./start.sh

# Print confirmation message
echo "WorkerTwo.py started as a daemon and logs are being written to worker.log"
