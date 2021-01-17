const { request, response } = require('express');
var express = require('express');
var router = express.Router();
var productHelper = require('../helpers/product-helpers');
const { route } = require('./admin');
const userHelpers =  require('../helpers/user-helpers')

const verifyLogin = (req,res,next) => {
  if(req.session.loggedIn){
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
  if(req.session.loggedIn){
    res.redirect('/')
  } else {
    res.render('user/login',{loginError:req.session.loginError})
    req.session.loginError=false
  }
})

router.get('/create-account',(req,res) => {
  res.render('user/create-account')
})

router.post('/signup',(req,res) => {
  userHelpers.doSignup(req.body).then((response) => {
    console.log(res);
    req.session.loggedIn=true
    req.session.user=response
    res.redirect('/')
  })
})

router.post('/login',(req,res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if(response.status){
      req.session.loggedIn=true
      req.session.user=response.user
      res.redirect('/')
    } else {
      req.session.loginError = "Invalid username or password"
      res.redirect('/login')
    }
  })
})

router.get('/logout',(req,res) => {
  req.session.destroy()
  res.redirect('/')
})

router.get('/cart',verifyLogin,async(req,res) => {
  let products =await userHelpers.getCartProducts(req.session.user._id)
  // console.log(products);
  let user=req.session.user
  // console.log(products);
  res.render('user/cart',{products,user})
})

router.get('/add-to-cart/:id',(req,res) => {
  console.log("api call");
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=> {
    res.json({status:true})
  })
})

router.post('/change-product-quantity',(req,res) =>{
  // console.log(req.body)
  userHelpers.changeProductQuantity(req.body).then((response) =>{
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
  res.render('user/place-order',{total})
})



module.exports = router;
