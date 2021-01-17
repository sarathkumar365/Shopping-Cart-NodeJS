    function addToCart(id){
    $.ajax({
      url:'/add-to-cart/'+id,
      method:'get',
      success:function(res){
        //   console.log(res);
        if(res.status){
            let count = $('#cart-count').html()
            count = parseInt(count)+1
            $('#cart-count').html(count)
        }
    },
      error: (res) => {
          console.log(res);
        alert(res)
      }
    })
  }

  function changeQuantity(cartID,proID,count) {
    // console.log("done");
    let quantity = parseInt(document.getElementById(proID).innerHTML)
    count =parseInt(count)

    $.ajax({
      url:'/change-product-quantity',
      data:{
        cart:cartID,product:proID,count,quantity:quantity
      },
      method:'post',
      success:(response) =>{
        if(response.removeProduct){
          alert("Product removed successfully")
          location.reload()
        } else {
          document.getElementById(proID).innerHTML=quantity+count
        }
      }
    })
  }

  function remove(cartID,proID){
    $.ajax({
      url:"/removeCartProduct",
      data:{
        cart:cartID,product:proID
      },
      method:'post',
      success:(response) => {
        if(response.removeProduct){
          alert("Product removed from cart")
          location.reload()
        } else {
          alert('Failed')
        }
      }
    })
  }