const express = require("express");
const {
  getAllFeedbacks,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
} = require("../controllers/feed");
const { verifyLogin, verifyAdmin } = require("../middlewares/verifyJWT");

const router = express.Router();

router.get("/", getAllFeedbacks);
router.get("/:id", getFeedbackById);
router.post("/", createFeedback);
router.put("/:id", verifyLogin, verifyAdmin, updateFeedback);
router.delete("/:id", deleteFeedback);

module.exports = router;
