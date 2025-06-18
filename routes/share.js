const express = require("express");
const {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} = require("../controllers/shareHolders");
const { verifyLogin } = require("../middlewares/verifyJWT");

const router = express.Router();

router.get("/", getClients);
router.get("/:id", getClientById);
router.post("/", verifyLogin, createClient);
router.put("/:id", verifyLogin, updateClient);
router.delete("/:id", verifyLogin, deleteClient);

module.exports = router;
