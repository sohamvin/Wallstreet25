#!/bin/bash
# closeMarket.sh - Script to close the market by stopping Bots and Engine,
# running the closing script (with virtual environment activation), and updating Redis status.

# 1. Stop Bots by running the stop.sh in the Bots directory
echo "Stopping Bots..."
cd ~/Bots || { echo "Error: Bots directory not found."; exit 1; }
./stop.sh

# echo "Stopping Engine..."
# cd ~/Engine || { echo "Error: Engine directory not found."; exit 1; }
# ./stop.sh

# 2. Activate the Engine's virtual environment and run closingScript.py
echo "Running closingScript.py..."
# Activate virtual environment (assumes it's located in ~/Engine/venv)
if [ -f venv/bin/activate ]; then
    source venv/bin/activate || { echo "Error: Could not activate virtual environment."; exit 1; }
    python3 closingScript.py
    deactivate
else
    echo "Error: Virtual environment not found in ~/Engine/venv"
    exit 1
fi

# 3. Set the Redis key 'market_status' to 'close'
echo "Updating market status in Redis..."
redis-cli set market_status close

echo "Market closed successfully."
