const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const fs = require("fs");
var path = require("path");
const { baseUrl } = require("../utils/url");
const { generateTimeSlots } = require('../helper/helper')
const {
  CreateNotification,
  SendPushNotification,
} = require("../utils/Notification");
const { check, validationResult } = require("express-validator");
const config = require("config");
//model
const UserModel = require("../models/User.model");
const paymentModel = require("../models/payment.model");
const Booking = require("../models/Booking.model");
const moment = require("moment");
const stripe = require("stripe")("sk_test_RG4EfYiSTOT8IxuNxbeMeDiy");






const convertTime12to24_2 = (time12h) => {
  const [time, modifier] = time12h.split(" ");

  let [hours, minutes] = time.split(":");
  if (hours === "12") {
    hours = "00";
  }
  if (modifier.toUpperCase() === "PM") {
    hours = parseInt(hours, 10) + 12;
  }

  return `${hours}:${minutes}`;
};
const convertTime12to24 = (time12h) => {
  const [time, modifier] = time12h.split(" ");
  // console.log(time,modifier)
  let [hours, minutes] = time.split(":");
  // console.log("hours",hours)
  if (hours === "12") {
    hours = "00";
  }
  if (modifier.toUpperCase() === "PM") {
    hours = parseInt(hours, 10) + 12;
  }

  return hours;
};





