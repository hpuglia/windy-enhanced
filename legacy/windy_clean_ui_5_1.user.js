// ==UserScript==
// @name         Windy.com - Clean UI e tentativa de restaurar cores
// @namespace    http://tampermonkey.net/
// @version      5.1
// @description  Oculta chamadas ao Premium e remove filtros visuais locais sem falsificar assinatura ou interferir nos dados meteorológicos.
// @author       Henrique
// @match        https://www.windy.com/*
// @match        https://windy.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=windy.com
// @grant        GM_addStyle
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    // Seletores observados em estilos/scripts públicos do Windy.
    // O CSS também atua sobre elementos que forem criados depois.
    GM_addStyle(`
        /* Chamadas promocionais identificadas na interface */
        #desktop-premium-icon,
        .get-premium,
        .premium-button,
        .plugin-paywall-overlay,
        .paywall-banner,
        .modal-content-paywall,
        a[href*="/premium"],
        a[href*="upgrade"],
        [data-plugin="startup-articles"] {
            display: none !important;
        }

        /* Opções explicitamente marcadas como Premium no seletor de mapas */
        .map-selector a.clickable:has(.premium-flag),
        .map-selector [role="button"]:has(.premium-flag) {
            display: none !important;
        }

        /* Tenta remover a camada visual de cinza e a marca d'água.
           Não recria cores se os pixels já chegam/renderizam em cinza. */
        .premium-calendar #map-container,
        .premium-calendar #map-container #leaflet-map {
            filter: none !important;
            -webkit-filter: none !important;
        }

        .premium-calendar #map-container #leaflet-map {
            animation: none !important;
        }

        .premium-calendar #map-container::after {
            background-image: none !important;
            display: none !important;
            content: none !important;
        }
    `);

    // Oculta botões promocionais cujo texto não possui classe CSS estável.
    // Não remove elementos do DOM nem esconde todos os nós com 'premium'.
    const patterns = [
        /^(?:get|go|buy|try|unlock|subscribe to|upgrade to)\s+(?:windy\s+)?premium(?:\s+now)?$/i,
        /^(?:assine|assinar|obter|seja|experimente|desbloqueie)\s+(?:o\s+)?(?:windy\s+)?premium(?:\s+agora)?$/i,
        /^(?:windy\s+)?premium$/i
    ];

    function hidePremiumButtons() {
        document.querySelectorAll('a, button, [role="button"]').forEach(el => {
            // Limita o processamento a rótulos pequenos, para não ocultar regiões inteiras.
            const label = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
            if (label.length > 65 || !patterns.some(re => re.test(label))) return;
            el.style.setProperty('display', 'none', 'important');
        });
    }

    function start() {
        hidePremiumButtons();
        let scheduled = false;
        const observer = new MutationObserver(() => {
            if (scheduled) return;
            scheduled = true;
            setTimeout(() => {
                scheduled = false;
                hidePremiumButtons();
            }, 250);
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})();
