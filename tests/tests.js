import { ReactiveComponent } from '../src/reactive_component.js';
import { ComponentBase } from '../src/component_base.js';

//Zero-dependency test runner: each test is an async function that throws (via assert) on failure.

const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const assert = (condition, message = 'assertion failed') => { if (!condition) throw new Error(message); };
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const settleOrTimeout = (promise, ms = 2000) => Promise.race([promise.then(() => true), wait(ms).then(() => false)]);

const define = (tag, templateUrl, shadowDom = false) =>
    customElements.define(tag, class extends ReactiveComponent {
        constructor() { super({ templateUrl, shadowDom }, import.meta.url); }
    });

define('t-conditional', 'fixtures/conditional.html');
define('t-datetime', 'fixtures/datetime.html');
define('t-with-script', 'fixtures/with-script.html');
define('t-missing', 'fixtures/does-not-exist.html');
define('test-broken-child', 'fixtures/does-not-exist.html');
define('t-parent', 'fixtures/parent.html');
define('t-forms', 'fixtures/forms.html');
define('t-primitives', 'fixtures/primitives.html');
define('t-child-light', 'fixtures/child-light.html');
define('t-parent-light', 'fixtures/parent-light.html');
define('t-cached', 'fixtures/cached.html');
define('t-observed', 'fixtures/observed.html');
define('t-sri', 'fixtures/sri.html');
define('t-nested-list', 'fixtures/nested-list.html');

class Events extends ReactiveComponent {
    constructor() { super({ templateUrl: 'fixtures/events.html', shadowDom: false }, import.meta.url); this.calls = []; }
    onPlain(event, scope) { this.calls.push(['plain', event.type, scope.tasks?.length]); }
    onTask(event, scope) { this.calls.push(['task', scope.t.id]); }
}
customElements.define('t-events', Events);

class Computed extends ReactiveComponent {
    constructor() { super({ templateUrl: 'fixtures/computed.html', shadowDom: false }, import.meta.url); this.seen = []; }
    computed() { return { fullName: `${this.state?.first ?? ''} ${this.state?.last ?? ''}`.trim() }; }
    watchers() { return { fullName: (now, before) => this.seen.push([now, before]), 'meta.count': (now) => this.seen.push(['count', now]) }; }
}
customElements.define('t-computed', Computed);

const mount = async (tag, state) => {
    const element = document.createElement(tag);
    if (state) element.state = state;
    document.body.append(element);
    assert(await settleOrTimeout(element.whenLoaded()), `<${tag}> never finished loading`);
    return element;
};

const visible = element => ['a', 'b', 'c'].filter(id => element.querySelector('#' + id)).join('');

// --- data-if / data-else-if / data-else ---

test('conditional chain switches between every branch, in any order', async () => {
    const element = await mount('t-conditional', { a: true });
    const sequence = [
        [{ a: true }, 'a'], [{ b: true }, 'b'], [{}, 'c'], [{ a: true }, 'a'],
        [{}, 'c'], [{ b: true }, 'b'], [{ b: true }, 'b'], [{ a: true, b: true }, 'a'], [{}, 'c'],
    ];
    for (const [state, expected] of sequence) {
        element.state = state;
        assert(visible(element) === expected, `state ${JSON.stringify(state)}: expected "${expected}", got "${visible(element)}"`);
    }
});

test('conditional chain renders the else branch on first render', async () => {
    const element = await mount('t-conditional', {});
    assert(visible(element) === 'c', `got "${visible(element)}"`);
});

// --- datetime-local ---

test('datetime-local with a missing value does not throw and still loads', async () => {
    const element = await mount('t-datetime');
    element.state = { other: 1 };
    assert(element.querySelector('#d').value === '');
});

test('datetime-local with an invalid value is cleared', async () => {
    const element = await mount('t-datetime', { when: 'garbage' });
    assert(element.querySelector('#d').value === '');
});

test('datetime-local with a valid value', async () => {
    const element = await mount('t-datetime', { when: '2024-01-02T03:04' });
    assert(element.querySelector('#d').value === '2024-01-02T03:04');
});

// --- load failures ---

test('a template that 404s fires ERROR_EVENT and does not inject the error page', async () => {
    const element = document.createElement('t-missing');
    const errored = new Promise(resolve => element.addEventListener(ComponentBase.ERROR_EVENT, resolve));
    document.body.append(element);
    assert(await settleOrTimeout(errored, 3000), 'no error event');
    assert(element.failed === true && element.loaded === false);
    assert(element.innerHTML.trim() === '', 'server error page was injected as the template');
});

test('a parent still loads when a child component fails', async () => {
    const element = await mount('t-parent');
    assert(element.loaded);
});

test('a failing <script> in the template does not block the component', async () => {
    const element = await mount('t-with-script');
    assert(element.querySelector('#s'));
});


// --- bindings ---

test('boolean properties follow the value (disabled=false must not disable)', async () => {
    const element = await mount('t-forms', { busy: false, on: true });
    const button = element.querySelector('#btn');
    assert(button.disabled === false, 'disabled=false disabled the button');
    element.state = { busy: true, on: false };
    assert(button.disabled === true && !button.hasAttribute('disabled') === false);
    assert(element.querySelector('#chk').checked === false);
    element.state = { busy: false, on: true };
    assert(button.disabled === false && !button.hasAttribute('disabled'), 'attribute left behind');
});

