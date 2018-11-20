let snakeGame = 0;

function findGetParameter(parameterName) {
    let result = null;
    let tmp = [];
    location.search
        .substr(1)
        .split("&")
        .forEach(function (item) {
          tmp = item.split("=");
          if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}

function setup() {
    //p5js setup
    start();
}

function start(){


    let modals = [];
    let settingsModal = $('#modalSettings');
    modals.push(settingsModal);

    $('.toggle-control').click((e) => {
        let self = $(e.target);
        self.toggleClass('on');
    });

    $('#btnSettings').click(() => {
        showModal(settingsModal);
        snakeGame.pause()
    })

    $('.modal .close').click((e) => {
        let self = $(e.target);
        let modal = self.parents('.modal');
        hideModal(modal)
        snakeGame.unpause()
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
                snakeGame.unpause()
            }
        }
    });

    let numberPlayers = parseInt( findGetParameter('players') );
    snakeGame = new Game(numberPlayers);
    $('#canvas-section').append(snakeGame.renderer.domElement);
    
    snakeGame.onGamePaused(function () {
        console.log('callback overriden');
    });

    snakeGame.run();
}

function showModal(modal) {
    modal.addClass('show');
}

function hideModal(modal){
    modal.removeClass('show');
}

//$(document).ready(start);