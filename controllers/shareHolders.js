const { PrismaClient } = require("@prisma/client");
const { uploadFile } = require("../config/uploadFile");
const prisma = new PrismaClient();

const createClient = async (req, res) => {
  try {
    const fileUrl = await uploadFile(req, "validatedDatas");
    const { organizationId, category } = req.body;
    const client = await prisma.client.create({
      data: {
        fileUrl,
        organizationId,
        category,
      },
    });
    res.status(201).json({ success: true, message: "Data added successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "Internal server error if the issue persistes submit your feedback,",
    });
  }
};

const getClients = async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      include: { organization: true },
    });
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await prisma.client.findMany({
      where: { organizationId: id },
      include: { organization: { include: { identification: true } } },
    });
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.status(200).json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { fileUrl, organizationId } = req.body;
    const client = await prisma.client.update({
      where: { id },
      data: {
        fileUrl,
        organizationId,
      },
    });
    res.status(200).json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await prisma.client.findUnique({ where: { id } });
    await prisma.client.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
};
