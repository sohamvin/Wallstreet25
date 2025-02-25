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
echo "🌍 Starting FastAPI server on 0.0.0.0:8000..."
nohup uvicorn server:app --host 0.0.0.0 --port 8000 --reload > server.log 2>&1 &

echo "✅ Server started successfully!"
