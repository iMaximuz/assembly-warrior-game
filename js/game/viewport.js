class Viewport{
    constructor(width, height, mode, orthoSize){
        this.window = {
            width: width,
            height: height
        }
        this.width = this.window.width;
        this.height = this.window.height;
        this.ortho = {
            size: orthoSize || 40,
            left: () => { return -0.5 * this.aspect() * this.ortho.size },
            right: () => { return 0.5 * this.aspect() * this.ortho.size },
            top: () => { return 0.5 * this.ortho.size },
            bottom: () => { return -0.5 * this.ortho.size }
        }
        this.near = 0.1;
        this.far = 1000;
        this.mode = mode;
        this.onViewportResizedCallback = (viewport) => {};
        window.addEventListener("resize", () => { this._viewportSizeChanged() });
    }

    aspect(){
        return this.width / this.height;
    }

    onViewportResized(callback){
        if(callback){
            this.onViewportResizedCallback = callback
        }else{
            this.onViewportResizedCallback(this);
        }

    }

    _viewportSizeChanged() {
        if (this.width != window.innerWidth || this.height != window.innerHeight) {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.onViewportResized();
        }
    }
}