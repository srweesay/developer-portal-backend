const { PrismaClient } = require("@prisma/client");
const { uploadFile } = require("../config/uploadFile");
const prisma = new PrismaClient();

const getNews = async (req, res) => {
  try {
    const news = await prisma.news.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    res.status(200).json(news);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching news" });
  }
};

const getNewsById = async (req, res) => {
  const id = req.params.id;
  try {
    const newsItem = await prisma.news.findUnique({
      where: {
        id,
      },
    });
    if (!newsItem) {
      return res.status(404).json({ message: "News item not found" });
    }
    res.status(200).json(newsItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching news item" });
  }
};

const createNews = async (req, res) => {
  try {
    const { title, detail, category } = req.body;
    const files = await uploadFile(req, "news");
    if (!files)
      return res
        .status(500)
        .json({ success: false, message: "Error uploading photos" });

    const newsItem = await prisma.news.create({
      data: {
        title,
        detail,
        category,
        attachments: files,
      },
    });

    res
      .status(201)
      .json({ success: true, message: "News posted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error creating news item" });
  }
};

const updateNews = async (req, res) => {
  const id = req.params.id;
  try {
    const { title, detail, category } = req.body;
    const newsItem = await prisma.news.update({
      where: {
        id,
      },
      data: {
        title,
        detail,
        category,
        attachments: req.fileUrls ? req.fileUrls : [],
      },
    });
    res.status(200).json(newsItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating news item" });
  }
};

const deleteNews = async (req, res) => {
  const id = req.params.id;
  try {
    await prisma.news.delete({
      where: {
        id,
      },
    });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting news item" });
  }
};

module.exports = {
  getNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
};
