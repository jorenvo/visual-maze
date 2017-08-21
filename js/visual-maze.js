'use strict';

let maze;

class Maze {
    constructor (canvas_id, init_image_name) {
        this.canvas = document.getElementById(canvas_id);
        this.context = this.canvas.getContext('2d');
        this.square = [];
        this.initialized = this._initializeFrom(init_image_name);
        this.solved = false;
    }

    _validateState () {
        if (! this.entrance) {
            setWarning('No entrance found.');
        }
        if (! this.exit) {
            setWarning('No exit found.');
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
                this.context.setTransform(1, 0, 0, 1, 0, 0);
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
                new_square.setFromRGBA(...rgba);

                if (new_square.getCurrentType() === 'entrance') {
                    this.entrance = new Position(this.square.length % this.width, Math.floor(this.square.length / this.width));
                } else if (new_square.getCurrentType() === 'exit') {
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

    getNumberOfIterations () {
        return this.getSquare(new Position(0, 0)).getNumberOfIterations();
    }

    getNumberOfTraversedPositions () {
        return this.square.filter((square) => {
            let type = square.getCurrentType();
            return type === 'traversed' || type === 'solution';
        }).length;
    }

    newIteration () {
        this.square.forEach((square) => square.newIteration());
    }

    getSquare (position) {
        return this.square[position.row * this.width + position.column];
    }

    draw (iteration) {
        return this.initialized.then(() => {
            this.context.clearRect(0, 0, this.width, this.height);
            for (let row = 0; row < this.height; ++row) {
                for (let column = 0; column < this.width; ++column) {
                    let position = new Position(column, row);
                    this.context.fillStyle = this.getSquare(position).getRGB(iteration);
                    this.context.fillRect(column, row, 1, 1);
                }
            }
        });
    }

    drawCurrent () {
        return this.initialized.then(() => {
            this.draw(this.getNumberOfIterations() - 1);
        });
    }

    // todo optimize by only drawing diff
    drawIterations () {
        return new Promise((resolve, _) => {
            let current_iteration = 0;
            let draw_function = () => {
                let delay_ms = getCurrentAnimationSpeedMs();

                if (delay_ms) {
                    this.draw(current_iteration++);

                    if (current_iteration < this.getNumberOfIterations()) {
                        setTimeout(draw_function, getCurrentAnimationSpeedMs());
                    } else {
                        resolve();
                    }
                } else {
                    this.drawCurrent().then(resolve);
                }
            };
            draw_function();
        });
    }
}

class Square {
    constructor () {
        this.type = ['path'];
    }

    getNumberOfIterations () {
        return this.type.length;
    }

    newIteration () {
        this.type.push(this.type[this.type.length - 1]);
    }

    getCurrentType () {
        return this.type[this.type.length - 1];
    }

    setCurrentType (type) {
        this.type[this.type.length - 1] = type;
    }

    setFromRGBA (r, g, b, a) {
        if (r === 255 && g === 255 && b === 255) {
            this.setCurrentType('path');
        } else if (r === 0 && g === 255 && b === 0) {
            this.setCurrentType('entrance');
        } else if (r === 0 && g === 0 && b === 255) {
            this.setCurrentType('exit');
        } else {
            this.setCurrentType('wall');
        }
    }

    getRGB (iteration) {
        const TYPE2RGB = {
            path: 'rgb(255, 255, 255)',
            entrance: 'rgb(255, 0, 0)',
            exit: 'rgb(0, 255, 0)',
            wall: 'rgb(0, 0, 0)',
            solution: 'rgb(255, 0, 0)',
            traversed: 'rgb(100, 100, 100)',
        };

        return TYPE2RGB[this.type[iteration]];
    }

    getCurrentRGB () {
        return this.getRGB(this.type.length - 1);
    }

    hasToBeHandled () {
        let type = this.getCurrentType();
        return type === 'path' || type === 'entrance' || type === 'exit';
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

function getCurrentAnimationSpeedMs () {
    return parseInt(document.querySelector('#animation-speed .active').getAttribute('delay-ms'), 10);
}

function _initButtonGroup (group_id) {
    let buttons = document.getElementById(group_id);
    buttons.addEventListener('click', (event) => {
        let clicked_button = event.target;
        if (! clicked_button.classList.contains('disabled')) {
            buttons.querySelectorAll('button').forEach((button) => button.classList.remove('active'));
            clicked_button.classList.add('active');
        }
    });
}

function initMaze () {
    let solve_button = document.getElementById('solve');
    maze = new Maze('maze', document.querySelector('#maze-selection .active').getAttribute('filename'));
    solve_button.classList.add('disabled');
    return maze.drawCurrent().then(() => solve_button.classList.remove('disabled'));
}

function _getButtonsToDisable () {
    let buttons_to_disable = [];
    buttons_to_disable.push(document.getElementById('solve'));
    buttons_to_disable.push(...document.querySelectorAll('#algorithm-selection button'));
    buttons_to_disable.push(...document.querySelectorAll('#maze-selection button'));
    return buttons_to_disable;
}

function disableControls () {
    _getButtonsToDisable().forEach((button) => button.classList.add('disabled'));
}

function enableControls () {
    _getButtonsToDisable().forEach((button) => button.classList.remove('disabled'));
}

function runSolver () {
    let solver;
    let start_time = Date.now();

    let selected_algorithm_id = document.querySelector('#algorithm-selection .active').getAttribute('id');
    if (selected_algorithm_id === "DFS") {
        solver = new DFSSolver(maze);
    } else if (selected_algorithm_id === "BFS") {
        solver = new BFSSolver(maze);
    } else {
        solver = new PriorityBFSSolver(maze);
    }

    setInfo();
    setWarning();
    disableControls();

    setTimeout(() => {
        let solved = solver.solve();
        let elapsed_time = (Date.now() - start_time) / 1000;

        if (solved) {
            setInfo(`Found a solution by traversing ${maze.getNumberOfTraversedPositions()} positions. This took ${elapsed_time} seconds.`);
        } else {
            setInfo(`Determined maze has no solution by traversing ${maze.getNumberOfTraversedPositions()} positions. This took ${elapsed_time} seconds.`);
        }
        maze.drawIterations().then(enableControls);
    }, 0);
}

function initUI () {
    let solve_button = document.getElementById('solve');
    _initButtonGroup('algorithm-selection');
    _initButtonGroup('maze-selection');
    _initButtonGroup('animation-speed');

    document.getElementById('maze-selection').addEventListener('click', (event) => {
        if (! event.target.classList.contains('disabled')) {
            initMaze();
        }
    });

    solve_button.addEventListener('click', () => {
        if (solve_button.classList.contains('disabled')) {
            return;
        }
        if (maze.solved) {
            initMaze().then(runSolver);
        } else {
            runSolver();
        }
    });
}

function _setMessage (id, message) {
    let element = document.getElementById(id);
    element.innerHTML = message;

    if (message) {
        element.classList.remove('hide');
    } else {
        element.classList.add('hide');
    }
}

function setInfo (message) {
    _setMessage('info', message);
}

function setWarning (message) {
    _setMessage('warning', message);
}

function init () {
    initMaze();
    initUI(maze);
}
