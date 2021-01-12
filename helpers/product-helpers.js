var db =  require('../config/connection')
var collections = require('../config/collections')
var objectId = require('mongodb').ObjectID


module.exports = {
    
    addProduct: (product,callback) => {
        db.get().collection('product').insertOne(product).then((data)=>{
            callback(data.ops[0]._id)
        })
    },
    getAllProducts: () => {
        return new Promise(async(resolve,reject) => {
            let products = await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray()
            resolve(products)  
        })
    },
    deleteProduct: (proId) => {
        return new Promise((resolve,reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION).removeOne({_id:objectId(proId)}).then((res) => {
                resolve()
            })
        })
    },
    getProductDetails: (id) => {
        return new Promise((resolve,reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION).findOne({_id:objectId(id)}).then((product) => {
                resolve(product)
            })
        })
    },
    updateProduct: (proId,proDetails) => {
        return new Promise((resolve,reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION)
            .updateOne({_id:objectId(proId)},{
                $set:{
                    name:proDetails.name,
                    descriprion:proDetails.descriprion,
                    price:proDetails.price,
                    category:proDetails.category
                }
            }).then((response) => {
                resolve()
        })
        })
    }
}