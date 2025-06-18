// const { PrismaClient } = require("@prisma/client");
// const prisma = new PrismaClient();
// const Docker = require("dockerode");
// const docker = new Docker({ socketPath: "/var/run/docker.sock" });
// const { exec } = require("child_process");

// const os = require("os");
// const absolutify = require("absolutify");
// const axios = require("axios");
// const { sendEmail } = require("./organization");
// function generateRandomUser() {
//   const generateUsername = () => {
//     const characters =
//       "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
//     let username = "";
//     for (let i = 0; i < 6; i++) {
//       username += characters.charAt(
//         Math.floor(Math.random() * characters.length)
//       );
//     }
//     return username;
//   };

//   const generatePassword = () => {
//     const lowercase = "abcdefghijklmnopqrstuvwxyz";
//     const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
//     const numbers = "0123456789";
//     const specialCharacters = "@#$&?";
//     const allCharacters = lowercase + uppercase + numbers + specialCharacters;
//     let password = "";
//     password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
//     password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
//     password += numbers.charAt(Math.floor(Math.random() * numbers.length));
//     password += specialCharacters.charAt(
//       Math.floor(Math.random() * specialCharacters.length)
//     );
//     for (let i = 4; i < 8; i++) {
//       password += allCharacters.charAt(
//         Math.floor(Math.random() * allCharacters.length)
//       );
//     }
//     return password
//       .split("")
//       .sort(() => Math.random() - 0.5)
//       .join("");
//   };

//   const username = generateUsername();
//   const password = generatePassword();
//   return `username: ${username} password: ${password}`;
// }
// function getHostIpAddress() {
//   const interfaces = os.networkInterfaces();
//   for (const interfaceName in interfaces) {
//     for (const iface of interfaces[interfaceName]) {
//       if (iface.family === "IPv4" && !iface.internal) {
//         return iface.address;
//       }
//     }
//   }
//   throw new Error("Host IP address could not be found");
// }

// module.exports = {
//   getSandboxesByOrganization: async (req, res) => {
//     try {
//       const { organizationId } = req.params;

//       const organization = await prisma.organization.findUnique({
//         where: { id: organizationId },
//       });

//       if (!organization) {
//         return res
//           .status(404)
//           .json({ success: false, error: "Organization not found" });
//       }

//       const sandboxes = await prisma.sandbox.findMany({
//         where: { organizationId },
//         include: { organization: true },
//       });

//       res.json({ success: true, sandboxes });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         error: `Error fetching sandboxes: ${error.message}`,
//       });
//     }
//   },

//   getSandboxById: async (req, res) => {
//     try {
//       const { id } = req.params;

//       const sandbox = await prisma.sandbox.findUnique({
//         where: { id },
//         include: { organization: true },
//       });

//       if (!sandbox) {
//         return res
//           .status(404)
//           .json({ success: false, error: "Sandbox not found" });
//       }

//       res.json({ success: true, sandbox });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         error: `Error fetching sandbox: ${error.message}`,
//       });
//     }
//   },

//   requestSandbox: async (req, res) => {
//     try {
//       const { organizationId, requestDetails } = req.body;

//       const organization = await prisma.organization.findUnique({
//         where: { id: organizationId },
//       });

//       if (!organization) {
//         return res
//           .status(404)
//           .json({ success: false, error: "Organization not found" });
//       }

//       const newRequest = await prisma.sandboxRequest.create({
//         data: {
//           organizationId,
//           requestDetails,
//           status: "Pending",
//         },
//       });

//       res.status(201).json({
//         success: true,
//         message: "Sandbox request created successfully",
//         sandboxRequest: newRequest,
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         error: `Error creating sandbox request: ${error.message}`,
//       });
//     }
//   },

//   approveSandboxRequest: async (req, res) => {
//     try {
//       const { requestId } = req.params;
//       const request = await prisma.sandboxRequest.findUnique({
//         where: { id: requestId },
//       });

//       if (!request) {
//         return res
//           .status(404)
//           .json({ success: false, error: "Sandbox request not found" });
//       }

//       if (request.status !== "Pending") {
//         return res.status(400).json({
//           success: false,
//           error: "Sandbox request is not in a pending state",
//         });
//       }

//       const organization = await prisma.organization.findUnique({
//         where: { id: request.organizationId },
//       });

