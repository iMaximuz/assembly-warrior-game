class Particle {
    constructor(position, velocity) {
        this.geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        this.material = new THREE.MeshBasicMaterial({color: new THREE.Color(0xff0000)});
        this.mesh = new THREE.Mesh(this.geometry, this.material);

        this.initialPosition = position || new THREE.Vector3();
        this.position = this.mesh.position;
        this.scale = this.mesh.scale;
        this.position.copy(this.initialPosition);
        this.vel = new THREE.Vector3();
        if(velocity) this.vel.copy(velocity);
        this.acel = new THREE.Vector3();
        this.gravity = new THREE.Vector3(0, -9.8, 0);

        this.age = 0;
        this.lifespan = 2;
        this.alive = true;
    }

    spawn(initialVelocity){
        this.age = 0;
        this.alive = true;
        this.position.copy(this.initialPosition);
        this.vel.copy(initialVelocity);
    }

    applyForce(force){
        this.acel.add(force);
    }

    scaleByAge(){
        return 1 - (this.age / this.lifespan);
    }

    update(time){
        if(this.age < this.lifespan){
            let dt = time.deltaTime;
            this.age += dt;
            this.position.addScaledVector(this.vel, dt);
            this.vel.addScaledVector(this.acel, dt);
            this.acel.set(0, 0, 0);
            this.applyForce(this.gravity);
            
            let scale = this.scaleByAge();
            this.scale.set(scale, scale, scale);

            if(this.age >= this.lifespan) this.alive = false;
        }
    }
}

class ParticleSystem{

    constructor(count, strength) {
        this.age = 0;
        this.lifespan = 1;
        this.alive = true;

        this.particleCount = count;
        this.particles = [];
        this.burstStrength = strength;
        this.root = new THREE.Object3D();
        this.position = this.root.position;
        this.rotation = this.root.rotation;

        let initialPosition = new THREE.Vector3();        
        let initialVelocity = new THREE.Vector3();        
        for(let i = 0; i < this.particleCount; i++) {
            initialVelocity.set((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2);
            initialVelocity.normalize();
            initialVelocity.multiplyScalar(this.burstStrength);
            let p = new Particle(initialPosition, initialVelocity);
            p.gravity.set(0, 9.8, 0);
            p.lifespan = this.lifespan;
            this.root.add(p.mesh);
            this.particles.push(p);
        }
    }

    spawn() {
        this.alive = true;
        this.age = 0;
        //if(this.particles.length > 0) this.destroy(scene);
        let initialVelocity = new THREE.Vector3();        
        for(let p of this.particles){
            initialVelocity.set((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2);
            initialVelocity.normalize();
            initialVelocity.multiplyScalar(this.burstStrength);
            p.spawn(initialVelocity);
        }
    }

    update(time){
        if(this.age < this.lifespan){
            let dt = time.deltaTime;
            this.age += dt;
            for(let p of this.particles){
                p.update(time);
            }
            if(this.age >= this.lifespan) this.alive = false;             
        }
    }

    destroy(){
        for(let p of this.particles){
            this.root.remove(p.mesh);
        }
        this.particles = [];
    }
}