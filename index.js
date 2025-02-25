// const { createClient } = require('redis');
// const redisClient = createClient({ url: 'redis://localhost:6379' });
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); 
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { createServer } = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
// const mongoose = require('mongoose');
// const mongoose = require('./mongooseConnection');
const {
    redisClient,
    subscriber,
    subscriberBuyVol,
    subscriberSellVol,
    subscriberHighPrice,
    subscriberLowPrice,
} = require('./redisClient')


const { initMongo } = require('./controllers/mongoDb');

initMongo();

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
const authRoutes = require("./routes/userRoutes");
const portfolioroute = require("./routes/holdingsRoutes");
const orderRoutes2 = require("./routes/orderRoutesTwo");
const companyRoutes = require("./routes/companyRoutes");
const marketRouter = require("./routes/marketRoutes");
const watchlist = require("./routes/watchlistRoutes");
const { sub } = require('date-fns/sub');

app.use("/auth", authRoutes);
app.use("/portfolio", portfolioroute);
app.use("/order", orderRoutes2);
app.use("/company", companyRoutes);
app.use("/market", marketRouter);
app.use("/watchlist", watchlist);
app.get("/hello", (req, res) => {
    res.send("Hello World");
});

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ['GET', 'POST'],
    },
});

const list_of_companies = [
    "Titanium Consultancy Services",
    "NextGen Tech Solutions",
    "HCL Systems",
    "W-Tech Limited",
    "BHLIMindtree Limited",
    "Clipla Limited",
    "BondIt Industries Limited",
    "Helio Pharma Industries Limited",
    "Alpha Corporation Limited",
    "SR Chemicals and Fibers Limited",
    "Avani Power Limited",
    "AshLey Motors Limited",
    "Legacy Finance Limited",
    "Legacy Finserv Limited",
    "Legacy Holdings and Investment Limited",
    "Chola Capital Limited",
    "GZ Industries Limited",
    "RailConnect India Corporation Limited",
    "JFS Capital Limited",
    "JFW Steel Limited",
    "LarTex and Turbo Limited",
    "HPCI Limited",
    "TPCI Limited",
    "PowerFund Corporation Limited",
    "Bharat Steel Works Limited",
    "SG Capital Limited",
    "Shriram Money Limited",
    "Titanium Motors Limited",
    "Titan Tubes Investments Limited",
    "Titanium Steel Limited"
];
function spacesToUnderscores(str) {
    return str.replace(/ /g, "_");
  }
  
  function underscoresToSpaces(str) {
    return str.replace(/_/g, " ");
  }
  



const getUsersWithRankings = async () => {
    const users = await prisma.user.findMany({
        where: {
            friends: false,
        },
        select: {
            id: true,
            cash: true,
            name: true,
            holdings: {
                select: {
                    quantity: true,
                    averagePrice: true,
                    companyName: true,
                }
            }
        },
    });

    const getAllCompanies = await prisma.company.findMany({
        select: {
            name: true,
        },
    });

    const companyNames = getAllCompanies.map((company) => company.name);

    const companyPrices = await Promise.all(companyNames.map(async (companyName) => {
        // console.log('Getting price for:', spacesToUnderscores(companyName));
        const JsonObj = await redisClient.get(spacesToUnderscores(companyName));
        // console.log(JSON.stringify(JsonObj));
        const json = typeof JsonObj === 'string' ? JSON.parse(JsonObj) : JsonObj;
        const price = parseFloat(json.price);
        return { company: companyName, price: price };
    }));

    const companyPriceMap = companyPrices.reduce((acc, { company, price }) => {
        acc[company] = price;
        return acc;
    }, {});

    const usersWithTotalValue = users.map((user) => {
        const totalHoldingsValue = user.holdings.reduce((acc, holding) => {
            const price = companyPriceMap[holding.companyName] || 0;
            return acc + (holding.quantity * price);
        }, 0);
        const totalValue = parseFloat(user.cash) + parseFloat(totalHoldingsValue);
        return { name: user.name, cash : user.cash, totalValue };
    });

    const rankedUsers = usersWithTotalValue.sort((a, b) => b.totalValue - a.totalValue);

    const top20RankedUsers = rankedUsers.slice(0, 20);


    // console.log('Top 20 ranked users:', top20RankedUsers);

    io.emit('leaderboard', top20RankedUsers);
    
};


