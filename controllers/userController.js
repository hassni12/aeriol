const express = require("express");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const fs = require("fs");
var path = require("path");
const { baseUrl } = require("../utils/url");
const { CreateNotification } = require("../utils/Notification");
const { check, validationResult } = require("express-validator");
const config = require("config");
//model
const User = require("../models/User.model");
const isBase64 = require("is-base64");
// const {ADD_TRUCK} = require('../rou)
const moment = require("moment");
const { SUBSCRIPTION_PAYMENT } = require("./paymentController");
const { use } = require("../routes/usersRoute");

exports.Register = async (req, res, next) => {
  const { firstname, lastname, email, password, confirmpassword, phone_no,country,city,zip_code,image ,role} =
    req.body;
  try {
    let error = [];
    const errors = validationResult(req);
    const url = baseUrl(req);

    if (!errors.isEmpty()) {
      console.log(errors);
      throw(errors.array())
    }

    // if user duplicated
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      error.push({ message: "User already registered" });
      throw( "User already registered")
    }

    //if password doesnot match
    if (password !== confirmpassword) {
      error.push({ message: "confirm password doesnot match" });
      throw(error)
    }

    //decode the base 4 image
    let pathName = "uploads/images/abc.png";

    let imagedata = image ? image : pathName;
    const salt = await bcrypt.genSalt(10);

    // }
    //create new user
    user = new User({
      firstname: firstname ? firstname : "",
      lastname: lastname ? firstname : "",
      email: email.toLowerCase(),
      image: imagedata,
      phone_no : phone_no,
      country:country,
      city:city,
      zip_code:zip_code,
      role: role ? role : "USER",

      //   image: req.file.path
    });
    user.password = bcrypt.hashSync(req.body.password, salt);
    const token = await user.generateAuthToken();

    await user.save();

    //hash passoword
    await user.save();

    res.status(200).json({
      message: "Registration Success, please login to proceed",
      token: token,
      data: user,
    });
  } catch (err) {
    res.status(500).send({
      message: err.toString(),
    });
  }
};
exports.GetUsers = async (req, res) => {
  const { page, limit, selection, fieldname, order, from, to, keyword, role } =
    req.query;
  const currentpage = page ? parseInt(page, 10) : 1;
  const per_page = limit ? parseInt(limit, 10) : 5;
  const CurrentField = fieldname ? fieldname : "createdAt";
  const currentOrder = order ? parseInt(order, 10) : -1;
  let offset = (currentpage - 1) * per_page;
  const sort = {};
  sort[CurrentField] = currentOrder;
  const currentSelection = selection ? selection : 1;
  let roleType = role ? { role: role } : { role: { $ne: "ADMIN" } };

  let Datefilter = "";
  if (from && to) {
    Datefilter =
      from && to
        ? {
            createdAt: {
              $gte: moment(from).startOf("day").toDate(),
              $lte: moment(to).endOf("day").toDate(),
            },
          }
        : {};
    console.log("fromto", Datefilter);
  } else if (from) {
    console.log("from");
    Datefilter = from
      ? {
          createdAt: {
            $gte: moment(from).startOf("day").toDate(),
            $lte: moment(new Date()).endOf("day").toDate(),
          },
        }
      : {};
    console.log("from", Datefilter);
  } else if (to) {
    console.log.apply("to");
    Datefilter = to
      ? { createdAt: { $lte: moment(to).endOf("day").toDate() } }
      : {};
    console.log("to", Datefilter);
  }

  const search = keyword
    ? {
        $or: [
          { firstname: { $regex: `${keyword}`, $options: "i" } },
          { lastname: { $regex: `${keyword}`, $options: "i" } },
        ],
      }
    : {};
  let filter = { ...Datefilter, ...search, ...roleType };

  try {
    let users = await User.find({ ...filter })
      .limit(per_page)
      .skip(offset)
      .sort(sort);
    // console.log(users)
    if (!users.length) {
      return res.status(400).json({ message: "no user exist" });
    }
    const url = baseUrl(req);
    users.forEach((user) => (user.image = `${url}${user.image}`));
    let Totalcount = await User.find({ ...filter }).countDocuments();
    const paginate = {
      currentPage: currentpage,
      perPage: per_page,
      total: Math.ceil(Totalcount / per_page),
      to: offset,
      data: users,
    };
    res.status(200).json(paginate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.EditProfile = async (req, res) => {
  const url = baseUrl(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
  }

  const {
    firstname,
    lastname,
    city,
    country,
    phone_no,
    state,
    zip_code,
    address,
    location,
    image,
  } = req.body;

  try {
    let user = await User.findOne({ _id: req.user._id });
    let test = "";
    // console.log(user)
    if (!user) {
      return res.status(400).json({ message: "no  User Found" });
    }
    user.firstname = firstname ? firstname : user.firstname;
    (user.lastname = lastname ? lastname : user.lastname),
      (user.city = city ? city : user.city),
      (user.country = country ? country : user.country),
      (user.state = state ? state : user.state),
      (user.zip_code = zip_code ? zip_code : user.zip_code),
      (user.address = address ? address : user.address);
    user.phone_no = phone_no ? phone_no : user.phone_no;
    user.location = location ? location : user.location;
    user.image = image ? image : user.image;

    await user.save();

    res.status(200).json({
      message: "Profile Updated Successfully",
      user: user,
    });
  } catch (err) {
    res.status(500).json({
      message: err.toString(),
    });
  }
};
exports.GetCurrentUser = async (req, res) => {
  try {
    let user = await User.findOne({ _id: req.user._id })
      .populate("package")
      .lean();
    // console.log(user)
    if (!user) {
      return res.status(400).json({ message: "User doesnot exist" });
    }
    const url = baseUrl(req);
    user.image = `${url}${user.image}`;

    if (user.role == "TRUCKER") {
      console.log("true");
      const truck = await truckModel.findOne({ user: req.user._id }).lean();
      user.truck = truck;
      user.truck.truckimage = `${url}${user.truck.truckimage}`;
    }

    res.status(200).json({
      user: user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.GetUserById = async (req, res) => {
  let user_id = req.params.user_id;
  try {
    const user = await User.findOne({
      _id: user_id,
    });

    if (!user)
      return res.status(400).json({ message: "User Detail not found" });
    const url = baseUrl(req);
    user.image = `${url}${user.image}`;
    return res.json(user);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: err.message });
  }
};
exports.ApproveAndBlockUser = async (req, res) => {
  const { status } = req.params;
  //   console.log(status)
  try {
    let user = await User.findOne({ _id: req.body.userId });
    // console.log(user)
    if (!user) {
      return res.status(400).json({ message: "no user exist " });
    }

    if (status == 1 && user.status == 1) {
      return res.json({ message: "This user is  already active " });
    } else if (status == 0 && user.status == 0) {
      return res.json({ message: "This user is already blocked" });
    }

    if (user.status == 0 && status == 1) {
      user.status = status;
      await user.save();
      return res.status(200).json({ message: "User is  Active" });
    }
    if (user.status == 1 && status == 0) {
      user.status = status;
      await user.save();
      return res.status(200).json({ message: "User is blocked" });
    } else {
      return res.status(200).json({ message: "Invalid status" });
    }
  } catch (error) {
    //   console.error(error.message);
    res.status(500).json({ error: error.message });
  }
};
exports.UPLOAD_PICTURE = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const url = baseUrl(req);

    let pathName = "";
    if (req.body.image) {
      let image = req.body.image;
      console.log("image found");
      var data = image.replace(/^data:image\/\w+;base64,/, "");
      let buff = new Buffer.from(data, "base64");
      let r = Math.random().toString(36).substring(7);

      pathName = `uploads/images/${r}.png`;
      fs.writeFileSync(path.join(__dirname, `../${pathName}`), buff);
      // var full_address = req.protocol + "://" + req.headers.host ;
    }
    let uri = `${url}${pathName}`;

    res.status(200).json({
      path: pathName,
      uri: uri,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

exports.Update_User = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
  }

  const {
    firstname,
    lastname,
    city,
    country,
    state,
    zip_code,
    address,
    phone_no,
  } = req.body;

  try {
    let user = await User.findOne({ _id: req.params.userId });
    // console.log(user)
    if (!user) {
      return res.status(400).json({ message: "no  User Found" });
    }
    user.firstname = firstname;
    (user.lastname = lastname),
      (user.city = city ? city : user.city),
      (user.country = country ? country : user.country),
      (user.state = state ? state : user.state),
      (user.zip_code = zip_code ? zip_code : user.zip_code),
      (user.address = address ? address : user.address);
    user.phone_no = phone_no ? phone_no : user.phone_no;

    if (isBase64(image, { allowMime: true })) {
      console.log("trueeeeeeeeeee");

      let image = req.body.image;
      image = image.replace(/^data:image\/\w+;base64,/, "");
      let buff = new Buffer.from(image, "base64");
      let r = Math.random().toString(36).substring(7);
      let pathName = `uploads/images/${r}.png`;
      await fs.writeFileSync(path.join(__dirname, `../${pathName}`), buff);

      // //create new user
      user.image = pathName;
    }
    await user.save();

    const url = baseUrl(req);
    user.image = `${url}${user.image}`;

    const resuser = user;
    res.status(200).json({
      message: "User Profile Updated Successfully",
      user: resuser,
    });
  } catch (err) {
    const errors = [];
    errors.push({ message: err.message });
    res.status(500).json({ errors: errors });
  }
};
