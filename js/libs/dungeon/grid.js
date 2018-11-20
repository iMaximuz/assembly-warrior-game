

class GridArray {
	constructor(width, height) {
		this.width = Math.floor(width);
		this.height = Math.floor(height);
		this.tiles = new Array(width * height);
		for(let i = 0; i < height; i++){
			for(let j = 0; j < width; j++){
				this.tiles[(i * width) + j] = 0;
			}	
		}
	}

	carveRect(rect, offset){
		let realPos = p5.Vector.sub(rect.pos, offset);
		let limitW = Math.min(this.width, realPos.x + rect.width);
		let limitH = Math.min(this.height, realPos.y + rect.height);
		for(let i = realPos.y; i < limitH; i++){
			for(let j = realPos.x; j < limitW; j++){
				this.tiles[ (i * this.width ) + j] = 1; 
			}
		}
	}

	carveLine(start, end, width, offset) {

		let even = (width % 2) == 0;
		let stroke = width * 0.5;
		stroke = Math.floor(stroke);
		let minX = Math.floor(Math.min(start.x - offset.x, end.x - offset.x));
		let maxX = Math.floor(Math.max(start.x - offset.x, end.x - offset.x));
		let minY = Math.floor(Math.min(start.y - offset.y, end.y - offset.y));
		let maxY = Math.floor(Math.max(start.y- offset.y, end.y - offset.y));

		let startX;
		let startY;
		let endX;
		let endY;

		if(minX != maxX) {
			startX = minX;
			endX = Math.min(this.width, maxX);
			startY = minY - stroke;
			endY = Math.min(this.height, maxY + stroke + (even ? 0 : 1));
		}else{
			startX = minX - stroke;
			endX =  Math.min(this.width, maxX + stroke + (even ? 0 : 1));
			startY = minY;
			endY = Math.min(this.height, maxY);	
		}

		console.log(startX);

		for(let i = startY; i < endY; i++) {
			for(let j = startX; j < endX; j++)
				this.tiles[(i * this.width) + j] = 1; 
		}
		
	}

	getTile(x, y) {
		return this.tiles[(y * this.width) + x];
	}

	setTile(x, y, value) {
		return this.tiles[(y * this.width) + x] = value;
	}

	draw(tileSize){
		stroke(255, 255, 255);
		strokeWeight(1);
		noFill();
		for(let i = 0; i < this.height; i++){
			for(let j = 0; j < this.width; j++){
				let tile = this.tiles[ (i * this.width ) + j ]; 
				if(tile == 1){
					rect(j * tileSize, i * tileSize, tileSize, tileSize);
				}
			}
		}		
	}
}

