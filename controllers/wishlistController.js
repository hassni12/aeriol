const express = require('express');
const { validationResult } = require('express-validator')
const WishList = require('../models/wishlist.model');
const { baseUrl } = require('../utils/url');







exports.ADD_REMOVE_WISH_LIST = async (req, res) => {
  try {
 
    let flag = 0;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // if user duplicated
    let wishList = await WishList.findOne({
      user: req.user._id,
      product: { $in: req.body.product },
    });
    if (wishList) {
      wishList.product.splice(req.body.product, 1);
      flag = 1;
    } else {
      wishList = await WishList.findOne({ user: req.user._id });
      if (wishList) {
        wishList.product.push(req.body.product);
        flag = 2;
      } else {
        //create new user
        wishList = new WishList({
          user: req.user._id,
          //   image: req.file.path
        });
        wishList.product.push(req.body.product);
      }
    }

    //hash passoword

    await wishList.save();

    let newmessage =
      flag == 1
        ? "product Successfully removed from wishlist"
        : flag == 2
        ? "product Successfully added to wishlist"
        : "product Successfully added to wishlist";

    res.status(200).json({
      message: newmessage,
    });
  } catch (error) {
    const errors = [];
    errors.push({ message: error.message });
    res.status(500).json({ errors: errors });
  }
};
