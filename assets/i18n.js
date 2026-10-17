// Site internationalization, with no build step and no dependencies.
//
// English is the source language and is written directly in each page's HTML (so the site works,
// and is indexed, without JavaScript). Every other language is a dictionary in assets/i18n/<code>.js
// that maps the original English text to its translation:
//
//   export default {
//       strings: { [`Get started`]: `Comece agora` },   // text found in the pages' HTML
//       dynamic: { [`Running…`]: `Executando…` }        // text produced by JavaScript, via t()
//   };
//
// A "unit" is the smallest piece of translatable markup: an element holding text plus, at most,
// inline elements (<code>, <strong>, <a>…). Its key is its innerHTML with whitespace collapsed, so
// links and inline code travel inside the translation. Nothing needs to be marked in the HTML:
//   - translate="no" excludes an element (the standard HTML attribute);
//   - <pre>, <code>, scripts and the code windows' title bars are never translated, except for
//     comments inside code blocks (<span class="com">), which are units;
//   - alt, title, aria-label, placeholder and the meta description are translated as attributes.
//
// To add a language: create assets/i18n/<code>.js and add it to LANGUAGES below.

export const SOURCE_LANGUAGE = 'en';
const DEFAULT_LANGUAGE = 'pt';      // when the browser's languages match none of LANGUAGES
const STORAGE_KEY = 'ultima-lang';

export const LANGUAGES = {
    en: { name: 'English', htmlLang: 'en' },
    pt: { name: 'Português', htmlLang: 'pt-BR' },
    es: { name: 'Español', htmlLang: 'es' },
    zh: { name: '中文', htmlLang: 'zh-CN' },
    ja: { name: '日本語', htmlLang: 'ja' },
    it: { name: 'Italiano', htmlLang: 'it' }
};

//Proper names and identifiers that look like text but must never be translated.
const INVARIANT = new Set([
    'Ultima', 'Litedom', 'Alpine.js', 'Lit', 'Minze', 'VanJS', 'GitHub',
    'MIT', 'BSD-3-Clause', 'CC0 1.0', 'Web Components', 'Shadow DOM', 'Custom Elements'
]);

const INLINE_TAGS = new Set(['A', 'ABBR', 'B', 'BR', 'CODE', 'EM', 'I', 'KBD', 'SMALL', 'SPAN', 'STRONG', 'SUB', 'SUP']);
const SKIPPED = 'script, style, pre, code, svg, textarea, .barra, [translate="no"]';
const ATTRIBUTE_UNITS = [
    ['img[alt]', 'alt'],
    ['[aria-label]', 'aria-label'],
    ['[title]', 'title'],
    ['[placeholder]', 'placeholder'],
    ['meta[name="description"]', 'content']
];

const normalize = (text) => text.replace(/\s+/g, ' ').trim();
const hasLetters = (text) => /\p{L}/u.test(text);

/**
 * Finds every translatable unit under root: [{ element, attribute, source }], where attribute is
 * null for a unit whose content is the element's innerHTML.
 */
export function collectUnits(root = document) {
    const units = [];
    const mixed = [];

    const visit = (element) => {
        if (element.matches(SKIPPED)) {
            return;
        }
        const children = [...element.children];
        const hasOwnText = [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && hasLetters(node.textContent));
        if (hasOwnText) {
            if (children.every((child) => INLINE_TAGS.has(child.tagName))) {
                const source = normalize(element.innerHTML);
                if (!INVARIANT.has(normalize(element.textContent))) {
                    units.push({ element, attribute: null, source });
                }
            } else {
                mixed.push(element);
            }
            return;
        }
        children.forEach(visit);
    };
    visit(root.documentElement ?? root);

    //Comments in code samples are the one thing inside <pre> that is prose
    root.querySelectorAll('pre .com').forEach((element) => {
        if (!element.querySelector('*')) {
            units.push({ element, attribute: null, source: normalize(element.innerHTML) });
        }
    });

    ATTRIBUTE_UNITS.forEach(([selector, attribute]) => {
        root.querySelectorAll(selector).forEach((element) => {
            if (!element.closest('[translate="no"]') && hasLetters(element.getAttribute(attribute))) {
                units.push({ element, attribute, source: normalize(element.getAttribute(attribute)) });
            }
        });
    });

    mixed.forEach((element) => console.warn('i18n: text mixed with block elements, wrap the text in a <span>:', element));
    return units;
}