exports.BOOK_APPOINTMENT = async (req, res) => {
  try {
    let error = [];
    const errors = validationResult(req);
    const url = baseUrl(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      date,
      time,
      endtime,
      healer,
      charges,
      shop,
      payment_method,
      card_number,
      card_expiry,
      card_cvv,
    } = req.body;

    // if appointment Booked Already
    let appointment = await Booking.findOne({
      date: date,
      time: time,
      endtime: endtime,
      healer: healer,
    });
    if (appointment) {
      error.push({ msg: "This slot is already booked " });
      return res.status(400).json({ errors: error });
    }

    //Enroll new User
    appointment = new Booking({
      user: req.user._id,
      healer: healer,
      date: date,
      time: time,
      endtime: endtime,
      payment_method: payment_method

    });
    // let charge = "";
    // if (payment_method.toLowerCase() == "stripe") {
    //     appointment.payment_method = payment_method;
    //     let m = card_expiry.split("/");
    //     let cardNumber = card_number;
    //     let token = await stripe.tokens.create({
    //         card: {
    //             number: cardNumber,
    //             exp_month: m[0],
    //             exp_year: m[1],
    //             cvc: card_cvv,
    //         },
    //     });

    //     if (token.error) {
    //         return res.status(400).json({ msg: error });
    //     }

    //     charge = await stripe.charges.create({
    //         amount: charges,
    //         description: "Barber App",
    //         currency: "usd",
    //         source: token.id,
    //     });
    //     // console.log("charge",charge)
    // } else if (payment_method.toLowerCase() == "cod") {
    //     appointment.payment_method = payment_method;
    // }
    await appointment.save();

    // const paymentLog = new paymentModel({
    //     appointment: appointment.id,
    //     charge_id: charge.id ? charge.id : null,
    //     amount: charges,
    //     user: req.user ? req.user._id : null,
    //     type: req.body.payment_method,
    //     status: charge.id ? "paid" : "unpaid",
    // });

    // await paymentLog.save();

    const notification = {
      notifiableId: healer,
      notificationType: "booking",
      title: "New Appointment Booked ",
      body: "New Appointment Booked",
      payload: {
        type: "appointment",
        id: appointment._id,
      },
    };
    SendPushNotification(notification);


    const notification2 = {
      notifiableId: req.user._id,
      notificationType: "appointment",
      title: "Your appointment has been booked Successfully",
      body: "Your appointment has been booked Successfully",
      payload: {
        type: "appointment",
        id: appointment._id,
      },
    };
    SendPushNotification(notification2);


    res.status(200).json({
      msg: "Your appointment has been booked successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

exports.GetTimeSlots = async (req, res) => {
  try {
    const { selectedDate } = req.body;
    console.log(req.body)

    var d = new Date();
    var n = moment(d.getTime()).format("hh:mm a");
    let currenthour = convertTime12to24_2(n).split(":")[0];

    const bookedTimes = [];

    // Get All Bookings of specific date where status is not equals to Completed or Cancelled
    // and selected time is equal to user's selected time.
    const bookings = await Booking.find({
      date: {
        $gte: moment(new Date(selectedDate)).startOf("Day"),
        $lte: moment(new Date(selectedDate)).endOf("Day"),
      },

      // $and: [
      //   {
      //     status: {
      //       $ne: "Completed",
      //     },
      //   },
      //   {
      //     status: {
      //       $ne: "Cancelled",
      //     },
      //   },
      // ],
    }).select("time");
    // console.log("appointments",appointments)

    bookings.forEach((item) => {
      bookedTimes.push(item.time);
    });

    console.log("bookedTimes", bookedTimes);
    let selectedday = moment(new Date(selectedDate))
      .format("dddd")
      .toLowerCase();

    let startTime = convertTime12to24(
      // timings[0].from
      "8:00 am"
    );
    let endTime = convertTime12to24(
      // timings[0].to
      "1:00 pm"
    );

    const serviceDuration = "30";
    var startTime1 = moment(startTime, "HH:mm");
    var endTime1 = moment(endTime, "HH:mm");

    let hours = generateTimeSlots(startTime1, endTime1, 30);

    // Checking what slots of our hours are available and assigning flag accordingly.
    // PS: Kabara hogya.
    hours.forEach((hour, index) => {
      //   const startTimeHour = hour.startTime.split(":")[0];
      let startTimeHour = convertTime12to24_2(hour.startTime);

      const startTimeMinutes = startTimeHour.split(":")[1];
      startTimeHour = startTimeHour.split(":")[0];
      // console.log(startTimeHour)
      console.log("startTimeHour", startTimeHour, currenthour);

      bookedTimes.forEach((time, index2) => {
        const newTime = convertTime12to24_2(time);
        const newTimeHour = newTime.split(":")[0];
        const newTimeMinutes = newTime.split(":")[1];
        // console.log("startTimeHour",startTimeMinutes,newTimeMinutes,startTimeMinutes == newTimeMinutes)
        if (
          startTimeHour == newTimeHour &&
          startTimeMinutes == newTimeMinutes
        ) {
          console.log(newTimeHour, startTimeHour);
          hours[index].available = false;
        }
      });
    });

    await res.status(200).json(
      hours,
    );
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Internal Server Error",
      err: err.toString(),
      error: true,
    });
  }

};



// exports.GET_ALL_BOOKING_LOGS = async (req, res) => {
//     const { page, limit, selection, fieldname, order, from, to, keyword } =
//         req.body;
//     const currentpage = page ? parseInt(page, 10) : 1;
//     const per_page = limit ? parseInt(limit, 10) : 5;
//     const CurrentField = fieldname ? fieldname : "createdAt";
//     const currentOrder = order ? parseInt(order, 10) : -1;
//     let offset = (currentpage - 1) * per_page;
//     const sort = {};
//     sort[CurrentField] = currentOrder;
//     // return res.json(sort)

//     const currentSelection = selection ? selection : 1;
//     //date filter
//     let Datefilter = "";
//     if (from && to) {
//         // console.log("fromto");
//         Datefilter =
//             from && to
//                 ? {
//                     createdAt: {
//                         $gte: moment(from).startOf("day").toDate(),
//                         $lte: moment(to).endOf("day").toDate(),
//                     },
//                 }
//                 : {};
//     } else if (from) {
//         // console.log("from");
//         Datefilter = from
//             ? { createdAt: { $gte: moment(from).startOf("day").toDate() } }
//             : {};
//     } else if (to) {
//         // console.log.apply("to");
//         Datefilter = to
//             ? { createdAt: { $lte: moment(to).endOf("day").toDate() } }
//             : {};
//     }

//     const search = keyword
//         ? {
//             $or: [
//                 { firstname: { $regex: `${keyword}`, $options: "i" } },
//                 { lastname: { $regex: `${keyword}`, $options: "i" } },
//             ],
//         }
//         : {};

//     try {
//         const appointments = await bookingModel.find({
//             ...Datefilter,
//             ...search,
//         })
//             .populate("user", ["firstname", "lastname"])
//             .populate("service")
//             .populate("package")
//             .populate({

//                 path: "shop",
//                 populate: {
//                     path: "owner",
//                     select: ["firstname", "lastname", 'image']
//                 },
//             })

//             .populate("stylist")
//             .limit(per_page ? per_page : null)
//             .skip(offset)
//             .sort(sort);
//         // console.log(categories)
//         if (!appointments.length) {
//             return res.status(400).json({ message: "no appointment exist" });
//         }

//         let Totalcount = await bookingModel.find().countDocuments();
//         const paginate = {
//             currentPage: currentpage,
//             perPage: per_page,
//             total: Math.ceil(appointments.length / per_page),
//             to: offset,
//             data: appointments,
//         };
//         res.status(200).json(paginate);
//     } catch (err) {
//         console.error(err.message);
//         return res.status(500).json({ error: err.message });
//     }
// };


// exports.GET_BOOKINGS_BY_SHOP_ID = async (req, res) => {
//     const { page, limit, selection, fieldname, order, from, to, keyword } = req.query;
//     const shop_id = req.params.shop_id
//     const currentpage = page ? parseInt(page, 10) : 1;
//     const per_page = limit ? parseInt(limit, 10) : 5;
//     const CurrentField = fieldname ? fieldname : "createdAt";
//     const currentOrder = order ? parseInt(order, 10) : -1;
//     let offset = (currentpage - 1) * per_page;
//     const sort = {};
//     sort[CurrentField] = currentOrder;
//     // return res.json(sort)

//     const currentSelection = selection ? selection : 1;
//     //date filter
//     let Datefilter = "";
//     if (from && to) {
//         // console.log("fromto");
//         Datefilter =
//             from && to
//                 ? {
//                     createdAt: {
//                         $gte: moment(from).startOf("day").toDate(),
//                         $lte: moment(to).endOf("day").toDate(),
//                     },
//                 }
//                 : {};
//     } else if (from) {
//         // console.log("from");
//         Datefilter = from
//             ? { createdAt: { $gte: moment(from).startOf("day").toDate() } }
//             : {};
//     } else if (to) {
//         // console.log.apply("to");
//         Datefilter = to
//             ? { createdAt: { $lte: moment(to).endOf("day").toDate() } }
//             : {};
//     }

//     const search = keyword
//         ? {
//             $or: [
//                 { firstname: { $regex: `${keyword}`, $options: "i" } },
//                 { lastname: { $regex: `${keyword}`, $options: "i" } },
//             ],
//         }
//         : {};


//     const filter = {};

//     for (const key in req.query) {
//         if (req.query.hasOwnProperty(key)) {
//             const value = req.query[key];
//             if (key == "page" || key == "limit") {

//             }
//             else if (value && key == "date") {
//                 filter[key] = {
//                     $gte: moment(value).startOf("day").toDate(),
//                     $lte: moment(value).endOf("day").toDate(),
//                 }

//             }
//         }
//     }
//     console.log(filter)




//     try {
//         const appointments = await bookingModel.find({
//             shop: shop_id,
//             ...Datefilter,
//             ...filter,
//             ...search,
//         })
//             .populate("user", ["firstname", "lastname"])
//             .populate("service")
//             .populate({

//                 path: "shop",
//                 populate: {
//                     path: "owner",
//                     select: ["firstname", "lastname", 'image']
//                 },




//             })

//             .populate("stylist")
//             .limit(per_page ? per_page : null)
//             .skip(offset)
//             .sort(sort);
//         // console.log(categories)
//         if (!appointments.length) {
//             return res.status(400).json({ msg: "no appointment exist" });
//         }


//         const paginate = {
//             currentPage: currentpage,
//             perPage: per_page,
//             total: Math.ceil(appointments.length / per_page),
//             to: offset,
//             data: appointments,
//         };
//         res.status(200).json(paginate);
//     } catch (err) {
//         console.error(err.message);
//         return res.status(500).json({ error: err.message });
//     }
// };

// exports.Get_BOOKING_LOGS_BY_USER_ID = async (req, res) => {
//     let user_id = req.params.user_id;

//     console.log(user_id)
//     const { page, limit, selection, fieldname, order, from, to, keyword } =
//         req.body;
//     const currentpage = page ? parseInt(page, 10) : 1;
//     const per_page = limit ? parseInt(limit, 10) : 5;
//     const CurrentField = fieldname ? fieldname : "createdAt";
//     const currentOrder = order ? parseInt(order, 10) : -1;
//     let offset = (currentpage - 1) * per_page;
//     const sort = {};
//     sort[CurrentField] = currentOrder;
//     // return res.json(sort)

//     const currentSelection = selection ? selection : 1;
//     //date filter
//     let Datefilter = "";
//     if (from && to) {
//         // console.log("fromto");
//         Datefilter =
//             from && to
//                 ? {
//                     createdAt: {
//                         $gte: moment(from).startOf("day").toDate(),
//                         $lte: moment(to).endOf("day").toDate(),
//                     },
//                 }
//                 : {};
//     } else if (from) {
//         console.log("from");
//         Datefilter = from
//             ? { createdAt: { $gte: moment(from).startOf("day").toDate() } }
//             : {};
//     } else if (to) {
//         console.log.apply("to");
//         Datefilter = to
//             ? { createdAt: { $lte: moment(to).endOf("day").toDate() } }
//             : {};
//     }

//     const search = keyword
//         ? {
//             $or: [
//                 { firstname: { $regex: `${keyword}`, $options: "i" } },
//                 { lastname: { $regex: `${keyword}`, $options: "i" } },
//             ],
//         }
//         : {};

//     try {
//         const user = await UserModel.findOne({
//             _id: user_id,
//         });

//         if (!user)
//             return res.status(400).json({ msg: "User Detail not found" });
//         const url = baseUrl(req);

//         const appointments = await bookingModel.find({
//             user: user_id,
//             ...Datefilter,
//             ...search,
//         })
//             .populate("user", ["firstname", "lastname"])
//             .populate("service")
//             .populate("package")
//             .limit(per_page ? per_page : null)
//             .skip(offset)
//             .sort(sort);
//         // console.log(categories)
//         if (!appointments.length) {
//             return res.status(400).json({ msg: "no appointment exist" });
//         }

//         let Totalcount = await bookingModel.find({
//             user: user_id,
//             ...Datefilter,
//             ...search,
//         }).countDocuments();
//         const paginate = {
//             currentPage: currentpage,
//             perPage: per_page,
//             total: Math.ceil(Totalcount / per_page),
//             to: offset,
//             user: user,
//             data: appointments,
//             // data2 : userSessions2
//         };
//         res.status(200).json(paginate);
//     } catch (err) {
//         console.error(err.message);
//         return res.status(500).json({ error: err.message });
//     }
// };
exports.GET_CURRENT_USER_BOOKING_LOGS = async (req, res) => {
  let user_id = req.user._id;
  // console.log(session_id)
  const { page, limit, selection, fieldname, order, from, to, keyword } =
    req.query;
  const currentpage = page ? parseInt(page, 10) : 1;
  const per_page = limit ? parseInt(limit, 10) : 5;
  const CurrentField = fieldname ? fieldname : "createdAt";
  const currentOrder = order ? parseInt(order, 10) : -1;
  let offset = (currentpage - 1) * per_page;
  const sort = {};
  sort[CurrentField] = currentOrder;
  // return res.json(sort)

  const currentSelection = selection ? selection : 1;
  //date filter

  // console.log("from", from, "toTOTOTO", to);

  let Datefilter = "";
  if (from && to) {
    console.log("fromto", Datefilter);
    Datefilter =
      from && to
        ? {
          createdAt: {
            $gte: moment(from).startOf("day").toDate(),
            $lte: moment(to).endOf("day").toDate(),
          },
        }
        : {};
  } else if (from) {
    console.log("from", Datefilter);
    Datefilter = from
      ? {
        createdAt: {
          $gte: moment(from).startOf("day").toDate(),
          $lte: moment(new Date()).endOf("day").toDate(),
        },
      }
      : {};
  } else if (to) {
    console.log.apply("to", Datefilter);
    Datefilter = to
      ? { createdAt: { $lte: moment(to).endOf("day").toDate() } }
      : {};
  }
  console.log(Datefilter);

  const search = keyword
    ? {
      $or: [
        { firstname: { $regex: `${keyword}`, $options: "i" } },
        { lastname: { $regex: `${keyword}`, $options: "i" } },
      ],
    }
    : {};

  try {
    const user = await UserModel.findOne({
      _id: user_id,
    });

    if (!user)
      return res.status(400).json({ msg: "User Detail not found" });
    const url = baseUrl(req);

    const bookings = await Booking.find({
      user: user_id,
      ...Datefilter,
      ...search,
    })
      .populate("healer")
      .populate("user")
      .limit(per_page ? per_page : null)
      .skip(offset)
      .sort(sort);

    if (!bookings.length) {
      return res.status(400).json({ msg: "no appointment exist" });
    }

    let Totalcount = await Booking.find({
      user: user_id,
      ...Datefilter,
      ...search,
    }).countDocuments();
    const paginate = {
      currentPage: currentpage,
      perPage: per_page,
      total: Math.ceil(Totalcount / per_page),
      to: offset,
      // user: user,
      data: bookings,
      // data2 : userSessions2
    };
    res.status(200).json(paginate);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: err.message });
  }
};


