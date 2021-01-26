const { request, response } = require('express');
var express = require('express');
var router = express.Router();
var productHelper = require('../helpers/product-helpers');
const { route } = require('./admin');
const userHelpers =  require('../helpers/user-helpers');
const { Logger } = require('mongodb');

const verifyLogin = (req,res,next) => {
  console.log(req.session.userLoggedIn);
  if(req.session.userLoggedIn){
    next()
  } else {
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/',async function(req, res, next) {
  var user = req.session.user
  let cartCount=null  
  if(req.session.user){
     cartCount =await userHelpers.getCartCount(user._id)
  }
  productHelper.getAllProducts().then((products) => {
    res.render('user/view-products',{products,user,cartCount});
  })
});

router.get('/login',(req,res) => {
  if(req.session.user){
    res.redirect('/')
  } else {
    res.render('user/login',{loginError:req.session.userLoginError})
    req.session.userLoginError=false
  }
})

router.get('/create-account',(req,res) => {
  res.render('user/create-account')
})

router.post('/signup',(req,res) => {
  userHelpers.doSignup(req.body).then((response) => {
    console.log(res);
    req.session.user=response
    req.session.userLoggedIn=true
    res.redirect('/')
  })
})

router.post('/login',(req,res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if(response.status){
      req.session.user=response.user
      req.session.userLoggedIn=true
      res.redirect('/')
    } else {
      req.session.userLoginError = "Invalid username or password"
      res.redirect('/login')
    }
  })
})

router.get('/logout',(req,res) => {
  req.session.user=null
  req.session.userLoggedIn=false
  res.redirect('/')
})

router.get('/cart',verifyLogin,async(req,res) => {
  let total = 0
  let products =await userHelpers.getCartProducts(req.session.user._id)
  if(products.length>0){
    total = await userHelpers.getTotalAmount(req.session.user._id) 
  }
  // console.log(products);
  let user=req.session.user
  // console.log(products);

  res.render('user/cart',{products,user,total})
})

router.get('/add-to-cart/:id',(req,res) => {
  console.log("api call");
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=> {
    res.json({status:true})
  })
})

router.post('/change-product-quantity',(req,res) =>{
  // console.log(req.body)
  userHelpers.changeProductQuantity(req.body).then(async(response) =>{
    response.total = await userHelpers.getTotalAmount(req.body.user)

    res.json(response)
  })
})

router.post('/removeCartProduct',(req,res) => {
  userHelpers.removeCartProduct(req.body).then((response) => {
    console.log(response);
    res.json(response)
  })
})

router.get('/place-order',verifyLogin,async(req,res)=> {
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{total,user:req.session.user})
})

router.post('/place-ordered',async(req,res) => {
  console.log(req.body);
  let products =await userHelpers.getCartProductList(req.body.userID)
  // console.log(req.body.userID);
  let totalPrice =await userHelpers.getTotalAmount(req.body.userID)
  // console.log("total "+totalPrice);
  userHelpers.placeOrder(req.body,products,totalPrice).then((orderID) => {
    if(req.body['payment-method']==='COD'){
      res.json({codSuccess:true})
    } else {
      userHelpers.generateRazorpay(orderID,totalPrice).then((response) =>{
        res.json(response)
      })
    }
  })
  // console.log(req.body);
})

router.get('/order-placed',(req,res) => {
  res.render('user/order-placed',{user:req.session.user})
})

router.get('/orders',async(req,res) => {
  let orders = await userHelpers.getUserOrders(req.query.id)
  // console.log(orders)
  res.render('user/orders',{user:req.session.user,orders})
})


router.get('/view-order-products/:id',async(req,res) => {
  let productDetail = await userHelpers.getOrderProducts(req.params.id)
  // console.log(productDetail);
  res.render('user/view-ordered-products',{productDetail,user:req.session.user})
})


router.post('/verify-payment',(req,res) => {
  console.log(req.body);
  userHelpers.verifyPayment(req.body).then((response) => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log('payment success');
      res.json({status:true})
    })
  }).catch((err) => {
    console.log((err));
    res.json({status:false,errMsg:''})
  })
})

module.exports = router;
