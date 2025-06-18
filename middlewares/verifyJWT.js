const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const verifyLogin = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userFound = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { roles: true },
    });

    if (
      !userFound ||
      !decoded.roles.every((role) => userFound.roles.includes(role))
    ) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    next();
  } catch (err) {
    return res.status(403).json({ message: "Forbidden" });
  }
};

const verifyAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userFound = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { roles: true },
    });

    if (!userFound || !userFound.roles.includes("ADMIN")) {
      return res
        .status(403)
        .json({ success: false, message: "Dont have enough permissions" });
    }

    next();
  } catch (err) {
    return res.status(403).json({ message: "Forbidden" });
  }
};
const verifyAdminOrOrgHead = async (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userFound = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { roles: true },
    });
    if (
      userFound.roles.includes("ADMIN") ||
      userFound.roles.includes("ORG_HEAD")
    ) {
      return true;
    }

    return false;
  } catch (err) {
    return false;
  }
};
const isOwner = async (req, idToBeModified) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userFound = await prisma.user.findUnique({
      where: { id: decoded.id },
    });
    if (userFound.roles.includes("ADMIN") || userFound.id === idToBeModified) {
      return true;
    }

    return false;
  } catch (err) {
    return false;
  }
};

module.exports = { verifyLogin, verifyAdmin, verifyAdminOrOrgHead, isOwner };
