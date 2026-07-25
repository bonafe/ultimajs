import { ReactiveComponent } from '../../reactive_component.js';

//Benchmark scenario: two-way binding (data-bind + native "change" event writing back to state).
//writeTimes(n) simulates n value changes in sequence, firing the event Ultima's binding listens for
//to propagate DOM -> state -> render (including the span reflecting the value back).
export class BenchBinding extends ReactiveComponent {

    constructor() {
        super(
            { templateUrl: './bench-binding.html', shadowDom: true },
            import.meta.url
        );

        this.state = { text: '' };
    }

    reset() {
        this.state = { text: '' };
    }

    writeTimes(n) {
        const field = this.refs.field;
        for (let i = 0; i < n; i++) {
            field.value = `value-${i}`;
            field.dispatchEvent(new Event('change'));
        }
    }

    currentValue() {
        return this.state.text;
    }
}

window.customElements.define('bench-binding', BenchBinding);
