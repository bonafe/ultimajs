import { ReactiveComponent } from '../../reactive_component.js';

//Benchmark scenario: conditional chain (data-if/data-else). toggleTimes(n) simulates n toggles in
//sequence, each one going through the real conditional-rendering path.
export class BenchConditional extends ReactiveComponent {

    constructor() {
        super(
            { templateUrl: './bench-conditional.html', shadowDom: true },
            import.meta.url
        );

        this.state = { open: false };
    }

    reset() {
        this.state = { open: false };
    }

    toggleTimes(n) {
        for (let i = 0; i < n; i++) {
            this.state = { open: !this.state.open };
        }
    }

    currentState() {
        return this.state.open;
    }
}

window.customElements.define('bench-conditional', BenchConditional);
