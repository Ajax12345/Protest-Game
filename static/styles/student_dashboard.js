$(document).ready(function(){
    function compute_times(){
        $('.game_started').each(function(){
            var _min = parseInt($(this).text().split(':')[0]);
            var _sec = parseInt($(this).text().split(':')[1]);
            _sec++;
            if (_sec === 60){
                _sec = '00';
                _min++;
            }
            else{
                if (_sec < 10){
                    _sec = '0'+_sec.toString();
                }
                else{
                    _sec = _sec.toString();
                }
            }
            $(this).text(_min.toString()+':'+_sec);

        });
        setTimeout(function(){
            compute_times();
        }, 1000);
    }
    compute_times();
    $('.header').on('click', '.site_login', function(){
        window.location.replace('/login');
    });
});