const express = require("express");

const authMiddleware = require("../middlewares/auth");
const { orderLimiter } = require("../security/rateLimiters"); // Import rate limiter

const {
    getClosingPrice,
    getOpeningPrice,
    getHighPrice,
    getLowPrice,
    historicalMarketData,
    getBuyVolume,
    getSellVolume,
    marketIsOpen

    
} = require('../controllers/marketController');

const router = express.Router();

// router.post("/buy", authMiddleware, orderLimiter, placeBuyOrder);
// router.post("/sell", authMiddleware, orderLimiter, placeSellOrder);
// router.delete("/delete", authMiddleware, orderLimiter, deleteOrder);

router.post("/high", getHighPrice);
router.post("/low", getLowPrice);
router.post("/opening", getOpeningPrice);
router.post("/closing", getClosingPrice);
router.post("/historicalMarketData", historicalMarketData);
router.post("/buyVolume", getBuyVolume);
router.post("/sellVolume", getSellVolume);
router.get("/marketIsOpen", marketIsOpen);

module.exports = router;
