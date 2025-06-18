const express = require("express");
const {
  getNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
} = require("../controllers/news");
const { verifyAdmin, verifyLogin } = require("../middlewares/verifyJWT");

const router = express.Router();

router.get("/", getNews);
router.get("/:id", getNewsById);
router.post("/", verifyLogin, verifyAdmin, createNews);
router.put("/:id", verifyLogin, verifyAdmin, updateNews);
router.delete("/:id", deleteNews);

module.exports = router;
