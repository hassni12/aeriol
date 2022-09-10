const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const fs = require("fs");
var path = require("path");
const { baseUrl } = require("../utils/url");

// const Offer = require('../models/offers.model')
const User = require("../models/User.model");

const checkObjectId = require("../middleware/checkobjectId");
const NewsLetter = require("../models/Newsletter_Subscriber.model");

exports.SUBSCRIBE_NEWSLETTER = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;

  try {
    let newsletter = await NewsLetter.findOne({
      email: email,
    });
    if (newsletter_subscriber)
      return res.json({ message: "Email Already Exists" });

    newsletter = new NewsLetter({
      email: email,
    });

    await newsletter.save();

    return res.status(200).json({
      code: 200,
      message: "NewsLetter Subscribed SuccessFully",
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.GET_ALL_NEWSLETTER_SUBSCRIBERS = async (req, res) => {
  try {
    const { page, limit, fieldname, order, keyword } = req.query;
    const currentpage = page ? parseInt(page, 10) : 1;
    const per_page = limit ? parseInt(limit, 10) : 10;
    const CurrentField = fieldname ? fieldname : "createdAt";
    const currentOrder = order ? parseInt(order, 10) : -1;
    let offset = (currentpage - 1) * per_page;
    const sort = {};
    sort[CurrentField] = currentOrder;

    console.log(keyword);

    const search = keyword
      ? {
          $or: [
            { name: { $regex: `${keyword}`, $options: "i" } },
            { code: { $regex: `${keyword}`, $options: "i" } },
          ],
        }
      : {};

    const newsletter_subscribers = await NewsLetter.paginate(
      {
        ...search,
      },
      {
        page: currentpage,
        limit: per_page,
        lean: true,
        sort: "-_id",
      }
    );
    await res.status(200).send(newsletter_subscribers);
  } catch (err) {
    res.status(500).send({
      message: err.toString(),
    });
  }
};

//

//get_NEWSLETTER_ DetailByID

exports.UPDATE_NEWSLETTER_SUBSCRIBER_STATUS = async (req, res) => {
  const { status } = req.params;
  console.log(req.body);
  try {
    let newsletter_subscriber = await newsletter.findOne({
      _id: req.body.subscriber_id,
    });

    if (!newsletter_subscriber) {
      return res.status(400).json({ message: "no subscriber exist " });
    }

    if (status == 1 && newsletter_subscriber.status == 1) {
      return res.json({ message: "This subscriber is  already active " });
    } else if (status == 0 && newsletter_subscriber.status == 0) {
      return res.json({ message: "This subscriber is already inactive" });
    }

    if (newsletter_subscriber.status == 0 && status == 1) {
      newsletter_subscriber.status = status;
      await newsletter_subscriber.save();
      return res.status(200).json({ message: "subscriber Activated" });
    }
    if (newsletter_subscriber.status == 1 && status == 0) {
      newsletter_subscriber.status = status;
      await newsletter_subscriber.save();
      return res.status(200).json({ message: "subscriber deactivated" });
    } else {
      return res.status(200).json({ message: "Invalid status" });
    }
  } catch (error) {
    //   console.error(error.message);
    res.status(500).json({ error: error.message });
  }
};
