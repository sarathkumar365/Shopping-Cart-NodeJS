var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  products = [{
    name:"Realme",
    category:"mobile",
    image:'https://images-na.ssl-images-amazon.com/images/I/41erMp7DrmL._AC_UY700_.jpg'
  },
  {
    name:"Iphone",
    category:"mobile",
    image:'https://shop.ee.co.uk/content/dam/everything-everywhere/images/SHOP/affiliates/apple/iPhone_12_Blue_800x800.png'
  },
  {
    name:"OnePlus",
    category:"mobile",
    image:'https://www.gizmochina.com/wp-content/uploads/2020/03/OnePlus-8-1.jpg'
  },
  {
    name:"Google Home",
    category:"mobile",
    image:'https://www.gizmochina.com/wp-content/uploads/2020/03/OnePlus-8-1.jpg'
  }]
  res.render('index',{products,admin:true});
});

module.exports = router;
