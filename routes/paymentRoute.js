const express = require("express");
const { check } = require("express-validator");
const auth = require("../middleware/authMiddleware");

const paymentController = require("../controllers/paymentController");
const router = express.Router();




router.post(
  "/pay",
  [
    auth,
    [
      check("package", "package is required").not().isEmpty(),
      check("payment_method", "payment_method is required").not().isEmpty(),
      check("charges", " charges is required").not().isEmpty(),
      // check("card_number", "card_number is required").not().isEmpty(),
      // check("card_expiry", "card_expiry is required").not().isEmpty(),
      // check("card_cvv", "card_cvv is required").not().isEmpty(),

    ],
  ],
  paymentController.SUBSCRIBE_PAYMENT
);


router.get(
  "/allsubscriptions",
  [
    auth,
  ],
  paymentController.GET_ALL_SUBSCRIPTION_PAYMENTS
);



router.get(
    "/mysubscription",
    [
      auth,
    ],
    paymentController.MY_SUBSCRIPTION
  );


  router.get(
    "/:payment_id",
    [
      auth,
    ],
    paymentController.GET_PAYMENT_DETAIL_BY_ID
  );


module.exports = router