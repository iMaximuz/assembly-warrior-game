
class Player {
	constructor(scene, world, args) {

		this.playerId = args['playerId'] || 0;

		this.geometry = args['geometry'] || new THREE.BoxGeometry(1,1,1);
        this.material = args['material'] || new THREE.MeshLambertMaterial({color: new THREE.Color(0xffffff)});
		this.defaultMesh = args['defaultMesh'] || new THREE.Mesh(this.geometry, this.material);
		this.asyncMesh = args['asyncMesh'];

		this.physicsMaterial = args['physicsMaterial'];

		
		
		this.mesh = this.defaultMesh.clone();
		this.world = world;
		this.scene = scene;
		this.scene.add(this.mesh);

		this.velocity = new THREE.Vector3(0, 0, 0);
		this.mesh.position.set(0, 1, 0);
		this.tick = 0.0;
		this.elapsed = 0;

		/*
		this.body = this.calculatePhysicalBody();
		this.helper = new THREE.BoxHelper(this.mesh, 0xff0000);
		this.helper.update();
		this.body.helper = this.helper;
		this.scene.add(this.helper);
		this.body.mesh = this.mesh;
		this.world.addBody(this.body);
		*/

		this.shouldUpdateEmitter = false;

		this.emitters = [];



		this.hp = 100;

		if(this.asyncMesh){
			this.asyncMesh.subscribe((asyncMesh) => {
				let newMesh = asyncMesh.getClone();
				newMesh.position.copy(this.mesh.position);
				this.scene.remove(this.mesh);
				this.mesh = newMesh;
				this.mesh.scale.set(0.2, 0.2, 0.2);
				this.mesh.position.y = -1.2;
				this.scene.add(this.mesh);

				/*if(!this.body) {
					this.world.remove(this.body);
					this.scene.remove(this.helper);
				}*/

				this.body = this.calculatePhysicalBody();
				let helper = new THREE.BoxHelper(this.mesh, 0xff0000);
				helper.update();
				this.body.helper = helper;
				//this.scene.add(helper);
				this.body.mesh = this.mesh;
				this.world.addBody(this.body);

				this.body.addEventListener("collide", (e) => {
					let emitter = new ParticleSystem(50, 5);
					this.emitters.push( emitter);
					emitter.position.copy(this.mesh.position);
					emitter.spawn();
					this.scene.add(emitter.root);
					this.hp -= 1;
				});
			});
		}



	}

	calculatePhysicalBody(){
		//this.mesh.geometry.computeBoundingBox();
		let box = new THREE.Box3().setFromObject(this.mesh);//this.mesh.geometry.boundingBox;
		let boundinBox = new CANNON.Box(new CANNON.Vec3(
			(box.max.x - box.min.x) / 2,
			(box.max.y - box.min.y) / 2,
			(box.max.z - box.min.z) / 2
		));
		let body = new CANNON.Body({
			mass: 50,
			material: this.physicsMaterial
		});
		body.linearDamping = 0.95;
		body.angularDamping = 0.8;
		body.addShape(boundinBox);
		body.position.copy(this.mesh.position);
		body.computeAABB();
		return body
	}

	input(input) {
		let componenSpeed = 900;
		if(this.body){
			if (input.pressed('Left')) {
				this.velocity.add(new THREE.Vector3(-componenSpeed, 0, componenSpeed));
			}
			
			if (input.pressed('Right')) {
				this.velocity.add(new THREE.Vector3(componenSpeed, 0, -componenSpeed));
			}

			if (input.pressed('Forward')) {
				this.velocity.add(new THREE.Vector3(-componenSpeed, 0, -componenSpeed));

			}else{
				this.jumping = false;
			}

			if (input.pressed('Back')) {
				this.velocity.add(new THREE.Vector3(componenSpeed, 0, componenSpeed));
			}
			/*
			this.body.velocity.x = this.velocity.x;
			this.body.velocity.z = this.velocity.z;
			*/
			this.body.applyForce(this.velocity, this.body.position);
			this.velocity.set(0, 0, 0);
		}
	}

	update(time) {
		if(this.body){
			if(this.body.velocity.lengthSquared() > 2) {
				let angle = Math.PI/2 - Math.atan2(this.body.velocity.z, this.body.velocity.x);
				this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), angle);
			}
			this.mesh.quaternion.copy(this.body.quaternion);
			this.mesh.position.set(this.body.position.x, this.body.position.y - 2.0, this.body.position.z);
			this.body.helper.update();


			for(var i = this.emitters.length - 1; i >= 0; i--) {
				let emitter = this.emitters[i];
				if(emitter.alive){
					emitter.update(time);
					emitter.position.copy(this.mesh.position);
				}
				else { 
					this.scene.remove(emitter.root);
					this.emitters.splice(i, 1);
				}
			}
		}
	}
}