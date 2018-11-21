class AsyncMesh{
    constructor(path, name, startLoad, callback){
        this.path = path
        this.name = name;
        this.onLoadCallbacks = [];
        this.loaded = false;
        this.mesh = undefined;
        if(callback) this.subscribe(callback);
        if(startLoad) this.load();
    }

    getClone(){
        if(this.loaded) {
            return this.mesh.clone();
        }
        return undefined;
    }

    _onLoad( object ) {
        
        this.mesh = object;
        this.loaded = true;
        for(let sub of this.onLoadCallbacks){
            //sub.caller[sub.callback](this);
            sub(this);
        };

    }

    subscribe(callback) {
        /*
        this.onLoadCallbacks.push({ caller: caller, callback: callback });
        if(this.loaded){
            caller[callback](this);
        }
        */
       this.onLoadCallbacks.push(callback);
       if(this.loaded){
           callback(this);
       }
    }

    async load() {
        let self = this; 

        let loadOBJWithMTL = function(path, objFile, mtlFile, onLoadCallback) {
            let mtlLoader = new THREE.MTLLoader();
            mtlLoader.setPath(path);
            mtlLoader.load(mtlFile, (materials) => {
                let objLoader = new THREE.OBJLoader();
                objLoader.setPath(path);
                objLoader.setMaterials(materials);
                objLoader.load(objFile, onLoadCallback );
            });
        }

        let obj = this.name + '.obj';
        let mtl = this.name + '.mtl';
        loadOBJWithMTL(this.path, obj, mtl, (obj) => { self._onLoad(obj) });
    }
}