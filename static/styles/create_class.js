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
    $('.new_class_wrapper').on('click', '.create_class_button', function(){
        $(".submission_form").submit();
    });
    $('input[type="file"]').change(function(e){
        var _extensions = {'csv':'<i class="fas fa-file-csv"></i>', 'xlsx':'<i class="fas fa-file-excel"></i>', 'docx':'<i class="fas fa-file-word"></i>', 'doc':'<i class="fas fa-file-word"></i>'};
        var _final = '<i class="fas fa-file"></i>';
        var fileName = e.target.files[0].name;
        var _extension = fileName.split('.')[1];
        if (_extension in _extensions){
            _final = _extensions[_extension];
        }
        //alert('The file "' + fileName +  '" has been selected.');
        var _html = `
        <div style="height:10px"></div>
        <div class='filename_display'>
            <table style='width:100%'>
                <tr>
                    <td style='width:10%'>${_final}</td>
                    <td style='width:70%'>${fileName}</td>
                    <td style='width:20%'></td>
                </tr>
            </table>
            
        </div>
        `;
        $('.file_selected_wrapper').append(_html);
    });
});