// exports.BOOKING_STATUS = async (req, res) => {
//     try {
//         let booking = await bookingModel.findOne({ _id: req.body.booking_id }).populate("shop");
//         if (!booking) {
//             return res.status(400).json({ msg: "booking doesnot exist " });
//         }

//         console.log(booking.shop);

//         if (req.body.status == "Accepted" && booking.status == "Accepted") {
//             return res.json({ msg: "You  have already accepted this appointment" });
//         } else if (req.body.status == "Cancelled" && booking.status == "Cancelled") {
//             return res.json({ msg: "You have already Cancelled this appointment" });
//         } else if (req.body.status == "Completed" && booking.status == "Completed") {
//             return res.json({
//                 msg: "You have already  mark this Booking Completed",
//             });
//         }
//         if (req.body.status == "Accepted") {
//             booking.status = "Accepted";
//             await booking.save();
//             console.log(booking)
//             const data = {
//                 notifiableId: booking.user,
//                 title: "booking Accepted Successfully",
//                 notificationType: "booking",
//                 role: booking.user,
//                 body: "booking has been approved",
//                 payload: {
//                     type: "booking",
//                     id: booking._id,
//                 },
//             };

//             console.log(data);
//             const resp = await SendPushNotification(data);
//             console.log(resp);
//             return res.status(200).json({ message: "booking has been Accepeted" });
//         } else if (req.body.status == "Cancelled") {
//             booking.status = "Cancelled";
//             await booking.save();

