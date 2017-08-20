'use strict';

class Maze {
    constructor (canvas_id, init_image_name) {
        this.canvas = document.getElementById(canvas_id);
        this.context = this.canvas.getContext('2d');
        this.square = [];
        this.initialized = this._initializeFrom(init_image_name);
    }

    _initializeFrom (image_name) {
        return new Promise((resolve, _) => {
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
                resolve();
            };
        });
    }

    _initSquaresFromImageData (image_data) {
        let rgba = [];
        for (let i = 0; i <= image_data.data.length; ++i) {
            if (i && i % 4 === 0) {
                let new_square = new Square();
                new_square.initFromRGBA(...rgba);

                if (new_square.type === 'entrance') {
                    this.entrance = new Position(Math.floor(this.square.length / this.maze_width), this.square.length % this.maze_height);
                } else if (new_square.type === 'exit') {
                    this.exit = new Position(Math.floor(this.square.length / this.maze_width), this.square.length % this.maze_height);
                }

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
       this.initialized.then(() => {
            this.context.scale(this.canvas.width / this.maze_width, this.canvas.height / this.maze_height);
            for (let row = 0; row < this.maze_height; ++row) {
                for (let column = 0; column < this.maze_width; ++column) {
                    this.context.fillStyle = this.getSquare(column, row).toRGB();
                    this.context.fillRect(column, row, 1, 1);
                }
            }
       });
    }
}

class Square {
    initFromRGBA (r, g, b, a) {
        if (r === 255 && g === 255 && b === 255) {
            this.type = 'path';
        } else if (r === 0 && g === 255 && b === 0) {
            this.type = 'entrance';
        } else if (r === 0 && g === 0 && b === 255) {
            this.type = 'exit';
        } else {
            this.type = 'wall';
        }
    }

    toRGB () {
        const TYPE2RGB = {
            path: 'rgb(255, 255, 255)',
            entrance: 'rgb(255, 255, 255)',
            exit: 'rgb(255, 255, 255)',
            wall: 'rgb(0, 0, 0)',
            solution: 'rgb(255, 0, 0)',
        };

        return TYPE2RGB[this.type];
    }
}

class Position {
    constructor (row, column) {
        this.row = row;
        this.column = column;
    }
}

function _initButtonGroup (group_id) {
    let buttons = document.getElementById(group_id);
    buttons.addEventListener('click', (event) => {
        buttons.querySelectorAll('button').forEach((button) => button.classList.remove('active'));
        event.target.classList.add('active');
    });
}

function initUI () {
    _initButtonGroup('algorithm-selection');
    _initButtonGroup('maze-selection');
}

function init () {
    let maze = new Maze('maze', 'simple.png');
    maze.draw();

    initUI();
}
