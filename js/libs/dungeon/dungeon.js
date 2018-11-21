const TILE_SIZE = 20;
const LIGHT_LEVELS = 7;
const LIGHTNESS_STEP = 100 / LIGHT_LEVELS;

class DungeonTile {
	constructor(x, y, index, isRoom) {
		this.pos = createVector(x, y);
		this.index = index;
		this.isRoom = isRoom;
		this.hasLight = false;
		this.lightLevel = 1;
		this.isWall = false;
		this.color;
	}

	get neighborPositions() {
		return {
			up: 	{ x: this.pos.x, 		y: this.pos.y - 1 },
			right: 	{ x: this.pos.x + 1, 	y: this.pos.y },
			down: 	{ x: this.pos.x, 		y: this.pos.y + 1 },
			left: 	{ x: this.pos.x - 1, 	y: this.pos.y },
		}
	}
}

class DungeonHallway {
	constructor(id, start, end, startIndex, endIndex) {
		this.id = id;
		this.start = start;
		this.end = end;
		this.rooms = {
			start: startIndex,
			end: endIndex,
			extra: []
		}
		this.color = color(randomRange(0, 360), randomRange(25, 75), LIGHTNESS_STEP * 1);
		
		if(end.y == start.y) {
			this.type = 0;
		}
		else {
			this.type = 1;
		}

		this.grid;
		this.gridRect;
	}

	foreachTile(callback) {
		if(this.gridRect){
			let startPos = this.gridRect.top_left;
			let endPos = this.gridRect.bottom_right;
			for(let i = startPos.y; i < endPos.y; i++){
				for(let j = startPos.x; j < endPos.x; j++){
					callback(this.grid.getTile(j, i));
				}
			}
		}
	}
}

class DungeonRoom {
	constructor(x, y, w, h, tileSize) {
		this.id = 0;
		this.isMain = false;
		this.rect = new Rect(x, y, w, h);
		this.tileSize = tileSize;
		this.screenPos = createVector(x * this.tileSize, y * this.tileSize);
		this.screenSize = createVector(w * this.tileSize, h * this.tileSize);
		this.color = color(randomRange(0, 360), randomRange(25, 75), LIGHTNESS_STEP * 1);
		this.grid;
		this.gridRect;
	}

	foreachTile(callback) {
		if(this.gridRect){
			let startPos = this.gridRect.top_left;
			let endPos = this.gridRect.bottom_right;
			for(let i = startPos.y; i < endPos.y; i++){
				for(let j = startPos.x; j < endPos.x; j++){
					callback(this.grid.getTile(j, i));
				}
			}
		}
	}

	draw() {
		fill(this.color);
        noStroke();
		rect(this.screenPos.x, this.screenPos.y, this.screenSize.x, this.screenSize.y);
	}

	get sizeRatio(){
		let ratio = 0;
		if(this.rect.height > this.rect.width)
			ratio = this.rect.height / this.rect.width; 
		else
			ratio = this.rect.width / this.rect.height; 
		return ratio;
	}

	get area(){
		return this.rect.width * this.rect.height;
	}
}

class Dungeon {
	constructor(width, height) {
		this.width = width;
		this.height = height;

		this.rooms = [];
		this.mainRooms = [];
		this.hallways = [];
		this.lightTiles = [];
		this.wallTiles = [];

		this.debug_info = {
			connections: [],
			triangles: [],
			enable: false,
		}

		this.spawnTiles = [];

		this.bounds;
		this.grid; //= new Grid(this.width, this.height);

		this.properties = {
			circleLayout: {
				enable: true,
				radious: this.height * 0.5,
			},
			extraConnections: 3,
			maxRandomAttempts: 50
		}

		this._cached = {
			nextRoomId: 0,
			nextHallwayId: 0
		}


	}

	generate(minRoomSize, maxRoomSize, hallwaySize) {
		const roomCount = 100;
		let placedRooms = this._placeRooms(minRoomSize, maxRoomSize, roomCount);

		this.mainRooms = this._calculateMainRooms(placedRooms, 1.25);
		let connections = this._connectRooms(this.mainRooms, this.properties.extraConnections);
		this.debug_info.connections = connections;

		this.hallways = this._generateHallways(this.mainRooms, connections);
		this.rooms = this.mainRooms.concat( this._intersectRooms(placedRooms.rooms, this.hallways) );

		this.bounds = this._calculateDungeonBounds(this.rooms);

		this.grid = new GridArray(this.bounds.width, this.bounds.height);

		this._carveGrid(this.grid, this.bounds, hallwaySize);
		this._placeLightsAndWalls(this.grid, 8);
		this._propagateLights(this.grid, this.lightTiles);
	}

