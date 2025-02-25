const {
    getAllCompanies,
    getCompanyWiseOrders,
    getCompany
    // historicalDepthData,
    // historicalMarketData

} = require('../controllers/companyController');
const express = require("express");
const authMiddleware = require("../middlewares/auth");
const { orderLimiter } = require("../security/rateLimiters"); // Import rate limiter

const router = express.Router();


router.get("/all", getAllCompanies);
router.post("/about",getCompany);

router.post("/orders", authMiddleware, getCompanyWiseOrders);

// router.post("/historicalDepthData", authMiddleware, historicalDepthData);
// router.post("/historicalMarketData", authMiddleware, historicalMarketData);

module.exports = router;
// rou