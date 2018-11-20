function randomRange(min, max){
	return (Math.random() * (max - min)) + min;
}

function randomPointAtCircle(cx, cy, rad){
	let randomRad = randomRange(0, rad);
	let t = 2 * Math.PI * Math.random(); 
	let rx = cx + Math.cos(t) * randomRad;
	let ry = cy + Math.sin(t) * randomRad;
	return createVector(rx, ry);
}

function snapGridIndex(value, tileSize){
	return Math.floor( ((value + tileSize - 1) / tileSize) );
}


function snapGridScreen(value, tileSize){
	return Math.floor( ((value + tileSize - 1) / tileSize) ) * tileSize;
}