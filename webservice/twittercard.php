<?php

    $url = $_REQUEST['url'];

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Assembly Warrior" />
    <meta name="twitter:description" content="Check this new game!" />
    <meta name="twitter:image" content="<?php echo $url ?>" />

    <title>Document</title>
    
</head>
<body style="padding: 0px; margin: 0px;">
    <img src="<?php echo $url ?>">
    <script type="text/javascript" >
        location.href = "https://assemblywarrior.000webhostapp.com/";
    </script>
</body>
</html>