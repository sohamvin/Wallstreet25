#!/bin/bash

# Stop any running daemon for WorkerTwo.py
pkill -f WorkerTwo.py

# Pull the latest version from git
# git pull origin main

# Create a virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate the virtual environment
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Run WorkerTwo.py
python WorkerTwo.py