//       if (!organization) {
//         return res
//           .status(404)
//           .json({ success: false, error: "Organization not found" });
//       }
//       const url = `https://${getHostIpAddress()}:9443/csd`;
//       const creds = generateRandomUser();
//       const newSandbox = await prisma.sandbox.create({
//         data: {
//           organizationId: request.organizationId,
//           url,
//           isActive: true,
//           credentials: creds,
//         },
//       });
//       await sendEmail(
//         JSON.parse(organization.legalAddress).email,
//         "Sandbox Access Request Approved",
//         `<!DOCTYPE html>
//           <html lang="en">
//           <head>
//               <meta charset="UTF-8">
//               <meta name="viewport" content="width=device-width, initial-scale=1.0">
//               <title>Access Request Approved</title>
//               <style>
//                   body {
//                       font-family: Arial, sans-serif;
//                       margin: 0;
//                       padding: 0;
//                       background-color: #f4f4f4;
//                   }
//                   .container {
//                       width: 100%;
//                       max-width: 600px;
//                       margin: 0 auto;
//                       background-color: #ffffff;
//                       border-radius: 8px;
//                       overflow: hidden;
//                       box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
//                   }
//                   .header {
//                       background-color: #0033cc; /* Blue */
//                       color: #ffffff;
//                       padding: 20px;
//                       text-align: center;
//                   }
//                   .content {
//                       padding: 20px;
//                       color: #333333; /* Dark gray for text */
//                   }
//                   .footer {
//                       background-color: #333333; /* Black */
//                       color: #ffffff;
//                       text-align: center;
//                       padding: 10px;
//                       font-size: 12px;
//                   }
//                   .referral-code {
//                       background-color: #0033cc; /* Blue */
//                       color: #ffffff;
//                       padding: 10px;
//                       border-radius: 4px;
//                       display: inline-block;
//                       margin-top: 10px;
//                       font-weight: bold;
//                   }
//               </style>
//           </head>
//           <body>
//               <div class="container">
//                   <div class="header">
//                       <h1>Access Request Approved</h1>
//                   </div>
//                   <div class="content">
//                       <p>Dear Valued User,</p>
//                       <p>We are pleased to inform you that your can access csd test vm</p>
//                       <p>Credentials</p>
//                       <div class="referral-code">${creds}</div>
//                       <p>Thank you for being a part of our community!</p>
//                       <p>If it doesn't work. please send us feedback using the feedback section.</p>
//                   </div>
//                   <div class="footer">
//                       <p>&copy; ${new Date().getFullYear()} Ethiopian Central Securities Depository. All rights reserved.</p>
//                   </div>
//               </div>
//           </body>
//           </html>`
//       );
//       await prisma.sandboxRequest.update({
//         where: { id: request.id },
//         data: { status: "Approved" },
//       });

//       res.json({
//         success: true,
//         message: "Sandbox request approved and sandbox created",
//       });
//     } catch (error) {
//       console.log(error);
//       res.status(500).json({
//         success: false,
//         error: `Error approving sandbox request: ${error.message}`,
//       });
//     }
//   },

//   rejectSandboxRequest: async (req, res) => {
//     try {
//       const { requestId } = req.params;

//       const request = await prisma.sandboxRequest.findUnique({
//         where: { id: requestId },
//       });
//       if (!request) {
//         return res
//           .status(404)
//           .json({ success: false, error: "Sandbox request not found" });
//       }

//       if (request.status !== "Pending") {
//         return res.status(400).json({
//           success: false,
//           error: "Sandbox request is not in a pending state",
//         });
//       }

//       await prisma.sandboxRequest.update({
//         where: { id: request.id },
//         data: { status: "Rejected" },
//       });

//       res.json({ success: true, message: "Sandbox request rejected" });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         error: `Error rejecting sandbox request: ${error.message}`,
//       });
//     }
//   },
//   openSandbox: async (req, res, next) => {
//     try {
//       const { sandboxId } = req.params;

//       const sandbox = await prisma.sandbox.findUnique({
//         where: { id: sandboxId },
//         select: { url: true },
//       });

//       if (!sandbox) {
//         return res.status(404).json({ message: "Sandbox not found" });
//       }

//       let { url } = sandbox;
//       if (!/^https?:\/\//i.test(url)) {
//         return res.status(400).json({ error: "Invalid URL format" });
//       }

//       url = absolutify(url);
//       console.log(url);
//       const options = {
//         method: req.method,
//         url: decodeURIComponent(url),
//         headers: {
//           ...req.headers,
//         },
//       };

//       if (req.method === "POST") {
//         options.data = req.body;
//       }

//       const response = await axios(options);

