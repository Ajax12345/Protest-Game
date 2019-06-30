$(document).ready(function(){
    $('.login_pannel').on('click', '.login_button', function(){
        var _r = {};
        var headers = ['email', 'password'];
        for (var i in headers){
            _r[headers[i]] = $("#user_"+headers[i]).val();
        }
        $.ajax({
            url: "/login_user",
            type: "get",
            data: {payload: JSON.stringify(_r)},
            success: function(response) {
              window.location.replace('/game/1/SomeUser');
            },
            error: function(xhr) {
              //Do Something to handle error
            }
        });
    });
}); 