test('missing values render as empty, never as the string "undefined"', async () => {
    const element = await mount('t-forms', { text: 'x', title: 't' });
    element.state = {};
    assert(element.querySelector('#txt').value === '', `value="${element.querySelector('#txt').value}"`);
    assert(!element.querySelector('#evt').hasAttribute('title'));
});

test('javascript: URLs are refused in URL attributes', async () => {
    const element = await mount('t-forms', { url: 'javascript:alert(1)' });
    assert(!element.querySelector('#lnk').hasAttribute('href'));
    element.state = { url: ' JaVa\tScRiPt:alert(1)' };
    assert(!element.querySelector('#lnk').hasAttribute('href'), 'obfuscated scheme got through');
    element.state = { url: 'https://example.com/' };
    assert(element.querySelector('#lnk').getAttribute('href') === 'https://example.com/');
});

test('event handler attributes are never bound', async () => {
    const element = await mount('t-forms', { code: 'window.__pwned = 1', title: 'ok' });
    assert(!element.querySelector('#evt').hasAttribute('onclick'));
    assert(element.querySelector('#evt').getAttribute('title') === 'ok', 'safe attributes of the same element must still bind');
});

test('malformed data-bind JSON is skipped without breaking the render', async () => {
    const element = await mount('t-forms', { text: 'still renders' });
    assert(element.querySelector('#txt').value === 'still renders');
});

test('invalid data-state JSON is ignored and keeps the previous state', async () => {
    const element = await mount('t-forms', { text: 'good' });
    element.setAttribute('data-state', '{bad');
    assert(element.state.text === 'good');
    assert(element.querySelector('#txt').value === 'good');
});

// --- lists ---

test('editing a primitive list item writes back into the array', async () => {
    const element = await mount('t-primitives', { nums: ['a', 'b'] });
    const inputs = element.querySelectorAll('.pi');
    inputs[1].value = 'Z';
    inputs[1].dispatchEvent(new Event('change'));
    assert(JSON.stringify(element.state.nums) === '["a","Z"]', JSON.stringify(element.state.nums));
    assert(JSON.parse(element.getAttribute('data-state')).nums[1] === 'Z');
});

// --- nested components ---

test('a light-DOM child keeps its own bindings and refs (no parent scope leak)', async () => {
    const element = await mount('t-parent-light', { label: 'PARENT' });
    const kid = element.querySelector('#kid');
    await settleOrTimeout(kid.whenLoaded());
    assert(element.querySelector('.p').textContent === 'PARENT');
    assert(kid.querySelector('.c').textContent === 'CHILD', `child shows "${kid.querySelector('.c').textContent}"`);
    assert(element.refs.mine && element.refs.inner === undefined, 'parent collected the child\'s ref');
    assert(kid.refs.inner, 'child lost its own ref');
});

// --- loading infrastructure ---

test('a template is fetched once however many instances exist', async () => {
    const originalFetch = window.fetch;
    let count = 0;
    window.fetch = (input, ...rest) => { if (String(input).includes('cached.html')) count++; return originalFetch(input, ...rest); };
    try {
        const elements = Array.from({ length: 25 }, () => document.createElement('t-cached'));
        document.body.append(...elements);
        await Promise.all(elements.map(e => e.whenLoaded()));
        assert(count === 1, `fetched ${count} times for 25 instances`);
    } finally {
        window.fetch = originalFetch;
    }
});

test('script integrity (SRI) is enforced', async () => {
    const element = await mount('t-sri');
    await wait(300);
    assert(window.__sriProbeRan !== true, 'script with a wrong integrity hash executed');
});

test('ResizeObserver is released on disconnect and restored on reconnect', async () => {
    const element = await mount('t-observed');
    let disconnected = 0, observed = 0;
    const realDisconnect = element.resizeObserver.disconnect.bind(element.resizeObserver);
    const realObserve = element.resizeObserver.observe.bind(element.resizeObserver);
    element.resizeObserver.disconnect = () => { disconnected++; realDisconnect(); };
    element.resizeObserver.observe = target => { observed++; realObserve(target); };
    element.remove();
    assert(disconnected === 1, 'observer not disconnected');
    document.body.append(element);
    assert(observed === 1, 'observer not re-attached');
});

// --- nested lists ---

const groupsText = element => [...element.querySelectorAll('.g')].map(g =>
    g.querySelector('h4').textContent + ':' + [...g.querySelectorAll('.m')].map(m => m.textContent).join('')).join('|');

