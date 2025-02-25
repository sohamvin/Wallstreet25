#!/bin/bash

# Create a virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate the virtual environment
source venv/bin/activate

# Install requirements
pip install --upgrade pip
pip install -r requirements.txt

python open_market.py

# Start the bot scripts as daemons
# nohup python bot.py > bot.log 2>&1 &
# nohup python botThree.py > botThree.log 2>&1 &
nohup python updatebot.py > updatebot.log 2>&1 &

echo "Bots started successfully!"
