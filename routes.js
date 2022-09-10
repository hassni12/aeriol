//importing api's
const error = require("./middleware/errorMiddleware");
const cors = require("cors");
const helmet = require("helmet");
const xss = require("xss-clean");
const logger = require("morgan");
const express = require("express");

const Users = require("./routes/usersRoute");
const Auth = require("./routes/authRoute");
const Notification = require("./routes/notificationsRoute");
const Dashboard = require("./routes/dashboardRoute");
const Contact = require("./routes/contactRoute");
const NewsLetter = require("./routes/newletterRoute");
const Category = require("./routes/categoryRoute");
const Product = require("./routes/productRoute");
const Wishlist = require("./routes/wishlistRoute");
const Order = require("./routes/orderRoute");
const BookingRoute = require("./routes/bookingRoute");

// const PaymentRoute = require('./routes/paymentRoute')

module.exports = function (app) {
  //look for dependency
  //Middlware
  app.use(express.json());
  app.use(function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "POST,GET,OPTIONS,PUT,DELETE"
    );
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Accept");

    next();
  });
  const mongoSanitize = require("express-mongo-sanitize");
  const compression = require("compression");
  app.use(helmet());
  app.use(xss());
  app.use(mongoSanitize());
  // gzip compression
  app.use(compression());
  app.use(cors());
  app.options("*", cors());
  app.use(express.json({ limit: "50mb" }));
  app.use("/api/users", Users);
  app.use("/api/auth", Auth);
  app.use("/api/newsletter", NewsLetter);
  app.use("/api/notifications", Notification);
  app.use("/api/contact", Contact);
  app.use("/api/category", Category);
  app.use("/api/product", Product)
  app.use('/api/wishlist',Wishlist)
  app.use('/api/order',Order)
  app.use('/api/booking',BookingRoute)


  app.use(error);
  app.get("/uploads/images/:name", (req, res) => {
    res.sendFile(path.join(__dirname, `./uploads/images/${req.params.name}`));
  });

  app.get("/", (req, res) => {
    res.send("Aeriol Ashcer Server Runing");
  });
};