	draw(tileSize){
		if(this.debug_info.enable){
			fill(255, 0, 0);
			for(let room of this.rooms){
				room.draw();
			}

			stroke(0,  255, 255);
			strokeWeight(2);
			
			for(let hallway of this.hallways){
				stroke(0,  255, 255);
				strokeWeight(2);
				line(hallway.start.x * TILE_SIZE, hallway.start.y * TILE_SIZE, hallway.end.x * TILE_SIZE, hallway.end.y * TILE_SIZE);
			}
			
			for(let connection of this.debug_info.connections){
				stroke(0,  255, 0);
				let v1 = this.mainRooms[connection[0]].rect.center;
				let v2 = this.mainRooms[connection[1]].rect.center;
				line(v1.x * TILE_SIZE, v1.y * TILE_SIZE, v2.x * TILE_SIZE, v2.y * TILE_SIZE);
			}
			for(let reachedRoom of this.mainRooms){
				ellipse(reachedRoom.rect.center.x * TILE_SIZE, reachedRoom.rect.center.y * TILE_SIZE, 10, 10);
			}

			noFill();
			stroke(255);
			strokeWeight(5);
			rect(this.bounds.pos.x * TILE_SIZE, this.bounds.pos.y * TILE_SIZE, this.bounds.width * TILE_SIZE, this.bounds.height * TILE_SIZE);
		}

		noStroke();
		for(let tile of this.grid.tiles) {
			//stroke(255, 255, 255);
			//strokeWeight(1);
			
			if(tile != 0) {
				if(tile.isRoom){
					let room = this.rooms[tile.index];
					fill(room.color.levels[0], room.color.levels[1], tile.lightLevel * LIGHTNESS_STEP);
				}
				else{
					let hallway = this.hallways[tile.index];
					fill(hallway.color.levels[0], hallway.color.levels[1], tile.lightLevel * LIGHTNESS_STEP);
				}
				if(tile.isWall){
					fill(120, 100, 0);
				}
				/*if(tile.hasLight){
					fill(120, 100, 50);
				}*/

				rect(tile.pos.x * TILE_SIZE, tile.pos.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
			}
		}

	}

	get _nextRoomId() {
		let result = this._cached.nextRoomId++;
		return result;
	}

	get _nextHallwayId() {
		let result = this._cached.nextHallwayId++;
		return result;
	}

	_placeRooms(minRoomSize, maxRoomSize, maxRoomCount){
		let placedRooms = 0;
		let attempts = 0;
		let center = createVector(this.width * 0.5, this.height * 0.5);
		let sizeSum = 0;

		let rooms = [];

		while(placedRooms < maxRoomCount) { 
			let room;
			let w = Math.floor( randomRange(minRoomSize, maxRoomSize) );
			let h = Math.floor( randomRange(minRoomSize, maxRoomSize) );
			if(this.properties.circleLayout.enable) {
				let point = randomPointAtCircle(center.x, center.y, this.properties.circleLayout.radious );
				point.x = Math.floor(point.x);
				point.y = Math.floor(point.y);
				room = new DungeonRoom(point.x, point.y, w, h, TILE_SIZE);
			}
			else{	
				let x = Math.floor( randomRange(1, this.width - w - 1) + 1 );
				let y = Math.floor( randomRange(1, this.height - h - 1) + 1 );
				room = new DungeonRoom(x, y, w, h, TILE_SIZE);		
			}
			let valid = true;
			for(let placedRoom of rooms){
				if(placedRoom.rect.intersectsOrTouches(room.rect)){
					valid = false;
					break;
				}
			}

			if(valid){
				rooms.push(room);
				sizeSum += room.area;
				placedRooms++;
				attempts = 0;
			} else {
				attempts++;
			}

			if(attempts > this.properties.maxRandomAttempts){
				attempts = 0;
				placedRooms++;
			}
		}
		let sizeMean = sizeSum / rooms.length;		
		// get main rooms and mark them as unreached
		for(let room of rooms){
			if(room.area > (sizeMean * 1.25)){
				this.mainRooms.push(room);
			}
		}

		return {rooms, sizeMean};
	}

	_calculateMainRooms(placedRooms, meanWeight){
		let mainRooms = [];

		let index = 0;
		for(let room of placedRooms.rooms) {
			if(room.area >= (placedRooms.sizeMean * meanWeight)){
				room.id = this._nextRoomId;
				room.isMain = true;
				mainRooms.push(room);
			}
		}

		return mainRooms;
	}

	_connectRooms(rooms, extraConnections) {
		let unreached = [];
		for(let i = 0; i < rooms.length; i++){
			unreached.push(i);
		}
		let reached = [];

		reached.push(unreached[0]);
		unreached.splice(0, 1);


		let connections = [];
		let vertices = [];
		while(unreached.length > 0) {
			let record = 100000;
			let rIndex = 0;
			let uIndex = 0;
			for(let i = 0; i < reached.length; i++) {
				for(let j = 0; j < unreached.length; j++) {
					let v1 = rooms[reached[i]].rect.center;
					let v2 = rooms[unreached[j]].rect.center;
					let d = dist(v1.x, v1.y, 0, v2.x, v2.y, 0);
					if( d < record) {
						record = d;
						rIndex = i;
						uIndex = j;
					}
				}
			}
	
			let reachedRoom = rooms[unreached[uIndex]];
			reached.push(unreached[uIndex]);
			vertices.push([reachedRoom.rect.center.x, reachedRoom.rect.center.y]);
			unreached.splice(uIndex, 1);

			connections.push([reached[rIndex], reached[reached.length-1]]);
		}

		let triangles = Delaunay.triangulate(vertices);
		this.debug_info.triangles = triangles;

		// generate extra connections using Delaunay Triangulation
		let newConnections = 0;
		let attempts = 0;
		while(newConnections < extraConnections) {
			let randomEdgeIndex = Math.floor(randomRange(0, triangles.length - 1));
			let roomIndex = triangles[randomEdgeIndex];
			let connectedRoomIndex = triangles[randomEdgeIndex + 1];
	
			connections.push([roomIndex, connectedRoomIndex]);
			newConnections++;	
		}

		return connections;
	}

	_generateHallways(rooms, connections){

		// Generate hallways with random L shapes, using midpoints between room centers.
		let hallways = [];
		const boundsDeadZone = 2;
		for(let i = 0; i < rooms.length; i++) {
			for(let connection of connections){
				if(connection[0] == i || connection[1] == i){
					let A = rooms[connection[0]];
					let B = rooms[connection[1]];

					let dir = p5.Vector.sub(B.rect.center, A.rect.center);
					let midpoint = createVector((B.rect.center.x + A.rect.center.x) / 2, (B.rect.center.y + A.rect.center.y) / 2);
					midpoint.x = Math.floor(midpoint.x);
					midpoint.y = Math.floor(midpoint.y);

					if( A.rect.isWithinXBounds(midpoint, boundsDeadZone) && B.rect.isWithinXBounds(midpoint, boundsDeadZone) ) {
						let start = createVector(midpoint.x, midpoint.y > A.rect.center.y ? Math.floor(A.rect.bottom_left.y) : Math.floor(A.rect.top_left.y));
						let end = createVector(midpoint.x, midpoint.y > B.rect.center.y ? Math.floor(B.rect.bottom_left.y) : Math.floor(B.rect.top_left.y));

						hallways.push(new DungeonHallway(this._nextHallwayId, start, end, connection[0], connection[1]));
					}
					else if (A.rect.isWithinYBounds(midpoint, boundsDeadZone) && B.rect.isWithinYBounds(midpoint, boundsDeadZone)) {
						let start = createVector(midpoint.x > A.rect.center.x ? Math.floor(A.rect.top_right.x) : Math.floor(A.rect.top_left.x), midpoint.y);
						let end = createVector(midpoint.x > B.rect.center.x ? Math.floor(B.rect.top_right.x) : Math.floor(B.rect.top_left.x), midpoint.y);
							
						hallways.push(new DungeonHallway(this._nextHallwayId, start, end, connection[0], connection[1]));
					}else{
						let randLshape = Math.round(Math.random());
						let start = A.rect.center.copy();
						let end = B.rect.center.copy();
						let joint = randLshape == 0 ? createVector(A.rect.center.x, B.rect.center.y) : createVector(B.rect.center.x, A.rect.center.y);
						hallways.push(new DungeonHallway(this._nextHallwayId, start, joint, connection[0], connection[1]));
						hallways.push(new DungeonHallway(this._nextHallwayId, joint, end, connection[0], connection[1]));
					}
				}
			}
		}
		return hallways;
	}

	_intersectRooms(rooms, hallways){
		let dungeonRooms = [];
		for(let room of rooms) {
			if(!room.isMain) {
				for(let hallway of hallways) {
					if(room.rect.intersectsLine(hallway.start, hallway.end)) {
						//room.color = color(randomRange(0, 360), randomRange(25, 75), randomRange(0, 100));
						room.id = this._nextRoomId;
						hallway.rooms.extra.push(room.id);
						dungeonRooms.push(room);
					}
				}
			}
		}
		return dungeonRooms;
	}

	_calculateDungeonBounds(rooms) {
		let min = createVector(100000, 100000);
		let max = createVector(-100000, -100000);
		for(let room of rooms) {
			min.x = Math.min(room.rect.top_left.x, min.x);
			max.x = Math.max(room.rect.top_right.x, max.x);
			
			min.y = Math.min(room.rect.top_left.y, min.y);
			max.y = Math.max(room.rect.bottom_left.y, max.y);
		}
		return new Rect(min.x - 2, min.y - 2, max.x - min.x + 4, max.y - min.y + 4);
	}

	_carveGrid(grid, dungeonBounds, hallwayStroke) {
		const offset = dungeonBounds.pos;

		for(let roomIndex = 0; roomIndex < this.rooms.length; roomIndex++) {
			let room = this.rooms[roomIndex];
			let realPos = p5.Vector.sub(room.rect.pos, offset);
			let limitW = Math.min(grid.width, realPos.x + room.rect.width);
			let limitH = Math.min(grid.height, realPos.y + room.rect.height);
			room.grid = grid;
			room.gridRect = new Rect(realPos.x, realPos.y, room.rect.width, room.rect.height);
			room.gridRect.foreachPoint((x, y) => {
				let newTile = new DungeonTile(x, y, roomIndex, true);
				grid.setTile(x, y, newTile);
			});
		}

		for(let hallwayIndex = 0; hallwayIndex < this.hallways.length; hallwayIndex++) {
			let hallway = this.hallways[hallwayIndex];

			let even = (hallwayStroke % 2) == 0;
			let stroke = Math.floor(hallwayStroke * 0.5);
			let minX = Math.floor(Math.min(hallway.start.x - offset.x, hallway.end.x - offset.x));
			let maxX = Math.floor(Math.max(hallway.start.x - offset.x, hallway.end.x - offset.x));
			let minY = Math.floor(Math.min(hallway.start.y - offset.y, hallway.end.y - offset.y));
			let maxY = Math.floor(Math.max(hallway.start.y- offset.y, hallway.end.y - offset.y));
	
			let startX;
			let startY;
			let endX;
			let endY;
	
			if(minX != maxX) {
				startX = minX;
				endX = Math.min(grid.width, maxX);
				startY = minY - stroke;
				endY = Math.min(grid.height, maxY + stroke + (even ? 0 : 1));
			} else {
				startX = minX - stroke;
				endX =  Math.min(grid.width, maxX + stroke + (even ? 0 : 1));
				startY = minY;
				endY = Math.min(grid.height, maxY);	
			}
		
			hallway.grid = grid;
			hallway.gridRect = new Rect(startX, startY, endX - startX, endY - startY);

			hallway.gridRect.foreachPoint((x, y) => {
				let tile = grid.getTile(x, y);
				if(tile == 0){
					grid.setTile(x, y, new DungeonTile(x, y, hallwayIndex, false));
				}
			});
		}

	}

	_placeLight(grid, tile) {
		let neighbors = tile.neighborPositions;

		let neighborHasLight = false;
		let wallCount = 0;
		for(let direction in neighbors) {
			let pos = neighbors[direction];
			let neighborTile = grid.getTile(pos.x, pos.y);
			if( neighborTile == 0 || neighborTile.isWall)  {
				wallCount++;
				break;
			}
			else {
				if(neighborTile.hasLight){
					neighborHasLight = true;
					break;
				}
			}
		}

		fill(0, 255, 0);
		if(!neighborHasLight && wallCount > 0) {
			tile.hasLight = true;
			this.lightTiles.push(tile);
		}
	}

	_placeWallArroundTile(grid, tile) {
		let tileBounds = new Rect(tile.pos.x - 1, tile.pos.y - 1, 3, 3);
		tileBounds.foreachPoint((x, y) => {
			let neighborTile = grid.getTile(x, y);
			if( neighborTile == 0 )  {
				neighborTile = new DungeonTile(x, y, tile.index, tile.isRoom);
				neighborTile.isWall = true;
				grid.setTile(x, y, neighborTile);
				this.wallTiles.push(neighborTile);
			}
		});
	}

	_placeLightsAndWalls(grid, spacing) {
		for(let room of this.rooms) {
			room.foreachTile(tile => {
				if(tile.pos.x == room.gridRect.top_left.x || tile.pos.x == room.gridRect.bottom_right.x - 1) {
					if(((tile.pos.y - room.gridRect.top_left.y) % spacing) == 0) {
						this._placeLight(grid, tile);
					}
					this._placeWallArroundTile(grid, tile);
				}
				if(tile.pos.y == room.gridRect.top_left.y || tile.pos.y == room.gridRect.bottom_right.y - 1) {
					if( ((tile.pos.x - room.gridRect.top_left.x) % spacing) == 0){
						this._placeLight(grid, tile);
					}
					this._placeWallArroundTile(grid, tile);
				}
			})
		}

		for(let hallway of this.hallways) {
			hallway.foreachTile(tile => {
				if(hallway.type == 0){
					if(tile.pos.y == hallway.gridRect.top_left.y || tile.pos.y == hallway.gridRect.bottom_right.y - 1) {
						if( ((tile.pos.x - hallway.gridRect.top_left.x) % spacing) == 0){
							this._placeLight(grid, tile);
						}
					}
					this._placeWallArroundTile(grid, tile);

				} else if( hallway.type == 1 ){
					if(tile.pos.x == hallway.gridRect.top_left.x || tile.pos.x == hallway.gridRect.bottom_right.x - 1) {
						if(((tile.pos.y - hallway.gridRect.top_left.y) % spacing) == 0) {
							this._placeLight(grid, tile);
						}
					}
					this._placeWallArroundTile(grid, tile);
				}
			});
		}
	}

	_propagateLights(grid, lightTiles) {
		for(let tile of lightTiles) {
			this._floodFillLightLinear(grid, tile, LIGHT_LEVELS);
			//this._floodFillLightRadial(grid, tile, LIGHT_LEVELS)
		}
	}

	_floodFillLightLinear(grid, tile, level) {
		if(level == 0) return;
		let neighbors = {
			up: 	grid.getTile(tile.pos.x, 	tile.pos.y - 1),
			right: 	grid.getTile(tile.pos.x + 1, tile.pos.y),
			down: 	grid.getTile(tile.pos.x, tile.pos.y + 1),
			left: 	grid.getTile(tile.pos.x - 1, tile.pos.y),
		}

		for(let direction in neighbors) {
			let neighbor = neighbors[direction];
			if(neighbor != 0 && !neighbor.isWall) {
				if(neighbor.lightLevel < level - 1)
					this._floodFillLightLinear(grid, neighbor, level - 1);
			}
		}

		tile.lightLevel = level;
	}

	_floodFillLightRadial(grid, origin, level) {
		if(level <= 0) return;

		let even = (level % 2) == 0; 
		let rad = even ? level * 0.5 : (level - 1) * 0.5;

		let lightbounds = new Rect(origin.pos.x - rad, origin.pos.y - rad, even ? level + 1 : level, even ? level + 1 : level);
		let lightLevel = level;
		lightbounds.foreachPoint((x, y) => {
			let neighbor = grid.getTile(x, y);
			if(neighbor && neighbor != 0 && !neighbor.isWall) {
				if(origin != neighbor){
					let distance = dist(origin.pos.x, origin.pos.y, origin.pos.z, neighbor.pos.x, neighbor.pos.y, neighbor.pos.z);
					lightLevel = Math.floor(level - distance);
					if(neighbor.lightLevel < lightLevel) {
						neighbor.lightLevel = lightLevel;
					}
				}
				else{
					origin.lightLevel = level;
				}
			}
		});
	}

	generateSpawnTiles(count){
		for(let i = 0; i < count; i++) {
			let randomRoomIndex = Math.floor(randomRange(0, this.mainRooms.length-1));
			let randomRoom = this.mainRooms[randomRoomIndex];
			let center = randomRoom.gridRect.center.copy();
			this.spawnTiles.push(this.grid.getTile(Math.floor(center.x), Math.floor(center.y)));
		}
		return this.spawnTiles;
	}

}
