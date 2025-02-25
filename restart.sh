#!/bin/bash

# Stop any running bots
./stop.sh

# Pull the latest version from the 'main' branch
# git fetch origin
# git reset --hard origin/newbots

chmod +x start.sh

# Start the bots again
./start.sh

echo "Bots restarted successfully!"
