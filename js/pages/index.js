function start(){
    let modals = [];
    let settingsModal = $('#modalSettings');
    let highscoresModal = $('#modalHighscores');
    //let multiplayerModal = $('#modalMultiplayer');
    modals.push(settingsModal);
    modals.push(highscoresModal);
    //modals.push(multiplayerModal);

    $('.toggle-control').click((e) => {
        let self = $(e.target);
        self.toggleClass('on');
    });

    $('#btnSettings').click(() => {
        showModal(settingsModal);
    })

    $('.modal .close').click((e) => {
        let self = $(e.target);
        let modal = self.parents('.modal');
        hideModal(modal)
    })

    $('#btnPlay').click(() => {
        window.location.href = 'game.html?players=1'
    })

    $('#btnMultiplayer').click(() => {
        window.location.href = 'game.html?players=2'
        //showModal(multiplayerModal);
    })

    $('#btnHighscores').click(() => {
        showModal(highscoresModal);
    })



    //Obtener valor del setting de sonido
    $('#settingSound').click((e) => {
        let self = $(e.target);
        console.log(self.hasClass('on'));
    });    

    $(document).click((e) => {
        for(let modal of modals){
            if(e.target == modal[0]){
                hideModal(modal)      
            }
        }
    });
}

function showModal(modal) {
    modal.addClass('show');
}

function hideModal(modal){
    modal.removeClass('show');
}

$(document).ready(start)