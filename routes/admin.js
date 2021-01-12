const { response } = require('express');
var express = require('express');
const collections = require('../config/collections');
var router = express.Router();
var productHelper = require('../helpers/product-helpers')
/* GET users listing. */
router.get('/', function(req, res, next) {
  productHelper.getAllProducts().then((products) =>{
  res.render('admin/view-products',{admin:true,products})

  })
});

router.get('/add-product',(req,res) => {
  res.render('admin/add-product')
})

router.post('/add-product',(req,res) => {
  console.log(req.body);
  console.log(req.files.image);
  productHelper.addProduct(req.body,(id) => {
    let image = req.files.image
    image.mv('./public/product-images/'+id+'.jpg',(err,done) => {
      if(!err){
        res.render('admin/add-product')
      }
      else (
        console.log((err))
      )
    })
  })
})

router.get('/delete-product',(req,res) => {
  let proId = req.query.id
  productHelper.deleteProduct(proId).then((response) => {
    res.redirect('/admin')
  })
})

router.get('/edit-product',async(req,res) => {
  let product = await productHelper.getProductDetails(req.query.id)
  res.render('admin/edit',{product})
})

router.post('/edit-product',(req,res) => {
  productHelper.updateProduct(req.query.id,req.body).then((response) => {
    res.redirect('/admin')
    if(req.files.image){
      let image = req.files.image
      image.mv('./public/product-images/'+req.query.id+'.jpg')  

    }
  })
})

module.exports = router;
