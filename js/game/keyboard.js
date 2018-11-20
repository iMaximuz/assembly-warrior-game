class Keyboard{
    constructor(){
        this.keyCodes = {};
        this.modifiers = {};

        var self = this;
        this._onKeyDown = (event) => { self._onKeyChange(event, true) }
        this._onKeyUp = (event) => { self._onKeyChange(event, false) }

        document.addEventListener('keydown', this._onKeyDown, false);
        document.addEventListener('keyup', this._onKeyUp, false);

        this.MODIFIERS = ['shift', 'ctrl', 'alt', 'meta'];
        this.ALIAS = {
            'delete':   8,
            'backspace':8,
            'tab':      9,
            'enter':    13,
            'esc':      27,
            'space':    32,
            'spacebar': 32,
            'pageup':   33,
            'pagedown': 34,
            'left':     37,
            'up':       38,
            'right':    39,
            'down':     40,
            '0':        48,
            '1':        49,
            '2':        50,
            '3':        51,
            '4':        52,
            '5':        53,
            '6':        54,
            '7':        55,
            '8':        56,
            '9':        57,
            'numpad0':  96,
            'numpad1':  97,
            'numpad2':  98,
            'numpad3':  99,
            'numpad4':  100,
            'numpad5':  101,
            'numpad6':  102,
            'numpad7':  103,
            'numpad8':  104,
            'numpad9':  105,
            'multiply': 106,
            'add':      107,
            'decimalpoint': 110,
            'divide':   111,
            'numlock':  144,
        };
    }

    destroy(){
        document.removeEventListener('keydown', this._onKeyDown, false);
        document.removeEventListener('keyup', this._onKeyUp, false);
    }

    _onKeyChange(event, pressed){
        let keyCode = event.keyCode;
        this.keyCodes[keyCode] = pressed;
        this.modifiers['shift'] = event.shiftKey;
        this.modifiers['ctrl'] = event.ctrlKey;
        this.modifiers['alt'] = event.altKey;
        this.modifiers['meta'] = event.metaKey;
    }

    keycode(key){
        let result = -1;
        
        if (typeof key === 'string'){ 
            key = key.replace(/\s+/g, ''); 
            key = key.toLowerCase();
        }

        if (this.MODIFIERS.indexOf(key) !== -1) {
            let index = this.MODIFIERS.indexOf(key);
            result = this.MODIFIERS[index];
        }
        else if (Object.keys(this.ALIAS).indexOf(key) !== -1) {
            result = this.ALIAS[key];
        }
        else if (typeof key === 'string') {
            result = key.toUpperCase().charCodeAt(0);
        }
        else if(key >= 0 && key <= 255){
            result = key;
        }
        return result;
    }

    pressed(keySelector, isPressed){

        let keys = [];
        if (typeof keySelector === 'string')
            keys = keySelector.split('+');
        else
            keys.push(keySelector);

        let pressed = false;
        let setValue = isPressed !== undefined;

        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let keyc = this.keycode(key);
            if (typeof keyc === 'string'){
                if (setValue) this.modifiers[keyc] = isPressed;
                pressed = this.modifiers[keyc];
            } else if (keyc != -1) {

                if (setValue) this.keyCodes[keyc] = isPressed;
                pressed = this.keyCodes[keyc];
            }
            
            if (!pressed && !setValue) break;
        }

        return pressed;
    }
}

