const express = require("express");
const { placeBuyOrder, placeSellOrder, deleteOrder } = require("../controllers/orderController");
const authMiddleware = require("../middlewares/auth");
const { orderLimiter } = require("../security/rateLimiters"); // Import rate limiter

const router = express.Router();

// router.post("/buy", authMiddleware, orderLimiter, placeBuyOrder);
// router.post("/sell", authMiddleware, orderLimiter, placeSellOrder);
// router.delete("/delete", authMiddleware, orderLimiter, deleteOrder);

router.post("/buy", authMiddleware, placeBuyOrder);
router.post("/sell", authMiddleware, placeSellOrder);
router.delete("/delete", authMiddleware, deleteOrder);


module.exports = router;
