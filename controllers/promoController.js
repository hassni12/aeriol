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
const Promo = require("../models/promos.model");

//

//post package
exports.CREATE_PROMO = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    name,
    code,
    start_date,
    discount_type,
    discount_value,
    user_limit,
    end_date,
    status,
  } = req.body;

  try {
    let promo = await Promo.findOne({
      name: name.toLowerCase(),
      code: code.toLowerCase(),
      start_date: start_date,
      end_date: end_date,
     
    });
    if (promo) return res.json({ message: "promo Already Exists" });

    promo = new Promo({
      name: name.toLowerCase(),
      code: code.toLowerCase(),
      start_date: start_date,
      end_date: end_date,
      status: status,
      discount_type: discount_type,
      discount_value: discount_value,
      user_limit: user_limit,
    });

    await promo.save();

    return res.status(200).json({
      code: 200,
      message: "New Promo Created SuccessFully",
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.GET_ALL_PROMOS = async (req, res) => {
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

    const promos = await Promo.paginate(
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
    await res.status(200).send(promos);
  } catch (err) {
    res.status(500).send({
      message: err.toString(),
    });
  }
};

//

//getCategoryDetailByID

exports.GET_PROMO_BY_ID = async (req, res) => {
  let promo_id = req.params.promo_id;

  try {
    let promo = await Promo.findOne({ _id: promo_id }).lean();
    if (!promo)
      return res.status(400).json({ message: "promo Detail not found" });

    return res.status(200).json(promo);
  } catch (error) {
    // console.error(error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.UPDATE_PROMO_STATUS = async (req, res) => {
  const { status } = req.params;
  console.log(req.body);
  try {
    let promo = await Promo.findOne({ _id: req.body.promo_id });
    // console.log(promo)
    if (!promo) {
      return res.status(400).json({ message: "no promo exist " });
    }

    if (status == 1 && promo.status == 1) {
      return res.json({ message: "This promo is  already active " });
    } else if (status == 0 && promo.status == 0) {
      return res.json({ message: "This promo is already inactive" });
    }

    if (promo.status == 0 && status == 1) {
      promo.status = status;
      await promo.save();
      return res.status(200).json({ message: "promo Activated" });
    }
    if (promo.status == 1 && status == 0) {
      promo.status = status;
      await promo.save();
      return res.status(200).json({ message: "promo deactivated" });
    } else {
      return res.status(200).json({ message: "Invalid status" });
    }
  } catch (error) {
    //   console.error(error.message);
    res.status(500).json({ error: error.message });
  }
};
