<?php

$data = $_REQUEST['base64data'];
$image = explode('base64', $data);
$name = uniqid();
$dir = 'savedImages/' . $name . '.jpg';
file_put_contents($dir, base64_decode($image[1]));

$location = 'https://assemblywarrior.000webhostapp.com/webservice/';

echo $location . $dir;

?>