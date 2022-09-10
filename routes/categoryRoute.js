const express = require("express");
const _ = require("lodash");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

//servcies
const { url } = require("../utils");
const checkObjectId = require("../middleware/checkobjectId");

//Controller
const CategoryController = require("../controllers/categoryController");

// @route Post api/category/register
// access public

router.post("/",
  [auth, admin, [check("name", "Category name is required.").not().isEmpty()]],
  CategoryController.ADD_CATEGORY
);

//get all categories
router.get("/", CategoryController.GET_ALL_CATEGORIES);

//edit Category
router.post(
  "/edit",
  [
    auth,
    admin,
    // checkObjectId('categoryId'),
    [check("name", "Category name is required.").not().isEmpty()],
  ],
  CategoryController.UPDATE_CATEGORY
);

router.get('/:category_id', [auth, checkObjectId('category_id')],  CategoryController.GET_CATEGORY_BY_ID)




router.post('/status/:status', [auth,admin],CategoryController.UPDATE_CATEGORY_STATUS)


module.exports = router