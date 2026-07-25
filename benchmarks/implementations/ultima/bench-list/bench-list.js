import { ReactiveComponent } from '../../../../src/reactive_component.js';

const ADJECTIVES = ['fast', 'slow', 'big', 'small', 'blue', 'green', 'red', 'light', 'dark', 'new'];
const NOUNS = ['car', 'table', 'cloud', 'river', 'hill', 'wind', 'field', 'port', 'valley', 'lake'];

//Benchmark scenario: keyed list (data-for="row in rows : id"). Reproduces the classic
//js-framework-benchmark battery (create, partial update, swap two rows, remove one row, clear), to
//compare the cost of each operation in isolation.
export class BenchList extends ReactiveComponent {

    #nextId = 1;

    constructor() {
        super(
            { templateUrl: './bench-list.html', shadowDom: true },
            import.meta.url
        );

        this.state = { rows: [] };
    }

    #randomLabel() {
        const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
        const n = NOUNS[Math.floor(Math.random() * NOUNS.length)];
        return `${a} ${n}`;
    }

    create(n) {
        const rows = [];
        for (let i = 0; i < n; i++) {
            rows.push({ id: this.#nextId++, label: this.#randomLabel() });
        }
        this.state = { rows };
    }

    updatePartial() {
        const rows = this.state.rows.map((row, index) =>
            index % 10 === 0 ? { ...row, label: row.label + ' !!!' } : row
        );
        this.state = { rows };
    }

    swap() {
        const rows = this.state.rows.slice();
        if (rows.length > 998) {
            [rows[1], rows[998]] = [rows[998], rows[1]];
        } else if (rows.length > 1) {
            [rows[0], rows[rows.length - 1]] = [rows[rows.length - 1], rows[0]];
        }
        this.state = { rows };
    }

    remove() {
        const rows = this.state.rows;
        if (rows.length === 0) {
            return;
        }
        this.state = { rows: rows.slice(1) };
    }

    clear() {
        this.state = { rows: [] };
    }

    countRows() {
        return this.state.rows.length;
    }
}

window.customElements.define('bench-list', BenchList);
