class Solver {
    constructor (maze) {
        this.maze = maze;
        this.iteration = [];
        this.path = [];
    }

    solve () {
        this.maze.solved = true;
    }
}

class DFSSolver extends Solver {
    solve () {
        super.solve();
        let found_exit = this.findExit(this.maze.entrance);
        this._markSolution();
        return found_exit;
    }

    findExit (position) {
        if (! this.maze.hasToBeHandled(position)) {
            return false;
        }

        this.maze.newIteration();
        this.path.push(position);

        if (position.equals(this.maze.exit)) {
            return true;
        }

        this.maze.getSquare(position).setCurrentType('traversed');

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

    _markSolution () {
        this.path.forEach((position) => this.maze.getSquare(position).setCurrentType('solution'));
    }
}

class BFSSolver extends Solver {
    solve () {
        super.solve();
        let found_exit = this.findExit(this.maze.entrance);
        return found_exit;
    }

    _markSolution (current_position) {
        while (current_position) {
            this.maze.getSquare(current_position).setCurrentType('solution');
            current_position = current_position.parent;
        }
    }

    _getChildren (position) {
        let children = [position.getEast(), position.getSouth(),
                        position.getWest(), position.getNorth()];
        children = children.filter((child) => this.maze.hasToBeHandled(child));
        children.forEach((child) => child.parent = position);
        return children;
    }

    findExit (position) {
        let children = this._getChildren(position);
        this.maze.getSquare(position).setCurrentType('traversed');

        while (children.length) {
            let current_position = children.shift();

            // A maze is effectively an undirected graph with
            // loops. This means a child can have multiple parents. So
            // it's possible that the same position appears >1 times
            // in the children array. This makes sure not to waste
            // time processing a position if it has already been done
            // in before.
            if (this.maze.getSquare(current_position).getCurrentType() === 'traversed') {
                continue;
            }

            this.maze.getSquare(current_position).setCurrentType('traversed');
            this.maze.newIteration();

            if (current_position.equals(this.maze.exit)) {
                this._markSolution(current_position);
                return true;
            }

            children.push(...this._getChildren(current_position));
        }

        return false;
    }
}

class AStarSolver extends Solver {
        solve () {
        super.solve();
        let found_exit = this.findExit(this.maze.entrance);
        return found_exit;
    }

    _markSolution (current_position) {
        while (current_position) {
            this.maze.getSquare(current_position).setCurrentType('solution');
            current_position = current_position.parent;
        }
    }

    _getChildren (position) {
        let children = [position.getEast(), position.getSouth(),
                        position.getWest(), position.getNorth()];
        children = children.filter((child) => this.maze.hasToBeHandled(child));
        children.forEach((child) => child.parent = position);
        return children;
    }

    findExit (position) {
        let children = this._getChildren(position);
        this.maze.getSquare(position).setCurrentType('traversed');

        while (children.length) {
            let current_position = children.shift();

            // A maze is effectively an undirected graph with
            // loops. This means a child can have multiple parents. So
            // it's possible that the same position appears >1 times
            // in the children array. This makes sure not to waste
            // time processing a position if it has already been done
            // in before.
            if (this.maze.getSquare(current_position).getCurrentType() === 'traversed') {
                continue;
            }

            this.maze.getSquare(current_position).setCurrentType('traversed');
            this.maze.newIteration();

            if (current_position.equals(this.maze.exit)) {
                this._markSolution(current_position);
                return true;
            }

            children.push(...this._getChildren(current_position));
        }

        return false;
    }
}
