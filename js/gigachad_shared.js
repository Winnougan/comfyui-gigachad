/**
 * gigachad_shared.js
 * Shared gold + electric theme for all Gigachad nodes.
 * Import from each node's JS file.
 */

import { app } from "../../scripts/app.js";

// ── Colour palette ─────────────────────────────────────────────────────────────
export const GOLD = {
    core:   "#FFD700",
    bright: "#FFE866",
    hot:    "#FFF1A0",
    deep:   "#B8860B",
    ember:  "#FF9500",
    plasma: "#FFAA33",
    white:  "#FFFFF0",
};

export const ELEC = {
    core:   "#00CFFF",
    bright: "#80EEFF",
    arc:    "#FFFFFF",
    plasma: "#3AF5FF",
};

const rand = (min, max) => min + Math.random() * (max - min);
const lerp = (a, b, t) => a + (b - a) * t;

// ═══════════════════════════════════════════════════════════════════════════════
// PARTICLE SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════
export class GigachadParticleSystem {
    constructor() {
        this.embers   = [];
        this.sparks   = [];
        this.arcs     = [];
        this._arcTimer = 0;
    }

    _spawnEmber(w, h, yOff) {
        const edge = Math.random();
        let x, y;
        if (edge < 0.5) { x = rand(0, w); y = yOff + h; }
        else if (edge < 0.75) { x = 0; y = rand(yOff, yOff + h); }
        else { x = w; y = rand(yOff, yOff + h); }
        this.embers.push({ x, y, vx: rand(-0.4, 0.4), vy: rand(-0.8, -0.2),
            life: 1.0, decay: rand(0.006, 0.016), size: rand(1.0, 2.8), flicker: rand(0, Math.PI * 2) });
    }

    _spawnSpark(w, h, yOff) {
        const perim = 2 * (w + h); let d = Math.random() * perim, x, y;
        if (d < w)              { x = d;       y = yOff; }
        else if (d < w + h)     { x = w;       y = yOff + (d - w); }
        else if (d < 2 * w + h) { x = w - (d - w - h); y = yOff + h; }
        else                    { x = 0;       y = yOff + h - (d - 2*w - h); }
        this.sparks.push({ x, y, vx: rand(-1.2, 1.2), vy: rand(-1.2, 1.2),
            life: 1.0, decay: rand(0.025, 0.06), size: rand(0.8, 2.0), trail: [] });
    }

