const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const { sendEmail } = require("./organization");
const prisma = new PrismaClient();
const { spawn } = require("child_process");
const path = require("path");
const { getIp } = require("./sandbox");

const generateUsername = () => {
  const length = 8;
  const letters = "abcdefghijklmnopqrstuvwxyz";

  return Array.from(crypto.randomBytes(length))
    .map((byte) => letters[byte % letters.length])
    .join("");
};

const generatePassword = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const createCredentialRequest = async (req, res) => {
  const { userId, resourceName, orgId } = req.body;

  try {
    const request = await prisma.credentialsRequest.create({
      data: { userId, resourceName, organizationId: orgId },
      include: { user: true, organization: true },
    });

    res.json({ message: "Credential request created successfully", request });
  } catch (error) {
    res.status(500).json({
      message: "Error creating credential request",
      error: error.message,
    });
  }
};
const forgotCredentialRequest = async (req, res) => {
  const { id } = req.params;

  try {
    const request = await prisma.credentialsRequest.findFirst({
      where: { userId: id },
    });

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    await prisma.credentialsRequest.update({
      where: { id: request.id },
      data: { status: "Pending", credRequestType: "forgot" },
    });
    res.json({
      message: "Credential request sent successfully",
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating  request",
      success: false,
    });
  }
};

const getCredReqDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const credDetail = await prisma.credentialsRequest.findUnique({
      where: { id },
      include: {
        user: true,
        organization: {
          include: {
            identification: true,
            contact: { include: { legalAddress: true, actualAddress: true } },
          },
        },
      },
    });
    if (!credDetail) {
      return res
        .status(400)
        .json({ success: false, message: "request with given id not found" });
    }
    return res.json({ success: true, credDetail });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
const approveCredentialRequest = async (req, res) => {
  const { requestId } = req.params;
  const { username, password } = req.body;

  const request = await prisma.credentialsRequest.findUnique({
    where: { id: requestId },
    include: { user: true, organization: true },
  });

  if (!request) {
    return res.status(404).json({ message: "Request not found" });
  }

  try {
    await sendEmail(
      request.user.email,
      "Sandbox Access Request Approved",
      `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Access Request Approved</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }
          .header { background-color: #0033cc; color: #ffffff; padding: 20px; text-align: center; }
          .content { padding: 20px; color: #333333; }
          .footer { background-color: #333333; color: #ffffff; text-align: center; padding: 10px; font-size: 12px; }
          .referral-code { background-color: #0033cc; color: #ffffff; padding: 10px; border-radius: 4px; display: inline-block; margin-top: 10px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Access Request Approved</h1>
          </div>
          <div class="content">
            <p>Dear Valued User,</p>
            <p>You can now access the CSD test VM.</p>
            <p>Credentials:</p>
            <div class="referral-code">Username: ${username}</div>
            <div class="referral-code">Password: ${password}</div>
            <p>Thank you for being a part of our community!</p>
            <p>If you encounter any issues, please reach out via the feedback section.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Ethiopian Central Securities Depository. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>`
    );
    if (request.credRequestType === "forgot") {
      const previousCred = await prisma.credentials.findFirst({
        where: { userId: request.userId },
      });
      await prisma.credentials.update({
        where: { id: previousCred.id },
        data: {
          username,
          url: `https://${process.env.CSD_REVERSE_IP}:9443/csd`,
          organizationId: request.organizationId,
          userId: request.userId,
          expiredDate: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
      });
    } else {
      await prisma.credentials.create({
        data: {
          username,
          url: `https://${process.env.CSD_REVERSE_IP}:9443/csd`,
          organizationId: request.organizationId,
          userId: request.userId,
          expiredDate: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
      });
    }

    await prisma.credentialsRequest.update({
      where: { id: requestId },
      data: { status: "Approved" },
    });
    return res.json({
      success: true,
      message: "Credential request approved",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error while sending email or updating request",
    });
  }
};

const getCredentialsByOrgId = async (req, res) => {
  const { orgId } = req.params;

  try {
    const credentials = await prisma.credentials.findMany({
      where: { organizationId: orgId },
      include: {
        user: true,
        organization: { include: { identification: true } },
      },
    });

    res.json({ credentials });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving credentials", error: error.message });
  }
};

const getCredentialsByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    const credentials = await prisma.credentials.findMany({
      where: { userId },
      include: {
        user: true,
        organization: { include: { identification: true } },
      },
    });

    res.json({ credentials });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving credentials",
      error: error.message,
    });
  }
};
const getCredentials = async (req, res) => {
  try {
    const credentials = await prisma.credentials.findMany({
      include: {
        user: true,
        organization: { include: { identification: true } },
      },
    });

    res.json({ credentials });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving credentials",
      error: error.message,
    });
  }
};

const getCredentialsRequest = async (req, res) => {
  try {
    const requests = await prisma.credentialsRequest.findMany({
      include: {
        organization: { include: { identification: true } },
        user: true,
      },
    });
    res.json({ requests });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving requests", error: error.message });
  }
};

module.exports = {
  createCredentialRequest,
  approveCredentialRequest,
  getCredentialsByOrgId,
  getCredReqDetail,
  getCredentialsByUserId,
  getCredentialsRequest,
  getCredentials,
  forgotCredentialRequest,
};
