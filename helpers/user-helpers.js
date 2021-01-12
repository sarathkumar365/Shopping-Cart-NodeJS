var db = require("../config/connection");
var collections = require("../config/collections");
var bcrypt = require("bcrypt");
const { use } = require("../routes/admin");
const { ObjectID } = require("mongodb");

module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      userData.password = await bcrypt.hash(userData.password, 10);
      db.get()
        .collection(collections.USER_COLLECTION)
        .insertOne(userData)
        .then((res) => {
          resolve(res.ops[0]);
        });
    });
  },
  doLogin: (userData) => {
    let loginStatus = false;
    let response = {};
    return new Promise(async (resolve, rej) => {
      let user = await db
        .get()
        .collection(collections.USER_COLLECTION)
        .findOne({ email: userData.email });
      if (user) {
        bcrypt.compare(userData.password, user.password).then((res) => {
          if (res) {
            console.log("success");
            response.user = user;
            response.status = true;
            resolve(response);
          } else {
            console.log("failed");
            resolve({ status: false });
          }
        });
      } else {
        console.log("user does not exist");
        resolve({ status: false });
      }
    });
  },
  addToCart: (proId, userId) => {
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .findOne({ user: ObjectID(userId) });
      if (userCart) {
        db.get()
          .collection(collections.CART_COLLECTION)
          .updateOne(
            { user: ObjectID(userId) },
            {
              $push: { products: ObjectID(proId) },
            }
          )
          .then(() => {
            resolve();
          });
      } else {
        let cartObj = {
          user: ObjectID(userId),
          products: [ObjectID(proId)],
        };
        db.get()
          .collection(collections.CART_COLLECTION)
          .insertOne(cartObj)
          .then((response) => {
            resolve();
          });
      }
    });
  },
  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: ObjectID(userId) },
          },
          {
            $lookup: {
              from: collections.PRODUCT_COLLECTION,
              let: { proList: "$products" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $in: ["$_id", "$$proList"],
                    },
                  },
                },
              ],
              as: "cartItems",
            },
          },
        ])
        .toArray();
      resolve(cartItems[0].cartItems);
    });
  },
  getCartCount: (userId) => {
      return new Promise(async(resolve,reject) => {
          var count=0
          let cart =await db.get().collection(collections.CART_COLLECTION).findOne({user:ObjectID(userId)})
          if(cart) {
            count = cart.products.length
          }
          resolve(count)
      })
  }
};
