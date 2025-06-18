const express = require("express");
const router = express.Router();
const {
  registerOrganization,
  editOrganization,
  deleteOrganization,
  activateOrganization,
  deactivateOrganization,
  verifyOrganization,
  getAllOrganizations,
  getOrganizationById,
} = require("../controllers/organization");
const { verifyAdmin, verifyLogin } = require("../middlewares/verifyJWT");

router.get("/", getAllOrganizations);
router.get("/:id", getOrganizationById);
router.post("/", registerOrganization);
router.put(
  "/edit/:id",
  verifyLogin,
  // verifyAdmin,

  editOrganization
);
router.delete("/delete/:id", verifyLogin, verifyAdmin, deleteOrganization);
router.put("/activate/:id", verifyLogin, verifyAdmin, activateOrganization);
router.put("/deactivate/:id", verifyLogin, verifyAdmin, deactivateOrganization);
router.put("/verify/:id", verifyLogin, verifyAdmin, verifyOrganization);

module.exports = router;
