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

        let found_exit = this.maze.getChildren(position).find((new_position) => {
            return this.findExit(new_position);
        });

        if (found_exit) {
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
        let children = this.maze.getChildren(position);
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

class PriorityBFSSolver extends Solver {
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
        let children = this.maze.getChildren(position);
        children.forEach((child) => {
            child.parent = position;
            if (position.cost) {
                child.cost_from_start = position.cost;
            } else {
                child.cost_from_start = 1;
            }
            child.cost_to_exit = this._predictCostToExit(child);
        });
        return children;
    }

    _predictCostToExit (position) {
        let exit = this.maze.exit;
        return Math.sqrt(Math.pow(position.column - exit.column, 2) + Math.pow(position.row - exit.row, 2));
    }

    findExit (position) {
        let priority_queue = new PriorityQueue();
        let children = this._getChildren(position);
        this.maze.getSquare(position).setCurrentType('traversed');

        children.forEach((child) => {
            let cost_prediction_to_exit = this._predictCostToExit(child);
            priority_queue.insert(child, child.cost_from_start + child.cost_to_exit);
        });

        while (! priority_queue.isEmpty()) {
            let current_position = priority_queue.shift();

            if (this.maze.getSquare(current_position).getCurrentType() === 'traversed') {
                continue;
            }

            this.maze.getSquare(current_position).setCurrentType('traversed');
            this.maze.newIteration();

            if (current_position.equals(this.maze.exit)) {
                this._markSolution(current_position);
                return true;
            }

            this._getChildren(current_position).forEach((child) => priority_queue.insert(child, child.cost_from_start + child.cost_to_exit));
        }

        return false;
    }
}

class AStarSolver extends Solver {
    solve () {
        super.solve();
        return this.findExit(this.maze.entrance);
    }

    _cost (from, to) {
        // moving diagonally takes longer than moving straight
        return Math.sqrt(Math.pow(from.column - to.column, 2) + Math.pow(from.row - to.row, 2));
    }

    _cost_estimate_to_exit (position) {
        return this._cost(position, this.maze.exit);
    }

    _markSolution (current_position) {
        while (current_position) {
            this.maze.getSquare(current_position).setCurrentType('solution');
            current_position = current_position.parent;
        }
    }

    findExit (parent) {
        // already evaluated will be marked 'traversed'
        let open_positions = new PriorityQueue();
        let best_score_from_start_to = {};
        
        open_positions.insert(parent, this._cost_estimate_to_exit(parent));
        best_score_from_start_to[parent] = 0;

        while (! open_positions.isEmpty()) {
            parent = open_positions.shift();

            if (parent.equals(this.maze.exit)) {
                this._markSolution(parent);
                return true;
            }

            this.maze.newIteration();
            this.maze.getSquare(parent).setCurrentType('traversed');

            this.maze.getChildren(parent).forEach((child) => {
                if (this.maze.getSquare(child).getCurrentType() === 'traversed') {
                    return;
                }

                let score_from_start_to_child = best_score_from_start_to[parent] + this._cost(parent, child);
                if (best_score_from_start_to[child] && score_from_start_to_child >= best_score_from_start_to[child]) {
                    return;
                }

                child.parent = parent;
                best_score_from_start_to[child] = score_from_start_to_child;
                open_positions.insert(child, score_from_start_to_child + this._cost_estimate_to_exit(child));
            });
        }

        return false;
    }
}
