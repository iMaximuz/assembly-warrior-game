<?php header('Access-Control-Allow-Origin: *');

$action = $_POST["action"];

switch ($action) {
    case 'leaderboard':
        leaderboard();
        break;
    case 'submit_score':
        submit_score();
        break;
    default:
        # code...
        break;
}


function connect() {
    $databasehost = "localhost";
    $databasename = "id5887441_snaking";
    $databaseuser = "id5887441_admin";
    $databasepass = "admin";

    $mysqli = new mysqli($databasehost, $databaseuser, $databasepass, $databasename);
    if ($mysqli->connect_errno) {
        echo "Problema con la conexion a la base de datos";
    }
    return $mysqli;
}

function disconnect() {
    mysqli_close();
}


function leaderboard(){
    $mysqli = connect();
		
    $result = $mysqli->query("SELECT playerName, score, submit_date FROM Scores ORDER BY score DESC");

    if (!$result) {
        echo "Problema al hacer un query: " . $mysqli->error;								
    } else {
        // Recorremos los resultados devueltos
        $rows = array();
        while( $r = $result->fetch_assoc()) {
            $rows[] = $r;
        }			
        // Codificamos los resultados a formato JSON y lo enviamos al HTML (Client-Side)
        echo json_encode($rows);
    }
    mysqli_close($mysqli);
}


function submit_score(){
    $name = $_POST["name"];
    $score = $_POST["score"];

    $mysqli = connect();
    $query = "INSERT INTO Scores(playerName, score, submit_date) VALUES('".$name."',".$score.",NOW());";
    $result = $mysqli->query($query);
    
    if (!$result) {
        echo "Problema al hacer un query: " . $mysqli->error;								
    } else {
        echo "OK";
    }
    mysqli_close($mysqli);
}

?>