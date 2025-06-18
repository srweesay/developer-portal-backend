const express = require("express");
const {
  getSandboxesByOrganization,
  getSandboxById,
  deleteSandbox,
  requestSandbox,
  approveSandboxRequest,
  rejectSandboxRequest,
  openSandbox,
  getRequests,
  getAllSandboxesWithStatus,
  stopSandbox,
  startSandbox,
} = require("../controllers/sandbox");
const verifyJwt = require("../middlewares/verifyJWT");

const router = express.Router();
router.get("/", getAllSandboxesWithStatus);
router.post("/stop/:id", stopSandbox);
router.post("/start/:id", startSandbox);
router.get(
  "/organization/:organizationId",
  verifyJwt,
  getSandboxesByOrganization
);
router.get("/requests", getRequests);
router.get("/:id", getSandboxById);
router.delete("/:id", deleteSandbox);
router.get("/open/:sandboxId", openSandbox);

router.post("/request", requestSandbox);
router.post("/approve/:requestId", approveSandboxRequest);
router.post("/reject/:requestId", rejectSandboxRequest);

module.exports = router;
