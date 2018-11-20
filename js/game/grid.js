class Grid{
    constructor(cellSize, cellCount){
        this.cellSize = cellSize;
        this.half_cellSize = this.cellSize * 0.5;
        this.cellCount = cellCount;
        this.gridSize = (this.cellSize * this.cellCount);
        this.position = new THREE.Vector3(this.gridSize * 0.5, 0, this.gridSize * 0.5);
        this.gridHelper = new THREE.GridHelper(this.cellSize * this.cellCount, this.cellCount);
        this.gridHelper.position.add(new THREE.Vector3(this.gridSize * 0.5, 0, this.gridSize * 0.5))
    }

    randomPosition() {
        let randX = Math.floor(Math.random() * this.cellCount);
        let y = this.half_cellSize;
        let randZ = Math.floor(Math.random() * this.cellCount);
        let result = new THREE.Vector3(randX, y, randZ);
        result.multiplyScalar(this.cellSize);
        result.add(new THREE.Vector3(this.cellSize * 0.5, 0, this.cellSize * 0.5));
        return result;
    }

    center(){
        let result = this.position.clone();
        let half_gridSize = this.gridSize * 0.5;
        result.x = Math.floor(half_gridSize / this.cellSize);
        result.y = 0;
        result.z = Math.floor(half_gridSize / this.cellSize);
        return result;
    }

    gridToWorld(x, y, z){
        let result = this.position.clone();
        result.x = x * this.cellSize;
        result.y = y * this.cellSize;
        result.z = z * this.cellSize;
        return result;
    }

    worldToGrid(position) {
        let result = position.clone();
        
        result.x = Math.floor(result.x / this.cellSize);
        result.y = Math.floor(result.y / this.cellSize);
        result.z = Math.floor(result.z / this.cellSize);
        return result;
    }

}