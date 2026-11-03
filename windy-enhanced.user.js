// ==UserScript==
// @name         Windy Enhanced - Cores, Interface e Controles
// @namespace    https://www.windy.com/
// @version      6.4.2
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
// @grant        unsafeWindow
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    // Windy Enhanced 6.4 - interface local. Nenhuma requisição externa,
    // alteração de credenciais ou simulação de assinatura.
    const VERSION = '6.4.2';
    const STORAGE_KEY = 'windy-enhanced:v6:settings';
    const ALLOWED_VIEW_ORIGINS = new Set(['https://windy.com', 'https://www.windy.com']);
    const DEFAULTS = Object.freeze({
        restoreColors: true,
        hideLogo: true,
        hideBranding: true,
        hideArchive: true,
        hidePromos: true,
        shadows: true,
        shadowIntensity: 78,
        layersCollapsed: false,
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
            hideLogo: typeof obj.hideLogo === 'boolean' ? obj.hideLogo : DEFAULTS.hideLogo,
            hideBranding: typeof obj.hideBranding === 'boolean' ? obj.hideBranding : DEFAULTS.hideBranding,
            hideArchive: typeof obj.hideArchive === 'boolean' ? obj.hideArchive : DEFAULTS.hideArchive,
            hidePromos: typeof obj.hidePromos === 'boolean' ? obj.hidePromos : DEFAULTS.hidePromos,
            shadows: typeof obj.shadows === 'boolean' ? obj.shadows : DEFAULTS.shadows,
            shadowIntensity: Number.isFinite(Number(obj.shadowIntensity))
                ? Math.min(100, Math.max(20, Math.round(Number(obj.shadowIntensity))))
                : DEFAULTS.shadowIntensity,
            layersCollapsed: typeof obj.layersCollapsed === 'boolean' ? obj.layersCollapsed : DEFAULTS.layersCollapsed,
            focusMode: typeof obj.focusMode === 'boolean' ? obj.focusMode : DEFAULTS.focusMode,
            savedView: safeView(obj.savedView)
        };
    }

    function load() {
        try { return sanitize(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')); }
        catch (_) { return sanitize({}); }
    }

    let settings = load();
    let panel, launcher, cleanToggle, panelClose, uiRoot, statusText, viewText;
    let shadowRange, shadowValue, layersToggle, managedMenu;
    let dragState = null;
    let layoutTimer = null;
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
        /* O Windy reutiliza .premium-flag para as coroas de horários, dias e
           opções Premium. Ocultamos somente o marcador, preservando o texto. */
        html.we-hide-promos .premium-flag,
        html.we-hide-promos [class^="premium-flag"],
        html.we-hide-promos [class*=" premium-flag"],
        html.we-hide-promos .premium-crown,
        html.we-hide-promos [data-ref="premium-flag"],
        html.we-hide-promos [data-ref="premiumFlag"],
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

        /* Modo limpo: mantém o mapa e a atribuição cartográfica, removendo
           barras, painéis e controles sobrepostos conhecidos do Windy. */
        html.we-focus #logo-wrapper,
        html.we-focus #search,
        html.we-focus #detail-box-desktop,
        html.we-focus #plugin-detail,
        html.we-focus #desktop-menu,
        html.we-focus #mobile-ovr-select,
        html.we-focus [data-plugin="startup-articles"],
        html.we-focus #bottom-wrapper,
        html.we-focus [data-plugin="bottom-controls-desktop"],
        html.we-focus [data-plugin="bottom-controls-mobile"],
        html.we-focus [data-plugin="bottom-below-controls-mobile"],
        html.we-focus #legend-mobile,
        html.we-focus .metric-legend,
        html.we-focus #bottom-credits,
        html.we-focus .rhpane,
        html.we-focus [data-plugin="bottom-right"],
        html.we-focus [data-plugin="mobile-ui"],
        html.we-focus #plugin-mobile-ui,
        html.we-focus .leaflet-control-container,
        html.we-focus .maplibregl-control-container {
            display: none !important;
        }

        /* A ocultação do logotipo é independente do modo limpo. */
        html.we-hide-logo #logo-wrapper {
            display: none !important;
        }

        /* Selos institucionais exibidos sobre o mapa. A atribuição
           cartográfica permanece intacta nos controles próprios do mapa. */
        html.we-hide-branding #bottom-credits,
        html.we-hide-branding .bottom-credits,
        html.we-hide-branding [data-plugin="bottom-credits"] {
            display: none !important;
        }

        html.we-hide-archive [data-we-archive-control="1"] {
            display: none !important;
        }

        /* Sombras graduais preservam o mapa e aumentam o contraste somente
           ao redor dos grupos de interface. */
        html.we-shadows #search {
            filter: drop-shadow(18px 22px var(--we-shadow-blur, 47px) rgba(0,0,0,var(--we-shadow-alpha, .81)))
                drop-shadow(8px 10px var(--we-shadow-blur-small, 23px) rgba(0,0,0,var(--we-shadow-soft-alpha, .45)));
        }
        html.we-shadows .rhpane,
        html.we-shadows #desktop-menu {
            filter: drop-shadow(-24px 0 var(--we-shadow-blur, 47px) rgba(0,0,0,var(--we-shadow-alpha, .81)))
                drop-shadow(-10px 0 var(--we-shadow-blur-small, 23px) rgba(0,0,0,var(--we-shadow-soft-alpha, .45)));
        }
        html.we-shadows [data-plugin="bottom-controls-desktop"],
        html.we-shadows [data-plugin="bottom-controls-mobile"],
        html.we-shadows .metric-legend {
            filter: drop-shadow(0 -24px var(--we-shadow-blur, 47px) rgba(0,0,0,var(--we-shadow-alpha, .81)))
                drop-shadow(0 -10px var(--we-shadow-blur-small, 23px) rgba(0,0,0,var(--we-shadow-soft-alpha, .45)));
        }
        html.we-shadows .leaflet-control-container,
        html.we-shadows .maplibregl-control-container {
            filter: drop-shadow(0 10px var(--we-shadow-blur-small, 23px) rgba(0,0,0,var(--we-shadow-alpha, .81)));
        }
        html.we-shadows #we-quick-controls {
            filter: drop-shadow(0 0 var(--we-shadow-blur-small, 23px) rgba(0,0,0,var(--we-shadow-alpha, .81)));
        }

        html.we-layers-collapsed .map-selector,
        html.we-layers-collapsed #plugin-map-selector,
        html.we-layers-collapsed [data-plugin="map-selector"],
        html.we-layers-collapsed [data-plugin="overlay-selector"],
        html.we-layers-collapsed [data-we-layer-list="1"] {
            display: none !important;
        }

        #we-root { position: fixed; left: 14px; bottom: 14px; z-index: 2147483645;
            color: #f0f4fb; font: 13px/1.45 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
            direction: ltr; text-align: left; pointer-events: none; }
        #we-root * { box-sizing: border-box; }
        #we-quick-controls { pointer-events: auto; display: flex; align-items: center; gap: 8px; }
        #we-launcher, #we-clean-toggle { display: flex; align-items: center; justify-content: center;
            width: 42px; height: 42px; border-radius: 13px;
            background: #172338; color: #fff; border: 1px solid #465b75;
            box-shadow: 0 5px 18px rgba(0,0,0,.3); font-size: 23px; cursor: pointer; }
        #we-launcher:hover, #we-launcher:focus-visible,
        #we-clean-toggle:hover, #we-clean-toggle:focus-visible { background: #253d5f; }
        #we-clean-toggle[aria-pressed="true"] { background: #196b68; border-color: #78e0c8;
            box-shadow: 0 0 0 2px rgba(120,224,200,.2), 0 5px 18px rgba(0,0,0,.3); }
        #we-panel { pointer-events: auto; position: fixed; display: none;
            left: 14px; bottom: 66px; width: min(355px, calc(100vw - 28px));
            max-height: min(76vh, 680px); overflow-y: auto; margin: 0;
            scrollbar-width: none; -ms-overflow-style: none;
            background: #121d30; color: #edf3fa; border: 1px solid #405270;
            border-radius: 15px; padding: 15px; box-shadow: 0 13px 35px rgba(0,0,0,.44); }
        #we-panel::-webkit-scrollbar { display: none; width: 0; height: 0; }
        #we-panel.we-open { display: block; }
        #we-panel.we-dragging { user-select: none; box-shadow: 0 18px 44px rgba(0,0,0,.55); }
        #we-panel .we-header { display: flex; justify-content: space-between; align-items: center;
            gap: 8px; margin: -5px -5px 5px; padding: 5px; border-radius: 10px;
            cursor: grab; touch-action: none; }
        #we-panel.we-dragging .we-header { cursor: grabbing; }
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
        #we-panel .we-range-setting { padding: 2px 0 11px; border-bottom: 1px solid #2e3d54; }
        #we-panel .we-range-header { display: flex; align-items: center; justify-content: space-between;
            color: #abbcd1; font-size: 11px; margin-bottom: 5px; }
        #we-panel input[type="range"] { appearance: auto; width: 100%; margin: 0; accent-color: #61a8ff; cursor: pointer; }
        #we-panel input[type="range"]:disabled { opacity: .4; cursor: not-allowed; }
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
        #we-layers-toggle { position: fixed; z-index: 2147483644; display: flex; align-items: center;
            justify-content: center; width: 42px; height: 30px; border-radius: 9px;
            border: 1px solid rgba(255,255,255,.38); background: rgba(18,29,48,.9); color: #fff;
            box-shadow: 0 5px 18px rgba(0,0,0,.45); font: 700 22px/1 system-ui,sans-serif;
            cursor: pointer; backdrop-filter: blur(7px); }
        #we-layers-toggle:hover, #we-layers-toggle:focus-visible { background: rgba(37,61,95,.96); }
        @media (max-width: 600px) {
            #we-root { left: 9px; bottom: 9px; }
            #we-launcher, #we-clean-toggle { width: 39px; height: 39px; }
            #we-panel { left: 9px; bottom: 57px; max-height: 72vh; }
        }
    `);

    function applySettings() {
        const html = document.documentElement;
        if (html) {
            const intensity = settings.shadowIntensity / 100;
            html.classList.toggle('we-hide-promos', settings.hidePromos);
            html.classList.toggle('we-restore-colors', settings.restoreColors);
            html.classList.toggle('we-hide-logo', settings.hideLogo);
            html.classList.toggle('we-hide-branding', settings.hideBranding);
            html.classList.toggle('we-hide-archive', settings.hideArchive);
            html.classList.toggle('we-shadows', settings.shadows);
            html.classList.toggle('we-layers-collapsed', settings.layersCollapsed);
            html.classList.toggle('we-focus', settings.focusMode);
            html.style.setProperty('--we-shadow-alpha', (0.38 + intensity * 0.55).toFixed(2));
            html.style.setProperty('--we-shadow-soft-alpha', (0.18 + intensity * 0.35).toFixed(2));
            html.style.setProperty('--we-shadow-blur', `${Math.round(24 + intensity * 30)}px`);
            html.style.setProperty('--we-shadow-blur-small', `${Math.round(12 + intensity * 14)}px`);
        }
        for (const [name, input] of toggles) input.checked = settings[name];
        if (shadowRange) {
            shadowRange.value = String(settings.shadowIntensity);
            shadowRange.disabled = !settings.shadows;
        }
        if (shadowValue) shadowValue.textContent = `${settings.shadowIntensity}%`;
        if (layersToggle) {
            layersToggle.textContent = settings.layersCollapsed ? '+' : '−';
            layersToggle.setAttribute('aria-expanded', String(!settings.layersCollapsed));
            layersToggle.title = settings.layersCollapsed ? 'Mostrar tipos de mapas' : 'Recolher tipos de mapas';
        }
        if (cleanToggle) {
            cleanToggle.setAttribute('aria-pressed', String(settings.focusMode));
            cleanToggle.title = settings.focusMode ? 'Desativar modo limpo' : 'Ativar modo limpo';
        }
        if (viewText) {
            viewText.textContent = settings.savedView
                ? `Vista salva em ${settings.savedView.savedAt || 'data desconhecida'}.`
                : 'Nenhuma vista salva.';
        }
    }

    function setFocusMode(enabled, announce = true) {
        settings.focusMode = Boolean(enabled);
        persist();
        applySettings();
        if (announce) {
            setStatus(settings.focusMode ? 'Modo limpo ativado.' : 'Modo limpo desativado.');
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

    function scanForArchive(root) {
        if (!settings.hideArchive || !root || root.nodeType !== 1) return;
        const selector = 'a,button,[role="button"],.clickable';
        const nodes = [];
        if (root.matches?.(selector)) nodes.push(root);
        if (root.querySelectorAll) nodes.push(...root.querySelectorAll(selector));
        for (const el of nodes) {
            if (el.closest('#we-root') || el.hasAttribute('data-we-archive-control')) continue;
            const label = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
            if (/^(?:arquivo|archive)$/i.test(label)) el.setAttribute('data-we-archive-control', '1');
        }
    }

    let pending = new Set();
    let scanTimer = null;
    function scheduleScan(node) {
        if ((!settings.hidePromos && !settings.hideArchive) || !node || node.nodeType !== 1) return;
        pending.add(node);
        if (scanTimer !== null) return;
        scanTimer = window.setTimeout(() => {
            scanTimer = null;
            const batch = [...pending];
            pending.clear();
            for (const item of batch) {
                if (!item.isConnected) continue;
                if (settings.hidePromos) scanForPromos(item);
                if (settings.hideArchive) scanForArchive(item);
            }
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
            if ((name === 'hidePromos' || name === 'hideArchive') && settings[name]) scheduleScan(document.body);
            setStatus(`${title}: ${checkbox.checked ? 'ativado' : 'desativado'}.`);
        });
        label.append(copy, checkbox);
        parent.appendChild(label);
        toggles.set(name, checkbox);
    }

    function addShadowRange(parent) {
        const wrapper = document.createElement('div');
        wrapper.className = 'we-range-setting';
        const header = document.createElement('div');
        header.className = 'we-range-header';
        const label = document.createElement('span');
        label.textContent = 'Intensidade do degradê';
        shadowValue = document.createElement('output');
        header.append(label, shadowValue);
        shadowRange = document.createElement('input');
        shadowRange.type = 'range';
        shadowRange.min = '20';
        shadowRange.max = '100';
        shadowRange.step = '1';
        shadowRange.setAttribute('aria-label', 'Intensidade das sombras');
        shadowRange.addEventListener('input', () => {
            settings.shadowIntensity = Number(shadowRange.value);
            applySettings();
        });
        shadowRange.addEventListener('change', () => {
            persist();
            setStatus(`Intensidade das sombras: ${settings.shadowIntensity}%.`);
        });
        wrapper.append(header, shadowRange);
        parent.appendChild(wrapper);
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

    function keepPanelInViewport() {
        if (!panel || !panel.style.top) return;
        const rect = panel.getBoundingClientRect();
        const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
        const maxTop = Math.max(8, window.innerHeight - rect.height - 8);
        panel.style.left = `${Math.min(Math.max(8, rect.left), maxLeft)}px`;
        panel.style.top = `${Math.min(Math.max(8, rect.top), maxTop)}px`;
    }

    function resetPanelPosition() {
        if (!panel) return;
        for (const property of ['top', 'right', 'bottom', 'left']) panel.style.removeProperty(property);
        setStatus('Posição do painel restaurada.');
    }

    function startPanelDrag(ev) {
        if (!panel || ev.button !== 0 || ev.target.closest('button')) return;
        const rect = panel.getBoundingClientRect();
        dragState = {
            pointerId: ev.pointerId,
            offsetX: ev.clientX - rect.left,
            offsetY: ev.clientY - rect.top,
            handle: ev.currentTarget
        };
        panel.style.left = `${rect.left}px`;
        panel.style.top = `${rect.top}px`;
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
        panel.classList.add('we-dragging');
        ev.currentTarget.setPointerCapture(ev.pointerId);
        ev.preventDefault();
    }

    function movePanel(ev) {
        if (!panel || !dragState || dragState.pointerId !== ev.pointerId) return;
        const maxLeft = Math.max(8, window.innerWidth - panel.offsetWidth - 8);
        const maxTop = Math.max(8, window.innerHeight - panel.offsetHeight - 8);
        const left = Math.min(Math.max(8, ev.clientX - dragState.offsetX), maxLeft);
        const top = Math.min(Math.max(8, ev.clientY - dragState.offsetY), maxTop);
        panel.style.left = `${left}px`;
        panel.style.top = `${top}px`;
    }

    function finishPanelDrag(ev) {
        if (!panel || !dragState || dragState.pointerId !== ev.pointerId) return;
        const { handle, pointerId } = dragState;
        if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId);
        dragState = null;
        panel.classList.remove('we-dragging');
        keepPanelInViewport();
    }

    function visibleElement(selectors) {
        for (const selector of selectors) {
            for (const element of document.querySelectorAll(selector)) {
                const rect = element.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) return element;
            }
        }
        return null;
    }

    function locateLayerList() {
        const direct = document.querySelector(
            '.map-selector, #plugin-map-selector, [data-plugin="map-selector"], [data-plugin="overlay-selector"]'
        );
        if (direct) {
            direct.setAttribute('data-we-layer-list', '1');
            return direct;
        }
        const controls = document.querySelectorAll('button,a,[role="button"],.clickable');
        const moreLayers = [...controls].find(element =>
            /^(?:mais camadas|more layers)/i.test((element.textContent || '').replace(/\s+/g, ' ').trim())
        );
        let candidate = moreLayers?.parentElement || null;
        while (candidate && candidate !== document.body) {
            const rect = candidate.getBoundingClientRect();
            const clickableCount = candidate.querySelectorAll('button,a,[role="button"],.clickable').length;
            if (rect.height >= 180 && rect.width > 0 && rect.width <= 420 && clickableCount >= 5) {
                candidate.setAttribute('data-we-layer-list', '1');
                return candidate;
            }
            candidate = candidate.parentElement;
        }
        return null;
    }

    function ensureLayersToggle() {
        if (layersToggle) return;
        layersToggle = document.createElement('button');
        layersToggle.id = 'we-layers-toggle';
        layersToggle.type = 'button';
        layersToggle.setAttribute('aria-label', 'Mostrar ou recolher tipos de mapas');
        layersToggle.addEventListener('click', () => {
            settings.layersCollapsed = !settings.layersCollapsed;
            persist();
            applySettings();
            setStatus(settings.layersCollapsed ? 'Tipos de mapas recolhidos.' : 'Tipos de mapas exibidos.');
            scheduleWindyLayout();
        });
        document.body.appendChild(layersToggle);
        applySettings();
    }

    function arrangeWindyControls() {
        locateLayerList();
        const menu = visibleElement([
            '[data-ref="mobileHamburgerMenu"]',
            '.mobile-ui__hamburger-icon'
        ]);
        const avatar = visibleElement([
            '#mobile-avatar',
            '.mobile-ui__avatar',
            '[data-ref="mobileAvatar"]',
            '[data-ref="avatar"]'
        ]);
        if (!menu || !avatar) {
            if (layersToggle) layersToggle.hidden = true;
            return;
        }
        if (managedMenu && managedMenu !== menu) {
            for (const property of ['position', 'left', 'top', 'right', 'bottom', 'margin', 'z-index', 'transform']) {
                managedMenu.style.removeProperty(property);
            }
        }
        managedMenu = menu;
        const avatarRect = avatar.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();
        const gap = 8;
        menu.style.position = 'fixed';
        menu.style.left = `${Math.max(8, avatarRect.left - menuRect.width - gap)}px`;
        menu.style.top = `${Math.max(8, avatarRect.top + (avatarRect.height - menuRect.height) / 2)}px`;
        menu.style.right = 'auto';
        menu.style.bottom = 'auto';
        menu.style.margin = '0';
        menu.style.transform = 'none';
        menu.style.zIndex = '2147483643';

        ensureLayersToggle();
        layersToggle.hidden = false;
        layersToggle.style.left = `${Math.max(8, avatarRect.left + (avatarRect.width - 42) / 2)}px`;
        layersToggle.style.top = `${Math.min(window.innerHeight - 38, avatarRect.bottom + gap)}px`;
    }

    function scheduleWindyLayout() {
        if (layoutTimer !== null) return;
        layoutTimer = window.setTimeout(() => {
            layoutTimer = null;
            arrangeWindyControls();
        }, 180);
    }

    function togglePanel(force) {
        if (!panel || !launcher) return;
        const willOpen = typeof force === 'boolean' ? force : !panel.classList.contains('we-open');
        panel.classList.toggle('we-open', willOpen);
        launcher.setAttribute('aria-expanded', String(willOpen));
        if (willOpen) {
            setStatus('Preferências aplicadas localmente.');
            keepPanelInViewport();
            window.setTimeout(() => panelClose?.focus(), 0);
        } else if (panel.contains(document.activeElement)) {
            launcher.focus();
        }
    }

    function initUI() {
        if (!document.body || document.getElementById('we-root')) return;
        uiRoot = document.createElement('div');
        uiRoot.id = 'we-root';
        const quickControls = document.createElement('div');
        quickControls.id = 'we-quick-controls';
        launcher = document.createElement('button');
        launcher.id = 'we-launcher';
        launcher.type = 'button';
        launcher.textContent = '⚙';
        launcher.title = 'Windy Enhanced — configurações';
        launcher.setAttribute('aria-label', 'Abrir configurações do Windy Enhanced');
        launcher.setAttribute('aria-expanded', 'false');
        launcher.setAttribute('aria-controls', 'we-panel');
        launcher.addEventListener('click', () => togglePanel());
        cleanToggle = document.createElement('button');
        cleanToggle.id = 'we-clean-toggle';
        cleanToggle.type = 'button';
        cleanToggle.textContent = '🧹';
        cleanToggle.setAttribute('aria-label', 'Alternar modo limpo');
        cleanToggle.addEventListener('click', () => setFocusMode(!settings.focusMode));
        quickControls.append(launcher, cleanToggle);

        panel = document.createElement('section');
        panel.id = 'we-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'false');
        panel.setAttribute('aria-labelledby', 'we-title');
        const header = document.createElement('div');
        header.className = 'we-header';
        header.title = 'Arraste para mover. Clique duas vezes para restaurar a posição.';
        header.addEventListener('pointerdown', startPanelDrag);
        header.addEventListener('pointermove', movePanel);
        header.addEventListener('pointerup', finishPanelDrag);
        header.addEventListener('pointercancel', finishPanelDrag);
        header.addEventListener('dblclick', ev => {
            if (!ev.target.closest('button')) resetPanelPosition();
        });
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
        section(panel, 'Visual');
        addSetting(panel, 'restoreColors', 'Cores do mapa', 'Remove filtros visuais locais quando presentes.');
        addSetting(panel, 'hideLogo', 'Ocultar logotipo superior', 'Remove apenas a marca Windy.com do topo da tela.');
        addSetting(panel, 'hideBranding', 'Remover branding', 'Oculta selos institucionais sobrepostos ao mapa.');
        addSetting(panel, 'hideArchive', 'Ocultar Arquivo', 'Esconde o histórico temporal; o cache normal continua automático.');
        addSetting(panel, 'hidePromos', 'Ocultar chamadas Premium', 'Esconde banners e botões promocionais reconhecidos.');
        addSetting(panel, 'shadows', 'Sombras', 'Cria contraste suave entre o mapa e os grupos de controles.');
        addShadowRange(panel);

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
        uiRoot.append(panel, quickControls);
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
            setFocusMode(!settings.focusMode);
        }
    }, true);

    window.addEventListener('resize', () => {
        window.requestAnimationFrame(keepPanelInViewport);
        scheduleWindyLayout();
    });

    if (typeof GM_registerMenuCommand === 'function') {
        GM_registerMenuCommand('Windy Enhanced — configurações', () => togglePanel(true));
    }

    // Mantém preferências coerentes quando há mais de uma aba do Windy aberta.
    window.addEventListener('storage', ev => {
        if (ev.key !== STORAGE_KEY) return;
        settings = load();
        applySettings();
        if (settings.hidePromos || settings.hideArchive) scheduleScan(document.body);
        scheduleWindyLayout();
        setStatus('Preferências sincronizadas de outra aba.');
    });


    // Integração discreta com o Play original do Radar/Satélite.
    // Não cria controles: reaproveita o botão do Windy quando a timeline já
    // exibiu horários anteriores a 1h nesta aba e o store permite alterá-los.
    // Dados Premium não são liberados; se a API não estiver exposta, o Play
    // original continua funcionando sem nenhuma alteração.
    const nativeReplay = {
        observations: {
            radsatTimestamp: new Set(),
            radarTimestamp: new Set(),
            satelliteTimestamp: new Set()
        },
        previous: Object.create(null),
        timer: null,
        button: null,
        key: null,
        product: null,
        store: null,
        frameMs: 430
    };

    function nativeReplayStore() {
        try {
            const page = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;
            return [page.W?.store, page.windyAPI?.store, window.W?.store, window.windyAPI?.store]
                .find(s => s && typeof s.get === 'function' && typeof s.set === 'function') || null;
        } catch (_) { return null; }
    }

    function nativeReplayProduct(store) {
        try {
            const product = String(store.get('product') || '').toLowerCase();
            const overlay = String(store.get('overlay') || '').toLowerCase();
            if (product.includes('radar') || overlay.includes('radar')) return 'radar';
            if (product.includes('satellite') || overlay.includes('satellite')) return 'satellite';
        } catch (_) { /* O Windy pode não publicar este estado. */ }
        return null;
    }

    function nativeReplayTime(value) {
        const time = Number(value);
        return Number.isFinite(time) && time > 946684800000 &&
            time < Date.now() + 86400000 ? time : null;
    }

    function nativeReplayObserve() {
        const store = nativeReplayStore();
        if (!store || !nativeReplayProduct(store)) return;
        for (const key of Object.keys(nativeReplay.observations)) {
            try {
                const time = nativeReplayTime(store.get(key));
                if (time === null || nativeReplay.previous[key] === time) continue;
                nativeReplay.previous[key] = time;
                const values = nativeReplay.observations[key];
                values.add(time);
                if (values.size > 500) values.delete(values.values().next().value);
            } catch (_) { /* Propriedade não exposta. */ }
        }
    }

    function nativeReplayFrames(key) {
        return [...nativeReplay.observations[key]].sort((a, b) => a - b);
    }

    function nativeReplayChoice(product) {
        const keys = product === 'radar'
            ? ['radsatTimestamp', 'radarTimestamp']
            : ['radsatTimestamp', 'satelliteTimestamp'];
        for (const key of keys) {
            const frames = nativeReplayFrames(key);
            // Não substitui o Play original para reproduzir apenas a última hora.
            if (frames.length >= 3 && frames[frames.length - 1] - frames[0] > 65 * 60000) {
                return { key, frames };
            }
        }
        return null;
    }

    function nativeReplayStop() {
        if (nativeReplay.timer !== null) clearTimeout(nativeReplay.timer);
        nativeReplay.timer = null;
        nativeReplay.button?.removeAttribute('data-we-replaying');
        nativeReplay.button = null;
        nativeReplay.key = null;
        nativeReplay.product = null;
        nativeReplay.store = null;
    }

    function nativeReplayTick() {
        if (nativeReplay.timer === null) return;
        const { key, product, store } = nativeReplay;
        if (!document.hasFocus() || document.hidden || !nativeReplay.button?.isConnected ||
            nativeReplayStore() !== store || nativeReplayProduct(store) !== product) {
            nativeReplayStop();
            return;
        }

        const frames = nativeReplayFrames(key);
        if (frames.length < 3) { nativeReplayStop(); return; }

        try {
            const now = nativeReplayTime(store.get(key));
            if (now === null) { nativeReplayStop(); return; }
            const target = frames.find(t => t > now) ?? frames[0];
            store.set(key, target);
            const actual = nativeReplayTime(store.get(key));
            if (actual === null || Math.abs(actual - target) > 60000) {
                nativeReplayStop();
                return;
            }
        } catch (_) { nativeReplayStop(); return; }
        nativeReplay.timer = setTimeout(nativeReplayTick, nativeReplay.frameMs);
    }

    // O botão circular de Play é do Windy. A detecção exige rótulo/classe de
    // reprodução e contexto da timeline, evitando capturar botões de outras telas.
    function nativeReplayButtonFromClick(event) {
        for (const node of event.composedPath()) {
            if (!(node instanceof Element) || node.closest('#we-root')) continue;
            if (!node.matches('button, [role="button"], .clickable, [data-ref]')) continue;
            const attrs = [
                node.id, typeof node.className === 'string' ? node.className : '',
                node.getAttribute('data-ref'), node.getAttribute('aria-label'),
                node.getAttribute('title')
            ].filter(Boolean).join(' ');
            if (!/(?:play|pause|replay|reproduzir|pausar|animat)/i.test(attrs) ||
                /(?:display|forecast|previsão)/i.test(attrs)) continue;

            let context = node.parentElement;
            let onTimeline = false;
            for (let depth = 0; context && depth < 6; depth++, context = context.parentElement) {
                if (context.matches('#bottom-wrapper, [data-plugin*="bottom-controls"], ' +
                    '[data-plugin*="radar"], .radar-plus, .radarPlus, .timeline, .timeline-bar')) {
                    onTimeline = true;
                    break;
                }
                const t = (context.textContent || '').replace(/\s+/g, ' ');
                if (t.includes('1h') && t.includes('6h') && (t.includes('24h') || t.includes('12h'))) {
                    onTimeline = true;
                    break;
                }
            }
            if (onTimeline) return node;
        }
        return null;
    }

    function nativeReplayOnClick(event) {
        const button = nativeReplayButtonFromClick(event);
        if (!button) return;
        if (nativeReplay.timer !== null) {
            event.preventDefault();
            event.stopImmediatePropagation();
            nativeReplayStop();
            return;
        }
        const store = nativeReplayStore();
        const product = store && nativeReplayProduct(store);
        if (!product) return;
        try {
            // Se o player nativo já estiver rodando, o clique deve pausá-lo.
            if (store.get('animation') === true) return;
        } catch (_) { /* Pode não estar publicado. */ }

        nativeReplayObserve();
        const choice = nativeReplayChoice(product);
        if (!choice) return;

        // Intercepta SOMENTE o Play existente, sem adicionar outro botão.
        event.preventDefault();
        event.stopImmediatePropagation();
        nativeReplay.store = store;
        nativeReplay.button = button;
        nativeReplay.key = choice.key;
        nativeReplay.product = product;
        button.setAttribute('data-we-replaying', '1');
        nativeReplay.timer = setTimeout(nativeReplayTick, 10);
    }

    function initNativeReplay() {
        addCSS(
            '[data-we-replaying="1"] { position: relative !important; }' +
            '[data-we-replaying="1"]::after {' +
            'content: "❚❚"; position: absolute; inset: 0; display: flex; ' +
            'align-items: center; justify-content: center; border-radius: inherit; ' +
            'background: #f7f7f7; color: #d00; pointer-events: none; font: bold 18px system-ui; }'
        );
        document.addEventListener('click', nativeReplayOnClick, true);
        document.addEventListener('keydown', event => {
            if (event.isTrusted && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
                if (nativeReplay.timer !== null) nativeReplayStop();
                setTimeout(nativeReplayObserve, 120);
            }
        }, true);
        document.addEventListener('pointerdown', event => {
            if (nativeReplay.timer === null) return;
            if (nativeReplay.button?.contains(event.target)) return;
            if (event.target.closest?.('#bottom-wrapper, .timeline, [data-plugin*="radar"]')) {
                nativeReplayStop();
            }
        }, true);
        window.addEventListener('pagehide', nativeReplayStop);
        window.setInterval(() => {
            if (!document.hidden) nativeReplayObserve();
        }, 135);
        nativeReplayObserve();
    }

    function start() {
        applySettings();
        initUI();
        initNativeReplay();
        scheduleScan(document.body);
        scheduleWindyLayout();
        const observer = new MutationObserver(records => {
            let hasAddedElement = false;
            for (const record of records) {
                for (const node of record.addedNodes) {
                    if (node.nodeType === 1) hasAddedElement = true;
                    if (settings.hidePromos || settings.hideArchive) scheduleScan(node);
                }
            }
            if (hasAddedElement) scheduleWindyLayout();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else start();
})();
