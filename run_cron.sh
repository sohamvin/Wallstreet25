#!/bin/bash

# Navigate to the project directory
cd "$(dirname "$0")"

# Check if virtual environment exists, create if not
if [ ! -d "venv" ]; then
    echo "⚡ Creating virtual environment..."
    python3 -m venv venv
fi

# Activate the virtual environment
echo "🚀 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📦 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Run FastAPI server on 0.0.0.0 and keep it running forever
echo "🌍 Starting cronJob"
python3 cron_job.py

echo "✅ Cron job done"
