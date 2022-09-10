const express = require("express");
const _ = require("lodash");
const router = express.Router();
const { check, validationResult } = require("express-validator");

//middleware
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");


//Controller
const NewsletterController = require("../controllers/NewsletterController");

// @route Post api/category/register
// access public

router.post(
  "/subscribe",
  [
    auth,
    admin,
    [
      check("email", "email is required.").not().isEmpty(),
      
    ],
  ],
  NewsletterController.SUBSCRIBE_NEWSLETTER
);

//get all packges
router.get("/", NewsletterController.GET_ALL_NEWSLETTER_SUBSCRIBERS);

router.post("/update/:status", [auth, admin], NewsletterController.UPDATE_NEWSLETTER_SUBSCRIBER_STATUS);


module.exports = router;
