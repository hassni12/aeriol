const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../middleware/authMiddleware");
const moment = require("moment");
const admin = require("../middleware/adminMiddleware");
const UserModel = require("../models/User.model");
// const truckModel = require("../models/truck.model");

//place order

router.get("/adminstats", auth, admin, async (req, res) => {
  const { page, limit, fieldname, order, searchBy } = req.query;
  const currentpage = page ? parseInt(page, 10) : 1;
  const per_page = limit ? parseInt(limit, 10) : 5;
  const CurrentField = fieldname ? fieldname : "createdAt";
  const currentOrder = order ? parseInt(order, 10) : -1;
  let offset = (currentpage - 1) * per_page;
  const sort = {};
  sort[CurrentField] = currentOrder;
  // return res.json(sort)

  const search = searchBy
    ? {
        name: { $regex: `${searchBy}`, $options: "i" },
      }
    : {};

  try {
    let TotalUsers = await UserModel.find({
      role: "CUSTOMER",
    }).countDocuments();
    let TotalTrucks = await truckModel.find().countDocuments();

    const paginate = {
      TotalUsers: TotalUsers,
      TotalTrucks: TotalTrucks,
    };
    res.status(200).json(paginate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/sales-analytics", auth, admin, async (req, res) => {
  const {year} = req.query
  console.log(year)
  try {
    const dates = [
      new Date(year, 0),
      new Date(year, 1),
      new Date(year, 2),
      new Date(year, 3),
      new Date(year, 4),
      new Date(year, 5),
      new Date(year, 6),
      new Date(year, 7),
      new Date(year, 8),
      new Date(year, 9),
      new Date(year, 10),
      new Date(year, 11),
    ];
    let data = [];
    let countData = []
    await Promise.all(
      dates.map(async (date, index) => {
        let from = moment(date).startOf("month").toDate();
        let to = moment(date).endOf("month").toDate();
        const uploadHour = { createdAt: { $gte: from, $lte: to } };
        let totalusers = await asyncRunner(uploadHour);
        console.log(totalusers);
        data.push({
          count: totalusers[0].length > 0 ? totalusers[0][0].count : 0,
          month: index,
        });
      })
    );

    data = data.sort((a, b) => a.month - b.month);
  data.map(item => countData.push(item.count))  
// console.log(countData)
    await res.status(200).json({
      data: countData,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function asyncRunner(uploadHour) {
  return Promise.all([test(uploadHour)]);
}

function test(uploadHour) {
  // let totalusers = await
  return new Promise((resolve, reject) => {
    resolve(
      UserModel.aggregate([
        {
          $match: {
            ...uploadHour,
            role: "CUSTOMER",
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
          },
        },
      ])
    );
  });
}

module.exports = router;
