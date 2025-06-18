const { faker } = require("@faker-js/faker");
const { PrismaClient, paymentOptions, orgRoles } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

const generateOrganization = (id) => ({
  id: `org-${id}`,
  identification: {
    fullname: faker.company.buzzNoun(),
    localname: faker.company.buzzNoun() + " Local",
    identificationType: faker.helpers.arrayElement([
      "swiftBic",
      "proprietaryId",
    ]),
    swiftBic: faker.finance.bic(),
    proprietaryId: faker.finance.accountNumber(),
    shortname: faker.company.buzzNoun().slice(0, 3).toUpperCase(),
    lei: faker.finance.iban(),
    legacyCode: faker.company.buzzNoun().slice(0, 3),
  },
  contact: {
    residencyStatus: faker.helpers.arrayElement(["Resident", "Non-Resident"]),
    mainEmail: faker.internet.email(),
    mainPhoneNumber: faker.phone.number(),
    legalAddress: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
      postalcode: faker.location.zipCode(),
      phoneNumber: faker.phone.number(),
      faxNumber: faker.phone.number(),
    },
    actualAddress: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
      postalcode: faker.location.zipCode(),
      phoneNumber: faker.phone.number(),
      faxNumber: faker.phone.number(),
    },
  },
  behavioural: {
    startingDate: faker.date.past(5).toISOString().split("T")[0],
    participantType: faker.helpers.arrayElement(["Type A", "Type B", "Type C"]),
    issuerType: faker.helpers.arrayElement([
      "Issuer A",
      "Issuer B",
      "Issuer C",
    ]),
    settelementBankType: faker.helpers.arrayElement([
      "Bank Type A",
      "Bank Type B",
      "Bank Type C",
    ]),
    regulatorType: faker.helpers.arrayElement([
      "Regulator A",
      "Regulator B",
      "Regulator C",
    ]),
    economicSector: faker.helpers.arrayElement([
      "finance",
      "agriculture",
      "technology",
      "education",
      "health",
      "banking",
    ]),
    defaultLanguage: faker.helpers.arrayElement(["EN", "ES", "FR"]),
    taxationSchema: faker.helpers.arrayElement(["Tax A", "Tax B", "Tax C"]),
    taxRegistrationNumber: faker.finance.accountNumber(),
    globalCashSettlementAgent: faker.datatype.boolean(),
  },
  cae: {
    paymentOption: faker.helpers.arrayElement([
      "paytobank",
      "nopayment",
      "paymenttosuspense",
    ]),
    paymentValues: [
      {
        name: faker.company.name(),
        bankAccount: faker.company.buzzNoun(),
        cashAccount: faker.finance.accountNumber(),
        affectsTradingCeiling: faker.datatype.boolean(),
      },
    ],
  },
  cashAccounts: [
    // {
    //   settlementBank: faker.company.name(),
    //   settlementBankAccountNo: faker.finance.accountNumber(),
    //   requiresTradingCeiling: faker.datatype.boolean(),
    //   cashCurrency: faker.helpers.arrayElements(["USD", "EUR", "JPY"]),
    //   cashSettlementSystem: "RTGS",
    // },
  ],
  interfaces: {
    stpConnectivity: faker.helpers.arrayElement(["Enabled", "Disabled"]),
  },
  issuingLocalization: {
    internalSecuritiesIssuer: faker.datatype.boolean(),
    externalSecuritiesIssuer: faker.datatype.boolean(),
  },
  issuingOptions: {
    debtInstrumentIssuer: faker.datatype.boolean(),
    equitiesIssuer: faker.datatype.boolean(),
    ETFsissuer: faker.datatype.boolean(),
    NoNtradingFundsIssuer: faker.datatype.boolean(),
    CommoditiesIssuer: faker.datatype.boolean(),
  },
  accountsManagement: {
    allowOwnAccount: faker.datatype.boolean(),
    allowClientOmnibusAccount: faker.datatype.boolean(),
    allowClientSegregetedAccount: faker.datatype.boolean(),
  },

  roles: [
    // faker.helpers.arrayElement([
    //   "participant",
    //   "regulator",
    //   "settelementBank",
    //   "issuer",
    // ]),
  ],
  agentAndManagerRole: {
    programmeAgentForDebtInstruments: faker.datatype.boolean(),
    issuerAgentForEquities: faker.datatype.boolean(),
    issuerAgentForEtfs: faker.datatype.boolean(),
    issuerAgentForNonTradedFunds: faker.datatype.boolean(),
    nonTradedFundManager: faker.datatype.boolean(),
    issuerAgentForCommodities: faker.datatype.boolean(),
  },
  verified: faker.datatype.boolean(),
  contactPersons: [],
  settlement: [
    // { cashSettlementSystem: "RTGS", settlementBankCode: "CBETTAAA" },
  ],
  active: faker.datatype.boolean(),
  logo: faker.image.avatar(),
});

const organizations = Array.from({ length: 100 }, (_, index) =>
  generateOrganization(index + 1)
);

async function main() {
  await prisma.etoken.deleteMany();
  await prisma.credentials.deleteMany();
  await prisma.credentialsRequest.deleteMany();
  await prisma.sandboxRequest.deleteMany();
  await prisma.client.deleteMany();
  await prisma.sandbox.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.news.deleteMany();
  await prisma.feedback.deleteMany();
  for (const org of organizations) {
    const {
      identification,
      contact,
      behavioural,
      cae,
      cashAccounts,
      accountsManagement,
      interfaces,
      issuingLocalization,
      issuingOptions,
      agentAndManagerRole,
      contactPersons,
      settlement,
      ...rest
    } = org;

    await prisma.organization.create({
      data: {
        ...rest,
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
          ? { create: { ...cae, paymentValues: { create: cae.paymentValues } } }
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
          rest.roles.includes("issuer") && issuingOptions
            ? { create: issuingOptions }
            : undefined,
        agentAndManagerRole: agentAndManagerRole
          ? { create: agentAndManagerRole }
          : undefined,
        contactPersons: contactPersons ? { create: contactPersons } : undefined,
        settlement:
          settlement && rest.roles.includes("settelementBank")
            ? { create: settlement }
            : undefined,
      },
    });
  }
}

main()
  .then(async () => {
    try {
      await prisma.user.create({
        data: {
          username: "admin",
          email: "kassimroze@email.com",
          firstName: "roza",
          lastName: "kassim",
          organizationId: "org-5",
          password: await bcrypt.hash("0", 10),
          phoneNumber: "909",
          roles: ["ADMIN"],
        },
      });
      await prisma.user.create({
        data: {
          username: "roze",
          email: "weletesadok@email.com",
          organizationId: "org-2",
          password: await bcrypt.hash("0", 10),
          phoneNumber: "909",
          firstName: "ayele",
          lastName: "masresha",
          roles: ["ADMIN"],
        },
      });
      await prisma.user.create({
        data: {
          username: "jerry",
          email: "dearrmom@email.com",
          organizationId: "org-8",
          password: await bcrypt.hash("0", 10),
          phoneNumber: "909",
          firstName: "eyersusalem",
          lastName: "abiy",
          roles: ["USER"],
        },
      });
      console.log("seed success");
      await prisma.$disconnect();
    } catch (error) {
      console.log(error);
    }
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
