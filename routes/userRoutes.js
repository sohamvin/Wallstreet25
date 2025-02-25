const express = require("express");
const { signup, login, logout, getUserRankings} = require("../controllers/userController");
const authMiddleware = require("../middlewares/auth");
const { signupLimiter, loginLimiter } = require("../security/rateLimiters");

const router = express.Router();

// router.post("/signup", signupLimiter, signup);
// router.post("/login", loginLimiter, login);
router.post("/bhali_mothi_sign_up_a_p_i", signup);
router.post("/login", login);
router.post("/logout", authMiddleware, logout);
router.get("/rankings", getUserRankings);


module.exports = router;
