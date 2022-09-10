const bcrypt = require("bcrypt");
const { check, validationResult } = require("express-validator");
const moment = require("moment");
const _ = require("lodash");
const { baseUrl } = require("../utils/url");
const axios = require("axios");
const fetch = require("node-fetch");
//models
const User = require("../models/User.model");
const Token = require("../models/Token.model");
const Session = require("../models/session.model");
//services
const { sendEmail } = require("../service/email");
const { SendPushNotification } = require("../utils/Notification");

var path = require("path");
const fs = require("fs");
const UserModel = require("../models/User.model");

exports.SocialLogin = async (req, res) => {
  if (req.body.method == "google") {
    try {
      const token = req.body.access_token ? req.body.access_token : "";
      const Googleuser = await axios.get(
        `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${token}`
      );

      if (Googleuser.data) {
        let user = await User.findOne({ email: Googleuser.data.email });
        if (user) {
          const token = user.generateAuthToken();
          let session = new Session({
            token: token,
            user: user.id,
            status: true,
            deviceId: req.body.deviceId ? req.body.deviceId : null,
          });


          await session.save();
          const url = baseUrl(req);
          user.image = `${url}${user.image}`;
          return res.status(200).json({
            message: "Log in Successfull",
            user: user,
            token: token,
          });
        }

        //if password doesnot match

        //decode the base 4 image
        let pathName = "uploads/images/abc.jpg";

        const response = await fetch(Googleuser.data.picture);
        const buffer = await response.buffer();
        let r = Math.random().toString(36).substring(7);
        pathName = `uploads/images/${r}.png`;
        fs.writeFileSync(path.join(__dirname, `../${pathName}`), buffer);

        //create new user
        user = new User({
          firstname: Googleuser.data.given_name,
          lastname: Googleuser.data.family_name,
          email: Googleuser.data.email,
          location: req.body.location ? req.body.location : null,
          role: req.body.role ? req.body.role : "CUSTOMER",
          image: pathName,
          googleId: Googleuser.data.id,

          //   image: req.file.path
        });
        await user.save();

        const token = user.generateAuthToken();
        let session = new Session({
          token: token,
          user: user.id,
          status: true,
          deviceId: req.body.deviceId ? req.body.deviceId : null,
        });
        await session.save();
        const url = baseUrl(req);
        user.image = `${url}${user.image}`;
        return res.status(200).json({
          message: "Log in Successfull",
          user: user,
          token: token,
        });
      }
    } catch (error) {
      return res.status(401).json({ message: error.message });
    }
  } else if (req.body.method == "facebook") {
    try {
      let access_token = req.body.access_token ? req.body.access_token : "";

      const Facebookuser = await axios({
        url: "https://graph.facebook.com/me",
        method: "get",
        params: {
          fields: ["id", "email", "first_name", "last_name", "picture"].join(
            ","
          ),
          access_token: access_token,
        },
      });
      //   console.log(Facebookuser.data.picture.data.url)

      if (Facebookuser.data) {
        let user = await User.findOne({ email: Facebookuser.data.email });
        if (user) {
          const token = user.generateAuthToken();
          let session = new Session({
            token: token,
            user: user.id,
            status: true,
            deviceId: req.body.deviceId ? req.body.deviceId : null,
          });
          // }

          await session.save();
          const url = baseUrl(req);
          user.image = `${url}${user.image}`;
          return res.status(200).json({
            message: "Log in Successfull",
            user: user,
            token: token,
          });
        }

        //if password doesnot match

        //decode the base 4 image
        let pathName = "uploads/images/abc.jpg";
        const response = await fetch(Facebookuser.data.picture.data.url);
        const buffer = await response.buffer();
        let r = Math.random().toString(36).substring(7);
        pathName = `uploads/images/${r}.png`;
        // console.log("pathname",pathName)
        fs.writeFileSync(path.join(__dirname, `../${pathName}`), buffer);

        //create new user
        user = new User({
          firstname: Facebookuser.data.first_name,
          lastname: Facebookuser.data.last_name,
          email: Facebookuser.data.email,
          location: req.body.location ? req.body.location : null,
          role: req.body.role ? req.body.role : "CUSTOMER",
          image: pathName,
          facebookId: Facebookuser.data.id,

          //   image: req.file.path
        });
        await user.save();
        const token = await user.generateAuthToken();
        session = new Session({
          token: token,
          user: user._id,
          status: true,
          deviceId: req.body.deviceId ? req.body.deviceId : null,
        });
        await session.save();
        const url = baseUrl(req);
        user.image = `${url}${user.image}`;
        return res.status(200).json({
          message: "Log in Successfull",
          user: user,
          token: token,
        });
      }
    } catch (err) {
      const errors = [];
      errors.push({ message: err.message });
      res.status(500).json({ errors: errors });
    }

    //return json webtoken
  }   
  else if (req.body.method == "apple") {
    const {first_name,last_name,email,apple_user_id,method,role} =req.body
    try {
      let user = await User.findOne({appleId: apple_user_id });


        if (user) {
          const token = user.generateAuthToken();
          let session = new Session({
            token: token,
            user: user.id,
            status: true,
            deviceId: req.body.deviceId ? req.body.deviceId : null,
          });
      

          await session.save();
          const url = baseUrl(req);
          user.image = `${url}${user.image}`;
          return res.status(200).json({
            message: "Log in Successfull",
            user: user,
            token: token,
          });
        }

        //if password doesnot match

        //decode the base 4 image
        let pathName = "uploads/images/abc.jpg";
        const random_number = Math.random().toString(36).substring(7);
        //create new user
        user = new User({
          firstname: first_name?first_name:"",
          lastname:last_name?last_name:"",
          email: email?email:"",
          location: req.body.location ? req.body.location : null,
          role: req.body.role ? req.body.role : "CUSTOMER",
          image: pathName,
          appleId: apple_user_id,
          password: `${random_number}_this_is_a_social_login_register_${random_number}`

          //   image: req.file.path
        });
        await user.save();
        const token = await user.generateAuthToken();
        session = new Session({
          token: token,
          user: user._id,
          status: true,
          deviceId: req.body.deviceId ? req.body.deviceId : null,
        });
        await session.save();
        const url = baseUrl(req);
        user.image = `${url}${user.image}`;
        return res.status(200).json({
          message: "Log in Successfull",
          user: user,
          token: token,
        });
      
    } catch (err) {
      const errors = [];
      errors.push({ message: err.message });
      res.status(500).json({ errors: errors });
    }

    //return json webtoken
  }   
 
  else {
    res.status(400).json({
      message: "Unsupported Login Method",
    });
  }

  //return json webtoken
};


