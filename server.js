require("dotenv").config();

const express = require("express");
const app = express();
const path = require("path");;

const port = process.env.PORT ||  5032;
const connectDB = require("./config/db");
var fs = require("fs");
var https = require("https");
require("dotenv").config();

var multipart = require("connect-multiparty");

//db connection
connectDB();




app.use(multipart());

let local = true;
var credentials = "";
let privateKey = "";
let certificate = "";
let cabundle = "";



if (local) {
  privateKey = fs.readFileSync(
    "/etc/apache2/ssl/onlinetestingserver.key",
    "utf8"
  );
  certificate = fs.readFileSync(
    "/etc/apache2/ssl/onlinetestingserver.crt",
    "utf8"
  );
  cabundle = fs.readFileSync("/etc/apache2/ssl/onlinetestingserver.ca");
  credentials = { key: privateKey, cert: certificate, ca: cabundle };
} else {
  privateKey = fs.readFileSync(
    "/home/followmyfoodtruc/ssl/keys/d8a69_d4105_e20d371273a13af1467620eaad82187f.key"
  );
  certificate = fs.readFileSync(
    "/home/followmyfoodtruc/ssl/certs/www_followmyfoodtrucks_com_d8a69_d4105_1661903999_9a8bdfeeb18e5c3037bb0cafcbed905d.crt"
  );
  cabundle = fs.readFileSync(
    "/home/followmyfoodtruc/ssl/certs/www_followmyfoodtrucks__com.ca"
  );
  credentials = { key: privateKey, cert: certificate, ca: cabundle };
}

//Init middleware
require("./routes")(app);


var httpsServer = https.createServer(credentials, app);

const server = httpsServer.listen(port, () => {
  console.log(`Server is running at the port  ${port}`);
});
