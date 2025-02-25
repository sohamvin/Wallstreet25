
# Pull the latest version from the 'Server' branch
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate the virtual environment
source venv/bin/activate

# Install requirements
pip install --upgrade pip
pip install -r requirements.txt

# Start WorkerTwo.py as a daemon
nohup python WorkerTwo.py > worker.log 2>&1 &

# Print confirmation message
echo "WorkerTwo.py started as a daemon and logs are being written to worker.log"
