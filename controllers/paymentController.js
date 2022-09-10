const express = require("express");
const { baseUrl } = require("../utils/url");
const {
  CreateNotification,
  SendPushNotification,
} = require("../utils/Notification");
const { check, validationResult } = require("express-validator");
const config = require("config");
//model
const paymentModel = require("../models/payment.model");
const moment = require("moment");
// const packagesModel = require("../models/packages.model");
const UserModel = require("../models/User.model");

const stripe = require("stripe")("sk_test_RG4EfYiSTOT8IxuNxbeMeDiy");

exports.SUBSCRIPTION_PAYMENT = async (
  package,
  charges,
  payment_method,
  card_number,
  card_expiry,
  card_cvv,
  user
) => {
  try {
    console.log(
      package,
      charges,
      payment_method,
      card_number,
      card_expiry,
      card_cvv,
      user
    );
    // if user already enrolled
    let paymentLog = " ";
    let packageData = await packagesModel.findOne({ _id: package });
    if (!packageData) {
      throw new Error("Package Doesnot Exist");
    }

    if (packageData.price <= 0) {
      paymentLog = new paymentModel({
        package: package,
        charge_id: null,
        amount: 0,
        user: user,
        type: null,
        status: "paid",
      });
    } else {
      let userSubscription = await paymentModel
        .findOne({ user: user, is_expired: false })

        .sort({ CreatedAt: -1 });

      if (userSubscription) {
        userSubscription.is_expired = true;
        await userSubscription.save();
      } else {
        let charge = "";
        let m = card_expiry.split("/");
        let cardNumber = card_number;
        let token = await stripe.tokens.create({
          card: {
            number: cardNumber,
            exp_month: m[0],
            exp_year: m[1],
            cvc: card_cvv,
          },
        });

        if (token.error) {
          throw new Error({ msg: error });
          // return res.status(400).json({ message: error });
        }

        charge = await stripe.charges.create({
          amount: charges,
          description: "foodTruck Backend",
          currency: "usd",
          source: token.id,
        });
      }

      paymentLog = new paymentModel({
        package: package,
        charge_id: charge.id ? charge.id : null,
        amount: charges,
        user: user ? user : null,
        type: payment_method,
        status: charge.id ? "paid" : "unpaid",
      });
    }

    const notification = {
      notifiableId: null,
      notificationType: "Admin",
      title: "New Subscription",
      body: "New Subscription",
      payload: {
        type: "SUBSCRIPTION",
        id: user,
      },
    };
    CreateNotification(notification);

    const notification2 = {
      notifiableId: user,
      notificationType: "payment",
      title: "Payment Successful",
      body: "Payment Successful",
      payload: {
        type: "SUBSCRIPTION",
        id: paymentLog._id,
      },
    };
    SendPushNotification(notification2);

    return await paymentLog.save();
  } catch (err) {
    console.log(err);
    throw err;
  }
};

