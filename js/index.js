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

    $('#btnHighScores').click(() => {
        showModal(highscoresModal);
        $.ajax({
            url: "https://snakignarround.000webhostapp.com/webservice/service.php",
            type: "post",
            data: {
                action: 'leaderboard'
            },
            success: function (response) {
                console.log(response)
                let data = JSON.parse(response);
                populateLeaderboard(data);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log(textStatus, errorThrown);
            }
        });
    })

    $('#btnShare').click(() => {

        let screenshotArea = $('body')[0];
        html2canvas(screenshotArea, {
            background: '#ffffff'
        }).then(function(canvas) {
            var imgData = canvas.toDataURL('image/jpeg');
            $.ajax({
                url: '../webservice/save.php',
                type: 'post',
                dataType: 'text',
                data: {
                    base64data: imgData
                },
                success: function(response){
                    let twitterUrl = "https://twitter.com/intent/tweet?";
                    let text = 'Look at this crazy game!: '// + response;
                    let pageUrl = 'https://assemblywarrior.000webhostapp.com/webservice/twittercard.php?url='+response;
                    let hashtags = 'assemblywarrior,game,warrior,dungeon';

                    let fullUrl = twitterUrl + 'text=' + text + '&url=' + pageUrl + '&hashtags=' + hashtags;

                    var win = window.open(fullUrl, '_blank');
                    win.focus();
                }
            });
        });
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

    function populateLeaderboard(rows) {
        let playerList = $('#highscores');
        playerList.empty();
        for(let row of rows) {
            let totalCharacters = 29;
            let scoreString = row.score.toString();
            let dots = '.'.repeat(totalCharacters - scoreString.length);
            let element = '<li><span class="player-name">'+row.playerName+'</span><dots>'+dots+'</dots><span class="player-points">' + row.score + '</span></li>';
            playerList.append(element);
        }
    }
}

$(document).ready(start);