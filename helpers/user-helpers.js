var db = require("../config/connection");
var collections = require("../config/collections");
var bcrypt = require("bcrypt");
const { use } = require("../routes/admin");
const { ObjectID } = require("mongodb");
const { response } = require("express");
const Razorpay = require('razorpay')
var instance = new Razorpay({
  key_id: 'rzp_test_MMB8DLA7p8Zu8h',
  key_secret: 'N6FYRAcCV1O5aNyVOPh2kcjS',
});

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
  addToCart: (proID, userID) => {
    let proObj = {
      item: ObjectID(proID),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .findOne({ user: ObjectID(userID) });
      if (userCart) {
        let proExist = userCart.products.findIndex(
          (product) => product.item == proID
        );
        console.log(proExist);
        if (proExist != -1) {
          db.get()
            .collection(collections.CART_COLLECTION)
            .updateOne(
              { user: ObjectID(userID), "products.item": ObjectID(proID) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(collections.CART_COLLECTION)
            .updateOne(
              { user: ObjectID(userID) },
              {
                $push: { products: proObj },
              }
            )
            .then((response) => {
              resolve();
            });
        }
      } else {
        let cartObj = {
          user: ObjectID(userID),
          products: [proObj],
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
  getCartProducts: (userID) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: ObjectID(userID) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collections.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "productDetails",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$productDetails", 0] },
            },
          },
        ])
        .toArray();
      // console.log(cartItems[0].products);
      resolve(cartItems);
    });
  },
  getCartCount: (userID) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .findOne({ user: ObjectID(userID) });
      if (cart) {
        count = cart.products.length;
      }
      resolve(count);
    });
  },
  changeProductQuantity: (details) => {
    details.quantity = parseInt(details.quantity);
    details.count = parseInt(details.count);

    return new Promise((resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        db.get()
          .collection(collections.CART_COLLECTION)
          .updateOne(
            { _id: ObjectID(details.cart) },
            {
              $pull: { products: { item: ObjectID(details.product) } },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
      } else {
        db.get()
          .collection(collections.CART_COLLECTION)
          .updateOne(
            {
              _id: ObjectID(details.cart),
              "products.item": ObjectID(details.product),
            },
            {
              $inc: { "products.$.quantity": details.count },
            }
          )
          .then((response) => {
            resolve({ status: true });
          });
      }
    });
  },
  removeCartProduct: (details) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.CART_COLLECTION)
        .updateOne(
          { _id: ObjectID(details.cart) },
          {
            $pull: { products: { item: ObjectID(details.product) } },
          }
        )
        .then((response) => {
          resolve({ removeProduct: true });
        });
    });
  },
  getTotalAmount: (userID) => {
    // console.log(userID);
    return new Promise(async (resolve, reject) => {
      var Total = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: ObjectID(userID) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collections.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "productDetails",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$productDetails", 0] },
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: {
                  $multiply: [
                    "$quantity",
                    {
                      $toInt: "$product.price",
                    },
                  ],
                },
              },
            },
          },
        ])
        .toArray();
      // console.log(Total);
      // console.log(Total[0].total);
      resolve(Total[0].total);
    });
  },
  placeOrder: (order, products, total) => {
    return new Promise((resolve, reject) => {
      // console.log(order, products, total);
      let status = order["payment-method"] === "COD" ? "placed" : "pending";
      let orderObj = {
        deliveryDetails: {
          mobile: order.mobile,
          pincode: order.pincode,
          adderss: order.address,
        },
        userID: ObjectID(order.userID),
        paymentMethod: order["payment-method"],
        products: products,
        totalAmount: total,
        status: status,
        date: new Date(),
      };
      db.get()
        .collection(collections.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((response) => {
          db.get()
            .collection(collections.CART_COLLECTION)
            .removeOne({ user: ObjectID(order.userID) });
          resolve(response.ops[0]._id);
        });
    });
  },
  getCartProductList: (userID) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .findOne({ user: ObjectID(userID) });
      resolve(cart.products);
    });
  },
  getUserOrders: (userID) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collections.ORDER_COLLECTION)
        .find({ userID: ObjectID(userID) })
        .toArray();
      resolve(orders);
    });
  },
  getOrderProducts: (orderID) => {
    return new Promise(async (resolve, reject) => {
      let orderItems = await db
        .get()
        .collection(collections.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { _id: ObjectID(orderID) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collections.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "productDetails",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$productDetails", 0] },
            },
          },
        ])
        .toArray();
      console.log(orderItems);
      resolve(orderItems);
    });
  },
  generateRazorpay: (orderID,total) => {
    return new Promise((resolve,reject) => {
      var options = {
        amount: total,  // amount in the smallest currency unit
        currency: "INR",
        receipt:""+orderID
      };
      instance.orders.create(options, function(err, order) {
        if(err){
          console.log(err);
        } else {
        console.log("new order",order);
        resolve(order)
        }
      });
    })
  }
};
