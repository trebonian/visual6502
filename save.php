<?php

$filename = $_REQUEST['name'];
file_put_contents($filename, file_get_contents("php://input"));

function file_put_contents($filename, $data) {
	$f = @fopen($filename, 'w');
	if ($f) {
		$bytes = fwrite($f, $data);
		fclose($f);
		return $bytes;
	}

	return false;
}

?>

