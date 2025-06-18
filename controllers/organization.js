const jwt = require("jsonwebtoken");
const { PrismaClient, Prisma } = require("@prisma/client");
const prisma = new PrismaClient();
const { validateSwiftBic } = require("../config/validators");
const crypto = require("crypto");
const { sendEmail } = require("../config/emailService");
const { connect } = require("http2");
const { create } = require("domain");
const { verifyAdminOrOrgHead } = require("../middlewares/verifyJWT");

const generateReferralCode = () =>
  crypto.randomBytes(4).toString("hex").toUpperCase();

const registerOrganization = async (req, res) => {
  const {
    identification,
    roles,
    behavioural,
    interfaces,
    issuingLocalization,
    issuingOptions,
    accountsManagement,
    agentAndManagerRole,
    settlement,
    contact,
    cashAccounts,
    cae,
    contactPersons,
  } = req.body;
  try {
    if (
      roles &&
      identification &&
      (roles.includes("settelementBank") ||
        identification.identificationType === "swiftBic")
    ) {
      const validBic = validateSwiftBic(identification.swiftBic);
      if (!validBic)
        return res
          .status(400)
          .json({ success: false, message: "Invalid Swift Bic" });
    }
    await prisma.organization.create({
      data: {
        roles,
        identification: identification
          ? {
              create: identification,
            }
          : undefined,
        contact: contact
          ? {
              create: {
                ...contact,
                legalAddress: contact.legalAddress
                  ? {
                      create: contact.legalAddress,
                    }
                  : undefined,
                actualAddress: contact.actualAddress
                  ? {
                      create: contact.actualAddress,
                    }
                  : undefined,
              },
            }
          : undefined,
        behavioural: behavioural
          ? {
              create: behavioural,
            }
          : undefined,

        cae: cae
          ? {
              create: {
                paymentOption: cae.paymentOption,
                paymentValues: { create: cae.paymentValues },
              },
            }
          : undefined,
        cashAccounts: cashAccounts ? { create: cashAccounts } : undefined,
        accountsManagement: accountsManagement
          ? { create: accountsManagement }
          : undefined,
        interfaces: interfaces ? { create: interfaces } : undefined,
        issuingLocalization: issuingLocalization
          ? { create: issuingLocalization }
          : undefined,
        issuingOptions:
          roles && roles.includes("issuer") && issuingOptions
            ? { create: issuingOptions }
            : undefined,
        agentAndManagerRole: agentAndManagerRole
          ? { create: agentAndManagerRole }
          : undefined,
        contactPersons: contactPersons ? { create: contactPersons } : undefined,
        settlement:
          settlement && roles && roles.includes("settelementBank")
            ? { create: settlement }
            : undefined,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Organization registered successfully",
    });
  } catch (error) {
    const message = error.message;
    console.log(message);
    if (message.includes("must not be null")) {
      const fieldMatch = message.match(/Argument `(\w+)` must not be null/);
      const fieldName = fieldMatch ? fieldMatch[1] : "unknown field";

      return res.status(400).json({
        success: false,
        message: `The field '${fieldName}' cannot be null. Please provide a valid value.`,
      });
    } else if (error.code === "P2002") {
      const violatedField = error.meta.target.join(", ");
      return res.status(400).json({
        success: false,
        message: `Duplicate values are not allowed for: ${violatedField}`,
      });
    } else if (error.code === "P2003") {
      return res.status(400).json({
        success: false,
        message: "Invalid reference value provided for a foreign key field.",
      });
    } else if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message:
          "The requested record does not exist or has already been deleted.",
      });
    } else if (error instanceof Prisma.PrismaClientValidationError) {
      return res.status(400).json({
        success: false,
        message:
          "Validation failed. Please ensure all required fields are provided and correct.",
      });
    } else {
      return res.status(500).json({
        success: false,
        message:
          "Internal Server Error occurred. Please try again later.Error saved for investigation.",
      });
    }
  }
};

