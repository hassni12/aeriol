const express = require("express");
const _ = require("lodash");
const router = express.Router();
const { check, validationResult } = require("express-validator");

//middleware
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

//servcies
const { url } = require("../utils");
const checkObjectId = require("../middleware/checkobjectId");

//Controller
const PromoController = require("../controllers/promoController");

// @route Post api/category/register
// access public

router.post(
  "/",
  [
    auth,
    admin,
    [
      check("name", "name is required.").not().isEmpty(),
      check("code", "code is required.").not().isEmpty(),
      check("start_date", "start_date is required.").not().isEmpty(),
      check("end_date", "end_date is required.").not().isEmpty(),
      check("discount_type", "discount_type is required.").not().isEmpty(),
      check("discount_value", "discount_value is required.").not().isEmpty(),
      check("user_limit", "user_limit is required.").not().isEmpty(),
    ],
  ],
  PromoController.CREATE_PROMO
);

//get all packges
router.get("/", PromoController.GET_ALL_PROMOS);

router.get("/:promo_id", [auth], PromoController.GET_PROMO_BY_ID);

router.post("/update/:status", [auth, admin], PromoController.UPDATE_PROMO_STATUS);

// router.post("/delete", [auth, admin], PromoController.DELETE_PROMO);

module.exports = router;
