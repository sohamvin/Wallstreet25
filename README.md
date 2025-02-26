# Wallstreet25

![Wallstreet25 Logo](./Wallstreet25.svg)

A comprehensive stock market simulation system with real-time order matching, automated trading bots, and AI-powered news generation.

## System Architecture
Wallstreet25 consists of several interconnected components:
![Wallstreet25 Architecture](./Wallstreet25Arch.svg)
- **Matching Engine**: Core component that processes and matches orders in real-time
- **Bots**: Automated trading algorithms that provide market liquidity
- **Backend**: Node.js API server handling user authentication and order submission
- **News Backend**: AI-powered financial news generator using Gemini and Pinecone
- **Frontend**: React-based user interface for trading and market visualization

## Prerequisites

Before setting up Wallstreet25, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Docker](https://www.docker.com/get-started)
- [MongoDB](https://www.mongodb.com/try/download/community)
- [PostgreSQL](https://www.postgresql.org/download/)
- [Redis](https://redis.io/download)
- [RabbitMQ](https://www.rabbitmq.com/docs/download)

### RabbitMQ Setup Options

You can either:

1. Install RabbitMQ locally following the [official download instructions](https://www.rabbitmq.com/docs/download)

OR

2. Run RabbitMQ in Docker:
   ```bash
   docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
   ```

## Installation

Clone the repository and check out the different branches as needed:

```bash
git clone https://github.com/sohamvin/Wallstreet25.git
cd Wallstreet25
```

The system consists of the following branches:
- `main` - Main branch with documentation and utility scripts
- `Bots` - Trading bot implementation
- `MatchingEngine` - Order matching engine
- `Backend` - Node.js backend API server
- `NewsBackend` - AI news generation service
- `Wallstreet25Frontend` - React frontend application

## Setup Instructions

### 1. Start RabbitMQ

Ensure RabbitMQ is running either as a local service or Docker container before proceeding.

### 2. Matching Engine and Bots Setup

```bash
# Check out the MatchingEngine branch
git checkout MatchingEngine

# OR start as a daemon for production
./start.sh

# Start in development mode
./activate.sh

# Check out the Bots branch
git checkout Bots

# OR start as a daemon for production
./start.sh

# Start in development mode
./activate.sh
```

### 3. Backend Setup
.env =>

MONGO_URI=mongodb://localhost:27017/wallstreet25
PORT=3502
DATABASE_URL="postgresql://postgres:password@localhost:5432/wallstreet25?schema=public"
JWT_SECRET=$(get from node generateSecret.js)
RABBITMQ_USER=guest
RABBITMQ_PASS=guest
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672

```bash
# Check out the Backend branch
git checkout Backend

# Install dependencies
npm install

# Create .env file


# Set up database schema
npx prisma generate
npx prisma migrate dev

# Seed database with companies
# You can use the provided companiesData.json or your own data

# Start the server
node index.js

# In separate terminals, start the support services
node StreamReader.js
node worker2.js
```

### 4. User Registration

Use Thunder Client, Postman, or any API client to create users:

```
POST http://localhost:3502/auth/bhali_mothi_sign_up_a_p_I
Content-Type: application/json

{
  "email": "your.email@example.com",
  "name": "Your Name",
  "password": "your_secure_password",
  "username": "your_username",
  "friends": true
}
```

Set `friends` to `false` if you want the user to appear on the leaderboard.

### 5. News Backend Setup

```bash
# Check out the NewsBackend branch
git checkout NewsBackend

# Create .env file
cat > .env << EOF
MONGO_URI=mongodb://localhost:27017/wallstreet25_news
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_pinecone_index_name
GEMINI_API_KEY1=your_first_gemini_api_key
GEMINI_API_KEY2=your_second_gemini_api_key
GEMINI_API_KEY3=your_third_gemini_api_key
EOF

# Start the Flask server
./start_flask.sh

#Stop the flask server
./stop_flask.sh

# Generate news (run manually or set up as a cron job)
./run_cron.sh
```

#### API Keys

- For Gemini API keys, visit: [Google AI Studio](https://ai.google.dev/gemini-api/docs/api-key)
- For Pinecone setup and API keys, visit: [Pinecone Documentation](https://www.pinecone.io/learn/search-with-pinecone/)

For production, consider setting up a cron job to generate news every 20 minutes:
```bash
*/20 * * * * /path/to/wallstreet25/run_cron.sh
```

### 6. Frontend Setup
.env => 

VITE_SOCKET_LINK=http://localhost:3502
VITE_BACKEND_URL=http://localhost:3502
Or whatver your Port is

```bash
# Check out the Frontend branch
git checkout Wallstreet25Frontend

# Install dependencies
npm install

# Start development server
npx vite@latest
```

## Market Operations

You can use the provided scripts to open and close the market in production:

```bash
# Open the market
./openMarket.sh

# Close the market
./closeMarket.sh
```

