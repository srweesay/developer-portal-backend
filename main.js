require("dotenv").config();
require("express-async-errors");
const express = require("express");
const fs = require("fs");
const https = require("https");
const { logger, logEvents } = require("./middlewares/logger");
const errorHandler = require("./middlewares/errorHandler");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const checkDatabaseConnection = require("./config/dbCon");
const path = require("path");
const fileUpload = require("express-fileupload");

const app = express();
const port = process.env.PORT || 3000;

const privateKey = fs.readFileSync("./sslCertificates/private.key", "utf8");
const certificate = fs.readFileSync(
  "./sslCertificates/certificate.crt",
  "utf8"
);
const credentials = { key: privateKey, cert: certificate };

app.use(fileUpload());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static("files"));
app.use(express.static("files/dist"));
app.use(cookieParser());

app.use("/auth", require("./routes/auth"));
app.use("/user", require("./routes/user"));
app.use("/organization", require("./routes/organization"));
app.use("/share", require("./routes/share"));
app.use("/feed", require("./routes/feed"));
app.use("/news", require("./routes/news"));
app.use("/etoken", require("./routes/etoken"));
app.use("/credentials", require("./routes/credentials"));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "files/dist", "index.html"));
});
app.all("*", (req, res) => {
  res.status(404).json({ message: "Not Found" });
});

app.use(errorHandler);

checkDatabaseConnection()
  .then(() => {
    https.createServer(credentials, app).listen(port, "0.0.0.0", () => {
      console.log(`Server is running on https://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error(
      "Failed to start the server due to database connection issues:",
      error
    );
    logEvents(`${JSON.stringify(error)}`, "databaseConnection.log");
  });
