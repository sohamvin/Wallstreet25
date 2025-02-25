const express = require("express");
const { placeBuyOrder, placeSellOrder, deleteOrder, GetALLPendingForBot, deleteWhenClose } = require("../controllers/orderControllerTwo");
const authMiddleware = require("../middlewares/auth");
const { orderLimiter } = require("../security/rateLimiters"); // Import rate limiter

console.log("placeBuyOrder:", typeof placeBuyOrder);
console.log("placeSellOrder:", typeof placeSellOrder);
console.log("deleteOrder:", typeof deleteOrder);

const router = express.Router();

router.post("/buy", authMiddleware, placeBuyOrder);
router.post("/sell", authMiddleware ,placeSellOrder);
router.post("/delete", authMiddleware ,deleteOrder);
router.get("/makda_tu_ithe_kasa_alas_asa_tanay_mhanala", GetALLPendingForBot);
router.post("/deleteWhenClose", authMiddleware ,deleteWhenClose);

module.exports = router;