//             const data1 = {
//                 notifiableId: booking?.shop?.owner,
//                 title: "booking Cancelled ",
//                 role: booking.shop,
//                 notificationType: "booking",
//                 body: "booking has been Cancelled",
//                 payload: {
//                     type: "booking",
//                     id: booking._id,
//                 },
//             };
//             const resp1 = SendPushNotification(data1);
//             console.log(resp1);

//             const data2 = {
//                 notifiableId: booking.user,
//                 title: "booking Cancelled ",
//                 role: booking.user,
//                 notificationType: "booking",
//                 body: "booking has been Cancelled",
//                 payload: {
//                     type: "booking",
//                     id: booking._id,
//                 },
//             };

//             // console.log(data);
//             const resp = SendPushNotification(data2);
//             console.log(resp);

//             return res.status(200).json({ msg: "booking has been Cancelled" });
//         }
//         else if (req.body.status == "CancelledByCustomer") {
//             booking.status = "CancelledByCustomer";
//             await booking.save();

//             const data1 = {
//                 notifiableId: booking?.shop?.owner,
//                 title: "booking Cancelled By Customer ",
//                 role: booking.shop,
//                 notificationType: "booking",
//                 body: "booking has been Cancelled By Customer",
//                 payload: {
//                     type: "booking",
//                     id: booking._id,
//                 },
//             };
//             const resp1 = SendPushNotification(data1);
//             console.log(resp1);

