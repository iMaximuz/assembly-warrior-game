/*
const DEBUG_MODE = false;
const TILE_SIZE = 8;

let dungeon;

function setup() {
	createCanvas(windowWidth, windowHeight);
	clear();
	background(28,31,35);

	// place rooms arround a circle or rectangle;
	const minRoomSize = 5;
	const maxRoomSize = 15;
	const hallwayStroke = 3;
	const cellCountH = Math.floor(windowWidth / TILE_SIZE);
	const cellCountV = Math.floor(windowHeight / TILE_SIZE);
	colorMode(HSL);
	
	dungeon = new Dungeon(cellCountH, cellCountV);
	dungeon.generate(minRoomSize, maxRoomSize, hallwayStroke);

	dungeon.draw(TILE_SIZE);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function draw() {

}

function mousePressed(){
    
}

function mouseReleased(){
    
}
*/