const editOrganization = async (req, res) => {
  const { id } = req.params;
  const {
    identification,
    behavioural,
    interfaces,
    roles,
    issuingLocalization,
    issuingOptions,
    accountsManagement,
    agentAndManagerRole,
    settlement,
    contact,
    cashAccounts,
    cae,
    contactPersons,
  } = req.body;
  try {
    const allowedToDo = await verifyAdminOrOrgHead(req);
    if (!allowedToDo) {
      return res.status(400).json({
        success: false,
        message:
          "Your role is not authorized here, only admins and users with organization email on their profile can do it.this trial is tracked on the system thanks.",
      });
    }
    if (
      roles &&
      identification &&
      (roles.includes("settelementBank") ||
        identification.identificationType === "swiftBic")
    ) {
      const validBic = validateSwiftBic(identification.swiftBic);
      if (!validBic)
        return res
          .status(400)
          .json({ success: false, message: "invalid swift bic" });
    }
    if (contact && !contact.id) {
      await prisma.contact.create({
        data: {
          create: {
            ...contact,
            orgId: id,
            legalAddress: contact.legalAddress
              ? {
                  create: contact.legalAddress,
                }
              : undefined,
            actualAddress: contact.actualAddress
              ? {
                  create: contact.actualAddress,
                }
              : undefined,
          },
        },
      });
    }
    if (contact && contact.id) {
      const {
        id: legalAddressId,
        contactId,
        ...legalAddressData
      } = contact.legalAddress || {};
      const {
        id: actualAddressId,
        contactId: dd,
        ...actualAddressData
      } = contact.actualAddress || {};

      const updatedContact = await prisma.contact.update({
        where: { id: contact.id },
        data: {
          residencyStatus: contact.residencyStatus,
          mainEmail: contact.mainEmail,
          mainPhoneNumber: contact.mainPhoneNumber,
          orgId: contact.orgId,
          legalAddress: legalAddressId
            ? {
                update: legalAddressData,
              }
            : {
                connect: legalAddressData,
              },
          actualAddress: actualAddressId
            ? {
                update: actualAddressData,
              }
            : {
                connect: actualAddressData,
              },
        },
        include: {
          legalAddress: true,
          actualAddress: true,
        },
      });
    }
    if (cae && !cae.id) {
      await prisma.cae.create({
        data: {
          paymentOption: cae.paymentOption,
          orgId: id,
          paymentValues: { create: cae.paymentValues },
        },
      });
    }

    if (cae && cae.id) {
      const { paymentValues = [], ...caeData } = cae;

      const existingPaymentValues = paymentValues.filter(
        (account) => account.id
      );
      const newPaymentValues = paymentValues.filter((account) => !account.id);
      const updatedCae = await prisma.cae.update({
        where: { id: cae.id },
        data: {
          paymentOption: cae.paymentOption,
          ...caeData,
          paymentValues: {
            update:
              existingPaymentValues.length > 0
                ? existingPaymentValues.map((account) => {
                    const { id, caeId, ...acc } = account;
                    return {
                      where: { id },
                      data: { ...acc },
                    };
                  })
                : undefined,

            create:
              newPaymentValues.length > 0
                ? newPaymentValues.map((account) => ({
                    ...account,
                  }))
                : undefined,
          },
        },
        include: {
          paymentValues: true,
        },
      });
    }

    await prisma.organization.update({
      where: { id },
      data: {
        roles,

        identification: identification
          ? identification.id
            ? {
                update: {
                  where: { id: identification.id },
                  data: (({ id, orgId, ...rest }) => rest)(identification), // Filter the data
                },
              }
            : { create: { ...identification } }
          : undefined,

        behavioural: behavioural
          ? behavioural.id
            ? {
                update: {
                  where: { id: behavioural.id },
                  data: (({ id, orgId, ...rest }) => rest)(behavioural), // Filter the data
                },
              }
            : { create: { ...behavioural } }
          : undefined,

        cashAccounts: cashAccounts?.length
          ? {
              update: cashAccounts
                .filter((account) => account.id)
                .map((account) => {
                  const { id, orgId, ...rest } = account;
                  return {
                    where: { id },
                    data: { ...rest },
                  };
                }),
              create: cashAccounts
                .filter((account) => !account.id)
                .map((account) => ({ ...account })),
            }
          : undefined,

        accountsManagement: accountsManagement
          ? accountsManagement.id
            ? {
                update: {
                  where: { id: accountsManagement.id },
                  data: (({ id, orgId, ...rest }) => rest)(accountsManagement),
                },
              }
            : { create: { ...accountsManagement } }
          : undefined,

        interfaces: interfaces
          ? interfaces.id
            ? {
                update: {
                  where: { id: interfaces.id },
                  data: (({ id, orgId, ...rest }) => rest)(interfaces),
                },
              }
            : { create: { ...interfaces } }
          : undefined,

        issuingLocalization: issuingLocalization
          ? issuingLocalization.id
            ? {
                update: {
                  where: { id: issuingLocalization.id },
                  data: (({ id, orgId, ...rest }) => rest)(issuingLocalization),
                },
              }
            : { create: { ...issuingLocalization } }
          : undefined,

        issuingOptions:
          roles && roles.includes("issuer") && issuingOptions
            ? issuingOptions.id
              ? {
                  update: {
                    where: { id: issuingOptions.id },
                    data: (({ id, orgId, ...rest }) => rest)(issuingOptions),
                  },
                }
              : { create: { ...issuingOptions } }
            : undefined,

        agentAndManagerRole: agentAndManagerRole
          ? agentAndManagerRole.id
            ? {
                update: {
                  where: { id: agentAndManagerRole.id },
                  data: (({ id, orgId, ...rest }) => rest)(agentAndManagerRole),
                },
              }
            : { create: { ...agentAndManagerRole } }
          : undefined,

        contactPersons: contactPersons?.length
          ? {
              update: contactPersons
                .filter((account) => account.id)
                .map((account) => {
                  const { id, orgId, ...rest } = account;
                  return {
                    where: { id },
                    data: { ...rest },
                  };
                }),
              create: contactPersons
                .filter((account) => !account.id)
                .map((account) => ({ ...account })),
            }
          : undefined,
        settlement:
          settlement?.length && roles && roles.includes("settlementBank")
            ? {
                update: settlement
                  .filter((account) => account.id)
                  .map((account) => {
                    const { id, orgId, ...rest } = account;
                    return {
                      where: { id },
                      data: { ...rest },
                    };
                  }),
                create: settlement
                  .filter((account) => !account.id)
                  .map((account) => ({ ...account })),
              }
            : undefined,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Organization updated successfully",
    });
  } catch (error) {
    const message = error.message;
    if (message.includes("must not be null")) {
      const fieldMatch = message.match(/Argument `(\w+)` must not be null/);
      const fieldName = fieldMatch ? fieldMatch[1] : "unknown field";

      return res.status(400).json({
        success: false,
        message: `The field '${fieldName}' cannot be null. Please provide a valid value.`,
      });
    } else if (error.code === "P2002") {
      const violatedField = error.meta.target.join(", ");
      return res.status(400).json({
        success: false,
        message: `Duplicate values are not allowed for: ${violatedField}`,
      });
    } else if (error.code === "P2003") {
      return res.status(400).json({
        success: false,
        message: "Invalid reference value provided for a foreign key field.",
      });
    } else if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message:
          "The requested record does not exist or has already been deleted.",
      });
    } else if (error instanceof Prisma.PrismaClientValidationError) {
      return res.status(400).json({
        success: false,
        message:
          "Validation failed. Please ensure all required fields are provided and correct.",
      });
    } else {
      return res.status(500).json({
        success: false,
        message:
          "Internal Server Error occurred. Please try again later.Error saved for investigation.",
      });
    }
  }
};

