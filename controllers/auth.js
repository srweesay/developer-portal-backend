const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { sendEmail } = require("../config/emailService");

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

const generateAccessToken = ({ id, roles, orgId }) => {
  return jwt.sign({ id, roles, orgId }, accessTokenSecret, {
    expiresIn: "15m",
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, roles: user.roles, orgId: user.orgId },
    refreshTokenSecret,
    {
      expiresIn: "7d",
    }
  );
};

module.exports = {
  register: async (req, res, next) => {
    const {
      username,
      email,
      password,
      referralCode,
      orgShortCode,
      firstName,
      lastName,
      nationalIdNumber,
      phoneNumber,
    } = req.body;
    try {
      const company = await prisma.organization.findFirst({
        where: {
          identification: {
            shortname: orgShortCode,
          },
        },
      });
      if (!company || !company.verified) {
        return res.status(404).json({
          success: false,
          message: "Organization not found or verified",
        });
      }
      const userExists = await prisma.user.findUnique({
        where: {
          email,
        },
      });
      const userExistss = await prisma.user.findUnique({
        where: {
          username,
        },
      });
      if (userExists || userExistss) {
        return res
          .status(400)
          .json({ success: false, message: "user already exists" });
      }

      if (company.referralCode !== referralCode) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid referral code" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          organization: {
            connect: { id: company.id },
          },
          firstName,
          lastName,
          nationalIdNumber,
          phoneNumber: phoneNumber,
        },
      });

      return res
        .status(201)
        .json({ success: true, message: "User registered successfully" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        sucess: false,
        message: "An error occurred during registration",
      });
    }
  },

  login: async (req, res) => {
    try {
      const { username, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { username },
        include: { organization: true },
      });
      if (!user) {
        return res
          .status(401)
          .json({ success: false, error: "Invalid email or password" });
      }

      if (user.isActive === false) {
        return res.status(401).json({
          success: false,
          error:
            "Your account has been deactivated. Please contact the system administrator for assistance.",
        });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res
          .status(401)
          .json({ success: false, error: "Invalid email or password" });
      }
      const accessToken = generateAccessToken({
        id: user.id,
        roles: user.roles,
        orgId: user.organization.id,
      });
      const refreshToken = generateRefreshToken({
        id: user.id,
        roles: user.roles,
        orgId: user.organization.id,
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: true,
      });
      res.json({ success: true, accessToken });
    } catch (error) {
      res.status(500).json({ success: false, error });
    }
  },

  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User with this email not found" });
      }

      const token = crypto.randomBytes(3).toString("hex");

      await prisma.user.update({
        where: { email },
        data: { passwordResetToken: token },
      });

      await sendEmail(
        email,
        "Password Reset Token",
        `<div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h2 style="color: #0044cc;">Password Reset Request</h2>
            <p style="color: #333333;">
              Hello,
            </p>
            <p style="color: #333333;">
              You have requested to reset your password for the Ethiopian Central Securities Depository Developer Portal. Please use the token below to reset your password.
            </p>
            <div style="background-color: #ffffff; padding: 10px; border: 1px solid #0044cc; border-radius: 5px; text-align: center;">
              <strong style="color: #0044cc; font-size: 18px;">Your Password Reset Token:</strong>
              <p style="font-size: 16px; color: #333333;">${token}</p>
            </div>
            <p style="color: #333333;">
              If you did not request this, please ignore this email.
            </p>
            <p style="color: #333333;">
              Thank you!
            </p>
            <footer style="margin-top: 20px; font-size: 12px; color: #888888;">
              <p>This email was sent from the Ethiopian Central Securities Depository Developer Portal.</p>
            </footer>
          </div>
        `
      );

      res.json({
        success: true,
        message: "Password reset token sent to email",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        error: `Error sending reset token: ${error.message}`,
      });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { token, newPassword, email } = req.body;
      if (!token) {
        return res
          .status(400)
          .json({ success: false, message: "token is requried" });
      }
      if (!newPassword) {
        return res
          .status(400)
          .json({ success: false, message: "new password is requried" });
      }

      const user = await prisma.user.findFirst({
        where: { passwordResetToken: String(token), email },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          error: "Invalid or expired password reset token",
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword, passwordResetToken: null },
      });

      res.json({ success: true, message: "Password reset successful" });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        error: `Error resetting password: ${error.message}`,
      });
    }
  },

  refresh: (req, res) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(403).json({
        success: false,
        error: "Access denied, no refresh token provided",
      });
    }

    jwt.verify(refreshToken, refreshTokenSecret, (err, user) => {
      if (err) {
        return res
          .status(403)
          .json({ success: false, error: "Invalid refresh token" });
      }

      const accessToken = generateAccessToken(user);

      res.json({ success: true, accessToken });
    });
  },
  logout: async (req, res) => {
    try {
      res.clearCookie("refreshToken");
      res.json({ message: "Logout successful" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};
