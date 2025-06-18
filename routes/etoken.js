const express = require("express");
const {
  createEtokenRequest,
  approveEtokenRequest,
  rejectEtokenRequest,
  deleteEtokenRequest,
  getAllEtokenRequests,
  getEtokenRequestById,
} = require("../controllers/etoken");
const { verifyAdmin, verifyLogin } = require("../middlewares/verifyJWT");

const router = express.Router();

router.get("/", verifyLogin, verifyAdmin, getAllEtokenRequests);
router.get("/:id", verifyLogin, verifyAdmin, getEtokenRequestById);
router.post("/", verifyLogin, createEtokenRequest);
router.put("/approve/:id", verifyLogin, verifyAdmin, approveEtokenRequest);
router.put("/reject/:id", verifyLogin, verifyAdmin, rejectEtokenRequest);
router.delete("/:id", verifyLogin, verifyAdmin, deleteEtokenRequest);

module.exports = router;
