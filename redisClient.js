const { sub } = require('date-fns/sub');
const { createClient } = require('redis');
const redisClient = createClient({ url: 'redis://localhost:6379' });


redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
}
);
const subscriber = createClient({ url: 'redis://localhost:6379' });
const subscriberBuyVol = createClient({ url: 'redis://localhost:6379' });
const subscriberSellVol = createClient({ url: 'redis://localhost:6379' });
const subscriberHighPrice = createClient({ url: 'redis://localhost:6379' });
const subscriberLowPrice = createClient({ url: 'redis://localhost:6379' });
subscriber.on('error', (err) => console.error('Redis Client Error:', err));
subscriberBuyVol.on('error', (err) => console.error('Redis Client Error:', err));
subscriberSellVol.on('error', (err) => console.error('Redis Client Error:', err));
subscriberHighPrice.on('error', (err) => console.error('Redis Client Error:', err));
subscriberLowPrice.on('error', (err) => console.error('Redis Client Error:', err));


function spacesToUnderscores(str) {
    return str.replace(/ /g, '_');
}

function underscoresToSpaces(str) {
    return str.replace(/_/g, ' ');
}

async function setupRedis() {
    try {
        await redisClient.connect();

        await subscriber.connect();
        await subscriberBuyVol.connect();
        await subscriberSellVol.connect();
        await subscriberHighPrice.connect();
        await subscriberLowPrice.connect();
        
        console.log('Connected successfully');
    } catch (err) {
        console.error('Connection Error:', err);
        process.exit(1);
    }
}

setupRedis();

module.exports = {
    redisClient,
    subscriber,
    subscriberBuyVol,
    subscriberSellVol,
    subscriberHighPrice,
    subscriberLowPrice,
    spacesToUnderscores,
    underscoresToSpaces
};