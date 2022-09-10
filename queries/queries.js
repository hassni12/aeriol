const moment = require("moment");

const User = require("../models/User");
const Vendor = require("../models/Vendor");
const Auth = require("../models/Auth");
const Reset = require("../models/Reset");
const Product = require("../models/Product");
const Order = require("../models/Order");
const PaymentLog = require("../models/PaymentLog");
const RefundPaymentCustom = require("../services/refund_payment_custom");
const { mongo } = require("mongoose");

exports.findUserByEmail = async (email) => await User.findOne({ email });

exports.findUserById = async (id) => await User.findById(id);

exports.createResetToken = async (email, code) => {
  const token = await Reset.findOne({ email });
  if (token) await token.remove();
  const newToken = new Reset({
    email,
    code,
  });
  await newToken.save();
  await User.findOneAndUpdate({ email }, { resetCode: code });
};

exports.validateCode = async (code) => await Reset.exists({ code });

exports.findResetCode = async (code) => await Reset.findOne({ code });

exports.updatePassword = async (user, updated_data) =>
  await Auth.findByIdAndUpdate(user, updated_data);

exports.checkStock = async (product_id) => {
  const product = await Product.findById(product_id);
  if (!product) throw new Error(`Invalid Product ID: ID = ${product_id}`);
  if (product.stock !== 0) return product;
  throw new Error(`Product ${product.name} is out of Stock!`);
};

exports.getAdminCut = async (vendor_id, total) => {
  const vendor = await Vendor.findById(vendor_id);
  return parseFloat(
    parseFloat(total) *
      parseFloat(this.convertToPercentage(vendor.admin_comission))
  ).toFixed(1);
};

exports.convertToPercentage = (number) => number / 100;

exports.refundOrder = async (order_id) => {
  try {
    const order = await Order.findById(order_id);
    if (!order) throw Error("Invalid Order");
    const total = order.price_info.total;
    const payment_log = await PaymentLog.findOne({ "order_ids.id": order_id });
    if (!payment_log) throw Error("Invalid Payment Log");
    const refund = await RefundPaymentCustom(total, payment_log.paymentIntent);
    if (refund.status === "succeeded") {
      payment_log.refunded.push({
        order_id: order._id,
        refunded_amount: total,
      });
      await payment_log.save();
    }
  } catch (err) {
    throw err;
  }
};

exports.monthsIncome = async (vendor) => {
  try {
    const month_start = moment(new Date()).startOf("month").toDate();
    const month_end = moment(new Date()).endOf("month").toDate();
    const vendor_filter = vendor
      ? {
          vendor: mongo.ObjectId(vendor),
        }
      : {};
    const result = await Order.aggregate([
      {
        $match: {
          ...vendor_filter,
          createdAt: { $gt: month_start, $lt: month_end },
          order_status: { $ne: "Refunded" },
        },
      },
      {
        $group: {
          _id: null,
          monthly_income: { $sum: "$price_info.total" },
        },
      },
    ]);
    return result;
  } catch (err) {
    throw err;
  }
};

exports.yearsIncome = async (vendor) => {
  try {
    const month_start = moment(new Date()).startOf("year").toDate();
    const month_end = moment(new Date()).endOf("year").toDate();
    const vendor_filter = vendor
      ? {
          vendor: mongo.ObjectId(vendor),
        }
      : {};
    const result = await Order.aggregate([
      {
        $match: {
          ...vendor_filter,
          createdAt: { $gt: month_start, $lt: month_end },
          order_status: { $ne: "Refunded" },
        },
      },
      {
        $group: {
          _id: null,
          yearly_income: { $sum: "$price_info.total" },
        },
      },
    ]);
    return result;
  } catch (err) {
    throw err;
  }
};

exports.totalRegisteredProducts = async (vendor) => {
  try {
    const vendor_filter = vendor
      ? {
          vendor: mongo.ObjectId(vendor),
        }
      : {};
    const products = await Product.find({ ...vendor_filter }).countDocuments();
    return products;
  } catch (err) {
    throw err;
  }
};

exports.getYearlyIncome = async (vendor) => {
  try {
    const vendor_filter = vendor
      ? {
          vendor: mongo.ObjectId(vendor),
        }
      : {};
    const arr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const query = [
      {
        $match: {
          ...vendor_filter,
          order_status: { $ne: "Refunded" },
        },
      },
      {
        $addFields: {
          date: {
            $month: "$createdAt",
          },
        },
      },
      {
        $group: {
          _id: "$date",
          count: { $sum: "$price_info.total" },
        },
      },
      {
        $addFields: {
          month: "$_id",
        },
      },
      {
        $project: {
          _id: 0,
          month: 1,
          count: 1,
        },
      },
    ];
    const data = await Order.aggregate(query);
    data.forEach((data) => {
      if (data) arr[data.month - 1] = data.count;
    });
    return arr;
  } catch (err) {
    throw new Error(err.toString());
  }
};
