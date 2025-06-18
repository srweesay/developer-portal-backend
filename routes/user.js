const express = require("express");
const {
  getAllUsers,
  editUser,
  activateUser,
  deactivateUser,
  deleteUser,
  getUserById,
} = require("../controllers/user");
const { verifyAdmin, verifyLogin } = require("../middlewares/verifyJWT");

const router = express.Router();
router.get("/", verifyLogin, verifyAdmin, getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", verifyLogin, editUser);
router.delete("/:id", verifyLogin, verifyAdmin, deleteUser);
router.put("/activate/:id", verifyLogin, verifyAdmin, activateUser);
router.put("/deactivate/:id", verifyLogin, verifyAdmin, deactivateUser);

module.exports = router;
