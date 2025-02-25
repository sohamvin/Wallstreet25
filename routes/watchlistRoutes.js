const express = require("express");
const { addToWatchlist, removeFromWatchlist, getWatchlist, isCompanyBookmarked } = require("../controllers/watchlistController");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");

router.post("/add", authMiddleware,addToWatchlist);
router.post("/remove", authMiddleware ,removeFromWatchlist);
router.get("/", authMiddleware , getWatchlist);
router.post("/isBookmarked", authMiddleware , isCompanyBookmarked);

module.exports = router;
