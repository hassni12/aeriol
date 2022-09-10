const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../middleware/authMiddleware");;
const admin = require("../middleware/adminMiddleware");
const fs = require("fs");
var path = require("path");
const { baseUrl } = require("../utils/url");
const User = require("../models/User.model")
const checkObjectId = require("../middleware/checkobjectId");
const OrderModel = require("../models/order.model");
const {
  SendPushNotification,
  CreateNotification,
} = require("../utils/Notification");
const paymentModel = require("../models/payment.model");
const stripe = require("stripe")("sk_test_RG4EfYiSTOT8IxuNxbeMeDiy");
const orderController = require('../controllers/orderController')
//place order

router.post("/", [auth], orderController.CREATE_ORDER);

// get order detail by id

router.get("/me",auth,
orderController.GET_MY_ORDERS
);


router.get(
  "/:order_id",
  [auth, checkObjectId("order_id")],
orderController.GET_ORDER_DETAIL_BY_ID
);







//status 0 is pending default
//status "inprocess" is to approve
//status 2 is to reject

router.post("/status", [auth, admin], async (req, res) => {
  try {
    let order = await Order.findOne({ _id: req.body.orderId });
    if (!order) {
      return res.status(400).json({ msg: "order doesnot exist " });
    }

    console.log(order);

    if (req.query.status == "inprocess" && order.status == "inprocess") {
      return res.json({ message: "You  have already accepted this order" });
    } else if (req.query.status == "cancelled" && order.status == "cancelled") {
      return res.json({ message: "You have already rejected this order" });
    } else if (req.query.status == "delivered" && order.status == "delivered") {
      return res.json({
        message: "You have already  mark this order delivered",
      });
    }
    if (req.query.status == "received") {
      order.status = "inprocess";
      await order.save();
      // console.log(lugger.user)
      const data = {
        notifiableId: order.user,
        title: "Order Accepted Successfully",
        notificationType: "order",
        body: "Order has been approved",
        payload: {
          type: "order",
          id: order._id,
        },
      };

      console.log(data);
      const resp = await SendPushNotification(data);
      console.log(resp);
      return res.status(200).json({ message: "Order has been Accepeted" });
    } else if (req.query.status == "rejected") {
      order.status = "rejected";
      await order.save();

      const data = {
        notifiableId: order.user,
        title: "Order Rejected ",
        notificationType: "order",
        body: "Order has been Rejected",
        payload: {
          type: "order",
          id: order._id,
        },
      };

      console.log(data);
      const resp = SendPushNotification(data);
      console.log(resp);
      return res.status(200).json({ message: "Order has been Rejected" });
    } else if (req.query.status == "delivered") {
      order.status = "delivered";
      order.isDelivered = true
      const rider = await User.findById(order.Rider);
      rider.riderStatus = "free";
      await rider.save();
      await order.save();

      const data = {
        notifiableId: order.user,
        title: "Order Deliverd ",
        notificationType: "order",
        body: "Order has been Delivered",
        payload: {
          type: "order",
          id: order._id,
        },
      };

      console.log(data);
      const resp = SendPushNotification(data);
      console.log(resp);
      return res.status(200).json({ message: "Order has been Delivered" });
    }

    // else if (req.params.status == 3 && lugger.status == 1) {
    else {
      return res.status(200).json({ message: "Invalid status" });
    }
  } catch (error) {
    // console.error(error.message);
    res.status(500).json({ error: error.message });
  }
});







module.exports = router;