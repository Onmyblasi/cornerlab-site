/**
 * Handle dynamic asset processing and DOM rendering
 */
const ArchiveManager = {
    dataSource: './data/notes.json',
    targetSelector: '#dynamic-notes-target',

    async init() {
        const container = document.querySelector(this.targetSelector);
        if (!container) return;

        try {
            const response = await fetch(this.dataSource);
            if (!response.ok) throw new Error(`HTTP network anomaly status: ${response.status}`);
            const data = await response.json();
            
            this.renderNotesArchive(data, container);
        } catch (error) {
            console.error('Data pipeline failure:', error);
            container.innerHTML = `<p style="font-family:var(--font-mono); font-size:0.8rem; color:var(--text-muted); padding:2rem 0;">Unable to connect to lab notes archive infrastructure.</p>`;
        }
    },

    renderNotesArchive(items, mountPoint) {
        // Clear SSR or fallback elements safely
        mountPoint.innerHTML = '';

        items.forEach(item => {
            const anchor = document.createElement('a');
            anchor.href = `lab/${item.slug}`;
            anchor.className = 'note-row';
            
            anchor.innerHTML = `
                <span class="note-index">${item.id}</span>
                <h3 class="note-heading">${item.title}</h3>
                <span class="note-action">READ ARCHIVE ↗</span>
            `;

            mountPoint.appendChild(anchor);
        });
    }
};

/**
 * Modular Client UX Behavior Management
 */
const InteractionEngine = {
    translations: null,
    currentLang: 'en',

    async init() {
        await this.loadTranslations();
        this.processLanguageToggles();
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

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            const value = this.translations[lang][key];
            if (value) el.innerHTML = value;
        });
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    ArchiveManager.init();
    await InteractionEngine.init();
});