const { request } = require('express');
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
  console.log(products);
  let user=req.session.user
  res.render('user/cart',{products,user})
})

router.get('/add-to-cart/:id',(req,res) => {
  console.log(req.params.id);
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=> {
    res.json({status:true})
  })
})


module.exports = router;