//Which language to show: ?lang=, then the saved choice, then the browser's, then the default.
function chooseLanguage() {
    const supported = (code) => (code && LANGUAGES[code.toLowerCase().split('-')[0]] ? code.toLowerCase().split('-')[0] : null);
    const fromUrl = supported(new URLSearchParams(location.search).get('lang'));
    if (fromUrl) {
        return fromUrl;
    }
    try {
        const saved = supported(localStorage.getItem(STORAGE_KEY));
        if (saved) {
            return saved;
        }
    } catch (e) {
        //Storage blocked (private window, site data disabled): just don't remember the choice
    }
    return (navigator.languages ?? [navigator.language]).map(supported).find(Boolean) ?? DEFAULT_LANGUAGE;
}

let currentLanguage = SOURCE_LANGUAGE;
let strings = new Map();
let dynamicStrings = new Map();
let units = [];
const listeners = new Set();
const dictionaries = new Map();

async function loadDictionary(code) {
    if (!dictionaries.has(code)) {
        try {
            dictionaries.set(code, (await import(`./i18n/${code}.js`)).default);
        } catch (error) {
            console.error(`i18n: could not load the "${code}" dictionary, showing ${SOURCE_LANGUAGE}.`, error);
            return null;
        }
    }
    return dictionaries.get(code);
}

/** Translates a string produced by JavaScript (status messages, labels…) into the current language. */
export function t(text) {
    return dynamicStrings.get(text) ?? strings.get(text) ?? text;
}

export const language = () => currentLanguage;

/** Registers a callback run after every language change (and returns a function that removes it). */
export function onLanguageChange(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
}

/** Registers the units of markup added after the page loaded, translating them right away. */
export function translateTree(root) {
    const added = collectUnits(root);
    units.push(...added);
    render(added);
}

function render(list) {
    for (const { element, attribute, source } of list) {
        const text = strings.get(source) ?? source;
        if (attribute) {
            element.setAttribute(attribute, text);
        } else if (element.innerHTML !== text) {
            element.innerHTML = text;
        }
    }
}

export async function setLanguage(code, { remember = true } = {}) {
    const dictionary = code === SOURCE_LANGUAGE ? {} : await loadDictionary(code);
    currentLanguage = dictionary ? code : SOURCE_LANGUAGE;
    strings = new Map(Object.entries(dictionary?.strings ?? {}));
    dynamicStrings = new Map(Object.entries(dictionary?.dynamic ?? {}));

    document.documentElement.lang = LANGUAGES[currentLanguage].htmlLang;
    render(units);
    if (remember) {
        try {
            localStorage.setItem(STORAGE_KEY, currentLanguage);
        } catch (e) {
            //See chooseLanguage()
        }
    }
    listeners.forEach((callback) => callback(currentLanguage));
}

function addLanguageSelector() {
    const nav = document.querySelector('.nav-site');
    if (!nav) {
        return;
    }
    const select = document.createElement('select');
    select.className = 'seletor-idioma';
    select.translate = false;
    select.innerHTML = Object.entries(LANGUAGES)
        .map(([code, { name }]) => `<option value="${code}" lang="${code}">${name}</option>`).join('');
    select.value = currentLanguage;
    select.addEventListener('change', async () => {
        //An explicit choice replaces any ?lang= the page was opened with
        const url = new URL(location.href);
        if (url.searchParams.has('lang')) {
            url.searchParams.delete('lang');
            history.replaceState(null, '', url);
        }
        await setLanguage(select.value);
    });
    onLanguageChange((code) => {
        select.value = code;
        select.setAttribute('aria-label', t('Language'));
    });
    nav.insertBefore(select, nav.querySelector('.botao-github'));
}

async function start() {
    //Module scripts run after the document is parsed, so the whole page is already there
    try {
        units = collectUnits(document);
        addLanguageSelector();
        await setLanguage(chooseLanguage(), { remember: false });
    } finally {
        //Reveals the page (see "i18n-ok" in estilo.css), translated or not
        document.documentElement.classList.add('i18n-ok');
    }
}

//Only pages of the site (the ones with the navigation bar) translate themselves; anything else
//that imports this module, like the test suite, just uses collectUnits()
if (document.querySelector('.nav-site')) {
    await start();
}
