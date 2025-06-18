const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const checkUniqueness = async (field, value) => {
  const organizations = await prisma.organization.findMany({
    where: {
      identification: {
        contains: `"${field}":"${value}"`,
      },
    },
  });

  return organizations.length > 0;
};

const validateUniqueFields = async (fields) => {
  const { swiftBic, proprietaryId, taxRegistrationNumber, identificationType } =
    JSON.parse(fields.identification);

  if (fields.update) {
    if (identificationType === "swiftBic") {
      if (!swiftBic) {
        throw new Error(" swiftBic must not be empty.");
      }

      if (!validateSwiftBic(swiftBic)) {
        throw new Error("swiftBic must be a valid BIC code.");
      }
    }
    if (identificationType === "proprietaryId" && !proprietaryId) {
      throw new Error(
        "When identificationType is proprietaryId, proprietaryId must not be empty."
      );
    }
    return;
  }

  if (swiftBic && (await checkUniqueness("swiftBic", swiftBic))) {
    throw new Error("swiftBic must be unique.");
  }

  if (
    proprietaryId &&
    (await checkUniqueness("proprietaryId", proprietaryId))
  ) {
    throw new Error("proprietaryId must be unique.");
  }

  if (
    taxRegistrationNumber &&
    (await checkUniqueness("taxRegistrationNumber", taxRegistrationNumber))
  ) {
    throw new Error("taxRegistrationNumber must be unique.");
  }

  if (identificationType === "swiftBic") {
    if (!swiftBic) {
      throw new Error(" swiftBic must not be empty.");
    }

    if (!validateSwiftBic(swiftBic)) {
      throw new Error("swiftBic must be a valid BIC code.");
    }
  }

  if (identificationType === "proprietaryId") {
    if (!proprietaryId) {
      throw new Error(
        "When identificationType is proprietaryId, proprietaryId must not be empty."
      );
    }

    if (await checkUniqueness("proprietaryId", proprietaryId)) {
      throw new Error("proprietaryId must be unique.");
    }
  }

  if (!swiftBic && !proprietaryId) {
    throw new Error(
      "Either swiftBic or proprietaryId must be provided when identificationType is required."
    );
  }
};

const validateSwiftBic = (bic) => {
  const bicRegex = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
  return bicRegex.test(bic);
};

module.exports = { validateUniqueFields, validateSwiftBic };
