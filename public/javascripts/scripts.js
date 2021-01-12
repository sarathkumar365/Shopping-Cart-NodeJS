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