const express = require("express");
const { check, validationResult } = require("express-validator");
const { baseUrl } = require("../utils/url");
const User = require("../models/User.model")
const OrderModel = require("../models/order.model");
const {
    SendPushNotification,
    CreateNotification,
} = require("../utils/Notification");
const paymentModel = require("../models/payment.model");
const orderModel = require("../models/order.model");
const stripe = require("stripe")("sk_test_RG4EfYiSTOT8IxuNxbeMeDiy");

exports.CREATE_ORDER = async (req, res) => {
    console.log("req.body", req.body)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const order = new Order({
            orderItems: req.body.orderItems,
            shippingAddress: req.body.shippingAddress,
            ship_to_a_different_address: req.body.ship_to_a_different_address,
            itemsPrice: req.body.itemsPrice,
            shippingPrice: parseFloat(req.body.shippingPrice),
            taxPrice: parseFloat(req.body.taxPrice ? req.body.taxPrice : 0),
            totalPrice: parseFloat(req.body.totalPrice ? req.body.totalPrice : 0),
            user: req.user._id,
        });

        if (req.body.ship_to_a_different_address == "1") {
            order.billingAddress = req.body.billingAddress
        }


        let customer = "";
        let charge = "";
        if (req.body.paymentMethod.toLowerCase() == "cod") {
            order.paymentMethod = req.body.paymentMethod;
        } else if (req.body.paymentMethod.toLowerCase() == "card") {
            order.paymentMethod = req.body.paymentMethod;
            let m = req.body.card_expiry.split("/");
            let cardNumber = req.body.card_number;
            let token = await stripe.tokens.create({
                card: {
                    number: cardNumber,
                    exp_month: m[0],
                    exp_year: m[1],
                    cvc: req.body.cvv,
                },
            });
            if (token.error) {
                return res.status(400).json({ message: error });
            }

            customer = await stripe.customers.create({
                email: req.user.email,
                source: token.id,
            });
            // console.log("customer",customer)

            charge = await stripe.charges.create({
                amount: parseFloat(req.body.totalPrice * 100),
                description: "Paleo Keto",
                currency: "usd",
                customer: customer.id,
            });
            // console.log("charge",charge)

            order.isPaid = true
        }

        const createdOrder = await order.save();

        const paymentLog = new paymentModel({
            order: createdOrder.id,
            user: req.user._id,
            customer_id: req.body.paymentMethod == "cod" ? null : customer.id,
            charge_id: req.body.paymentMethod == "cod" ? null : charge.id,
            amount: parseFloat(req.body.totalPrice),
            type: req.body.paymentMethod == "cod" ? "cod" : "card",
        });

        await paymentLog.save();

        const data1 = {
            notifiableId: null,
            title: "New Order Received",
            notificationType: "Admin",
            body: "New Order has Been Received on the platform",
            payload: {
                type: "order",
                id: createdOrder._id,
            },
        };

        CreateNotification(data1);

        const data2 = {
            notifiableId: createdOrder.user,
            title: "Order Placed Successfully",
            notificationType: "User",
            body: "Your order has been placed Successfully",
            payload: {
                type: "order",
                id: createdOrder._id,
            },
        };

        const resp = SendPushNotification(data2);

        return res
            .status(201)
            .send({ message: "New Order Created", order: createdOrder });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: error.message });
    }
}

exports.GET_ORDER_DETAIL_BY_ID = async (req, res) => {
    let id = req.params.order_id;

    try {
        let order = await OrderModel.findOne({ _id: id }).populate("user").lean();

        if (!order)
            return res.status(400).json({ message: "Order Detail not found" });
        const url = baseUrl(req);



        res.status(200).json(order);
    } catch (error) {
        // console.error(error.message);
        res.status(500).json({ error: error.message });
    }
}

exports.GET_MY_ORDERS = async (req, res) => {
    try {
        console.log('called')
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

        const orders = await orderModel.paginate(
            {
                ...search,
                user: req.user._id
            },
            {
                page: currentpage,
                limit: per_page,
                lean: true,
                sort: "-_id",
            }
        );
        await res.status(200).send(orders);
    } catch (err) {
        res.status(500).send({
            message: err.toString(),
        });
    }
};
