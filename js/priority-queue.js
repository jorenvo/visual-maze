class PriorityQueueElement {
    constructor (value, priority) {
        this.value = value;
        this.priority = priority;
    }
}

class PriorityQueue {
    constructor () {
        this.queue = [];
    }

    insert (value, priority) {
        let element = new PriorityQueueElement(value, priority);
        this.queue.push(element);

        // ascending sort on priority, just like nice(1) low priority
        // value is more important
        this.queue.sort((a, b) => {
            if (a.priority < b.priority) {
                return -1;
            } else if (a.priority > b.priority) {
                return 1;
            } else {
                return 0;
            }
        });
    }

    shift () {
        return this.queue.shift().value;
    }

    isEmpty () {
        return this.queue.length === 0;
    }
}
