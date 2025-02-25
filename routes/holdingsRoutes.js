const express = require("express");
const authMiddleware = require("../middlewares/auth");
const {getCompletedOrders, getPendingOrders, getUserCash, getQuantityAndCashForNetWorth, individualHoldings, getCompanyHoldings}=require("../controllers/holdingsController");

const router = express.Router();

router.get("/completedOrders", authMiddleware, getCompletedOrders);
router.get("/pendingOrders", authMiddleware, getPendingOrders);
router.get("/cash", authMiddleware, getUserCash);
router.get("/netWorth", authMiddleware, getQuantityAndCashForNetWorth);
router.get("/holdingDetail", authMiddleware, individualHoldings);
router.post("/companyHolding", authMiddleware, getCompanyHoldings)

module.exports = router;