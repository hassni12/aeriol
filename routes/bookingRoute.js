const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/authMiddleware')
const admin = require('../middleware/adminMiddleware')

const bookingController = require('../controllers/bookingController')
const checkObjectId = require('../middleware/checkobjectId');

//create Package

router.post(
    '/create',
    [
        auth,
        [
    
            check('healer', 'healer is required.').not().isEmpty(),
            check('time', 'time is required.').not().isEmpty(),
            check('date', 'date is required.').not().isEmpty(),
            check('payment_method', 'payment_method is required.').not().isEmpty(),
        ],
    ],
    bookingController.BOOK_APPOINTMENT
);
router.post(
    '/getslots',
    [
        auth,
    ],
    bookingController.GetTimeSlots
);

// router.get('/',[auth,admin],bookingController.GET_ALL_BOOKING_LOGS);



// router.get('/shop/:shop_id',[auth],bookingController.GET_BOOKINGS_BY_SHOP_ID);





router.get('/me',[auth,admin],bookingController.GET_CURRENT_USER_BOOKING_LOGS);


// // router.get('/',bookingController.);



// router.get('/:user_id',[auth,admin],bookingController.Get_BOOKING_LOGS_BY_USER_ID);





router.get('/:booking_id',[auth,admin],bookingController.Get_BOOKING_DETAIL_BY_ID);



// router.post('/status',[auth,admin],bookingController.BOOKING_STATUS);


module.exports = router
