class InputMapping{
    constructor(keyboard, mappings){
        this.keyboard = keyboard || new Keyboard();
        this._keyboardOwner = keyboard !== undefined;
        this.map = {};
        if (mappings !== undefined){
            this.mapRange(mappings);
        }
    }

    map(name, key){
        name = name.toLowerCase();
        this.map[name] = key;
    }

    mapRange(range){
        for(let key in range){
            let name = key.toLowerCase();
            this.map[name] = range[key];
        }
    }

    pressed(input, override){
        let name = input.toLowerCase();
        if (this.map[name]){
            return this.keyboard.pressed(this.map[name], override);
        }
        else{
            //console.warn(`Input ${input} is not defined in this Input Mapping`);
            return false;
        }
    }

    keycodes(input){
        let result = [];
        let name = input.toLowerCase();
        if (this.map[name]) {
            let keys = this.map[name].split('+');
            for(let key of keys){
                let keycode = this.keyboard.keycode(key);
                result.push(keycode);
            }
        }
        return result;
    }

    destroy(){
        if(this._keyboardOwner){
            this.keyboard.destroy();
        }
    }
}