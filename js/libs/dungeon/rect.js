class Rect {
	constructor(x, y, w, h){
		this.pos = createVector(x, y);
		this.width = w;
		this.height = h;
		this.top_left = createVector(x, y);
		this.top_right = createVector(x + w, y);
		this.bottom_left = createVector(x, y + h);
		this.bottom_right = createVector(x + w, y + h);
		this.center = createVector( (this.top_left.x + this.top_right.x) * 0.5, (this.top_left.y + this.bottom_right.y) * 0.5);
	}

	intersects(other){
		return !(other.top_left.x >= this.top_right.x
			|| other.top_right.x <= this.top_left.x
			|| other.top_left.y >= this.bottom_left.y
			|| other.bottom_left.y <= this.top_left.y);
	}

	intersectsOrTouches(other){
		return !(other.top_left.x > this.top_right.x
			|| other.top_right.x < this.top_left.x
			|| other.top_left.y > this.bottom_left.y
			|| other.bottom_left.y < this.top_left.y);
	}

	intersectsLine(lineStart, lineEnd){
		if(lineStart.x > this.bottom_right.x && lineEnd.x > this.bottom_right.x) return false;
		if(lineStart.x < this.top_left.x && lineEnd.x < this.top_left.x) return false;
		if(lineStart.y > this.bottom_right.y && lineEnd.y > this.bottom_right.y) return false;
		if(lineStart.y < this.top_left.y && lineEnd.y < this.top_left.y) return false;
		return true;
	}

	isWithinXBounds(point, deadZoneSize){
		return (point.x >= (this.top_left.x + deadZoneSize) && point.x <= (this.top_right.x - deadZoneSize));
	}

	isWithinYBounds(point, deadZoneSize){
		return (point.y >= (this.top_left.y + deadZoneSize) && point.y <= (this.bottom_left.y - deadZoneSize));
	}

	foreachPoint(callback){
		for(let i = this.top_left.y; i < this.bottom_right.y; i++){
			for(let j = this.top_left.x; j < this.bottom_right.x; j++){
				callback(j, i);
			}
		}
	}
}