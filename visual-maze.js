'use strict';

class Maze {
    constructor (canvas_id, init_image_name) {
        this.canvas = document.getElementById(canvas_id);
        this.context = this.canvas.getContext('2d');
        this.square = [];

        this._initializeFrom(init_image_name);
    }

    _initializeFrom (image_name) {
        let offscreen_canvas = document.createElement('canvas');
        let context = offscreen_canvas.getContext('2d');

        let image = new Image();
        image.src = image_name;
        image.onload = () => {
            context.drawImage(image, 0, 0);
            this.maze_width = image.width;
            this.maze_height = image.height;
            let image_data = context.getImageData(0, 0, image.width, image.height);
            this._initSquaresFromImageData(image_data);
            this.draw();
        };
    }

    _initSquaresFromImageData (image_data) {
        let rgba = [];
        for (let i = 0; i <= image_data.data.length; ++i) {
            if (i && i % 4 === 0) {
                let new_square = new Square();
                new_square.initFromRGBA(...rgba);
                this.square.push(new_square);
                rgba = [];
            }

            if (i < image_data.data.length) {
                rgba.push(image_data.data[i]);
            }
        }
    }

    getSquare (column, row) {
        return this.square[row * this.maze_width + column];
    }

    draw () {
        this.context.scale(this.canvas.width / this.maze_width, this.canvas.height / this.maze_height);
        for (let row = 0; row < this.maze_height; ++row) {
            for (let column = 0; column < this.maze_width; ++column) {
                this.context.fillStyle = this.getSquare(column, row).toRGB();
                this.context.fillRect(column, row, 1, 1);
            }
        }    
    }
}

class Square {
    initFromRGBA (r, g, b, a) {
        if (r === 255) {
            this.type = 'path';
        } else {
            this.type = 'wall';
        }
    }

    toRGB () {
        const TYPE2RGB = {
            path: 'rgb(255, 255, 255)',
            wall: 'rgb(0, 0, 0)',
            solution: 'rgb(255, 0, 0)',
        };

        return TYPE2RGB[this.type];
    }
}

function image2maze (image_data) {
    let maze = [];
    let rgba = [];
    for (let i = 0; i <= image_data.data.length; ++i) {
        if (i && i % 4 === 0) {
            let new_square = new Square();
            new_square.initFromRGBA(...rgba);
            maze.push(new_square);
            rgba = [];
        }

        if (i < image_data.data.length) {
            rgba.push(image_data.data[i]);
        }
    }
    return maze;
}

function init () {
    let maze = new Maze('maze', 'simple.png');
}
