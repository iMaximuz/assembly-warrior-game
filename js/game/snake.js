class Snake{

    constructor(scene, grid, args){
        if(!args) args = {};
        
        this.bodyColor = args['bodyColor'] || new THREE.Color(0xffffff);
        this.geometry = args['geometry'] || new THREE.BoxGeometry(1,1,1);
        this.material = args['material'] || new THREE.MeshLambertMaterial({color: this.bodyColor});
        this.defaultMesh = args['defaultMesh'] || new THREE.Mesh(this.geometry, this.material);
        let headMeshAsync = args['headMesh'];
        this.mesh = this.defaultMesh.clone();
        this.bodymesh = this.defaultMesh.clone();
        
        let pos = args['position'] || new THREE.Vector3(0, 0, 0);
        this.mesh.position.copy(pos);
        
        if(headMeshAsync) {
            if(headMeshAsync instanceof AsyncMesh) {
                headMeshAsync.subscribe((asyncMesh) => { this._onMeshLoad(asyncMesh); });
                //this, '_onMeshLoad');
            }
        }

        this.grid = grid;
     
        this.scene = scene;
        this.scene.add(this.mesh);
        
        this.history = [];
        if(args['length']){
            for(let i = 0; i < args['length']; i++)
                this.grow();
        }
        
        this.velocity = args['velocity'] || new THREE.Vector3(0, 0, 1);
        this.position = this.mesh.position;
        
        this.elapsed = 0;
        this.tick = args['tick'] || 1;

        this.playerId = args['playerId'] || 0;
        this.isAlive = true;
        this.jumping = false;
        this.onAirCount = 0;
        this.score = 0;
    }

    _onMeshLoad(asyncMesh) {
        this.scene.remove(this.mesh);
        let newMesh = asyncMesh.getClone();
        newMesh.scale.set(0.2, 0.2, 0.2);
        newMesh.position.copy(this.mesh.position);
        newMesh.rotation.copy(this.mesh.rotation);
        this.mesh = newMesh;
        this.position = this.mesh.position;
        this.scene.add(this.mesh);
    }

    input(input){

        if (input.pressed('Left')) {
            this.rotateDir(90);
            input.pressed('Left', false);
        }
        
        if (input.pressed('Right')) {
            this.rotateDir(-90);
            input.pressed('Right', false);
        }

        if (input.pressed('Jump')) {
            this.jumping = true;
            //input.pressed('Jump', false);
        }else{
            this.jumping = false;
        }

        if (input.pressed('Grow')) {
            this.grow();
        }
    }

    update(time){
        this.elapsed += time.deltaTime;
        if(this.elapsed >= this.tick){
            this.addScore( Math.ceil(Math.random() * 2) );
            this.elapsed = 0;
            let scaleRange = {
                max: 0.9,
                min: 0.3
            }
            let scaleStep = scaleRange.max / this.history.length;
            let scale = scaleStep;
            for (let i = 0; i < this.history.length - 1; i++) {
                let next = this.history[i + 1];
                this.history[i].position.copy(next.position);
                this.history[i].isNew = false;
                if (scale >= scaleRange.min)
                    this.history[i].scale.set(scale, scale, scale);
                else
                    this.history[i].scale.set(scaleRange.min, scaleRange.min, scaleRange.min);
                scale += scaleStep;
            }
            if(this.history.length > 0){
                let first = this.history[this.history.length - 1];
                first.position.copy(this.position);
                first.scale.set(scaleRange.max, scaleRange.max, scaleRange.max);
            }

            let vel = this.velocity.clone();
            vel.multiplyScalar(this.grid.cellSize);
            this.position.add(vel);
            if (this.jumping && this.onAirCount < 4){
                this.position.y = this.grid.half_cellSize * 3;
                this.onAirCount++;
            }else{
                this.onAirCount = 0;
                this.position.y = this.grid.half_cellSize;
            }
            
            let gridSize = this.grid.gridSize;
            this.position.x = (this.position.x + gridSize) % gridSize;
            this.position.z = (this.position.z + gridSize) % gridSize;

            /*if (this.intersects(this))
                this.onIntersectItself();
                */
        }
    }

    addScore(points){
        this.score += points;
    }

    eat(food){
        let gridPosition = this.grid.worldToGrid(this.position);
        let distance = gridPosition.distanceTo(food);
        if(distance == 0) {
            this.grow();
        }
        return distance == 0;
    }

    grow(){
        let body = this.bodymesh.clone();
        body.position.copy(this.mesh.position);
        body.isNew = true;
        this.scene.add(body);
        this.history.push(body);
    }

    deleteHistory(){
        for(let body of this.history){
            this.scene.remove(body);
        }
        this.history = [];
    }

    intersects(snake){
        let result = false;
        let gridPosition = this.grid.worldToGrid(this.position);
        for(let bodyPart of snake.history){
            let bodyInGrid = this.grid.worldToGrid(bodyPart.position);
            let distance = gridPosition.distanceTo(bodyInGrid);
            if(distance == 0 && !bodyPart.isNew )
                result = true;
        }
        if(snake != this){
            let otherHead = this.grid.worldToGrid(snake.position);
            let distance = gridPosition.distanceTo(otherHead);
            if (distance == 0)
                result = true;
        }
        return result;
    }

    rotateDir(angle){
        let axis = new THREE.Vector3(0, 1, 0);
        this.velocity.applyAxisAngle(axis, THREE.Math.degToRad(angle));
        this.mesh.rotation.y += THREE.Math.degToRad(angle);
    }

    get alive(){
        return this.isAlive;
    }

    set alive(value){
        this.isAlive = value;
        if(!this.isAlive)
            this.deleteHistory();
    }

}