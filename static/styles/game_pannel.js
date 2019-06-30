$(document).ready(function(){
    function adjust_tds(){
        var h1 = parseInt($('.td_1_wrapper').css('height').match('\\d+'));
        var h2 = parseInt($('.td_2_wrapper').css('height').match('\\d+'));
        if (h1 > h2){
            $('.td_1_wrapper').css('height', h1.toString()+'px');
            $('.td_2_wrapper').css('height', h1.toString()+'px');
        }
        else{
            $('.td_1_wrapper').css('height', h2.toString()+'px');
            $('.td_2_wrapper').css('height', h2.toString()+'px');
        }
        
    }
    function create_board(){
        var colors = ['rgb(236, 167, 196)', 'rgb(150, 199, 232)'];
        for (var i = 0; i < 16; i++){
            var _html = `
                <tr id='board_row_${i}'></tr>
            `
            $('.game_board_table').append(_html);
            for (var b = 0; b < 16; b++){
                var _color = colors[Math.floor(colors.length * Math.random())];
                var html = `
                    <td class='game_board_cell' data-row='${b}' data-col='${i}'><div class='game_square' style='background-color:${_color}'></div></td>
                `;
                $("#board_row_"+i.toString()).append(html);
            }
        }
    }
    
    create_board();
    adjust_tds();
    function add_message(){
        var _date = new Date();
        var h = _date.getHours();
        var mins = _date.getMinutes();
        var m = 'AM';
        if (h > 12){
            m = 'PM';
            h -= 12;
        }
        if (mins < 10){
            mins = '0'+mins.toString();
        }
        var _message = $('#chat_message_input').val();
        var _count = 0;
        $('.chat_message').each(function(){
            _count = 1;
        });
        if (_message.length > 0){
            //pass
            var _html = `
                <div style='height:${_count*2+30}px'></div>
                <div class='chat_message'>
                    <table>
                        <tr>
                            <td><span class='chat_poster'>James Petullo</span></td>
                        
                            <td><div class='chat_timestamp'>${h}:${mins} ${m}</div></td>
                        </tr>
                    </table>
                    <div style='height:15px'></div>
                    <table>
                        <tr>
                            <td><div class='message_dot'></div></td>
                            <td>
                                <span class='main_chat_message'>
                                 ${_message}
                                </span>
                            </td>
                        </tr>
                    </table>
                    
                </div>
            `;
            $('.no_messages_posted').remove();
            $('.inner_chat_pannel').append(_html);
        }
    }
    $('.message_input_box').on('click', '.add_message', function(){
        add_message();
    });
    $('#chat_message_input').keyup(function(e){
        if(e.keyCode == 13){
            add_message();
        }
    });
});