test('nested data-for renders, updates and reorders inner lists', async () => {
    const element = await mount('t-nested-list', { groups: [
        { id: 1, title: 'A', members: [{ id: 1, name: 'x' }, { id: 2, name: 'y' }] },
        { id: 2, title: 'B', members: [] },
    ] });
    assert(groupsText(element) === 'A:xy|B:', groupsText(element));
    element.state = { groups: [
        { id: 2, title: 'B', members: [{ id: 3, name: 'z' }] },
        { id: 1, title: 'A', members: [{ id: 2, name: 'y' }, { id: 1, name: 'x' }, { id: 4, name: 'w' }] },
    ] };
    assert(groupsText(element) === 'B:z|A:yxw', groupsText(element));
    element.state = { groups: [] };
    assert(groupsText(element) === '', groupsText(element));
});

test('nested data-for reuses the inner DOM nodes of a surviving key', async () => {
    const state = () => ({ groups: [{ id: 1, title: 'A', members: [{ id: 1, name: 'x' }, { id: 2, name: 'y' }] }] });
    const element = await mount('t-nested-list', state());
    const before = element.querySelectorAll('.m')[1];
    const next = state();
    next.groups[0].members[0].name = 'changed';
    element.state = next;
    assert(element.querySelectorAll('.m')[1] === before, 'inner node was recreated');
    assert(element.querySelectorAll('.m')[0].textContent === 'changed');
});

// --- computed / watchers ---

test('computed values feed bindings and watchers fire only when the value changes', async () => {
    const element = await mount('t-computed', { first: 'Ada', last: 'Lovelace' });
    assert(element.querySelector('#full').textContent === 'Ada Lovelace');
    assert(element.seen.length === 1 && element.seen[0][0] === 'Ada Lovelace' && element.seen[0][1] === undefined);
    element.state = { first: 'Ada', last: 'Lovelace', unrelated: 1 };
    assert(element.seen.length === 1, 'watcher fired with no change in its value');
    element.state = { first: 'Grace', last: 'Hopper' };
    assert(element.seen.length === 2 && element.seen[1][0] === 'Grace Hopper' && element.seen[1][1] === 'Ada Lovelace', JSON.stringify(element.seen));
});

test('watchers see changes made in place by two-way binding', async () => {
    const element = await mount('t-computed', { first: 'Ada', last: 'L' });
    const input = element.querySelector('#first');
    input.value = 'Eve';
    input.dispatchEvent(new Event('change'));
    assert(element.querySelector('#full').textContent === 'Eve L');
    assert(element.seen.at(-1)[0] === 'Eve L' && element.seen.at(-1)[1] === 'Ada L', JSON.stringify(element.seen));
});

test('watchers on a nested path fire when only that nested value changes', async () => {
    const element = await mount('t-computed', { first: 'a', meta: { count: 1 } });
    element.state = { first: 'a', meta: { count: 2 } };
    assert(element.seen.filter(entry => entry[0] === 'count').map(entry => entry[1]).join() === '1,2', JSON.stringify(element.seen));
});

// --- data-on ---

test('data-on calls the component method with the event and the scope', async () => {
    const element = await mount('t-events', { tasks: [{ id: 7, title: 'seven' }] });
    element.querySelector('#plain').click();
    assert(JSON.stringify(element.calls) === '[["plain","click",1]]', JSON.stringify(element.calls));
});

test('data-on inside data-for receives the right item, even after re-renders and reorders', async () => {
    const element = await mount('t-events', { tasks: [{ id: 1, title: 'one' }, { id: 2, title: 'two' }] });
    element.state = { tasks: [{ id: 2, title: 'two' }, { id: 3, title: 'three' }, { id: 1, title: 'one' }] };
    element.state = { tasks: [{ id: 3, title: 'three' }, { id: 2, title: 'two' }, { id: 1, title: 'one' }] };
    [...element.querySelectorAll('.task')].forEach(button => button.click());
    assert(JSON.stringify(element.calls) === '[["task",3],["task",2],["task",1]]', JSON.stringify(element.calls));
});

test('data-on registers one listener per element however many renders happen', async () => {
    const element = await mount('t-events', { tasks: [] });
    for (let i = 0; i < 5; i++) element.state = { tasks: [], n: i };
    element.querySelector('#plain').click();
    assert(element.calls.length === 1, `handler ran ${element.calls.length} times`);
});

test('data-on with an unknown method logs an error instead of throwing', async () => {
    const element = await mount('t-events', { tasks: [] });
    const errors = [];
    const original = console.error;
    console.error = (...args) => errors.push(args.join(' '));
    try { element.querySelector('#missing').click(); } finally { console.error = original; }
    assert(errors.length === 1 && errors[0].includes('nope'), errors.join());
});

// --- run ---

const originalConsoleLog = console.log;
console.log = () => {};                                  //silences the framework's debug logging
const originalConsoleError = console.error;
console.error = () => {};                                //failure paths log on purpose

const lines = [];
let failed = 0;
for (const { name, fn } of tests) {
    try {
        await fn();
        lines.push(`PASS ${name}`);
    } catch (error) {
        failed++;
        lines.push(`FAIL ${name}\n     ${error.message}`);
    }
}
console.log = originalConsoleLog;
console.error = originalConsoleError;

const summary = `${tests.length - failed}/${tests.length} passed`;
document.getElementById('results').textContent = lines.join('\n');
document.getElementById('summary').textContent = summary;
document.title = (failed ? 'FAIL ' : 'PASS ') + summary;
