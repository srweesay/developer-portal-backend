const { PrismaClient } = require("@prisma/client");
const { isOwner } = require("../middlewares/verifyJWT");
const prisma = new PrismaClient();

const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { organization: { include: { identification: true } } },
    });

    res.json({
      users,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving users", error: error.message });
  }
};

const editUser = async (req, res) => {
  const { id } = req.params;
  const {
    firstName,
    lastName,
    username,
    organizationId,
    nationalIdNumber,
    dateOfBirth,
    phoneNumber,
    email,
    roles,
  } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        username,
        nationalIdNumber,
        avatar: req.fileUrls,
        dateOfBirth,
        phoneNumber,
        roles,
      },
    });
    const enableToDo = await isOwner(req, id);
    if (!enableToDo) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Only Owners and admin can modify user profile",
        });
    }
    res.json({ message: "User updated successfully", user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating user", error: error.message });
  }
};

const activateUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    res.json({ message: "User activated successfully", user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error activating user", error: error.message });
  }
};

const deactivateUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.update({
      where: { id: id },
      data: { isActive: false },
    });

    res.json({ message: "User deactivated successfully", user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deactivating user", error: error.message });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.user.delete({
      where: { id: id },
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
};

const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: id },
      include: { organization: true },
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting user",
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  editUser,
  activateUser,
  deactivateUser,
  deleteUser,
  getUserById,
};
