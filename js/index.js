function start(){
    // Get the modal
    let modals = [];
    var settingsModal = $('#settingsModal');
    var highscoresModal = $('#highscoresModal');
    var pauseModal = $('#pauseModal');
    
    modals.push(settingsModal);
    modals.push(highscoresModal);
    modals.push(pauseModal);

    // Get the button that opens the modal
    $("#settings").click(function() {
        showModal(settingsModal);
    });

    $("#highScores").click(function() {
        showModal(highscoresModal);
    });

    // Get the <span> element that closes the modal
    $(".close").click(function(e) {
        let self = $(this);
        hideModal(self.parents('.modal'));
    });

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        for(let modal of modals){
            if (event.target == modal[0]) {
                hideModal(modal)
            }
        }
    } 

    function showModal(modal) {
        modal.addClass('show');
    }

    function hideModal(modal) {
        modal.removeClass('show');
    }

    window.onkeydown = function(e){
        if(e.keyCode == 27)
            showModal(pauseModal)
    };
}

$(document).ready(start);