
#!/bin/bash
# openMarket.sh - Script to open the market by starting Bots and Engine,
# updating Redis status to open, and running the node putPendingInQueues.js in V2.

# 1. Start Bots by running start.sh in the Bots directory
echo "Starting Bots..."
cd ~/Bots || { echo "Error: Bots directory not found."; exit 1; }
./start.sh

# 2. Start Engine by running start.sh in the Engine directory
echo "Starting Engine..."
cd ~/Engine || { echo "Error: Engine directory not found."; exit 1; }
./start.sh

# 3. Update market status in Redis to open
echo "Updating market status in Redis..."
redis-cli set market_status open

# 4. Run putPendingInQueues.js in V2
echo "Running putPendingInQueues.js..."
cd ~/V2 || { echo "Error: V2 directory not found."; exit 1; }
node putPendingInQueues.js

echo "Market opened successfully."