exports.Login = async (req, res) => {

  try {
    let { email, password } = req.body;
    email = email.toLowerCase();
    //see if user exists
    const user = await UserModel.findOne({email,role:"USER"})

    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }
    const validpassword = await bcrypt.compare(password, user.password);
    if (!validpassword) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }
    const token = user.generateAuthToken();
  

    session = new Session({
      token: token,
      user: user.id,
      status: true,
      deviceId: req.body.deviceId,
      deviceType: req.body.deviceType,
    });


    await session.save();
    const url = baseUrl(req);
    user.image = `${url}${user.image}`;

 

    const notification2 = {
      notifiableId: user._id,
      notificationType: "Login Successful",
      title: `you are Successfully logged in `,
      body: `you are Successfully logged in`,
      payload: {
        type: "user",
        id: user._id,
      },
    };

    let resp1 = await SendPushNotification(notification2);

    res.status(200).json({
      message: "Log in Successfull",
      token: token,
      resp1: resp1,
    });
  } catch (err) {
    res.status(500).json({
      message: err.toString(),
    });
  }

  //return json webtoken
};


exports.AdminLogin = async (req, res) => {

  try {
  
    let { email, password } = req.body;
    email = email.toLowerCase();
    //see if user exists

    const user = await  UserModel.findOne({email,role:"ADMIN"})

    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }
    const validpassword = await bcrypt.compare(password, user.password);
    if (!validpassword) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }
    const token = user.generateAuthToken();
  

    session = new Session({
      token: token,
      user: user.id,
      status: true,
      deviceId: req.body.deviceId,
      deviceType: req.body.deviceType,
    });


    await session.save();
    const url = baseUrl(req);
    user.image = `${url}${user.image}`;

 

    const notification2 = {
      notifiableId: user._id,
      notificationType: "Login Successful",
      title: `you are Successfully logged in `,
      body: `you are Successfully logged in`,
      payload: {
        type: "user",
        id: user._id,
      },
    };

    let resp1 = await SendPushNotification(notification2);

    res.status(200).json({
      message: "Log in Successfull",
      token: token,
      user:user,
      resp1: resp1,
    });
  } catch (err) {
    res.status(500).json({
      message: err.toString(),
    });
  }

  //return json webtoken
};
exports.ForgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    User.findOne(
      { email: req.body.email.toLowerCase() },
      async function (err, user) {
        if (err) {
          return res.status(500).json({ message: err.message });
        }
        if (!user)
          return res.status(400).json({ message: "Invalid credentials." });

        let code = Math.floor(100000 + Math.random() * 900000);

        let token = await Token.findOne({ email: user.email });
        if (token) {
          token.remove();
        }

        let newtoken = new Token({
          email: user.email,
          token: code,
        });
        newtoken.save(function (err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // user.passwordResetToken = token.token;
          // user.passwordResetExpires = moment().add(12, "hours");

          user.resetCode = code;
          // user.passwordResetExpires = moment().add(1, "hours");

          user.save(async function (err) {
            if (err) {
              return res.status(500).json({ message: err.message });
            }

            let resp = await sendEmail(user.email, code);

            return res.status(200).json({
              message: "password recovery code successfully sent to email.",
            });
          });
        });
      }
    );
  } catch (err) {
    const errors = [];
    errors.push({ message: err.message });
    res.status(500).json({ errors: errors });
  }
};
exports.VerifyCode = (req, res) => {
  let error = [];
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Find a matching token
    Token.findOne({ token: req.body.resetCode }, function (err, token) {
      // console.log(token)
      if (err) {
        error.push({ message: err.message });
        return res.status(500).json({ errors: error });
      }
      if (!token) {
        error.push({
          message: "This code is not valid. OR Your code may have expired.",
        });
        return res.status(400).json({ errors: error });
      }

      if (token) {
        return res.status(200).json({
          message: "Code verified successfully, please set your new password ",
        });
      }
    });
  } catch (err) {
    const errors = [];
    errors.push({ message: err.message });
    res.status(500).json({ errors: errors });
  }
  // Validate password Input
};
exports.ResetPassword = (req, res) => {
  // Validate password Input
  const errors = validationResult(req);
  const { newpassword, confirmpassword } = req.body;
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Find a matching token
  Token.findOne({ token: req.params.token }, async function (err, token) {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    if (!token)
      return res.status(400).json({
        message: "This code is not valid. OR Your code may have expired.",
      });

    //see if user exists
    let user = await User.findOne({ email: token.email });
    if (!user) {
      return res.status(400).json({ error: "Invalid Credentials" });
    }

    //if currrent password and new password matches show  error
    const validpassword = await bcrypt.compare(newpassword, user.password);
    if (validpassword)
      return res.status(400).json({
        message: "please type new password which is not used earlier",
      });

    //if password and confirm password matches
    if (newpassword !== confirmpassword) {
      return res
        .status(400)
        .json({ message: "confirm password doesnot match" });
    }

    //hash password
    const salt = await bcrypt.genSalt(10);
    user.password = bcrypt.hashSync(newpassword, salt);

    token.remove();

    await user.save();
    res.status(200).json({
      message: "password updated Successfully",
    });
  });
};
exports.ChangePassword = async (req, res) => {
  let error = [];

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let error = [];
    // console.log(req.body);
    const { currentpassword, newpassword, confirmpassword } = req.body;

    // console.log(req.user)
    //see if user exists
    let user = await User.findOne({ _id: req.user._id });
    //   console.log(user)
    if (!user) {
      return res.status(400).json({ error: "user doesnot exist" });
    }

    //if password matches
    const validpassword = await bcrypt.compare(currentpassword, user.password);
    if (!validpassword) {
      error.push({ message: "Invalid Credentials" });
      return res.status(400).json({ errors: error });
    }

    //if currrent password and new password matches
    if (currentpassword === newpassword) {
      error.push({
        message: "please type new password which is not used earlier",
      });
      return res.status(400).json({ errors: error });
    }

    //if password and confirm password matches
    if (newpassword !== confirmpassword) {
      error.push({ message: "confirm password doesnot match" });
      return res.status(400).json({ errors: error });
    }

    //hash password
    const salt = await bcrypt.genSalt(10);
    user.password = bcrypt.hashSync(newpassword, salt);

    await user.save();
    res.status(200).json({
      message: "password updated Successfully",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }

  //return json webtoken
};

exports.Logout = async (req, res) => {
  try {
    const sessions = await Session.findOne({ user: req.user._id });
    (sessions.token = null),
      (sessions.status = false),
      (sessions.deviceId = null);
    await sessions.save();
    return res.status(200).send({ message: "User logout Successfullly" });
  } catch (error) {
    res.json({ message: error.message });
  }
};
exports.LoadUser = async (req, res) => {
  try {
    console.log(req.user);
    let user = await User.findOne({ _id: req.user._id });

    if (!user) {
      return res.status(400).json({ message: "User doesnot exist" });
    }
    const url = baseUrl(req);
    user.image = `${url}${user.image}`;
    res.status(200).json(user);
  } catch (error) {
    // console.error(error.message)
    res.status(500).json({ error: error.message });
  }
};
