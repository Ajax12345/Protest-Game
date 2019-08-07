$(document).ready(function(){
    $('.add_users_pannel').on('click', '.role_option', function(){
        var _id = $(this).data('sid');
        var _name = $(this).text();
        var _html = `
        <table class='selected_role_student' data-studentselect='${_id}'>
            <tr>
                <td id='${_name.toLowerCase()}${_id}'><span class='${_name.toLowerCase()}_role' data-sid='${_id}'>${_name}</span></td>
                <td><span class='diselect' data-sid='${_id}'>Undo</span></td>
            </tr>
        </table>
        `;
        $("#student"+_id).html(_html);
    });
    $('.add_users_pannel').on('click', '.diselect', function(){
        var _id = $(this).data('sid');
        var _html = `
        <table>
            <tr>
                <td id='protester${_id}'><span class='protester_role role_option' data-sid='${_id}'>Protester</span></td>
                <td id='police${_id}'><span class='police_role role_option' data-sid='${_id}'>Police</span></td>
            </tr>
        </table>
        `;
        $("#student"+_id).html(_html);
    });
    $('.game_name_outer').on('click', '#board_state_display', function(){
        $(this).attr('class', 'board_state board_state_left board_state_selected');
        $('#board_state_hide').attr('class', 'board_state board_state_right');
    });
    $('.game_name_outer').on('click', '#board_state_hide', function(){
        $('#board_state_display').attr('class', 'board_state board_state_left');
        $(this).attr('class', 'board_state board_state_right board_state_selected');
    });
    $('.game_name_outer').on('click', '#add_content_none', function(){
        $("#content_addition_modal").modal('toggle')
        $(this).attr('class', 'board_state board_state_left board_state_selected');
        $('#add_content_add').attr('class', 'board_state board_state_right');
    });
    $('.game_name_outer').on('click', '#add_content_add', function(){
        $("#content_addition_modal").modal('toggle');
        $('#add_content_none').attr('class', 'board_state board_state_left');
        $(this).attr('class', 'board_state board_state_right board_state_selected');
    });
    var content_payload = {};
    $("#content_addition_modal").on('click', '.save_content', function(){
        var _ids = ['content_location', 'content_date', 'content_overview', 'content_missionp', 'content_missionpr'];
        for (var i in _ids){
            content_payload[_ids[i].split('_')[1]] = $("#"+_ids[i]).val();
        }
        alert(JSON.stringify(content_payload));
        $("#content_addition_modal").modal('toggle');
    });
    function adjust_wrappers(){
        var _h1 = parseInt($('.game_input_wrapper').css('height').match('\\d+'));
        var _h2 = parseInt($('.class_display_wrapper').css('height').match('\\d+'));
        if (_h1 > _h2){
            $('.class_display_wrapper').css('height', _h1.toString()+'px');
        }
        else{
            $('.game_input_wrapper').css('height', _h2.toString()+'px');
        }
    }
    adjust_wrappers();
    $('.class_display_wrapper').on('click', '.action_box', function(){
        var _id = $(this).data('classid');
        if ($(this).prop('class').match('selected_class')){
            $(this).attr('class', 'action_box');
            $(this).html('<i class="fas fa-plus" style="font-size:1.5em;"></i>');
            $('.outer_student_listing').html("<div class='add_class_prompt'>Please select a class</div>");
            adjust_wrappers();
        }
        else{
            var ref = $(this);
            $('.action_box').each(function(){
                $(this).attr('class', 'action_box');
                $(this).html('<i class="fas fa-plus" style="font-size:1.5em;"></i>');  
            });
            ref.attr('class', 'action_box selected_class');
            ref.html('<i class="fas fa-check" style="font-size:1.5em;"></i>');
            var _data = $("#classcard"+_id).data('payload');
            var _students = _data.students;
            $('.outer_student_listing').html('');
            for (var i in _students){
                var _html = `
                <div class='student_listing'>
                            <table style='width:100%'>
                                <tr>
                                    <td style='width:60%'><div class='student_name' id='student_name${_students[i].classid}' data-userid='${parseInt(_students[i].id)}'>${_students[i].name}</div></td>
                                    <td class='student_role_select' id='student${_students[i].classid}'>
                                        <table>
                                            <tr>
                                                <td id='protester${_students[i].classid}'><span class='protester_role role_option' data-sid='${_students[i].classid}'>Protester</span></td>
                                                <td id='police${_students[i].classid}'><span class='police_role role_option' data-sid='${_students[i].classid}'>Police</span></td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                        </div>
                        <div style='height:10px'></div>
                `
                $('.outer_student_listing').append(_html);
                adjust_wrappers();
            }

        }
    });
});