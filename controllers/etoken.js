const { PrismaClient } = require("@prisma/client");
const { sendEmail } = require("../config/emailService");
const { uploadFile } = require("../config/uploadFile");
const prisma = new PrismaClient();

const getAllEtokenRequests = async (req, res) => {
  try {
    const requests = await prisma.etoken.findMany({
      include: { organization: { select: { identification: true } } },
    });
    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({
      message: "Error getting eToken requests",
      error: error.message,
    });
  }
};
const getEtokenRequestById = async (req, res) => {
  try {
    const request = await prisma.etoken.findUnique({
      where: { id: req.params.id },
      include: { organization: { select: { identification: true } } },
    });
    res.json({ success: true, request });
  } catch (error) {
    res.status(500).json({
      message: "Error getting eToken requests",
      error: error.message,
    });
  }
};
const createEtokenRequest = async (req, res) => {
  const { organizationID } = req.body;
  const attachements = await uploadFile(req, "etokenRequests");

  try {
    const etoken = await prisma.etoken.create({
      data: {
        organizationID,
        attachements: Array.isArray(attachements)
          ? attachements
          : [attachements],
      },
    });

    res.json({ message: "eToken request created successfully", etoken });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error creating eToken request",
      error: error.message,
    });
  }
};

const approveEtokenRequest = async (req, res) => {
  const { id } = req.params;
  const attachmentFile = req.files?.attachment;
  const orgFound = await prisma.etoken.findUnique({
    where: { id: id },
    include: { organization: true },
  });
  if (!attachmentFile) {
    return res.status(400).json({ message: "Attachment file is required" });
  }
  if (!orgFound) {
    return res.status(400).json({ message: "Organization Not Found" });
  }

  try {
    const organizationEmail = JSON.parse(
      orgFound.organization.contact
    ).mainEmail;

    if (!organizationEmail) {
      return res.status(400).json({ message: "Organization email not found" });
    }

    const attachmentBuffer = attachmentFile.data;
    const attachmentName = attachmentFile.name;

    await sendEmail(
      organizationEmail,
      "Important: eToken Request Approved",
      `
      <div style="font-family: Arial, sans-serif; color: black; background-color: white; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h1 style="color: #003366; text-align: center;">Ethiopian Central Securities Depository</h1>
        <hr style="border: 1px solid #003366;">
        <p>Dear Valued Customer,</p>
        <p>The <strong>eToken request</strong> with ID: <strong>${id}</strong> has been approved.</p>
        <p style="color: #003366; font-weight: bold;">
          Please note:
        </p>
        <ul>
          <li>Do not share this email or its contents with anyone. This certificate is unique to you and must remain confidential.</li>
          <li>Use the guide on the ECSD portal to install your certificate securely.</li>
        </ul>
        <p>If you did not request this certificate, <strong style="color: red;">please report it immediately</strong> to ECSD by replying to this email or contacting our support team at <a href="mailto:support@ecsd.gov.et">support@ecsd.gov.et</a>.</p>
        <p style="margin-top: 20px; font-size: 12px; color: gray;">Date and Time: ${new Date().toLocaleString()}</p>
        <p>Thank you for your prompt attention to this matter.</p>
        <hr style="border: 1px solid #003366;">
        <p style="text-align: center; color: #003366;">
          <strong>Ethiopian Central Securities Depository</strong><br>
          Secure. Reliable. Trusted.
        </p>
      </div>
      `,
      [
        {
          filename: attachmentName,
          content: attachmentBuffer,
        },
      ]
    );

    const etoken = await prisma.etoken.update({
      where: { id },
      data: { resolved: true, rejected: false },
      include: { organization: true },
    });
    res.json({
      message: "eToken request approved and email sent successfully",
      etoken,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error approving eToken request",
      error: error.message,
    });
  }
};

const rejectEtokenRequest = async (req, res) => {
  const { id } = req.params;

  try {
    const etoken = await prisma.etoken.update({
      where: { id },
      data: { resolved: false, rejected: true },
    });

    res.json({ message: "eToken request rejected successfully", etoken });
  } catch (error) {
    res.status(500).json({
      message: "Error rejecting eToken request",
      error: error.message,
    });
  }
};

const deleteEtokenRequest = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.etoken.delete({
      where: { id },
    });

    res.json({ message: "eToken request deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting eToken request",
      error: error.message,
    });
  }
};

module.exports = {
  createEtokenRequest,
  approveEtokenRequest,
  rejectEtokenRequest,
  deleteEtokenRequest,
  getAllEtokenRequests,
  getEtokenRequestById,
};
