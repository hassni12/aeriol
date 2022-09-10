const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { check, validationResult } = require("express-validator");
const moment = require("moment");
const _ = require("lodash");

const { baseUrl } = require("../utils/url");
//middleware
const auth = require("../middleware/authMiddleware");
const User = require("../models/User.model");
//models
const Token = require("../models/Token.model");
const Session = require("../models/session.model");
//services
const { sendEmail } = require("../service/email");
const Controller = require("../controllers/authController");

moment().format();

// socallogin

//@route Get api/auth
//@desc Test route
//access Public

router.get("/", auth, Controller.LoadUser);

//@route Post api/login
//@desc Test route
//access Public

router.post(
  "/login",
  [
    check("email", "Email is required").isEmail(),
    check("password", "password is required").exists(),
    check("role", "role is required").exists(),
  ],
  Controller.Login
);

router.post(
  "/login/admin",
  [
    check("email", "Email is required").isEmail(),
    check("password", "password is required").exists(),
  ],
  
  Controller.AdminLogin
);

//Post /api/auth/forgot
//access public

router.post(
  "/forgot",
  check("email", "Email is required").isEmail(),
  Controller.ForgotPassword
);

//post    /api/auth/verifyCode/
//access private

router.post(
  "/verifycode",
  check("resetCode", "Code is Required"),
  Controller.VerifyCode
);

//post    /api/auth/reset/
//access private

router.post(
  "/reset/:token",
  [
    check("newpassword", "newpassword is required").not().isEmpty(),
    check("confirmpassword", "confirmpassword is required").not().isEmpty(),
  ],
  Controller.ResetPassword
);

//post    /api/auth/changepassword
//access private
router.post(
  "/changepassword",
  [
    auth,
    [
      check("currentpassword", "current Password is required").not().isEmpty(),
      check("newpassword", "New Password is required").not().isEmpty(),
      check("confirmpassword", "Confirm password is required").not().isEmpty(),
    ],
  ],
  Controller.ChangePassword
);

router.get("/logout", auth, Controller.Logout);

router.post("/social", Controller.SocialLogin);

module.exports = router;
