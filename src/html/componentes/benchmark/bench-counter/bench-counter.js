import { ReactiveComponent } from '../../reactive_component.js';

//Benchmark scenario: simple reactive state. incrementTimes(n) simulates n clicks in sequence, each
//one going through the real state-update path (updateState -> render).
export class BenchCounter extends ReactiveComponent {

    constructor() {
        super(
            { templateUrl: './bench-counter.html', shadowDom: true },
            import.meta.url
        );

        this.state = { count: 0 };
    }

    reset() {
        this.state = { count: 0 };
    }

    incrementTimes(n) {
        for (let i = 0; i < n; i++) {
            this.state = { count: this.state.count + 1 };
        }
    }

    currentValue() {
        return this.state.count;
    }
}

window.customElements.define('bench-counter', BenchCounter);
