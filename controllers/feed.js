const { PrismaClient } = require("@prisma/client");
const { uploadFile } = require("../config/uploadFile");
const prisma = new PrismaClient();

const getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      include: {
        askingPerson: {
          select: {
            id: true,
            username: true,
            email: true,
            organization: {
              select: {
                identification: {
                  select: { fullname: true, shortname: true, localname: true },
                },
              },
            },
          },
        },
      },
    });
    res.json({ success: true, feedbacks });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving feedbacks",
      error: error.message,
    });
  }
};

const getFeedbackById = async (req, res) => {
  try {
    const feedback = await prisma.feedback.findUnique({
      where: { id: req.params.id },
      include: {
        askingPerson: { select: { id: true, username: true, email: true } },
      },
    });
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }
    res.json({ success: true, feedback });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving feedback",
      error: error.message,
    });
  }
};

const createFeedback = async (req, res) => {
  try {
    const attachments = await uploadFile(req, "feedbackAttachments");
    const feedback = await prisma.feedback.create({
      data: {
        ...req.body,
        attachements:
          String(attachments) === "Error: No files were uploaded."
            ? []
            : Array.isArray(attachments)
            ? attachments
            : [attachments],
      },
    });
    res.json({ message: "Feedback created successfully", feedback });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error creating feedback",
      error: error.message,
    });
  }
};

const updateFeedback = async (req, res) => {
  const { id } = req.params;
  const { answer } = req.body;

  try {
    const feedback = await prisma.feedback.update({
      where: { id },
      data: { answer },
    });
    res.json({ message: "Feedback updated successfully", feedback });
  } catch (error) {
    res.status(500).json({
      message: "Error updating feedback",
      error: error.message,
    });
  }
};

const deleteFeedback = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.feedback.delete({
      where: { id },
    });
    res.json({ message: "Feedback deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting feedback",
      error: error.message,
    });
  }
};

module.exports = {
  getAllFeedbacks,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
};
