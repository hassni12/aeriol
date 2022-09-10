const express = require("express");
const _ = require("lodash");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

const { url } = require("../utils");
const checkObjectId = require("../middleware/checkobjectId");

const productController = require("../controllers/productController");

router.post("/", [auth, admin], productController.CREATE);

router.get("/",auth, productController.GET_PRODUCTS);

router.post("/update", [auth, admin], productController.UPDATE_PRODUCT);

router.get(
  "/:id",
  [auth, checkObjectId("id")],
  productController.getProductById
);

router.post("/status/:id", [auth, admin], productController.toggleStatus);

module.exports = router;