exports.SUBSCRIBE_PAYMENT = async (req, res) => {
  try {
    const {
      package,
      charges,
      payment_method,
      card_number,
      card_expiry,
      card_cvv,
    } = req.body;
    // console.log('sdfsdfdf')
    // if user already enrolled
    //check if package exist

    let packageData = await packagesModel
      .findOne({ _id: package })
      .sort({ CreatedAt: -1 });
    if (!packageData) {
      throw new Error("package doesnot exist");
    }

    let paymentLog = ""
    if (packageData.price <= 0) {
      paymentLog = new paymentModel({
        package: package,
        charge_id: null,
        amount: 0,
        user: req.user._id,
        type: null,
        status: "paid",
      });
    } else {
      let userSubscription = await paymentModel
      .findOne({ user: req.user._id, is_expired: false })
      .sort({ CreatedAt: -1 });
    // console.log(packageData);

    if (userSubscription) {
      userSubscription.is_expired = true;
      await userSubscription.save();
    }

   
    console.log(userdata);
    // if (!packageData) {
    //   throw new Error("Package Doesnot Exist");
    // }

    let charge = "";
    let m = card_expiry.split("/");
    let cardNumber = card_number;
    let token = await stripe.tokens.create({
      card: {
        number: cardNumber,
        exp_month: m[0],
        exp_year: m[1],
        cvc: card_cvv,
      },
    });

    if (token.error) {
      // throw new Error (token.error);
      return res.status(400).json({ message: token.error });
    }

    charge = await stripe.charges.create({
      amount: charges,
      description: "FoodTruck Backend ",
      currency: "usd",
      source: token.id,
    });

     paymentLog = new paymentModel({
      package: package,
      charge_id: charge.id ? charge.id : null,
      amount: charges,
      user: req.user._id ? req.user._id : null,
      type: payment_method,
      status: charge.id ? "paid" : "unpaid",
    });

   

    }
    
    const userdata = await UserModel.findOne({ _id: req.user._id });
    const notification = {
      notifiableId: null,
      notificationType: "Admin",
      title: "New Subscription",
      body: "New Subscription",
      payload: {
        type: "SUBSCRIPTION",
        id: req.user._id,
      }
    };
    CreateNotification(notification);

    const notification2 = {
      notifiableId: req.user._id,
      notificationType: "SUBSCRIPTION",
      title: "Payment Successful",
      body: "Payment Successful",
      payload: {
        type: "SUBSCRIPTION",
        id: paymentLog._id,
      },
    };
    SendPushNotification(notification2);

    await paymentLog.save();

    userdata.is_subscribed = true;
    userdata.package = packageData._id;

    await userdata.save();

    res.status(200).json({ msg: "package subscribed successfully" });
  } catch (err) {
    throw err;
  }
};

//get All Payments

exports.GET_ALL_SUBSCRIPTION_PAYMENTS = async (req, res) => {
  const { page, limit, fieldname, order, searchBy } = req.query;
  const currentpage = page ? parseInt(page, 10) : 1;
  const per_page = limit ? parseInt(limit, 10) : "";
  const CurrentField = fieldname ? fieldname : "createdAt";
  const currentOrder = order ? parseInt(order, 10) : -1;
  let offset = (currentpage - 1) * per_page;
  const sort = {};
  sort[CurrentField] = currentOrder;

  const search = searchBy
    ? {
        $or: [{ name: { $regex: `${searchBy}`, $options: "i" } }],
      }
    : {};

  try {
    let subscriptions = await paymentModel
      .find()
      .populate("user")
      .populate("package")
      .limit(per_page)
      .skip(offset)
      .sort(sort);
    // console.log(users)
    if (!subscriptions.length) {
      return res.status(400).json({ message: "no subscriptions exist" });
    }
    const url = baseUrl(req);

    let Totalcount = await paymentModel.find({ ...search }).countDocuments();
    const paginate = {
      currentPage: currentpage,
      perPage: per_page,
      total: Math.ceil(Totalcount / per_page),
      to: offset,
      data: subscriptions,
    };
    res.status(200).json(paginate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.MY_SUBSCRIPTION = async (req, res) => {
  try {
    let error = [];

    let subscriptions = await paymentModel
      .find({ user: req.user._id })
      .populate("user")
      .populate("package")
      .sort({ createdAt: -1 });
    if (!subscriptions.length) {
      error.push({ message: "No subscription Exist" });
      return res.status(400).json({ errors: error });
    }

    res.status(200).json(subscriptions);
  } catch (err) {
    const errors = [];
    errors.push({ message: err.message });
    res.status(500).json({ errors: errors });
  }
};

exports.GET_PAYMENT_DETAIL_BY_ID = async (req, res) => {
  let payment_id = req.params.payment_id;
  try {
    const payment = await paymentModel
      .findOne({
        _id: payment_id,
      })
      .populate("user")
      .populate("package");

    if (!payment)
      return res.status(400).json({ message: "payment Detail not found" });

    return res.json(payment);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: err.message });
  }
};
