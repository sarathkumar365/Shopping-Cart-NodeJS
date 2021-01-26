

function addToCart(id) {
  $.ajax({
    url: "/add-to-cart/" + id,
    method: "get",
    success: function (res) {
      //   console.log(res);
      if (res.status) {
        let count = $("#cart-count").html();
        count = parseInt(count) + 1;
        $("#cart-count").html(count);
      }
    },
    error: (res) => {
      console.log(res);
      alert(res);
    },
  });
}

function changeQuantity(cartID, proID, userID, count) {
  // console.log("done");
  let quantity = parseInt(document.getElementById(proID).innerHTML);
  count = parseInt(count);

  $.ajax({
    url: "/change-product-quantity",
    data: {
      cart: cartID,
      product: proID,
      count,
      quantity: quantity,
      user: userID,
    },
    method: "post",
    success: (response) => {
      if (response.removeProduct) {
        alert("Product removed successfully");
        location.reload();
      } else {
        document.getElementById(proID).innerHTML = quantity + count;
        // location.reload()
        document.getElementById("total").innerHTML = response.total;
      }
    },
  });
}

function remove(cartID, proID) {
  $.ajax({
    url: "/removeCartProduct",
    data: {
      cart: cartID,
      product: proID,
    },
    method: "post",
    success: (response) => {
      if (response.removeProduct) {
        alert("Product removed from cart");
        location.reload();
      } else {
        alert("Failed");
      }
    },
  });
}

function verifyPayment(payment, order) {
  $.ajax({
    url: "/verify-payment",
    data: {
      payment,
      order,
    },
    method: "post",
    success: (response) => {
      if (response.status) {
        location.href = "/order-placed";
      } else {
        alert('payment failed')
      }
    },
  });
}

function razorPayPayment(order) {
  var options = {
    key: "rzp_test_MMB8DLA7p8Zu8h", // Enter the Key ID generated from the Dashboard
    amount: order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
    currency: "INR",
    name: "Sarath Kumar",
    description: "Test Transaction",
    image: "https://example.com/your_logo",
    order_id: order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
    handler: function (response) {
      // alert(response.razorpay_payment_id);
      // alert(response.razorpay_order_id);
      // alert(response.razorpay_signature);

      verifyPayment(response, order);
    },
    prefill: {
      name: "Gaurav Kumar",
      email: "gaurav.kumar@example.com",
      contact: "9999999999",
    },
    notes: {
      address: "Razorpay Corporate Office",
    },
    theme: {
      color: "#3399cc",
    },
  };
  var rzp1 = new Razorpay(options);
  rzp1.open();
}

$("#checkout-form").submit((e) => {
  e.preventDefault();
  $.ajax({
    url: "/place-ordered",
    method: "post",
    data: $("#checkout-form").serialize(),
    success: (response) => {
      console.log(response);
      if (response.codSucces) {
        location.href = "/order-placed";
      } else {
        razorPayPayment(response);
      }
    },
  });
});