const deleteOrganization = async (req, res) => {
  const { id } = req.params;
  const organizationExists = await prisma.organization.findUnique({
    where: { id },
  });
  if (!organizationExists) {
    return res.status(400).json({ message: "organization doesn't exists" });
  }

  try {
    await prisma.organization.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({
      error: "Organization could not be deleted",
    });
  }
};

const activateOrganization = async (req, res) => {
  const { id } = req.params;
  const organizationExists = await prisma.organization.findUnique({
    where: { id },
  });
  if (!organizationExists) {
    return res.status(400).json({ message: "organization doesn't exists" });
  }

  try {
    const organization = await prisma.organization.update({
      where: { id },
      data: { active: true },
    });
    res.status(200).json(organization);
  } catch (error) {
    res.status(400).json({
      error: "Organization could not be activated",
    });
  }
};

const deactivateOrganization = async (req, res) => {
  const { id } = req.params;
  const organizationExists = await prisma.organization.findUnique({
    where: { id },
  });
  if (!organizationExists) {
    return res.status(400).json({ message: "organization doesn't exists" });
  }

  try {
    const organization = await prisma.organization.update({
      where: { id },
      data: { active: false },
    });
    res.status(200).json(organization);
  } catch (error) {
    res.status(400).json({
      error: "Organization could not be deactivated",
    });
  }
};

