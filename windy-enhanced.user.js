// ==UserScript==
// @name         Windy Enhanced - Cores, Interface e Controles
// @namespace    https://www.windy.com/
// @version      6.1.0
// @description  Melhora a interface do Windy com opções visuais, visualização limpa, favoritos de visualização e controles opcionais da linha do tempo.
// @author       Henrique / Puglia Apps
// @match        https://www.windy.com/*
// @match        https://windy.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=windy.com
// @homepageURL  https://github.com/hpuglia/windy-enhanced
// @supportURL   https://github.com/hpuglia/windy-enhanced/issues
// @downloadURL  https://raw.githubusercontent.com/hpuglia/windy-enhanced/main/windy-enhanced.user.js
// @updateURL    https://raw.githubusercontent.com/hpuglia/windy-enhanced/main/windy-enhanced.user.js
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    // Windy Enhanced 6.1 - interface local. Nenhuma requisição externa,
    // alteração de credenciais ou simulação de assinatura.
    const VERSION = '6.1.0';
    const STORAGE_KEY = 'windy-enhanced:v6:settings';
    const ALLOWED_VIEW_ORIGINS = new Set(['https://windy.com', 'https://www.windy.com']);
    const DEFAULTS = Object.freeze({
        restoreColors: true,
        hidePromos: true,
        focusMode: false,
        savedView: null
    });

    const PROMO_LABELS = [
        /^(?:get|go|buy|try|unlock|subscribe to|upgrade to)\s+(?:windy\s+)?premium(?:\s+now)?$/i,
        /^(?:assine|assinar|obter|seja|experimente|desbloqueie)\s+(?:o\s+)?(?:windy\s+)?premium(?:\s+agora)?$/i,
        /^(?:windy\s+)?premium$/i
    ];

    function safeView(value) {
        if (!value || typeof value !== 'object') return null;
        if (typeof value.url !== 'string' || value.url.length > 2500) return null;
        try {
            const url = new URL(value.url);
            if (!ALLOWED_VIEW_ORIGINS.has(url.origin) || url.username || url.password) return null;
            return {
                url: url.toString(),
                savedAt: typeof value.savedAt === 'string' ? value.savedAt.slice(0, 40) : ''
            };
        } catch (_) {
            return null;
        }
    }

    function sanitize(input) {
        const obj = input && typeof input === 'object' ? input : {};
        return {
            restoreColors: typeof obj.restoreColors === 'boolean' ? obj.restoreColors : DEFAULTS.restoreColors,
            hidePromos: typeof obj.hidePromos === 'boolean' ? obj.hidePromos : DEFAULTS.hidePromos,
            focusMode: typeof obj.focusMode === 'boolean' ? obj.focusMode : DEFAULTS.focusMode,
            savedView: safeView(obj.savedView)
        };
    }

    function load() {
        try { return sanitize(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')); }
        catch (_) { return sanitize({}); }
    }

    let settings = load();
    let panel, launcher, panelClose, uiRoot, statusText, viewText;
    const toggles = new Map();

    function persist() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); }
        catch (_) { setStatus('Não foi possível gravar as preferências neste navegador.'); }
    }

    function setStatus(message) {
        if (statusText) statusText.textContent = message;
    }

    function addCSS(css) {
        if (typeof GM_addStyle === 'function') {
            GM_addStyle(css);
            return;
        }
        const style = document.createElement('style');
        style.textContent = css;
        const target = document.head || document.documentElement;
        if (target) target.appendChild(style);
        else document.addEventListener('DOMContentLoaded', () => document.head.appendChild(style), { once: true });
    }

    // Núcleo visual da versão 5.1, agora com opções ativáveis.
    addCSS(`
        html.we-hide-promos #desktop-premium-icon,
        html.we-hide-promos .get-premium,
        html.we-hide-promos .premium-button,
        html.we-hide-promos .plugin-paywall-overlay,
        html.we-hide-promos .paywall-banner,
        html.we-hide-promos .modal-content-paywall,
        html.we-hide-promos a[href*="/premium"],
        html.we-hide-promos a[href*="upgrade"],
        html.we-hide-promos [data-plugin="startup-articles"],
        html.we-hide-promos .map-selector a.clickable:has(.premium-flag),
        html.we-hide-promos .map-selector [role="button"]:has(.premium-flag),
        html.we-hide-promos [data-we-promo-hidden="1"] {
            display: none !important;
        }

        html.we-restore-colors .premium-calendar #map-container,
        html.we-restore-colors .premium-calendar #map-container #leaflet-map {
            filter: none !important;
            -webkit-filter: none !important;
        }
        html.we-restore-colors .premium-calendar #map-container #leaflet-map {
            animation: none !important;
        }
        html.we-restore-colors .premium-calendar #map-container::after {
            background-image: none !important;
            display: none !important;
            content: none !important;
        }

        /* Modo de visualização limpa: apenas elementos auxiliares conhecidos.
           O mapa, a legenda e a timeline continuam disponíveis. */
        html.we-focus #search,
        html.we-focus #detail-box-desktop,
        html.we-focus #plugin-detail,
        html.we-focus #desktop-menu,
        html.we-focus #mobile-ovr-select,
        html.we-focus [data-plugin="startup-articles"] {
            display: none !important;
        }

        #we-root { position: fixed; top: 74px; right: 14px; z-index: 2147483645;
            color: #f0f4fb; font: 13px/1.45 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
            direction: ltr; text-align: left; pointer-events: none; }
        #we-root * { box-sizing: border-box; }
        #we-launcher { pointer-events: auto; display: flex; align-items: center; justify-content: center;
            margin-left: auto; width: 42px; height: 42px; border-radius: 13px;
            background: #172338; color: #fff; border: 1px solid #465b75;
            box-shadow: 0 5px 18px rgba(0,0,0,.3); font-size: 23px; cursor: pointer; }
        #we-launcher:hover, #we-launcher:focus-visible { background: #253d5f; }
        #we-panel { pointer-events: auto; display: none; width: min(355px, calc(100vw - 28px));
            max-height: min(76vh, 680px); overflow-y: auto; margin-top: 9px;
            background: #121d30; color: #edf3fa; border: 1px solid #405270;
            border-radius: 15px; padding: 15px; box-shadow: 0 13px 35px rgba(0,0,0,.44); }
        #we-panel.we-open { display: block; }
        #we-panel .we-header { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 5px; }
        #we-panel .we-heading { display: flex; align-items: center; gap: 8px; min-width: 0; }
        #we-panel h2 { font: 700 17px/1.3 system-ui,sans-serif; margin: 0; color: #fff; }
        #we-panel h3 { font: 700 12px/1.3 system-ui,sans-serif; text-transform: uppercase;
            letter-spacing: .07em; color: #a8c0df; margin: 15px 0 8px; }
        #we-panel p { margin: 4px 0 12px; color: #afc0d5; }
        #we-panel .we-version { font-size: 11px; color: #b4c7e1; white-space: nowrap; }
        #we-panel .we-setting { display: flex; justify-content: space-between; align-items: center;
            gap: 13px; padding: 10px 0; border-top: 1px solid #2e3d54; cursor: pointer; }
        #we-panel .we-setting span { display: block; }
        #we-panel .we-setting small { display: block; color: #abbcd1; margin-top: 3px; font-size: 11px; }
        #we-panel input[type="checkbox"] { appearance: auto; width: 18px; height: 18px; margin: 0;
            accent-color: #61a8ff; flex-shrink: 0; cursor: pointer; }
        #we-panel .we-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
        #we-panel button.we-action { appearance: none; background: #273b58; color: #f8faff;
            border: 1px solid #526b8d; border-radius: 9px; padding: 9px 7px; font: inherit;
            cursor: pointer; min-height: 35px; }
        #we-panel button.we-action:hover, #we-panel button.we-action:focus-visible { background: #35547c; }
        #we-panel button.we-action:disabled { opacity: .55; cursor: not-allowed; }
        #we-panel .we-close { appearance: none; width: 32px; height: 32px; flex: 0 0 auto;
            border: 0; border-radius: 8px; background: transparent; color: #dbe7f7;
            font: 24px/1 system-ui,sans-serif; cursor: pointer; }
        #we-panel .we-close:hover, #we-panel .we-close:focus-visible { background: #2a405f; color: #fff; }
        #we-panel .we-full { grid-column: 1 / -1; }
        #we-panel .we-status { min-height: 17px; margin-top: 10px; font-size: 11px; color: #c5d6ef; }
        #we-panel .we-detail { font-size: 11px; color: #acbdd2; margin: 5px 0 10px; overflow-wrap: anywhere; }
        #we-panel kbd { padding: 1px 5px; border: 1px solid #6b7c95; border-radius: 4px; color: #fff; font: inherit; }
        #we-import { display: none !important; }
        @media (max-width: 600px) {
            #we-root { right: 9px; top: 59px; }
            #we-launcher { width: 39px; height: 39px; }
            #we-panel { max-height: 68vh; }
        }
    `);

    function applySettings() {
        const html = document.documentElement;
        if (html) {
            html.classList.toggle('we-hide-promos', settings.hidePromos);
            html.classList.toggle('we-restore-colors', settings.restoreColors);
            html.classList.toggle('we-focus', settings.focusMode);
        }
        for (const [name, input] of toggles) input.checked = settings[name];
        if (viewText) {
            viewText.textContent = settings.savedView
                ? `Vista salva em ${settings.savedView.savedAt || 'data desconhecida'}.`
                : 'Nenhuma vista salva.';
        }
    }

    if (document.documentElement) applySettings();
    else document.addEventListener('readystatechange', applySettings, { once: true });

    // Usa classes CSS para ocultar elementos; não remove nós, nem sobrescreve
    // o estado de assinatura do site. Examina apenas os nós inseridos.
    function scanForPromos(root) {
        if (!settings.hidePromos || !root || root.nodeType !== 1) return;
        const nodes = [];
        if (root.matches?.('a,button,[role="button"]')) nodes.push(root);
        if (root.querySelectorAll) nodes.push(...root.querySelectorAll('a,button,[role="button"]'));
        for (const el of nodes) {
            if (el.closest('#we-root') || el.hasAttribute('data-we-promo-hidden')) continue;
            const label = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
            if (label.length > 65 || !PROMO_LABELS.some(re => re.test(label))) continue;
            el.setAttribute('data-we-promo-hidden', '1');
        }
    }

    let pending = new Set();
    let scanTimer = null;
    function scheduleScan(node) {
        if (!settings.hidePromos || !node || node.nodeType !== 1) return;
        pending.add(node);
        if (scanTimer !== null) return;
        scanTimer = window.setTimeout(() => {
            scanTimer = null;
            const batch = [...pending];
            pending.clear();
            for (const item of batch) if (item.isConnected) scanForPromos(item);
        }, 200);
    }

    function addButton(parent, label, onClick, full = false) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'we-action' + (full ? ' we-full' : '');
        btn.textContent = label;
        btn.addEventListener('click', onClick);
        parent.appendChild(btn);
        return btn;
    }

    function addSetting(parent, name, title, hint) {
        const label = document.createElement('label');
        label.className = 'we-setting';
        const copy = document.createElement('span');
        const text = document.createElement('span');
        text.textContent = title;
        const small = document.createElement('small');
        small.textContent = hint;
        copy.append(text, small);
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = settings[name];
        checkbox.addEventListener('change', () => {
            settings[name] = checkbox.checked;
            persist();
            applySettings();
            if (name === 'hidePromos' && settings.hidePromos) scheduleScan(document.body);
            setStatus(`${title}: ${checkbox.checked ? 'ativado' : 'desativado'}.`);
        });
        label.append(copy, checkbox);
        parent.appendChild(label);
        toggles.set(name, checkbox);
    }

    function section(parent, title) {
        const heading = document.createElement('h3');
        heading.textContent = title;
        parent.appendChild(heading);
    }

    // A API pública documenta um store, mas a página principal pode não expô-lo.
    // Só usamos o controle de tempo quando o objeto encontrado for compatível.
    function compatibleTimeStore() {
        const options = [window.W?.store, window.windyAPI?.store];
        return options.find(s => s && typeof s.get === 'function' &&
            typeof s.getAllowed === 'function' && typeof s.set === 'function') || null;
    }

    function changeTime(direction) {
        const store = compatibleTimeStore();
        if (!store) {
            setStatus('Controle interno indisponível. Use as setas ←/→ do próprio Windy.');
            return;
        }
        try {
            const allowed = store.getAllowed('timestamp');
            const current = Number(store.get('timestamp'));
            if (!Array.isArray(allowed) || !Number.isFinite(current)) throw new Error('timestamp indisponível');
            const steps = [...new Set(allowed.map(Number).filter(Number.isFinite))].sort((a, b) => a - b);
            if (steps.length < 2) throw new Error('intervalos indisponíveis');
            let target;
            if (direction > 0) target = steps.find(t => t > current);
            else target = [...steps].reverse().find(t => t < current);
            if (target === undefined) {
                setStatus('Fim dos horários disponíveis para este modelo.');
                return;
            }
            store.set('timestamp', target);
            setStatus(`Horário selecionado: ${new Date(target).toLocaleString('pt-BR')}.`);
        } catch (_) {
            setStatus('Linha do tempo incompatível nesta página. Use as setas ←/→.');
        }
    }

    function saveCurrentView() {
        settings.savedView = { url: location.href, savedAt: new Date().toLocaleString('pt-BR') };
        persist();
        applySettings();
        setStatus('Vista atual salva neste navegador.');
    }

    function openSavedView() {
        const view = safeView(settings.savedView);
        if (!view) { setStatus('Salve uma vista primeiro.'); return; }
        location.assign(view.url);
    }

    function exportConfig() {
        const payload = { app: 'windy-enhanced', version: 6, exportedAt: new Date().toISOString(), settings };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'windy-enhanced-config.json';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        setStatus('Configurações exportadas.');
    }

    function importConfig(file) {
        if (!file || file.size > 64 * 1024) { setStatus('Selecione um JSON de até 64 KB.'); return; }
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const payload = JSON.parse(String(reader.result));
                if (payload.app !== 'windy-enhanced' || payload.version !== 6 ||
                    !payload.settings || typeof payload.settings !== 'object') {
                    throw new Error('formato incorreto');
                }
                settings = sanitize(payload.settings);
                persist();
                applySettings();
                if (settings.hidePromos) scheduleScan(document.body);
                setStatus('Configurações importadas.');
            } catch (_) { setStatus('Arquivo de configuração inválido.'); }
        };
        reader.onerror = () => setStatus('Não foi possível ler o arquivo.');
        reader.readAsText(file);
    }

    function togglePanel(force) {
        if (!panel || !launcher) return;
        const willOpen = typeof force === 'boolean' ? force : !panel.classList.contains('we-open');
        panel.classList.toggle('we-open', willOpen);
        launcher.setAttribute('aria-expanded', String(willOpen));
        if (willOpen) {
            setStatus('Preferências aplicadas localmente.');
            window.setTimeout(() => panelClose?.focus(), 0);
        } else if (panel.contains(document.activeElement)) {
            launcher.focus();
        }
    }

    function initUI() {
        if (!document.body || document.getElementById('we-root')) return;
        uiRoot = document.createElement('div');
        uiRoot.id = 'we-root';
        launcher = document.createElement('button');
        launcher.id = 'we-launcher';
        launcher.type = 'button';
        launcher.textContent = '⚙';
        launcher.title = 'Windy Enhanced — configurações';
        launcher.setAttribute('aria-label', 'Abrir configurações do Windy Enhanced');
        launcher.setAttribute('aria-expanded', 'false');
        launcher.setAttribute('aria-controls', 'we-panel');
        launcher.addEventListener('click', () => togglePanel());

        panel = document.createElement('section');
        panel.id = 'we-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'false');
        panel.setAttribute('aria-labelledby', 'we-title');
        const header = document.createElement('div');
        header.className = 'we-header';
        const heading = document.createElement('div');
        heading.className = 'we-heading';
        const title = document.createElement('h2');
        title.id = 'we-title';
        title.textContent = 'Windy Enhanced';
        const version = document.createElement('span');
        version.className = 'we-version';
        version.textContent = `v${VERSION}`;
        heading.append(title, version);
        panelClose = document.createElement('button');
        panelClose.type = 'button';
        panelClose.className = 'we-close';
        panelClose.textContent = '×';
        panelClose.title = 'Fechar painel';
        panelClose.setAttribute('aria-label', 'Fechar configurações');
        panelClose.addEventListener('click', () => togglePanel(false));
        header.append(heading, panelClose);
        panel.appendChild(header);
        const intro = document.createElement('p');
        intro.textContent = 'Personalize o mapa sem alterar sua conta ou os dados meteorológicos.';
        panel.appendChild(intro);
        section(panel, 'Visual');
        addSetting(panel, 'restoreColors', 'Cores do mapa', 'Remove filtros visuais locais quando presentes.');
        addSetting(panel, 'hidePromos', 'Ocultar chamadas Premium', 'Esconde banners e botões promocionais reconhecidos.');
        addSetting(panel, 'focusMode', 'Modo visualização limpa', 'Oculta elementos auxiliares sem esconder o mapa ou a linha do tempo.');

        section(panel, 'Linha do tempo');
        const timeButtons = document.createElement('div');
        timeButtons.className = 'we-buttons';
        addButton(timeButtons, '← Anterior', () => changeTime(-1));
        addButton(timeButtons, 'Próximo →', () => changeTime(1));
        panel.appendChild(timeButtons);
        const shortcuts = document.createElement('div');
        shortcuts.className = 'we-detail';
        shortcuts.textContent = 'No Windy: ←/→ muda o horário; +/- controla o zoom. Enhanced: Alt+Shift+E abre este painel; Alt+Shift+L alterna o modo limpo. Os botões acima exigem API compatível.';
        panel.appendChild(shortcuts);

        section(panel, 'Minha visualização');
        const viewButtons = document.createElement('div');
        viewButtons.className = 'we-buttons';
        addButton(viewButtons, 'Salvar vista', saveCurrentView);
        addButton(viewButtons, 'Abrir vista', openSavedView);
        panel.appendChild(viewButtons);
        viewText = document.createElement('div');
        viewText.className = 'we-detail';
        panel.appendChild(viewText);

        section(panel, 'Backup e manutenção');
        const backupButtons = document.createElement('div');
        backupButtons.className = 'we-buttons';
        addButton(backupButtons, 'Exportar JSON', exportConfig);
        addButton(backupButtons, 'Importar JSON', () => fileInput.click());
        const fileInput = document.createElement('input');
        fileInput.id = 'we-import';
        fileInput.type = 'file';
        fileInput.accept = '.json,application/json';
        fileInput.addEventListener('change', () => {
            const [file] = fileInput.files || [];
            if (file) importConfig(file);
            fileInput.value = '';
        });
        addButton(backupButtons, 'Restaurar padrões', () => {
            if (!window.confirm('Restaurar todas as preferências do Windy Enhanced?')) return;
            settings = sanitize({});
            persist();
            applySettings();
            scheduleScan(document.body);
            setStatus('Preferências restauradas aos padrões.');
        }, true);
        panel.appendChild(backupButtons);
        panel.appendChild(fileInput);

        statusText = document.createElement('div');
        statusText.className = 'we-status';
        statusText.setAttribute('role', 'status');
        statusText.setAttribute('aria-live', 'polite');
        panel.appendChild(statusText);
        uiRoot.append(launcher, panel);
        document.body.appendChild(uiRoot);
        applySettings();
        setStatus('Pronto para uso.');
    }

    // Alt + Shift + E abre o painel; Alt + Shift + L alterna modo limpo.
    document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape' && panel?.classList.contains('we-open')) {
            ev.preventDefault();
            togglePanel(false);
            return;
        }
        if (!ev.altKey || !ev.shiftKey || ev.ctrlKey || ev.metaKey) return;
        const key = ev.key.toLowerCase();
        if (key === 'e') {
            ev.preventDefault();
            togglePanel();
        } else if (key === 'l') {
            ev.preventDefault();
            settings.focusMode = !settings.focusMode;
            persist();
            applySettings();
            setStatus(settings.focusMode ? 'Visualização limpa ativada.' : 'Visualização limpa desativada.');
        }
    }, true);

    if (typeof GM_registerMenuCommand === 'function') {
        GM_registerMenuCommand('Windy Enhanced — configurações', () => togglePanel(true));
    }

    // Mantém preferências coerentes quando há mais de uma aba do Windy aberta.
    window.addEventListener('storage', ev => {
        if (ev.key !== STORAGE_KEY) return;
        settings = load();
        applySettings();
        if (settings.hidePromos) scheduleScan(document.body);
        setStatus('Preferências sincronizadas de outra aba.');
    });

    function start() {
        applySettings();
        initUI();
        scheduleScan(document.body);
        const observer = new MutationObserver(records => {
            if (!settings.hidePromos) return;
            for (const record of records) {
                for (const node of record.addedNodes) scheduleScan(node);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else start();
})();