    _spawnArc(w, h, yOff) {
        const edgePoint = (edge) => {
            switch (edge) {
                case 0: return { x: rand(w*0.1, w*0.9), y: yOff };
                case 1: return { x: w,                  y: yOff + rand(h*0.1, h*0.9) };
                case 2: return { x: rand(w*0.1, w*0.9), y: yOff + h };
                case 3: return { x: 0,                  y: yOff + rand(h*0.1, h*0.9) };
            }
        };
        const startEdge = Math.floor(Math.random() * 4);
        const endEdge   = (startEdge + 1 + Math.floor(Math.random() * 3)) % 4;
        const start = edgePoint(startEdge), end = edgePoint(endEdge);
        const segments = 6 + Math.floor(Math.random() * 6);
        const points = [start];
        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            points.push({ x: lerp(start.x, end.x, t) + rand(-18, 18), y: lerp(start.y, end.y, t) + rand(-18, 18) });
        }
        points.push(end);
        this.arcs.push({ points, life: 1.0, decay: rand(0.08, 0.18), width: rand(0.6, 1.8) });
    }

    update(w, h, yOff, dt) {
        while (this.embers.length < 18) this._spawnEmber(w, h, yOff);
        while (this.sparks.length < 10) this._spawnSpark(w, h, yOff);
        this._arcTimer += dt;
        if (this._arcTimer > rand(0.4, 0.9)) { this._arcTimer = 0; if (this.arcs.length < 3) this._spawnArc(w, h, yOff); }

        for (let i = this.embers.length - 1; i >= 0; i--) {
            const p = this.embers[i]; p.x += p.vx; p.y += p.vy; p.vy -= 0.01; p.vx *= 0.98;
            p.flicker += 0.15; p.life -= p.decay; if (p.life <= 0) this.embers.splice(i, 1);
        }
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            const p = this.sparks[i]; p.trail.push({ x: p.x, y: p.y });
            if (p.trail.length > 5) p.trail.shift();
            p.x += p.vx; p.y += p.vy; p.vx *= 0.92; p.vy *= 0.92; p.life -= p.decay;
            if (p.life <= 0) this.sparks.splice(i, 1);
        }
        for (let i = this.arcs.length - 1; i >= 0; i--) {
            this.arcs[i].life -= this.arcs[i].decay; if (this.arcs[i].life <= 0) this.arcs.splice(i, 1);
        }
    }

    draw(ctx) {
        // Arcs
        for (const arc of this.arcs) {
            if (arc.points.length < 2) continue;
            ctx.save(); ctx.globalAlpha = arc.life * 0.85;
            ctx.strokeStyle = ELEC.arc; ctx.shadowColor = ELEC.core; ctx.shadowBlur = 16;
            ctx.lineWidth = arc.width * 2; ctx.lineCap = "round";
            ctx.beginPath(); ctx.moveTo(arc.points[0].x, arc.points[0].y);
            for (let i = 1; i < arc.points.length; i++) ctx.lineTo(arc.points[i].x, arc.points[i].y);
            ctx.stroke();
            ctx.shadowBlur = 6; ctx.lineWidth = arc.width * 0.6; ctx.globalAlpha = arc.life;
            ctx.beginPath(); ctx.moveTo(arc.points[0].x, arc.points[0].y);
            for (let i = 1; i < arc.points.length; i++) ctx.lineTo(arc.points[i].x, arc.points[i].y);
            ctx.stroke(); ctx.restore();
        }
        // Embers
        for (const p of this.embers) {
            const flicker = 0.7 + 0.3 * Math.sin(p.flicker); const a = p.life * flicker;
            ctx.save(); ctx.globalAlpha = a; ctx.shadowColor = GOLD.ember; ctx.shadowBlur = 8 + p.size * 3;
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
            grad.addColorStop(0, GOLD.white); grad.addColorStop(0.3, GOLD.bright); grad.addColorStop(1, "rgba(255,150,0,0)");
            ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }
        // Sparks
        for (const p of this.sparks) {
            if (p.trail.length > 1) {
                ctx.save();
                for (let i = 1; i < p.trail.length; i++) {
                    ctx.globalAlpha = (i / p.trail.length) * p.life * 0.6;
                    ctx.strokeStyle = ELEC.bright; ctx.shadowColor = ELEC.core; ctx.shadowBlur = 4; ctx.lineWidth = 0.8;
                    ctx.beginPath(); ctx.moveTo(p.trail[i-1].x, p.trail[i-1].y); ctx.lineTo(p.trail[i].x, p.trail[i].y); ctx.stroke();
                }
                ctx.restore();
            }
            ctx.save(); ctx.globalAlpha = p.life; ctx.shadowColor = ELEC.arc; ctx.shadowBlur = 10;
            ctx.fillStyle = ELEC.arc; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BORDER DRAW
// ═══════════════════════════════════════════════════════════════════════════════
export function drawGigachadBorder(ctx, node, particles) {
    if (node.flags?.collapsed) return;
    const w = node.size[0], h = node.size[1] + LiteGraph.NODE_TITLE_HEIGHT;
    const yOff = -LiteGraph.NODE_TITLE_HEIGHT, r = 8;
    const t = Date.now() / 1000;
    const goldPulse = 0.5 + 0.5 * Math.sin(t * (2 * Math.PI / 2.4));
    const elecPulse = 0.5 + 0.5 * Math.sin(t * (2 * Math.PI / 0.7) + 0.8);
    const breathe   = 0.5 + 0.5 * Math.sin(t * (2 * Math.PI / 4.0));
    app.graph.setDirtyCanvas(true, false);

    ctx.save();

    ctx.shadowColor = GOLD.deep; ctx.shadowBlur = 40 + breathe * 20;
    ctx.strokeStyle = GOLD.deep; ctx.lineWidth = 1; ctx.globalAlpha = 0.08 + breathe * 0.10;
    ctx.beginPath(); ctx.roundRect(-4, yOff-4, w+8, h+8, r+4); ctx.stroke();

    ctx.shadowColor = GOLD.core; ctx.shadowBlur = 20 + goldPulse * 25;
    ctx.strokeStyle = GOLD.core; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.55 + goldPulse * 0.35;
    ctx.beginPath(); ctx.roundRect(0, yOff, w, h, r); ctx.stroke();

    ctx.shadowColor = GOLD.bright; ctx.shadowBlur = 10 + goldPulse * 12;
    ctx.strokeStyle = GOLD.bright; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.35 + goldPulse * 0.45;
    ctx.beginPath(); ctx.roundRect(1.5, yOff+1.5, w-3, h-3, r); ctx.stroke();

    ctx.shadowColor = ELEC.core; ctx.shadowBlur = 14 + elecPulse * 20;
    ctx.strokeStyle = ELEC.plasma; ctx.lineWidth = 1.0; ctx.globalAlpha = 0.10 + elecPulse * 0.25;
    ctx.beginPath(); ctx.roundRect(0.5, yOff+0.5, w-1, h-1, r); ctx.stroke();

    ctx.shadowColor = GOLD.hot; ctx.shadowBlur = 12; ctx.globalAlpha = 0.5 + goldPulse * 0.5;
    ctx.fillStyle = GOLD.hot;
    const dSize = 3 + goldPulse * 2;
    for (const [cx, cy] of [[0,yOff],[w,yOff],[0,yOff+h],[w,yOff+h]]) {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI/4);
        ctx.fillRect(-dSize/2, -dSize/2, dSize, dSize); ctx.restore();
    }

    ctx.shadowColor = ELEC.arc; ctx.shadowBlur = 20 + elecPulse * 15;
    ctx.globalAlpha = elecPulse * 0.7; ctx.fillStyle = ELEC.arc;
    const eSize = 1.5 + elecPulse * 1.5;
    for (const [cx, cy] of [[0,yOff],[w,yOff],[0,yOff+h],[w,yOff+h]]) {
        ctx.beginPath(); ctx.arc(cx, cy, eSize, 0, Math.PI*2); ctx.fill();
    }

    ctx.restore();

    particles.update(w, h, yOff, 1/60);
    particles.draw(ctx);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ELECTRIC LINKS — patches renderLink for all Gigachad node types
// ═══════════════════════════════════════════════════════════════════════════════
const GIGACHAD_NODE_TYPES = new Set([
    "GigachadModelLoader",
    "GigachadCheckpointLoader",
    "GigachadCLIPLoader",
    "GigachadPromptEncoder",
    "GigachadKSampler",
    "GigachadSamplerCustomAdvanced",
    "GigachadResolutionPicker",
    "GigachadLTXResolutionPicker",
    "GigachadPowerLoraLoader",
    "GigachadCacheCleanup",
    "GigachadVAELoader",
    "GigachadVAEDecode",
    "GigachadVAEEncode",
    "GigachadRTXSuperResolution",
    "GigachadPromptFileReader",
]);

export function installElectricLinks() {
    if (LiteGraph._gigachadLinksPatched) return;
    LiteGraph._gigachadLinksPatched = true;

    const origRenderLink = LGraphCanvas.prototype.renderLink;
    if (!origRenderLink) return;

    LGraphCanvas.prototype.renderLink = function (ctx, a, b, link, skip_border, flow, color, start_dir, end_dir, num_sublines) {
        const graph = this.graph;
        const srcNode = graph?.getNodeById(link?.origin_id);
        const dstNode = graph?.getNodeById(link?.target_id);
        const isGigachad = GIGACHAD_NODE_TYPES.has(srcNode?.type) || GIGACHAD_NODE_TYPES.has(dstNode?.type);

        if (!isGigachad) {
            return origRenderLink.call(this, ctx, a, b, link, skip_border, flow, color, start_dir, end_dir, num_sublines);
        }

        const t     = Date.now() / 1000;
        const pulse = 0.5 + 0.5 * Math.sin(t * (2 * Math.PI / 0.8));
        const elec  = 0.5 + 0.5 * Math.sin(t * (2 * Math.PI / 0.35) + 1.2);

        // ── Draw glow layers underneath using our gold colours ────────────────
        // Each pass draws the native ComfyUI path shape (respects straight/bezier
        // with nodules, whatever the user has set) but with our gold stroke.
        ctx.save();

        // Deep gold outer glow
        ctx.shadowColor = GOLD.deep; ctx.shadowBlur = 22 + pulse * 14;
        ctx.globalAlpha = 0.20 + pulse * 0.15;
        origRenderLink.call(this, ctx, a, b, link, true, false, GOLD.deep, start_dir, end_dir, num_sublines);

        // Core gold
        ctx.shadowColor = GOLD.core; ctx.shadowBlur = 14 + pulse * 10;
        ctx.globalAlpha = 0.65 + pulse * 0.25;
        origRenderLink.call(this, ctx, a, b, link, true, false, GOLD.core, start_dir, end_dir, num_sublines);

        // Electric blue shimmer
        ctx.shadowColor = ELEC.core; ctx.shadowBlur = 10 + elec * 16;
        ctx.globalAlpha = 0.18 + elec * 0.35;
        origRenderLink.call(this, ctx, a, b, link, true, false, ELEC.plasma, start_dir, end_dir, num_sublines);

        // Hot white centre flicker
        ctx.shadowColor = ELEC.arc; ctx.shadowBlur = 4;
        ctx.globalAlpha = 0.10 + elec * 0.30;
        origRenderLink.call(this, ctx, a, b, link, true, false, GOLD.white, start_dir, end_dir, num_sublines);

        ctx.restore();
        app.graph.setDirtyCanvas(true, false);
    };
}
