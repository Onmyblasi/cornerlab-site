/**
 * Handle dynamic asset processing and DOM rendering
 */

/**
 * Modular Client UX Behavior Management
 */


const ArchiveManager = {
    dataSource: './data/notes.json',
    targetSelector: '#dynamic-notes-target',
    items: null,

    async init() {
        const container = document.querySelector(this.targetSelector);
        if (!container) return;

        try {
            const response = await fetch(this.dataSource);
            if (!response.ok) throw new Error(`HTTP network anomaly status: ${response.status}`);
            this.items = await response.json();

            this.renderNotesArchive(this.items, container);
        } catch (error) {
            console.error('Data pipeline failure:', error);
            container.innerHTML = `<p style="font-family:var(--font-mono); font-size:0.8rem; color:var(--text-muted); padding:2rem 0;">Unable to connect to lab notes archive infrastructure.</p>`;
        }
    },

    rerender() {
        const container = document.querySelector(this.targetSelector);
        if (!container || !this.items) return;
        this.renderNotesArchive(this.items, container);
    },

    renderNotesArchive(items, mountPoint) {
        mountPoint.innerHTML = '';

        const lang = document.documentElement.lang === 'es' ? 'es' : 'en';
        const visibles = items.filter(item => item.published);

        if (!visibles.length) {
            mountPoint.innerHTML = `<p style="font-family:var(--font-mono); font-size:0.8rem; color:var(--text-muted); padding:2rem 0;">First entries coming soon.</p>`;
            return;
        }

        visibles.forEach(item => {
            const anchor = document.createElement('a');
            anchor.href = `lab/${item.slug}`;
            anchor.className = 'note-row';

            const title = lang === 'es' ? item.title_es : item.title_en;

            anchor.innerHTML = `
                <span class="note-index">${item.id}</span>
                <h3 class="note-heading">${title}</h3>
                <span class="note-action">READ ARCHIVE ↗</span>
            `;

            mountPoint.appendChild(anchor);
        });
    }
};

const InteractionEngine = {
    translations: null,
    currentLang: 'en',

    async init() {
        await this.loadTranslations();
        this.processLanguageToggles();

        const saved = localStorage.getItem('cornerlab-lang');
        if (saved && saved !== this.currentLang) {
            this.applyTranslations(saved);
            this.currentLang = saved;

            document.querySelectorAll('.lang-selector span').forEach(s => {
                s.classList.toggle('active', s.dataset.lang === saved);
            });
        }
    },

    async loadTranslations() {
        try {
            const response = await fetch('./data/translations.json');
            this.translations = await response.json();
        } catch (error) {
            console.error('Translation pipeline failure:', error);
        }
    },

    processLanguageToggles() {
        const selectors = document.querySelectorAll('.lang-selector span');
        selectors.forEach(span => {
            span.addEventListener('click', (e) => {
                const lang = e.target.dataset.lang;
                if (!lang) return;
                if (lang === this.currentLang) return;

                selectors.forEach(s => s.classList.remove('active'));
                e.target.classList.add('active');

                this.applyTranslations(lang);
                this.currentLang = lang;
            });
        });
    },

    applyTranslations(lang) {
        if (!this.translations || !this.translations[lang]) return;

        document.documentElement.lang = lang;
        localStorage.setItem('cornerlab-lang', lang);

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            const value = this.translations[lang][key];
            if (value) el.innerHTML = value;
        });

        document.querySelectorAll('[data-i18n-href]').forEach(el => {
            const map = JSON.parse(el.dataset.i18nHref);
            if (map[lang]) el.href = map[lang];
        });

        ArchiveManager.rerender();
    }
};

const ContactForm = {
    endpoint: 'https://api.simplyforms.app/v1/forms/MANGToXFLvuVxXwoESXIXw',

    init() {
        const form = document.querySelector('#contact-form');
        if (!form) return;
        const status = document.querySelector('#form-status');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Honeypot: si viene relleno, es un bot. Fingimos éxito y no enviamos.
            if (form.website_url.value !== '') {
                status.classList.remove('is-error');
                status.textContent = 'Message sent. Thank you!';
                form.reset();
                return;
            }

            const button = form.querySelector('button[type="submit"]');
            button.disabled = true;
            status.textContent = 'Sending...';

            const data = new FormData(form);
            data.delete('website_url');

            try {
                const response = await fetch(this.endpoint, {
                    method: 'POST',
                    body: data,
                    headers: { 'Accept': 'application/json' }
                });

                if (!response.ok) throw new Error(`Status ${response.status}`);

                status.classList.remove('is-error');
                status.textContent = 'Message sent. Thank you!';
                form.reset();
            } catch (error) {
                console.error('Form submission failed:', error);
                status.classList.add('is-error');
                status.textContent = 'Something went wrong. Please write to contact@cornerlab.me instead.';
            } finally {
                button.disabled = false;
            }
        });
    }
};

const ThemeToggle = {
    init() {
        const button = document.querySelector('.lamp-toggle');
        if (!button) return;

        const saved = localStorage.getItem('cornerlab-theme');
        if (saved === 'light') this.apply('light', button);

        button.addEventListener('click', () => {
            const current = document.documentElement.dataset.theme;
            this.apply(current === 'light' ? 'dark' : 'light', button);
        });
    },

    apply(theme, button) {
        if (theme === 'light') {
            document.documentElement.dataset.theme = 'light';
        } else {
            delete document.documentElement.dataset.theme;
        }
        localStorage.setItem('cornerlab-theme', theme);
        button.setAttribute('aria-pressed', theme === 'light');
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    await ArchiveManager.init();
    ContactForm.init();
    ThemeToggle.init();
    await InteractionEngine.init();
});

