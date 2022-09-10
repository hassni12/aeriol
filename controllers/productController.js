
const Product = require("../models/product.model");
const User = require("../models/User.model");
const moment = require("moment");
const Rating = require("../models/Rating.model");
const wishlistModel = require("../models/wishlist.model");
const { GET_IMAGE_PATH } = require("../helper/helper");

exports.CREATE = async (req, res) => {
  try {
    const {
      name,
      category,
      price,
      shipment,
      stock,
      specifications,
      status,
    } = req.body;
    const images = [];
   
    const _images = req.files.image;
    if (!_images || _images.length === 0)
      return res.status(400).send({
        message: "Please Select Product Image",
      });
   await Promise.all(
    _images.map(async(image) => {
        let path = await GET_IMAGE_PATH(image)
       images.push(path);
     })
   )
    
    // console.log("images",images)
    // if (!subCategory)
    //   return res.status(400).send({ message: "Please Select Sub Category" });

    const product = new Product({
      name,
      category,
      price,
      shipment ,
      stock,
      specifications,
      status,
      avgRatings: 0,
      images,
     
    });

    await product.save();
    await res.status(201).send({
      message: "Product Created Successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      message: err.toString(),
    });
  }
};

exports.GET_PRODUCTS = async (req, res) => {
  try {

    const { page, limit, fieldname, order, keyword } = req.query;
    const currentpage = page ? parseInt(page, 10) : 1;
    const per_page = limit ? parseInt(limit, 10) : 10;
    const searchParam = req.query.keyword
      ? { $text: { $search: req.query.keyword } }
      : {};

      const from = req.query.from ? req.query.from : null;
      const to = req.query.to ? req.query.to : null;
      let dateFilter = {};
      if (from && to)
        dateFilter = {
          createdAt: {
            $gte: moment(new Date(from)).startOf("day"),
            $lte: moment(new Date(to)).endOf("day"),
          },
        };

    const category_filter = req.query.category
      ? { category: req.query.category }
      : {};
    const sub_category_filter = req.query.sub_category
      ? { subCategory: req.query.sub_category }
      : {};
    const sort_filter = req.query.sort
      ? { sort: req.query.sort }
      : { sort: "-_id" };
    let min_max_filter = {};
    if (req.query.min && req.query.max) {
      min_max_filter = {
        price: {
          $gte: req.query.min,
          $lte: req.query.max,
        },
      };
    }
    const rating_filter = req.query.rating
      ? {
          avgRatings: {
            $gte: req.query.rating,
            $lt: parseInt(req.query.rating) + 1,
          },
        }
      : {};
    const products = await Product.paginate(
      {
        status: true,
        ...category_filter,
        ...sub_category_filter,
        ...searchParam,
        ...min_max_filter,
        ...rating_filter,
        
      },
      {
        page:currentpage,
        limit: per_page,
        lean: true,
        // select: "name images price avgRatings",
        ...sort_filter,
        sort: "-_id",
        populate: {
          path: "category",
          select: "name",
        },
      }
    );

    if(req['user']){
      console.log('"MYWORKtrue"')
      
      let wishlist = await WishList.find({user:req.user._id})

      if (wishlist.length) {
 
      for (let i = 0; i < products.docs.length; i++) {
          // console.log(wishlist[0].property,property[i].id)
          if(wishlist[0].product.includes(products.docs[i]._id)){
            products.docs[i].is_wishlist=true
          }else{
            products.docs[i].is_wishlist=false

          }
      }
  }
}

    await res.status(200).send(
      products,
    );
  } catch (err) {
    res.status(500).send({
      message: err.toString(),
    });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .lean();

     
      if(!product){
            throw('product doesnot exist')
      }
  

    if (req.user) {
      const isWishlist = await wishlistModel.findOne( {user: req.user._id,  product: { $in: [ product._id ]}        }).lean();
    
      if (isWishlist) product.is_wishlist = true;
      else product.is_wishlist = false;
      product.my_rating = await Rating.findOne({
        product: product._id,
        user: req.user._id,
      }).lean();
    }
   
    await res.status(200).send(
      product,
   
    );
  } catch (err) {
    res.status(500).send({
      message: err.toString(),
    });
  }
};



exports.toggleStatus = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if(!product){
        throw('product doesnot exist')
  }


    product.status = !product.status;
    await product.save();
    await res.status(201).send({
      message: product.status ? "Product Activated" : "Product Inactivated",
    });
  } catch (err) {
    res.status(500).send({
      message: err.toString(),
    });
  }
};

exports.UPDATE_PRODUCT = async (req, res) => {
  try {
    const {
      id,
      name,
      category,
      subCategory,
      price,
      shipment,
      stock,
      specifications,
      status,
      existing_images,
   
    } = req.body;
    const images = [];
    const _existing_images = JSON.parse(existing_images);
    _existing_images.forEach((image) => {
      images.push(image);
    });
    const _images = req.files ? req.files.images : [];
    if (_images)
      await Promise.all(
        _images.map(async(image) => {
            let path = await GET_IMAGE_PATH(image)
           images.push(path);
         })
       );


    await Product.findByIdAndUpdate(id, {
      name,
      category,
      price,
      shipment,
      stock,
      specifications,
      status,
      images,
     
    });
    await res.status(201).send({
      message: "Product Updated",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      message: err.toString(),
    });
  }
};

exports.getRandomProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      { $match: { status: true } },
      { $sample: { size: 10 } },
    ]);
    await res.status(200).send({ products });
  } catch (err) {
    res.status(500).send({
      message: err.toString(),
    });
  }
};
