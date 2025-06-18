const express = require("express");
const {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth");
const loginLimiter = require("../middlewares/loginLimiter");

const router = express.Router();
router.post("/register", register);
router.post("/", loginLimiter, login);
router.get("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
