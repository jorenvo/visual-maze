'use strict';

class Maze {
    constructor (canvas_id, init_image_name) {
        this.canvas = document.getElementById(canvas_id);
        this.context = this.canvas.getContext('2d');
        this.square = [];
        this.initialized = this._initializeFrom(init_image_name);
    }

    _validateState () {
        if (! this.entrance) {
            displayWarning('No entrance found.');
        }
        if (! this.exit) {
            displayWarning('No exit found.');
        }
    }

    _initializeFrom (image_name) {
        return new Promise((resolve, _) => {
            let offscreen_canvas = document.createElement('canvas');
            let context = offscreen_canvas.getContext('2d');

            let image = new Image();
            image.src = image_name;
            image.onload = () => {
                context.drawImage(image, 0, 0);
                this.width = image.width;
                this.height = image.height;
                let image_data = context.getImageData(0, 0, image.width, image.height);
                this._initSquaresFromImageData(image_data);
                this._validateState();
                this.context.scale(this.canvas.width / this.width, this.canvas.height / this.height);
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
                    this.entrance = new Position(this.square.length % this.width, Math.floor(this.square.length / this.width));
                } else if (new_square.type === 'exit') {
                    this.exit = new Position(this.square.length % this.height, Math.floor(this.square.length / this.width));
                }

                this.square.push(new_square);
                rgba = [];
            }

            if (i < image_data.data.length) {
                rgba.push(image_data.data[i]);
            }
        }
    }

    isInBounds (position) {
        if (! (position.row >= 0 && position.row < this.height)) {
            return false;
        } else if (! (position.column >= 0 && position.column < this.width)) {
            return false;
        }
        return true;
    }

    hasToBeHandled (position) {
        if (! this.isInBounds(position)) {
            return false;
        }
        return this.getSquare(position).hasToBeHandled();
    }

    getSquare (position) {
        return this.square[position.row * this.width + position.column];
    }

    draw () {
        return this.initialized.then(() => {
            for (let row = 0; row < this.height; ++row) {
                for (let column = 0; column < this.width; ++column) {
                    let position = new Position(column, row);
                    this.context.fillStyle = this.getSquare(position).toRGB();
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
            traversed: 'rgb(100, 100, 100)',
        };

        return TYPE2RGB[this.type];
    }

    hasToBeHandled () {
        return this.type === 'path' || this.type === 'entrance' || this.type === 'exit';
    }
}

class Position {
    constructor (column, row) {
        this.column = column;
        this.row = row;
    }

    equals (other) {
        return this.column === other.column && this.row === other.row;
    }

    getEast () {
        return new Position(this.column + 1, this.row);
    }

    getSouth () {
        return new Position(this.column, this.row + 1);
    }

    getWest () {
        return new Position(this.column - 1, this.row);
    }

    getNorth () {
        return new Position(this.column, this.row - 1);
    }
}

class Solver {
    constructor (maze) {
        this.maze = maze;
        this.iteration = [];
        this.path = [];
    }

    solve () {
        console.error('Not implemented');
    }
}

class DFSSolver extends Solver {
    solve () {
        let found_exit = this.findExit(this.maze.entrance);
        this.markSolution();
        return found_exit;
    }

    findExit (position) {
        if (! this.maze.hasToBeHandled(position)) {
            return false;
        }

        this.path.push(position);

        if (position.equals(this.maze.exit)) {
            return true;
        }

        this.maze.getSquare(position).type = 'traversed';

        if (this.findExit(position.getEast())) {
            return true;
        } else if (this.findExit(position.getSouth())) {
            return true;
        } else if (this.findExit(position.getWest())) {
            return true;
        } else if (this.findExit(position.getNorth())) {
            return true;
        }

        this.path.pop();
        return false;
    }

    markSolution () {
        this.path.forEach((position) => this.maze.getSquare(position).type = 'solution');
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

function _displayMessage (id, message) {
    let element = document.getElementById(id);
    element.innerHTML = message;
    element.classList.remove('hide');
}

function displayInfo (message) {
    _displayMessage('info', message);
}

function displayWarning (message) {
    _displayMessage('warning', message);
}

function init () {
    let maze = new Maze('maze', 'big.png');
    maze.draw().then(() => {
        let solver = new DFSSolver(maze);
        if (solver.solve()) {
            displayInfo('Found solution in TODO seconds.');
        } else {
            displayInfo('Determined maze had no solution in TODO seconds.');
        }
        maze.draw();
    });

    initUI();
}