io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('subscribeToCompany', async (company) => {
        console.log(`Client subscribed to ${company}`);
        if (list_of_companies.includes(company)) {
            socket.join(company);

            console.log(`Socket ${socket.id} subscribed to ${company}`);

            if (await redisClient.exists(spacesToUnderscores(company))) {
                const message = await redisClient.get(spacesToUnderscores(company));
                let messaGGe = typeof message === 'string' ? JSON.parse(message) : message;
                messaGGe.company = company;
                messaGGe.price = parseFloat(messaGGe.price).toFixed(2);
                console.log(messaGGe)
                socket.emit('market', messaGGe);

                const buyVol = {
                    "buy_volume": await redisClient.get(spacesToUnderscores(company) + "_buy_volume"),
                    "company": company
                };

                const sellVol = {
                    "sell_volume": await redisClient.get(spacesToUnderscores(company) + "_sell_volume"),
                    "company": company
                };

                const highPrice = {
                    "high_price": await redisClient.get(spacesToUnderscores(company) + ":high"),
                    "company": company
                };

                const lowPrice = {
                    "low_price": await redisClient.get(spacesToUnderscores(company) + ":low"),
                    "company": company
                };

                socket.emit('buy_volume', buyVol);
                socket.emit('sell_volume', sellVol);
                socket.emit('high_price', highPrice);
                socket.emit('low_price', lowPrice);
            }
        }
    });

    socket.on("disconnect", (reason) => {
        console.log("Disconnected from Socket.IO. Reason:", reason);
    });
});

const runClients = async () => {
    try {
        // await subscriber.connect();
        // await subscriberBuyVol.connect();
        // await subscriberSellVol.connect();
        // await subscriberHighPrice.connect();
        // await subscriberLowPrice.connect();
        console.log('Command client connected to Redis');
        console.log('Subscriber connected to Redis');

        list_of_companies.forEach(company => {
            subscriber.subscribe(spacesToUnderscores(company), (message, channel) => {
                let messaGGe = typeof message === 'string' ? JSON.parse(message) : message;
                messaGGe.company = company;
                // console.log(parseFloat(messaGGe.price).toFixed(2));
                messaGGe.price = parseFloat(messaGGe.price).toFixed(2);
                // console.log(messaGGe)
                io.to(company).emit('market', messaGGe);
            });

            subscriberBuyVol.subscribe(spacesToUnderscores(company) + "_buy_volume", (message, channel) => {
                const buyVol = {
                    "buy_volume": message,
                    "company": company
                };
                io.to(company).emit('buy_volume', buyVol);
            });

            subscriberSellVol.subscribe(spacesToUnderscores(company) + "_sell_volume", (message, channel) => {
                const sellVol = {
                    "sell_volume": message,
                    "company": company
                };
                io.to(company).emit('sell_volume', sellVol);
            });


            subscriberHighPrice.subscribe(spacesToUnderscores(company) + ":high:pub", (message, channel) => {
                const highPrice = {
                    "high_price": message,
                    "company": company
                };
                console.log('High price:', highPrice);
                io.to(company).emit('high_price', highPrice);
            });

            subscriberLowPrice.subscribe(spacesToUnderscores(company) + ":low:pub", (message, channel) => {
                const lowPrice = {
                    "low_price": message,
                    "company": company
                };
                console.log('Low price:', lowPrice);
                io.to(company).emit('low_price', lowPrice);
            });

        });
    } catch (err) {
        console.error('Error connecting to Redis:', err);
    }
};


setInterval(async ()=> {
    await getUsersWithRankings();
}, 5000)

runClients();
const PORT = process.env.PORT || 3500;
server.listen(PORT, '0.0.0.0' ,() => {
    console.log(`Server is running on port ${PORT}`);
});