const verifyOrganization = async (req, res) => {
  const { id } = req.params;
  const organizationExists = await prisma.organization.findUnique({
    where: { id },
    include: { contact: true },
  });
  if (!organizationExists.contact.mainEmail) {
    return res
      .status(400)
      .json({ message: "organization doesn't exists, or Invalid Email" });
  }

  const email = organizationExists.contact.mainEmail;
  try {
    const referralCode = generateReferralCode();
    await sendEmail(
      email,
      "Organization Verified",
      `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Organization Verified</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }
                .container {
                    width: 100%;
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                .header {
                    background-color: #0033cc; /* Blue */
                    color: #ffffff;
                    padding: 20px;
                    text-align: center;
                }
                .content {
                    padding: 20px;
                    color: #333333; /* Dark gray for text */
                }
                .footer {
                    background-color: #333333; /* Black */
                    color: #ffffff;
                    text-align: center;
                    padding: 10px;
                    font-size: 12px;
                }
                .referral-code {
                    background-color:rgb(9, 64, 227); /* Blue */
                    color: #ffffff;
                    padding: 10px;
                    border-radius: 4px;
                    display: inline-block;
                    margin-top: 10px;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Organization Verified</h1>
                </div>
                <div class="content">
                    <p>Dear Valued User,</p>
                    <p>We are pleased to inform you that your organization has been successfully registered on ESCD</p>
                    <p>You can now have your users register using the referral code.</p>
                    <div class="referral-code">${referralCode}</div>
                    <p>Thank you for being a part of our community!</p>
                </div>
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} Ethiopian Central Securities Depository. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>`
    );
    await prisma.organization.update({
      where: { id },
      data: { verified: true, referralCode },
    });
    res.status(200).json({
      message: "Organization verified and referral code sent",
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "error while verification", success: false });
  }
};
const getAllOrganizations = async (req, res) => {
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

    if (userFound.roles.includes("ADMIN")) {
      const organizations = await prisma.organization.findMany({
        include: {
          identification: true,
          accountsManagement: true,
          agentAndManagerRole: true,
          behavioural: true,
          cae: true,
          cashAccounts: true,
          interfaces: true,
          issuingLocalization: true,
          issuingOptions: true,
          settlement: true,
        },
      });
      return res.status(200).json(organizations);
    } else {
      const organizations = await prisma.organization.findMany({
        where: {
          id: decoded.orgId,
        },
        include: {
          identification: true,
          accountsManagement: true,
          agentAndManagerRole: true,
          behavioural: true,
          cae: true,
          cashAccounts: true,
          interfaces: true,
          issuingLocalization: true,
          issuingOptions: true,
          settlement: true,
        },
      });
      return res.status(200).json(organizations);
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error: "Could not retrieve organizations",
    });
  }
};

const getOrganizationById = async (req, res) => {
  const { id } = req.params;

  try {
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        identification: true,
        accountsManagement: true,
        agentAndManagerRole: true,
        behavioural: true,
        cae: { include: { paymentValues: true } },
        cashAccounts: true,
        interfaces: true,
        issuingLocalization: true,
        issuingOptions: true,
        settlement: true,
        contactPersons: true,
        contact: { include: { legalAddress: true, actualAddress: true } },
      },
    });
    if (!organization) {
      res.status(404).json({ error: "Organization not found" });
    } else {
      res.status(200).json(organization);
    }
  } catch (error) {
    res.status(400).json({
      error: "Could not retrieve organization",
    });
  }
};

module.exports = {
  registerOrganization,
  editOrganization,
  deleteOrganization,
  activateOrganization,
  deactivateOrganization,
  verifyOrganization,
  getAllOrganizations,
  getOrganizationById,
  sendEmail,
};
