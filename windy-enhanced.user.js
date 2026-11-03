
 // ==UserScript==
 // @name         Windy Enhanced - Replay Personalizado
 // @namespace    https://github.com/hpuglia/windy-enhanced
 // @version      1.0.0
 // @description  Replay personalizado dos horários acessíveis no Windy.
 // @author       Henrique / Puglia Apps
 // @match        https://www.windy.com/*
 // @match        https://windy.com/*
 // @grant        none
 // @run-at       document-idle
 // @license      MIT
 // ==/UserScript==

 (() => {
     'use strict';

     const ID = 'we-replay-addon';
     if (document.getElementById(ID)) return;

     const KEYS = {
         radar: 'radarTimestamp',
         satellite: 'satelliteTimestamp',
         forecast: 'timestamp'
     };

     const DELAYS = { 1: 900, 2: 450, 4: 225 };
     const MAX_SAMPLES = 400;

     const seen = {
         radar: new Set(),
         satellite: new Set(),
         forecast: new Set()
     };

     const state = {
         running: false,
         timer: null,
         layer: null,
         speed: 1,
         loop: true
     };

     const root = document.createElement('div');
     root.id = ID;

     root.innerHTML = `
         <button class="we-play" type="button">
             ▶ Replay +
         </button>
         <div class="we-options">
             <label>Velocidade
                 <select class="we-speed">
                     <option value="1">1x</option>
                     <option value="2">2x</option>
                     <option value="4">4x</option>
                 </select>
             </label>
             <label>
                 <input class="we-loop" type="checkbox" checked>
                 Loop
             </label>
             <button class="we-step" type="button">
                 Passo →
             </button>
             <span class="we-status" role="status">
                 Percorra a timeline para registrar horários.
             </span>
         </div>
     `;

     const style = document.createElement('style');
     style.textContent = `
         #${ID} {
             position: fixed;
             right: 16px;
             bottom: 100px;
             z-index: 2147483641;
             display: flex;
             align-items: flex-start;
             gap: 8px;
             max-width: min(560px, calc(100vw - 24px));
             font: 12px/1.45 system-ui, sans-serif;
             color: #f1f5ff;
             background: rgba(17,29,47,.95);
             border: 1px solid #4b678b;
             border-radius: 12px;
             padding: 8px;
             box-shadow: 0 4px 20px rgba(0,0,0,.38);
         }
         #${ID} * { box-sizing: border-box; }
         #${ID} button, #${ID} select {
             font: inherit;
             color: white;
             background: #264665;
             border: 1px solid #527da0;
             border-radius: 7px;
             padding: 7px;
             cursor: pointer;
         }
         #${ID} button:hover { background: #38638a; }
         #${ID} .we-play { font-weight: 700; }
         #${ID} .we-options {
             display: flex;
             align-items: center;
             flex-wrap: wrap;
             gap: 8px;
         }
         #${ID} label {
             display: flex;
             align-items: center;
             gap: 5px;
         }
         #${ID} .we-status {
             flex-basis: 100%;
             font-size: 11px;
             color: #c8dbf1;
         }
         @media(max-width:640px) {
             #${ID} {
                 right: 8px;
                 bottom: 115px;
                 flex-direction: column;
             }
         }
     `;

     (document.head || document.documentElement)
         .appendChild(style);
     document.body.appendChild(root);

     const play = root.querySelector('.we-play');
     const speed = root.querySelector('.we-speed');
     const loop = root.querySelector('.we-loop');
     const stepButton = root.querySelector('.we-step');
     const status = root.querySelector('.we-status');

     function message(text) {
         status.textContent = text;
     }

     function getStore() {
         try {
             const candidates = [
                 window.W?.store,
                 window.windyAPI?.store
             ];
             return candidates.find(s =>
                 s &&
                 typeof s.get === 'function' &&
                 typeof s.set === 'function'
             ) || null;
         } catch {
             return null;
         }
     }

     function getContext() {
         const store = getStore();
         if (!store) return null;

         try {
             const overlay =
                 String(store.get('overlay') || '').toLowerCase();
             const product =
                 String(store.get('product') || '').toLowerCase();

             const layer =
                 overlay.includes('radar') ||
                 product.includes('radar')
                     ? 'radar'
                     : overlay.includes('satellite') ||
                       product.includes('satellite')
                         ? 'satellite'
                         : 'forecast';

             const key = KEYS[layer];
             const time = Number(store.get(key));

             if (!Number.isFinite(time) ||
                 time < 946684800000 ||
                 time > Date.now() + 30 * 86400000) {
                 return null;
             }

             return { store, layer, key, time };
         } catch {
             return null;
         }
     }

     function capture() {
         const ctx = getContext();
         if (!ctx) return null;

         const frames = seen[ctx.layer];
         frames.add(ctx.time);

         while (frames.size > MAX_SAMPLES) {
             frames.delete(frames.values().next().value);
         }

         return ctx;
     }

     function getFrames(ctx) {
         const frames = new Set(seen[ctx.layer]);

         if (typeof ctx.store.getAllowed === 'function') {
             try {
                 const allowed = ctx.store.getAllowed(ctx.key);

                 if (Array.isArray(allowed) &&
                     allowed.length <= MAX_SAMPLES) {
                     for (const entry of allowed) {
                         const time = Number(entry);
                         if (Number.isFinite(time) &&
                             time > 946684800000 &&
                             time < Date.now() + 30 * 86400000) {
                             frames.add(time);
                         }
                     }
                 }
             } catch {}
         }

         return [...frames].sort((a, b) => a - b);
     }

     function pause(reason = 'Replay pausado.') {
         state.running = false;
         clearTimeout(state.timer);
         state.timer = null;
         play.textContent = '▶ Replay +';
         message(reason);
     }

     function experimentalArrow() {
         const event = {
             key: 'ArrowRight',
             code: 'ArrowRight',
             keyCode: 39,
             which: 39,
             bubbles: true,
             cancelable: true
         };

         window.dispatchEvent(
             new KeyboardEvent('keydown', event)
         );
         window.dispatchEvent(
             new KeyboardEvent('keyup', event)
         );
     }

     function advance() {
         const ctx = capture();

         if (ctx) {
             const frames = getFrames(ctx);

             if (frames.length >= 2) {
                 const next = frames.find(t => t > ctx.time);
                 const target = next === undefined && state.loop
                     ? frames[0]
                     : next;

                 if (target === undefined) {
                     return {
                         ok: false,
                         reason: 'Fim da timeline.'
                     };
                 }

                 try {
                     ctx.store.set(ctx.key, target);
                     const actual = Number(ctx.store.get(ctx.key));

                     if (Number.isFinite(actual) &&
                         Math.abs(actual - target) <= 60000) {
                         return {
                             ok: true,
                             mode: 'API',
                             layer: ctx.layer,
                             count: frames.length
                         };
                     }
                 } catch {}

                 return {
                     ok: false,
                     reason: 'O Windy não aceitou o horário.'
                 };
             }
         }

         // Alternativa experimental. Eventos sintéticos podem
         // ser ignorados pelo Windy.
         experimentalArrow();

         return {
             ok: true,
             mode: 'teclado experimental',
             count: 0
         };
     }

     function tick() {
         if (!state.running) return;

         const ctx = capture();

         if (state.layer && ctx &&
             state.layer !== ctx.layer) {
             pause('Camada alterada. Replay pausado.');
             return;
         }

         const result = advance();

         if (!result.ok) {
             pause(result.reason);
             return;
         }

         message(
             result.mode === 'API'
                 ? `${result.layer}: ${result.count} horários · ${state.speed}x`
                 : 'Avanço experimental: confira se o mapa mudou.'
         );

         state.timer = setTimeout(
             tick,
             DELAYS[state.speed]
         );
     }

     function toggle() {
         if (state.running) {
             pause();
             return;
         }

         const ctx = capture();
         state.layer = ctx?.layer || null;
         state.running = true;

         play.textContent = '❚❚ Pausar';
         message('Replay iniciado.');

         state.timer = setTimeout(tick, 100);
     }

     play.addEventListener('click', toggle);

     speed.addEventListener('change', () => {
         state.speed = Number(speed.value);
         message(`Velocidade: ${state.speed}x.`);
     });

     loop.addEventListener('change', () => {
         state.loop = loop.checked;
         message(state.loop
             ? 'Loop ativado.'
             : 'Loop desativado.');
     });

     stepButton.addEventListener('click', () => {
         if (state.running) pause();

         const result = advance();
         message(result.ok
             ? `Passo solicitado via ${result.mode}.`
             : result.reason);
     });

     document.addEventListener('keydown', event => {
         if (!event.isTrusted) return;

         if (event.key === 'ArrowLeft' ||
             event.key === 'ArrowRight') {
             if (state.running) pause();
             setTimeout(capture, 120);
         }
     }, true);

     const sampler = setInterval(() => {
         if (!document.hidden && root.isConnected) {
             capture();
         }
     }, 220);

     window.addEventListener('pagehide', () => {
         clearInterval(sampler);
         clearTimeout(state.timer);
     });

     capture();
 })();
