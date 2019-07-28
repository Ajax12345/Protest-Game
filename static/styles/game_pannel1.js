$(document).ready(function(){

    load_message_history();
    get_gametime();
    select_proper_chat();
    can_add_reaction();
    Pusher.logToConsole = true;

    var pusher = new Pusher('f7e3f6c14176cdde1625', {
      cluster: 'us2',
      forceTLS: true
    });
    var channel = pusher.subscribe('private-game-chat');
    channel.bind('client-protesters-chat'+$('.game_name').data('gameid'), function(data) {

        render_message_protesters(data);
    });
    channel.bind('client-police-chat'+$('.game_name').data('gameid'), function(data) {

        render_message_police(data);
    });
    
    var markers = pusher.subscribe('markers');
    //console.log('update-markers'+$('.game_name').data('gameid'));
    markers.bind('update-markers'+$('.game_name').data('gameid'), function(data) {

        add_new_marker(data);
    });
    var scores = pusher.subscribe('scores');
    scores.bind('update-scores'+$('.game_name').data('gameid'), function(data) {
        console.log(data);
        update_police_score(data.police);
        update_protester_score(data.protesters);
        
        if (data.keepgoing){
            $('.reaction_display_table').css('display', 'block');
            $('.history_round_label').html('Round ' + (parseInt($('.history_round_label').text().match('\\d+'))+1).toString());
        }
        else{
            $('.reaction_display_table').css('display', 'none');
            generate_victory_pannel();
        }
        //$('.reaction_display_table').css('display', 'block');
        adjust_main_wrappers();
        
        
    });
    function generate_victory_pannel(){
        var _winner = 'Police';
        var _p1_score = parseInt($('.__police_score_display').text());
        var _p2_score = parseInt($('.__protester_score_display').text());
        if (_p1_score < _p2_score){
            _winner = 'Protesters';
        }
        else if (_p1_score === _p2_score){
            _winner = 'draw';
        }
        var _winner_crest = {'Police':'eared-shield-1.svg', 'Protesters':'raised-fist.svg'};
        if (_winner != 'draw'){
            
            var _html = `
                <div class='winner_banner_name'>${_winner} Win!</div>
                <div style='height:20px'></div>
                <div class='logo_winner_wrapper'>
                <img src="/static/styles/${_winner_crest[_winner]}" alt="${_winner}_badge" style="width:30%;height:30%;margin:0 auto;">
                </div>
                <div style='height:20px'></div>
                <div class='score_card'>
                <table style='width:100%;margin:0 auto;'>
                <tr>
                     <td style='width:40%'><div class='victory_score_text'>${_p1_score}</div></td>
                     <td style='width:20%'><div class='victory_score_text'>to</div></td>
                     <td style='width:40%'><div class='victory_score_text'>${_p2_score}</div></td>
                </tr>     
                </table>
                </div>
                
                </div>
                `
                $('.full_board').html(_html);
        }
        else{
            var _html = `
                <div class='winner_banner_name'>Draw!</div>
                <div style='height:20px'></div>
                
                <div class='score_card'>
                <table style='width:100%;margin:0 auto;'>
                <tr>
                     <td style='width:40%'><div class='victory_score_text'>${_p1_score}</div></td>
                     <td style='width:20%'><div class='victory_score_text'>to</div></td>
                     <td style='width:40%'><div class='victory_score_text'>${_p2_score}</div></td>
                </tr>     
                </table>
                </div>
                
                </div>
                `
                $('.full_board').html(_html);
        }
        $('.game_board_wrapper').append('<div style="height:20px"></div>\n');
        var _survey_html = `
            <div class='full_board survey_pannel'>
                <div class='survey_prompt_text'>Before you go, please rate this game!</div>
                <div style='height:30px'></div>
                <table style='margin:0 auto'>
                    <tr>
                        <td id='start_td1' class='star_td'><i class="fas fa-star empty_star" data-starid='1'></i></td>
                        <td id='start_td2' class='star_td'><i class="fas fa-star empty_star" data-starid='2'></i></td>
                        <td id='start_td3' class='star_td'><i class="fas fa-star empty_star" data-starid='3'></i></td>
                        <td id='start_td4' class='star_td'><i class="fas fa-star empty_star" data-starid='4'></i></td>
                        <td id='start_td5' class='star_td'><i class="fas fa-star empty_star" data-starid='5'></i></td>
                    </tr>
                </table>
                <div style='height:30px'></div>
                <div class='survey_prompt_text'>Comments (Optional)</div>
                <div style='height:15px'></div>
                <textarea class='larger_comments'></textarea>
                <div style='height:15px'></div>
                <div class='submit_survey'>Submit Survey</div>
            </div>
            <div style='height:100px'></div>
        `
        $('.game_board_wrapper').append(_survey_html);
        adjust_main_wrappers();
    }
    function select_proper_chat(){
        if ($('.logged_in_user').data('role') != 'police'){
            $("#protester_chat_channel").attr('class', 'chat_channel_option selected_channel');
            $("#police_chat_channel").attr('class', 'chat_channel_option');
        }
        else{
            $("#police_chat_channel").attr('class', 'chat_channel_option selected_channel');
            $("#protester_chat_channel").attr('class', 'chat_channel_option');
        }
    }
    function add_new_marker(data){
        var _htl = `
            "<span class='${data.role}_pulse'></span>"
        `;
        $("#board_cell_"+data.position[1].toString()+'_'+data.position[0].toString()).html(_htl); 
        if (data.candisplay){
            $('.reaction_display_table').css('display', 'block');
            
        }
        adjust_main_wrappers();
    }
    function can_add_reaction(){
        $.ajax({
            url: "/can_add_reaction",
            type: "get",
            data: {payload: JSON.stringify({'gameid':parseInt($('.game_name').data('gameid'))})},
            success: function(response) {
                if (response.can_add_reaction){
                    $('.reaction_display_table').css('display', 'block');
                    
                }
                var scores = JSON.parse(response.scores);
                update_protester_score(scores.protesters);
                update_police_score(scores.police);
                adjust_main_wrappers();
            },
            error: function(xhr) {
              //Do Something to handle error
            }
        });
    }
    function format_game_time(){
        var minutes = parseInt($('.game_time').text().split(':')[0]);
        var seconds = parseInt($('.game_time').text().split(':')[1]);
        var _s = seconds.toString();
        if (seconds < 10){
            _s = '0'+seconds.toString();
        }
        $('.game_time').html(minutes.toString()+':'+_s);
        $.ajax({
            url: "/update_gametime",
            type: "get",
            data: {payload: JSON.stringify({'gameid':parseInt($('.game_name').data('gameid')), 'time':minutes.toString()+':'+_s})},
            success: function(response) {
              //pass
            },
            error: function(xhr) {
              //Do Something to handle error
            }
        });
    }

    function update_timer(){
        var minutes = parseInt($('.game_time').text().split(':')[0]);
        var seconds = parseInt($('.game_time').text().split(':')[1]);
        seconds++;
        if (seconds === 60){
            seconds = 0;
            minutes++;
        }
        var _s = seconds.toString();
        if (seconds < 10){
            _s = '0'+seconds.toString();
        }
        $('.game_time').html(minutes.toString()+':'+_s);
        $.ajax({
            url: "/update_gametime",
            type: "get",
            data: {payload: JSON.stringify({'gameid':parseInt($('.game_name').data('gameid')), 'time':minutes.toString()+':'+_s})},
            success: function(response) {
              //pass
            },
            error: function(xhr) {
              //Do Something to handle error
            }
        });
        //format_game_time();
        setTimeout(function(){
            update_timer();
        }, 1000);
    }
    function get_gametime(){
        $.ajax({
            url: "/get_gametime",
            type: "get",
            data: {payload: JSON.stringify({'gameid':parseInt($('.game_name').data('gameid'))})},
            success: function(response) {
              $('.game_time').html(response.time);
              
              
              update_timer();
            },
            error: function(xhr) {
              //Do Something to handle error
            }
        });
    }
    function get_all_markers(){
        $.ajax({
            url: "/get_all_markers",
            type: "get",
            data: {payload: JSON.stringify({'gameid':parseInt($('.game_name').data('gameid'))})},
            success: function(response) {
                var _r = JSON.parse(response.markers);
                for (var i in _r){
                    add_new_marker(_r[i]);
                }
            },  
            error: function(xhr) {
              //Do Something to handle error
            }
        });
    }
    function create_board(){
       for (var i = 0; i < 18; i++){
           var tr_html = `
            <tr id='board_tr_${i}'></tr>
           `;
            $('.game_board_table').append(tr_html);
            for (var b = 0; b < 20; b++){
                var td_html =`
                    <td class='game_board_td' id='board_td_${i}_${b}'><div class='board_cell' id='board_cell_${i}_${b}' data-x='${b}' data-y='${i}'></div></td>
                `
                $("#board_tr_"+i.toString()).append(td_html);
            }
       } 
       /*
       $("#board_cell_3_4").html("<span class='protester_pulse'></span>")
       $("#board_cell_4_4").html("<span class='protester_pulse'></span>")
       $("#board_cell_2_17").html("<span class='police_pulse'></span>")
       */
    }
    function get_protester_cells(){
        var _start = 10;
        var _options = [];
        for (var i = 0; i< 18; i++){
            for (var b = 0; b < _start; b++){
                if ($("#board_cell_"+i.toString()+'_'+b.toString()).html().length === 0){
                    _options.push({x:b, y:i})
                }  
            }
            if (_start < 19){
                _start++;
            }
        }
        if (_options.length > 0){
            return _options[Math.floor(Math.random()*_options.length)];
        }
        return {};
        
    }
    function get_police_cells(){
        var _start = 10;
        var _options = [];
        for (var i = 0; i < 18; i++){
            if (_start < 20){
                for (var b = _start; b < 20; b++){
                    if ($("#board_cell_"+i.toString()+'_'+b.toString()).html().length === 0){
                        _options.push({x:b, y:i})
                    }  
                }
                _start++;
            }
        }
        /*
        for (var i in _options){
            if ($("#board_cell_"+_options[i].y.toString()+'_'+_options[i].x.toString()).html().length === 0){
                $("#board_cell_"+_options[i].y.toString()+'_'+_options[i].x.toString()).css('background-color', 'gray');
            }
        }   
          
        */
        if (_options.length > 0){
            return _options[Math.floor(Math.random()*_options.length)];
        }
        return {}
        
    }

    create_board();
    get_all_markers();
    var p_result = get_protester_cells();
    var pol_result = get_police_cells();
    var _place_marker = {'protester':get_protester_cells, 'police':get_police_cells};
    function place_user_marker(){
        if ($('.logged_in_user').data('role') != 'instructor'){
            var _move = _place_marker[$('.logged_in_user').data('role')]();
            $.ajax({
                url: "/add_player_marker",
                type: "get",
                data: {payload: JSON.stringify({'role':$('.logged_in_user').data('role'), 'gameid':parseInt($('.game_name').data('gameid')), 'player':parseInt($('.logged_in_user').data('userid')), 'position':_move})},
                success: function(response) {
                    if (response.success === 'True'){
                        
                        var _htl = `
                        "<span class='${$('.logged_in_user').data('role')}_pulse'></span>"
                        `;
                        $("#board_cell_"+_move.y.toString()+'_'+_move.x.toString()).html(_htl); 
                        if (response.candisplay){
                            $('.reaction_display_table').css('display', 'block');
                            adjust_main_wrappers();
                        }
                    }

                    else if (response.success === 'False'){
                        place_user_marker();
                    }
                },
                error: function(xhr) {
                  //Do Something to handle error
                }
            });
        }
    }
    place_user_marker();
    console.log(p_result);
    console.log(pol_result);
    function scroll_chat(){
        var d = $('.chat_main');
        d.scrollTop(d.prop("scrollHeight"));
    }
    function scroll_history(){
        var d = $('.inner_move_history');
        d.scrollTop(d.prop("scrollHeight"));
    }
    scroll_history();
    function load_message_history(){
        $.ajax({
            url: "/get_message_history",
            type: "get",
            data: {payload: JSON.stringify({'role':$('.logged_in_user').data('gamerole'), 'gameid':parseInt($('.game_name').data('gameid'))})},
            success: function(response) {
                $(response.html).insertAfter('.chat_history_buffer');
                scroll_chat();
            },
            error: function(xhr) {
              //Do Something to handle error
            }
        });
    }
    function adjust_main_wrappers(){
        var h1 = parseInt($('.game_chat_wrapper').css('height').match('\\d+'));
        var h2 = parseInt($('.game_board_wrapper').css('height').match('\\d+'));
        if (h1 > h2){
            $('.game_board_wrapper').css('height', h1.toString()+'px');
        }
        else{
            $('.game_chat_wrapper').css('height', h2.toString()+'px');
        }
    }
    function adjust_inner_wrappers(){
        var h1 = parseInt($('.channel_wrapper').css('height').match('\\d+'));
        var h2 = parseInt($('.chat_wrapper').css('height').match('\\d+'));
        if (h1 > h2){
            $('.chat_wrapper').css('height', h1.toString()+'px');
        }
        else{
            $('.channel_wrapper').css('height', h2.toString()+'px');
        }
    }
    function set_channel_selection_color(){
        var _color_border = {'Protesters':'rgb(209, 47, 117)', 'Police':'rgb(40, 84, 154)'};
        $('.selected_channel').css('border-left', 'solid');
        $('.selected_channel').css('border-left-width', '3px');
        $('.selected_channel').css('border-left-color', _color_border[$('.selected_channel').data('channel')]);
           
            

    }
    set_channel_selection_color();
    adjust_main_wrappers();
    adjust_inner_wrappers();
    $('.game_display').on('click', '.chat_channel_option', function(){
        var _ref = $(this);
        $('.chat_channel_option').each(function(){
            $(this).attr('class', 'chat_channel_option');
            $(this).css('border-left', 'none');
        });
        _ref.attr('class', 'chat_channel_option selected_channel')
        $(".chat_header_text").html('#'+_ref.data('channel'));
        $('.main_input_box').attr('placeholder', 'Message #'+_ref.data('channel'));
        $('.logged_in_user').attr('data-gamerole', _ref.data('channel').toLowerCase());
        set_channel_selection_color();
        load_chat_message_history(_ref.data('channel'));
    }); 
    $('.game_display').on('click', '.select_emogi_pannel', function(){
        if ($('.emoji_display').css('display') === 'none'){
            $('.emoji_display').css('display', 'block');
        }
        else{
            $('.emoji_display').css('display', 'none')
        }
        adjust_main_wrappers();
        adjust_inner_wrappers();
    });
    function load_emojis(){
        var emojis = ['😀', '😀', '😁', '😂', '😃', '😄', '😅', '😆', '😇','😉', '😊', '😋', '😌', '😍', '😎', '✊', '✋', '👇', '👈', '👉', '👊', '👋', '👌', '👍', '👎', '👏', '🤙', '🤚', '🤛', '🤜', '🤝', '🤞']
        for (var i in emojis){
            $('.emoji_display').append("<span class='emoji_span'>"+emojis[i]+"</span>");
        }
    }
    load_emojis();
    $('.game_display').on('click', '.emoji_span', function(){
        $('.main_input_box').val($('.main_input_box').val()+$(this).text());
    });
    function load_chat_message_history(_role){
        $.ajax({
            url: "/get_message_history",
            type: "get",
            data: {payload: JSON.stringify({'gameid':parseInt($('.game_name').data('gameid')), 'role':_role.toLowerCase()})},
            success: function(response) {
              $('.chat_main').html('<div class="chat_history_buffer"></div>');
              $('.chat_main').append(response.html);
              scroll_chat();
            },
            error: function(xhr) {
              //Do Something to handle error
            }
        });
    }
    function get_scores(){
        $.ajax({
            url: "/get_scores",
            type: "get",
            data: {payload: JSON.stringify({'gameid':parseInt($('.game_name').data('gameid'))})},
            success: function(response) {
              var scores = JSON.parse(response.scores);
              $('.police_score_outer').attr('data-score', scores.police.toString());
              $('.protester_score_outer').attr('data-score', scores.protesters.toString());
              display_scores();
            },
            error: function(xhr) {
              //Do Something to handle error
            }
        });
    }
    function update_police_score(_score){
        var color_codes = {10: '#24EA1E', 1: '#FF0000', 3: '#FF530D', 2: '#F74017', 5: '#FCD00A', 4: '#FD8641', 7: '#F3EC0E', 6: '#F8E049', 9: '#4DC84A', 8: '#73CA7C'};
        /*
        $('.police_score_negative').css('width', '0%');
        $('.police_score_positive').css('width', '0%');
        if (_score < 0){
            $('.police_score_negative').css('width', (Math.abs(_score)*10).toString()+'%');
            $('.police_score_negative').css('border-bottom', '10px solid '+color_codes[Math.abs(_score)]);
        }
        else{
            $('.police_score_positive').css('width', (_score*10).toString()+'%');
            $('.police_score_positive').css('background-color', color_codes[_score]);
        }
        */
       $('.__police_score_display').html(_score);

    }
    function update_protester_score(_score){
        var color_codes = {10: '#24EA1E', 1: '#FF0000', 3: '#FF530D', 2: '#F74017', 5: '#FCD00A', 4: '#FD8641', 7: '#F3EC0E', 6: '#F8E049', 9: '#4DC84A', 8: '#73CA7C'};
        /*
        $('.protester_score_negative').css('width', '0%');
        $('.protester_score_positive').css('width', '0%');
        if (_score < 0){
            $('.protester_score_negative').css('width', (Math.abs(_score)*10).toString()+'%');
            $('.protester_score_negative').css('border-bottom', '10px solid '+color_codes[Math.abs(_score)]);
        }
        else{
            $('.protester_score_positive').css('width', (_score*10).toString()+'%');
            $('.protester_score_positive').css('background-color', color_codes[_score]);
        }
        */
        $('.__protester_score_display').html(_score);
    }
    function display_scores(){
        var color_codes = {10: '#24EA1E', 1: '#FF0000', 3: '#FF530D', 2: '#F74017', 5: '#FCD00A', 4: '#FD8641', 7: '#F3EC0E', 6: '#F8E049', 9: '#4DC84A', 8: '#73CA7C'};
        $('.entity_scores').each(function(){
            var _score = parseInt($(this).data('score'));
            if (_score < 0){
                $('.'+$(this).data('entity')+'_score_negative').css('width', (Math.abs(_score)*10).toString()+'%');
                $('.'+$(this).data('entity')+'_score_negative').css('border-bottom', '10px solid '+color_codes[Math.abs(_score)]);
            }
            else{
                $('.'+$(this).data('entity')+'_score_positive').css('width', (_score*10).toString()+'%');
                $('.'+$(this).data('entity')+'_score_positive').css('background-color', color_codes[_score]);
            }
            
        });
    }
    //display_scores();
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
        else{
            mins = mins.toString();
        }
        var _message = $('.main_input_box').val();
        $('.main_input_box').val('');
        var _count = 0;
        $('.chat_message').each(function(){
            _count = 1;
        });
        if (_message.length > 0){
            var _role;
            if ($("#protester_chat_channel").prop('class').match('selected_channel')){
                _role = 'protesters';
            }
            else{
                _role = 'police';
            }
            var _timestamp = h.toString()+':'+mins+" "+m;
            var _message_payload = {'poster':$('.logged_in_user').data('tuser'), 'timestamp':_timestamp, 'message':_message};
            console.log(_message_payload);
            channel.trigger('client-'+_role+'-chat'+$('.game_name').data('gameid'), _message_payload);
            
            //pass
            var _html = `
            <div style='height:10px'></div>
            <table>
                <tr>
                    <td><div class='poster_name'>${$('.logged_in_user').data('tuser')}</div></td>
                    <td><div class='message_date'>${h}:${mins} ${m}</div></td>
                </tr>
            </table>
            <div style='height:5px'></div>
            <div class='message_text'>${_message}</div>
            <div style='height:5px'></div>
            `;
            
            $('.chat_main').append(_html);
            scroll_chat();
            log_message(_message_payload);
        }
    }
    function log_message(data){
        var _role;
        if ($("#protester_chat_channel").prop('class').match('selected_channel')){
            _role = 'protesters';
        }
        else{
            _role = 'police';
        }
        $.ajax({
            url: "/log_message",
            type: "get",
            data: {payload: JSON.stringify({'role':_role, 'gameid':parseInt($('.game_name').data('gameid')), 'payload':data})},
            success: function(response) {
              //$("#place_for_suggestions").html(response);
            },
            error: function(xhr) {
              //Do Something to handle error
            }
          });
    }
    function render_message(data){
        var _html =`
        <div style='height:10px'></div>
            <table>
                <tr>
                    <td><div class='poster_name'>${data['poster']}</div></td>
                    <td><div class='message_date'>${data['timestamp']}</div></td>
                </tr>
            </table>
            <div style='height:5px'></div>
            <div class='message_text'>${data['message']}</div>
            <div style='height:5px'></div>
        `
        
            $('.chat_main').append(_html);
            scroll_chat();
    }
    function render_message_police(data){
        if ($("#police_chat_channel").prop('class').match('selected_channel')){
            render_message(data);
        }
    }
    function render_message_protesters(data){
        if ($("#protester_chat_channel").prop('class').match('selected_channel')){
            render_message(data);
        }
    }
    $('.main_input_box').keyup(function(e){
        if(e.keyCode == 13 && $(this).val().length > 0){
            add_message();
        }
    });
    
    $('.game_display').on('click', '.violence_level', function(){
        
        $.ajax({
            url: "/log_reaction",
            type: "get",
            data: {payload: JSON.stringify({'role':$('.logged_in_user').data('role'), 'gameid':parseInt($('.game_name').data('gameid')), 'player':parseInt($('.logged_in_user').data('userid')), 'reaction':$(this).data('reaction')})},
            success: function(response) {
                if (response.success === 'True'){
                    update_police_score(response.police);
                    update_protester_score(response.protesters);
                    if (response.keepgoing){
                        $('.reaction_display_table').css('display', 'block');
                    }
                    else{
                        $('.reaction_display_table').css('display', 'none');
                    }
                    //$('.reaction_display_table').css('display', 'block');
                }
                else{
                    $('.reaction_display_table').css('display', 'none');
                }
                adjust_main_wrappers();
                
            },
            error: function(xhr) {
              //Do Something to handle error
            }
          });
          
    });
    $('.game_board_wrapper').on('click', '.empty_star', function(){
        var _id = parseInt($(this).data('starid'));
        $('.star_td').each(function(){
            var new_id = parseInt($(this).prop('id').match('\\d+'));
            if (new_id <= _id){
                var _html = `
                    <i class="fas fa-star full_star" data-starid='${new_id}'></i>
                `
                $("#start_td"+new_id.toString()).html(_html);
            }
            else{
                var _html = `
                    <i class="fas fa-star empty_star" data-starid='${new_id}'></i>
                `
                $("#start_td"+new_id.toString()).html(_html);
            }
        });
        
      });
      $('.game_board_wrapper').on('click', '.full_star', function(){
        var _id = parseInt($(this).data('starid'));
        $('.star_td').each(function(){
            var new_id = parseInt($(this).prop('id').match('\\d+'));
            if (new_id < _id){
                var _html = `
                    <i class="fas fa-star full_star" data-starid='${new_id}'></i>
                `
                $("#start_td"+new_id.toString()).html(_html);
            }
            else{
                var _html = `
                    <i class="fas fa-star empty_star" data-starid='${new_id}'></i>
                `
                $("#start_td"+new_id.toString()).html(_html);
            }
        });
        
      });
      $('.game_board_wrapper').on('click', '.submit_survey', function(){
        var _max_star = 0;
        $('.full_star').each(function(){
            var _val = parseInt($(this).data('starid'));
            if (_val > _max_star){
                _max_star = _val;
            }
        });
        $.ajax({
            url: "/post_review",
            type: "get",
            data: {payload: JSON.stringify({'rating':_max_star, 'comments':$('.larger_comments').val()})},
            success: function(response) {
                $('.survey_pannel').html('<div class="winner_banner_name">Thank you!</div>\n<div style="height:20px;"></div>\n<div class="survey_prompt_text">redirecting...</div>')
                setTimeout(function(){
                    window.location.replace('/dashboard');
                }, 2000);
                
            },
            error: function(xhr) {
              //Do Something to handle error
            }
        });
    });
});