//             const data2 = {
//                 notifiableId: booking.user,
//                 title: "booking Cancelled By Customer",
//                 role: booking.user,
//                 notificationType: "booking",
//                 body: "booking has been Cancelled By Customer",
//                 payload: {
//                     type: "booking",
//                     id: booking._id,
//                 },
//             };

//             // console.log(data);
//             const resp = SendPushNotification(data2);
//             console.log(resp);

//             return res.status(200).json({ msg: "booking has been Cancelled By Customer" });
//         } else if (req.body.status == "Completed") {
//             booking.status = "Completed";
//             await booking.save();

//             const data = {
//                 notifiableId: booking.user,
//                 title: "booking Completed ",
//                 role: booking.user,
//                 notificationType: "booking",
//                 body: "booking has been Compelted",
//                 payload: {
//                     type: "booking",
//                     id: booking._id,
//                 },
//             };

//             console.log(data);
//             const resp = SendPushNotification(data);
//             console.log(resp);
//             return res.status(200).json({ msg: "Booking has been Completed" });
//         }

//         // else if (req.params.status == 3 && lugger.status == 1) {
//         else {
//             return res.status(200).json({ msg: "Invalid status" });
//         }
//     } catch (error) {
//         // console.error(error.message);
//         res.status(500).json({ error: error.message });
//     }
// }



exports.Get_BOOKING_DETAIL_BY_ID = async (req, res) => {
  let booking_id = req.params.booking_id;


  try {


    const booking = await Booking.findOne({
      _id: booking_id
    })
      .populate("user", ["firstname", "lastname","email","phone_no"])
      .populate("healer")

    // console.log(categories)
    if (!booking) {
      return res.status(400).json({ msg: "no appointment exist" });
    }


    res.status(200).json(booking);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: err.message })
  }
}