class Food{
    constructor(scene, mesh, position) {

        this.points = 30 ;

        this.scene = scene;
        this.position = position;
        let sphereGeo = new THREE.SphereGeometry(0.5, 4, 2);
        let sphereMaterial = new THREE.MeshPhongMaterial({
            color: new THREE.Color(0xFFFFFF)
        });
        this.defaultMesh = new THREE.Mesh(sphereGeo, sphereMaterial);

        this.mesh = this.defaultMesh.clone();

        let asyncMesh = mesh;

        if(asyncMesh){
            if(asyncMesh instanceof AsyncMesh) {
                asyncMesh.subscribe(this, '_onMeshLoad');
            }
            else {
                this.mesh = mesh.clone();
            }
        }

        this.mesh.position.copy(this.position);
        this.position = this.mesh.position;
        this.rotation = this.mesh.rotation;
        // this.particleEmitter = new ParticleEngine();
        // this.particleEmitter.setValues( Examples.fountain );
        // this.particleEmitter.initialize(this.scene);
        this.emitter = new ParticleSystem(50, 5);
        this.shouldUpdateEmitter = false;
    }

    gotEaten(){
        this.emitter.position.copy(this.position);
        this.emitter.spawn();
        this.scene.add(this.emitter.root);
        this.shouldUpdateEmitter = true;
    }

    update(time) {
        this.position.y = Math.sin(time.elapsed * 5) * 0.2 + 0.5;
        this.rotation.y += time.deltaTime;
        if(this.shouldUpdateEmitter){
            if(this.emitter.alive)
                this.emitter.update(time);
            else { 
                this.scene.remove(this.emitter.root);
                this.shouldUpdateEmitter = false;
            }
        }

        // this.particleEmitter.update( time.deltaTime * 0.5 );	
    }

    _onMeshLoad(asyncMesh) {
        this.scene.remove(this.mesh);
        this.mesh = asyncMesh.getClone();

        this.mesh.scale.set(0.2, 0.2, 0.2);

        this.mesh.position.copy(this.position);
        this.mesh.rotation.copy(this.rotation);
        this.position = this.mesh.position;
        this.rotation = this.mesh.rotation;
        this.scene.add(this.mesh);
    }
}