const express = require("express");
const router = express.Router();
const Notification = require("../models/notifications.model");
const { check, validationResult } = require("express-validator");
const axios = require("axios");
const FCM = require("fcm-node");
const config = require("config");
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const Session = require("../models/session.model");
const checkObjectId = require("../middleware/checkobjectId");
const { SendPushNotification } = require("../utils/Notification");
const notificationsModel = require("../models/notifications.model");

//set the route path and initialize the API

router.get("/admin", [auth, admin], async (req, res) => {
  try {
    console.log(req.query);
    const { page, limit } = req.query;

    let currentpage = page ? parseInt(page, 10) : 1;
    // console.log(currentpage)

    let per_page = limit ? parseInt(limit, 10) : 5;
    // console.log(limit)

    let offset = (currentpage - 1) * per_page;
    let notifications = await Notification.find({
      notificationType: "Admin",
      isread: false,
    })
      .populate("notifiableId", ["id", "email"])
      .limit(per_page)
      .skip(offset)
      .lean()
      .sort({ createdAt: -1 });
    if (!notifications.length) {
      return res.status(400).json({ message: "no notification exist" });
    }

    // let content =await Notification.updateMany(
    //     {notificationType:"Admin"},
    //     {
    //       $set: {is_read:true}
    //     })
    //     console.log(content)
    let Totalcount = await Notification.find({
      notificationType: "Admin",
      isread: false,
    })
      .populate("notifiableId", ["id", "email"])
      .countDocuments();
    const paginate = {
      currentPage: currentpage,
      perPage: per_page,
      total: Math.ceil(Totalcount / per_page),
      to: offset,
      totalCount: Totalcount,
      data: notifications,
    };

    return res.json(paginate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/count", [auth], async (req, res) => {
  try {
    let Totalcount = await Notification.find({
      notifiableId: req.user._id,
      isread: false,
    })
      .populate("notifiableId", ["id", "email"])
      .count();

    return res.json({ total_count: Totalcount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    console.log(req.query);
    const { page, limit } = req.query;

    let currentpage = page ? parseInt(page, 10) : 1;
    console.log(currentpage);

    let per_page = limit ? parseInt(limit, 10) : 5;
    console.log(limit);

    let offset = (currentpage - 1) * per_page;
    let notifications = await Notification.find({ notifiableId: req.user._id })
      .populate("notifiableId", ["id", "email"])
      .limit(per_page)
      .skip(offset)
      .lean()
      .sort({ createdAt: -1 });
    if (!notifications.length) {
      return res.status(200).json([]);
    }

    let Totalcount = await Notification.find({ notifiableId: req.user._id })
      .populate("notifiableId", ["id", "email"])
      .count();
    const paginate = {
      currentPage: currentpage,
      perPage: per_page,
      total: Math.ceil(Totalcount / per_page),
      to: offset,
      data: notifications,
    };

    return res.json(paginate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//update
router.post("/update", auth, async (req, res) => {
  try {
    let notification = await notificationsModel.updateMany(
      { _id: { $in: req.body.notificationIds } },
      {
        $set: { isread: true },
      }
    );

    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    notification.isread = true;
    await notification.save();
    await res.status(201).json({
      message: "Notification Marked as Read",
    });
  } catch (err) {
    res.status(500).json({
      message: err.toString(),
    });
  }
});

module.exports = router;
