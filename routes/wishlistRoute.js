const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt')
const { check, validationResult } = require('express-validator')
const auth = require('../middleware/authMiddleware')
const admin = require('../middleware/adminMiddleware');
const WishList = require('../models/wishlist.model');
const { baseUrl } = require('../utils/url');
const wishlistModel = require('../models/wishlist.model');
// const wishlistModel = require('../models/wishlist.model');
const wishlistController = require('../controllers/wishlistController')







router.post('/', [auth, check('product', 'product is required').not().isEmpty()], wishlistController.ADD_REMOVE_WISH_LIST)


router.get('/me', auth, async (req, res) => {
    const { page, limit, fieldname, order } = req.query
    const currentpage = page ? parseInt(page, 10) : 1
    const per_page = limit ? parseInt(limit, 10) : 5
    const CurrentField = fieldname ? fieldname : "createdAt"
    const currentOrder = order ? parseInt(order, 10) : -1
    let offset = (currentpage - 1) * per_page;
    const sort = {};
    sort[CurrentField] = currentOrder
    // return res.json(sort)



    try {
        let wishlist = await WishList.findOne({ user: req.user._id }).populate('product').limit(per_page).skip(offset).sort(sort)

        if (!wishlist.length && !wishlist.product.length > 0) {
            console.log("true")
            return res
                .status(400)
                .json({ message: 'no wishlist exist' });
        }
        // console.log(wishlist)



        const url = baseUrl(req)



        let Totalcount = await User.find({ user: req.user._id }).countDocuments()
        const paginate = {
            currentPage: currentpage,
            perPage: per_page,
            total: Math.ceil(Totalcount / per_page),
            to: offset,
            data: wishlist
        }
        res.status(200).json(paginate)
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

})






module.exports = router