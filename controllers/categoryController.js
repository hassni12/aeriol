const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const fs = require("fs");
var path = require("path");
const { baseUrl } = require("../utils/url");
const User = require("../models/User.model");
const checkObjectId = require("../middleware/checkobjectId");
const Category = require("../models/category.model");
const { GET_IMAGE_PATH } = require("../helper/helper");

//post Category
exports.ADD_CATEGORY = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, status } = req.body;

  try {
    let category = await Category.find({
      name: name.toLowerCase(),
    });
    if (category.length)
      return res.json({ message: "Category Already Exists" });

    let image = req.files.image;
    let imagepath = await GET_IMAGE_PATH(image);

    category = new Category({
      name: name.toLowerCase(),
      image: imagepath,
      status: status,
    });

    await category.save();

    return res.status(200).json({
      code: 200,
      message: "New Category has been added",
    });
  } catch (err) {
    res.status(500).send({
      message: err.toString(),
    });
  }
};

// getCategories
exports.GET_ALL_CATEGORIES = async (req, res) => {
  try {
    const { page, limit, fieldname, order, keyword } = req.query;
    const currentpage = page ? parseInt(page, 10) : 1;
    const per_page = limit ? parseInt(limit, 10) : 10;

    const searchParam = req.query.searchString
      ? { $text: { $search: req.query.searchString } }
      : {};
    const from = req.query.from ? req.query.from : null;
    const to = req.query.to ? req.query.to : null;
    let dateFilter = {};
    if (from && to)
      dateFilter = {
        createdAt: {
          $gte: moment(new Date(from)).startOf("day"),
          $lte: moment(new Date(to)).endOf("day"),
        },
      };

    const categories = await Category.paginate(
      {
        ...searchParam,
        ...dateFilter,
      },
      {
        page: currentpage,
        limit: per_page,
        lean: true,
        sort: "-_id",
      }
    );
    await res.status(200).send(categories);
  } catch (err) {
    res.status(500).send({
      message: err.toString(),
    });
  }
};

exports.UPDATE_CATEGORY = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, categoryId } = req.body;
  const image = req.files.image
  let imagepath = await GET_IMAGE_PATH(image);


  try {
    let category = await Category.findOne({
      _id: categoryId,
    });
    if (!category) return res.json({ error: "Category Doesnot Exists" });

    category.name = name ? name : category.name;
    category.image = image?imagepath:category.image

    await category.save();

    return res.status(200).json({
      code: 200,
      message: "Category is  updated",
    });
  } catch (err) {
    res.status(500).send({
      message: err.toString(),
    });
  }
};

//getCategoryDetailByID

exports.GET_CATEGORY_BY_ID = async (req, res) => {
  let category_id = req.params.category_id;

  try {
    let category = await Category.findOne({ _id: category_id }).lean();

   
    if (!category)
      return res.status(400).json({ message: "category Detail not found" });
    return res.status(200).json(category);
  } catch (err) {
    res.status(500).send({
      message: err.toString(),
    });
  }
};

exports.UPDATE_CATEGORY_STATUS = async (req, res) => {
  const { status } = req.params;
  const category_id = req.body.category_id;
  try {
    let category = await Category.findOne({ _id: category_id });
    // console.log(user)
    if (!category) {
      return res.status(200).json({ message: "no category found " });
    }

    if (status == 1 && category.status == 1) {
      return res.json({ message: "This category is  already active " });
    } else if (status == 0 && category.status == 0) {
      return res.json({ message: "This category is already Inactive" });
    }

    if (category.status == 0 && status == 1) {
      category.status = status;
      await category.save();
      return res.status(200).json({ message: "category is  Active" });
    }
    if (category.status == 1 && status == 0) {
      category.status = status;
      await category.save();
      return res.status(200).json({ message: "category is InActive" });
    } else {
      return res.status(200).json({ message: "Invalid status" });
    }
  } catch (err) {
    res.status(500).send({
      message: err.toString(),
    });
  }
};