//       res.status(response.status).send(response.data);
//     } catch (error) {
//       console.error("Error fetching URL:", error.message);
//       if (error.response) {
//         return res
//           .status(error.response.status)
//           .json({ message: "Error fetching URL", error: error.response.data });
//       } else {
//         return res
//           .status(500)
//           .json({ message: "Error fetching URL", error: error.message });
//       }
//     }
//   },
//   getRequests: async (req, res, next) => {
//     try {
//       const requests = await prisma.sandboxRequest.findMany({
//         where: { status: "Pending" },
//         include: { organization: true },
//       });
//       return res.json(requests);
//     } catch (error) {
//       return res
//         .status(500)
//         .json({ success: false, message: "internal server error" });
//     }
//   },
//   stopSandbox: async (req, res) => {
//     try {
//       const { id } = req.params;

//       const existingSandbox = await prisma.sandbox.findUnique({
//         where: { id },
//       });

//       if (!existingSandbox) {
//         return res
//           .status(404)
//           .json({ success: false, error: "Sandbox not found" });
//       }

//       const container = docker.getContainer(`sandbox-${existingSandbox.id}`);
//       console.log(container);
//       try {
//         await container.inspect();
//         await container.stop();
//         res.json({
//           success: true,
//           message: "Sandbox container stopped successfully",
//         });
//       } catch (containerError) {
//         console.log(containerError);
//         res.status(500).json({
//           success: false,
//           error: `Error stopping container: ${containerError.message}`,
//         });
//       }
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         error: `Error stopping sandbox: ${error.message}`,
//       });
//     }
//   },

//   deleteSandbox: async (req, res) => {
//     try {
//       const { id } = req.params;

//       const existingSandbox = await prisma.sandbox.findUnique({
//         where: { id },
//       });

//       if (!existingSandbox) {
//         return res
//           .status(404)
//           .json({ success: false, error: "Sandbox not found" });
//       }

//       const container = docker.getContainer(`sandbox-${existingSandbox.id}`);
//       try {
//         await container.stop();
//         await container.remove();
//       } catch (containerError) {
//         return res.status(500).json({
//           success: false,
//           error: `Error deleting sandbox:`,
//           message: containerError?.message,
//         });
//       }

//       await prisma.sandbox.delete({
//         where: { id },
//       });

//       res.json({
//         success: true,
//         message: "Sandbox and associated Docker container deleted successfully",
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         error: `Error deleting sandbox: ${error.message}`,
//       });
//     }
//   },
//   startSandbox: async (req, res) => {
//     try {
//       const { id } = req.params;

//       const existingSandbox = await prisma.sandbox.findUnique({
//         where: { id },
//       });

//       if (!existingSandbox) {
//         return res
//           .status(404)
//           .json({ success: false, error: "Sandbox not found" });
//       }

//       const container = docker.getContainer(`sandbox-${existingSandbox.id}`);
//       try {
//         await container.start();
//         res.json({
//           success: true,
//           message: "Sandbox container started successfully",
//         });
//       } catch (containerError) {
//         res.status(500).json({
//           success: false,
//           error: `Error starting container: ${containerError.message}`,
//         });
//       }
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         error: `Error starting sandbox: ${error.message}`,
//       });
//     }
//   },
//   getAllSandboxesWithStatus: async (req, res) => {
//     try {
//       const sandboxes = await prisma.sandbox.findMany({
//         include: { organization: true },
//       });

//       const sandboxStatuses = await Promise.all(
//         sandboxes.map(async (sandbox) => {
//           const container = docker.getContainer(`sandbox-${sandbox.id}`);
//           let status = "Not Running";
//           try {
//             const containerData = await container.inspect();
//             if (containerData.State.Running) {
//               status = "Running";
//             }
//           } catch (error) {
//             status = "Not Running";
//           }
//           return {
//             ...sandbox,
//             status,
//           };
//         })
//       );

//       res.json({ success: true, sandboxes: sandboxStatuses });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         error: `Error fetching sandboxes with status: ${error.message}`,
//       });
//     }
//   },
// };

// async function findAvailablePort(startPort = 8000) {
//   const net = require("net");

//   return new Promise((resolve, reject) => {
//     const port = startPort;
//     const server = net.createServer();

//     server.once("error", (err) => {
//       if (err.code === "EADDRINUSE") {
//         findAvailablePort(port + 1)
//           .then(resolve)
//           .catch(reject);
//       } else {
//         reject(err);
//       }
//     });

//     server.once("listening", () => {
//       server.close(() => {
//         resolve(port);
//       });
//     });

//     server.listen(port);
//   });
// }
// module.exports.getIp = getHostIpAddress;
