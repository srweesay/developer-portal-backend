const express = require("express");
const {
  createCredentialRequest,
  approveCredentialRequest,
  getCredentialsByOrgId,
  getCredentialsByUserId,
  getCredentialsRequest,
  getCredentials,
  getCredReqDetail,
  forgotCredentialRequest,
} = require("../controllers/credentials");
const { verifyAdmin, verifyLogin } = require("../middlewares/verifyJWT");

const router = express.Router();
router.get("/", getCredentials);
router.post("/request", createCredentialRequest);
router.post("/forgot/:id", forgotCredentialRequest);
router.get("/request", getCredentialsRequest);
router.put(
  "/approve/:requestId",
  verifyLogin,
  verifyAdmin,
  approveCredentialRequest
);
router.get("/:id", getCredReqDetail);
router.get("/organization/:orgId", getCredentialsByOrgId);
router.get("/user/:userId", getCredentialsByUserId);

module.exports = router;
