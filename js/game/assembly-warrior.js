class Game{
    constructor(players){
        this.viewport = new Viewport(window.innerWidth, window.innerHeight, 'PERSPECTIVE', 40);

        this.renderer = new THREE.WebGLRenderer( {alpha: true} );
        this.renderer.setClearColor(0x000000, 1);
        this.renderer.setSize(this.viewport.width, this.viewport.height);

        this.scene = new THREE.Scene();

        let self = this;

        this.camera;
        if(this.viewport.mode == 'PERSPECTIVE') {
            this.camera = new THREE.PerspectiveCamera(45, this.viewport.aspect(), this.viewport.near, this.viewport.far);
        }
        else if (this.viewport.mode == 'ORTHO') {
            this.camera = new THREE.OrthographicCamera(this.viewport.ortho.left(), this.viewport.ortho.right(), this.viewport.ortho.top(), this.viewport.ortho.bottom(), this.viewport.near, this.viewport.far);
        }

        this.viewport.onViewportResized((viewport) => {
            this.renderer.setSize(viewport.width, viewport.height);
            this.updateCamera()
        });

        this.lights = [];

        this.grid = new Grid(1, 31);

        this.camera.position.copy(this.grid.gridHelper.position);
        this.camera.position.add(new THREE.Vector3(100, 100, 100));
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));//this.grid.gridHelper.position);
        
        this.keyboard = new Keyboard();
        this.amountPlayers = players;
        this.players = [];
        this.playerControllers = [];
        this.defaultController = new InputMapping(this.keyboard);
        this.food = [];
        this.clock = new THREE.Clock();
        this.paused = false;
        
        this.onGamePauseCallback = (self) => { console.log('Game paused!'); };
        this.onGameUnpauseCallback = (self) => { console.log('Game unpaused!'); };
        this.onGameEndCallback = (self, playerId) => { console.log(`Game ended player ${playerId} won!`); };

        
        this.composer = new THREE.EffectComposer( this.renderer );
        this.composer.addPass( new THREE.RenderPass( this.scene, this.camera ) );

        // you might want to use a gaussian blur filter before
        // the next pass to improve the result of the Sobel operator
        // Sobel operator

        this.glitchPass = new THREE.GlitchPass();
        this.glitchPass.renderToScreen = true;
        //this.glitchPass.goWild = true;
        this.composer.addPass( this.glitchPass );
        this.useComposer = true;
		this.composerTimer = 0;
		



		// CANNON JS

		this.world = new CANNON.World();
		this.world.gravity.set(0, -9.82, 0); // m/s²

		this.fixedTimeStep = 1.0 / 60.0; // seconds
		this.maxSubSteps = 3;

        this.world.quatNormalizeSkip = 0;
        this.world.quatNormalizeFast = false;
        this.world.defaultContactMaterial.contactEquationStiffness = 1e7;
        this.world.defaultContactMaterial.contactEquationRelaxation = 4;
        this.world.gravity.set(0, -9.82, 0);
        this.world.solver.iterations = 20;
        this.world.solver.tolerance = 0.0;
    
        this.physicsMaterials = {
            ground: new CANNON.Material("groundMaterial"),
            wall: new CANNON.Material("wallMaterial"),
            player: new CANNON.Material("playerMaterial"),
        }
        this.contactMaterials = {
            ground_player: new CANNON.ContactMaterial(this.physicsMaterials.ground, this.physicsMaterials.player, {
                friction: 100.0,
                restitution: 0.0,
                contactEquationRelaxation: 10.0,
                frictionEquationStiffness: 10
            }),
            wall_player: new CANNON.ContactMaterial(this.physicsMaterials.wall, this.physicsMaterials.player, {
                friction: 10.0,
                restitution: 0.0,
                contactEquationRelaxation: 10.0,
                frictionEquationStiffness: 1
            }),
        }
        this.world.addContactMaterial(this.contactMaterials.ground_player);
        this.world.addContactMaterial(this.contactMaterials.wall_player);


        // AUDIO

        // create an AudioListener and add it to the camera
        var listener = new THREE.AudioListener();
        this.camera.add( listener );

        // create a global audio source
        var sound = new THREE.Audio( listener );

        // load a sound and set it as the Audio object's buffer
        var audioLoader = new THREE.AudioLoader();
        audioLoader.load( '../assets/songs/Diablo-2-rogue.ogg', function( buffer ) {
            sound.setBuffer( buffer );
            sound.setLoop( true );
            sound.setVolume( 0.2 );
            sound.play();
        });

    }

    allObjectsLoaded(){
        for(let prop in this.models){
            let model = this.models[prop];
            if(Array.isArray(model)){
                for(let obj of model){
                    if(!obj.mesh) return false;
                }
            }
            else{
                if(!model.mesh) return false;
            }
        }
        return true;
    }

    run() {
        this.start();
        this._animationLoop(this.gameLoop);
    }

    gameLoop( time ){
        this.input();
        if(!this.paused){
            this.update( time );
        }
        this.render();
    }

    start(){
        let self = this;
		
		this.models = {
			player: new AsyncMesh('../assets/warriors/', 'general_posed', false),
			enemy: new AsyncMesh('../assets/warriors/', 'gladiator_posed', false)
		};

        this.lights = [
            new THREE.AmbientLight(0xffffff, 0.2),
            //new THREE.DirectionalLight(0xffffff, 1.0),
        ];

        //this.lights[1].position.set(1, 0.8, 0.5);        

        /*let axesHelper = new THREE.AxesHelper(5);
		this.scene.add(axesHelper);*/
		
		const minRoomSize = 5;
		const maxRoomSize = 15;
		const hallwayStroke = 3;
		const cellCountH = Math.floor(1000 / TILE_SIZE);
		const cellCountV = Math.floor(1000 / TILE_SIZE);
		
		this.dungeon = new Dungeon(cellCountH, cellCountV);
		this.dungeon.generate(minRoomSize, maxRoomSize, hallwayStroke);

		let geometry = new THREE.BoxGeometry(1, 1, 1);
		let material = new THREE.MeshLambertMaterial({color: new THREE.Color(0xffffff)});
		let defaultMesh = new THREE.Mesh(geometry, material);

		//defaultMesh.position.set(0, 0, 0);
		//this.scene.add(defaultMesh);

		this.lamps = [];

		let sphereGeo = new THREE.SphereGeometry(0.3, 6, 6);
        let sphereMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xf48042)
		});

        let addKinematicObject = (mesh) => {
            let box = new THREE.Box3().setFromObject(mesh);
            let boundinBox = new CANNON.Box(new CANNON.Vec3(
                (box.max.x - box.min.x) / 2,
                (box.max.y - box.min.y) / 2,
                (box.max.z - box.min.z) / 2
            ));
            let body = new CANNON.Body({mass: 0, material: this.physicsMaterials.wall});
            body.addShape(boundinBox);
            body.position.copy(mesh.position);
            body.computeAABB();
            //body.type = CANNON.Body.STATIC;
            //body.collisionResponse = false;

            body.mesh = mesh;
            
            this.world.addBody(body);
            let helper = new THREE.BoxHelper(mesh, 0xff0000);
            helper.update();
            //this.scene.add(helper);
            body.helper = helper;
        }

		for(let tile of this.dungeon.grid.tiles) {
			if(tile != 0){
				let p5color;// = room.color;
				if(tile.isRoom) {
					let room = this.dungeon.rooms[tile.index];
					p5color = room.color;
				}
				else {
					let hallway = this.dungeon.hallways[tile.index];
					p5color = hallway.color;
				}

				let m = defaultMesh.clone();
				m.material = material.clone();
				m.material.color = new THREE.Color(`hsl(${p5color.levels[0]},${p5color.levels[1]}%, ${Math.floor(tile.lightLevel * LIGHT_LEVELS)}%)`); 
				let height = 0;
				if(tile.isWall){
					for(let i = 0; i < 3; i++) {
						let walldown = m.clone(); 
						walldown.position.copy(new THREE.Vector3(tile.pos.x, height + i, tile.pos.y));
                        this.scene.add(walldown);
                        if(i == 1)
                            addKinematicObject(walldown);
					}
				}
				else if(tile.hasLight){
					let light = new THREE.PointLight( 0xffffff, 5, 3 );
					light.position.set( tile.pos.x, height + 2, tile.pos.y );
					m.position.copy(new THREE.Vector3(tile.pos.x, height, tile.pos.y));
					this.lights.push(light);
					let lamp = new THREE.Mesh(sphereGeo, sphereMaterial);//m.material.clone());
					lamp.position.copy(m.position);
					lamp.position.y = height + 2;
					this.lamps.push({mesh: lamp, lightIndex: this.lights.length - 1});

					//this.scene.add( light );
					this.scene.add(m);
					this.scene.add(lamp);
				}
				else {
					m.position.copy(new THREE.Vector3(tile.pos.x, height, tile.pos.y));
					this.scene.add(m);
				}
				
			}
		}

        this.dungeon.generateSpawnTiles(1);

        //this.scene.add(this.grid.gridHelper);
        
		for(let model in this.models){
			this.models[model].load();
		}

		this.lightColors = [
			new THREE.Color(0xc41f1f),
			new THREE.Color(0xffee02),
		]
		this.lightColorIndex = 0;
		this.lightColorProgress = 0;



        
        //TODO: Create a configuration file to store the inputmappings of every player.
        this.playerControllers.push( new InputMapping(this.keyboard, {
            'Left': 'A',
            'Right': 'D',
            'Forward': 'W',
            'Back': 'S'
        }));

        this.playerControllers.push(new InputMapping(this.keyboard, {
            'Left': 'left',
            'Right': 'right',
			'Forward': 'up',
            'Back': 'down'
        }));

		
        for(let i = 0; i < this.amountPlayers; i++){
            let player = new Player(this.scene, this.world, {
				playerId: i,
                asyncMesh: this.models.player,
                physicsMaterial: this.physicsMaterials.player
            });
            this.players.push(player);
            let spawnIndex = i > this.dungeon.spawnTiles.length - 1 ? this.dungeon.spawnTiles.length - 1 : i;
            player.mesh.position.set(this.dungeon.spawnTiles[spawnIndex].pos.x, 1, this.dungeon.spawnTiles[spawnIndex].pos.y);
        }


        for (let light of this.lights) {
            this.scene.add(light);
        }

		// Create a plane
		var groundBody = new CANNON.Body({
            mass: 0, // mass == 0 makes the body static
            material: this.physicsMaterials.ground
		});
		var groundShape = new CANNON.Plane();
		groundBody.addShape(groundShape);
		var rot = new CANNON.Vec3(1,0,0)
		groundBody.quaternion.setFromAxisAngle(rot, -Math.PI / 2)
		groundBody.position.set(0,0,0);
		this.world.addBody(groundBody);
    }



    input(){
        for (let player of this.players) {
            let controller = this.playerControllers[player.playerId] || this.defaultController;
            player.input(controller);
        }
        if(this.keyboard.pressed('esc')){
            if(!this.paused)
                this.pause();
            else
                this.unpause();
            this.keyboard.pressed('esc', false);
        }
    }
    
    update( time ){

		this.world.step(this.fixedTimeStep, time.deltaTime, this.maxSubSteps);

        /*for(let body of this.world.bodies){
            if(body.mesh){
                body.mesh.position.copy(body.position);
                if(body.helper)
                    body.helper.update();
            }
        }*/

        if(this.composerTimer >= 2){
            this.useComposer = false;
        }else{
            this.composerTimer += time.deltaTime;
        }
		this.lamps[0].mesh.material.color.lerp(this.lightColors[this.lightColorIndex], time.deltaTime);
		this.lightColorProgress += time.deltaTime;
		if(this.lightColorProgress >= 1) {
			this.lightColorIndex = this.lightColorIndex == 0 ? 1 : 0;
			this.lightColorProgress = 0;
		}

		for(let lamp of this.lamps){
			lamp.mesh.position.y = Math.sin(time.elapsed * 5) * 0.2 + 2;
			this.lights[lamp.lightIndex].position.copy(lamp.mesh.position);
			this.lights[lamp.lightIndex].color = this.lamps[0].mesh.material.color;
		}

        for (let player of this.players) {
            player.update(time);
        }

        this.camera.position.set(this.players[0].mesh.position.x + 20, this.players[0].mesh.position.y + 20, this.players[0].mesh.position.z + 20);
        
        if(!this.winner){
            for(let player of this.players) {
                if(player.hp <= 0) {
                    if(this.players.length > 1){
                        for(let other of this.players) {
                            if(other.hp > 0) {
                                this.winner = other;
                                this.onGameEnd();
                            }
                        }
                    }
                    else{
                        this.winner = player;
                        this.onGameEnd();
                    }
                }
            }
        }

    }


    render() {
        if(!this.useComposer){
            this.renderer.render(this.scene, this.camera);
        }
        else
            this.composer.render();

    }

    updateCamera() {
        this.camera.aspect = this.viewport.aspect();
        if (this.viewport.mode == 'ORTHO') {
            this.camera.left = this.viewport.ortho.left();
            this.camera.right = this.viewport.ortho.right();
            this.camera.top = this.viewport.ortho.top();
            this.camera.bottom = this.viewport.ortho.bottom();
        }
        this.camera.updateProjectionMatrix();
    }

    onGamePaused(callback){
        if (callback) {
            this.onGamePauseCallback = callback;
        }
        else {
            this.onGamePauseCallback(this);
        }   
    }

    onGameUnpaused(callback) {
        if (callback) {
            this.onGameUnpauseCallback = callback;
        }
        else {
            this.onGameUnpauseCallback(this);
        }
    }

    onGameEnd(callback){
        if(callback){
            this.onGameEndCallback = callback;
        }else{
            this.onGameEndCallback(this, 0);
        }
    }

    pause(){
        if(!this.paused){
            this.paused = !this.paused;
            this.clock.stop();
            this.onGamePaused();
        }
    }

    unpause(){
        if(this.paused){
            this.paused = !this.paused;
            this.clock.start();
            this.onGameUnpaused();
        }
    }
    _animationLoop(callback) {
        this.clock.start();
        let elapsedTime = 0;
        let self = this;
        function _animationLoop_() {
            let dt = self.clock.getDelta();
            elapsedTime += dt;
            let time = {
                elapsed: elapsedTime,
                deltaTime: dt
            }
            self[callback.name](time);
            requestAnimationFrame(_animationLoop_);
        }
        requestAnimationFrame(_animationLoop_);
    }
}