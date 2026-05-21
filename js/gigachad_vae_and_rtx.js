import { app } from "../../scripts/app.js";
import { drawGigachadBorder, GigachadParticleSystem, GOLD, ELEC, installElectricLinks } from "./gigachad_shared.js";

// ── VAE Loader ────────────────────────────────────────────────────────────────
app.registerExtension({
    name: "Gigachad.VAELoader",
    async setup() { installElectricLinks(); },
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== "GigachadVAELoader") return;
        const origCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            origCreated?.call(this);
            this.color = "#2a1f00"; this.bgcolor = "#1a1200";
            this._particles = new GigachadParticleSystem();
            this.title = "⚡ Gigachad VAE Loader";
        };
        const origBg = nodeType.prototype.onDrawBackground;
        nodeType.prototype.onDrawBackground = function (ctx) {
            origBg?.call(this, ctx);
            if (!this._particles) this._particles = new GigachadParticleSystem();
            drawGigachadBorder(ctx, this, this._particles);
        };
        const origFg = nodeType.prototype.onDrawForeground;
        nodeType.prototype.onDrawForeground = function (ctx) {
            origFg?.call(this, ctx);
            if (this.flags?.collapsed) return;
            const W = this.size[0];
            const t = Date.now() / 1000;
            const pulse     = 0.5 + 0.5 * Math.sin(t * (2 * Math.PI / 2.4));
            const elecPulse = 0.5 + 0.5 * Math.sin(t * (2 * Math.PI / 0.7));
            const w = (name) => this.widgets?.find(ww => ww.name === name);
            const dtype = w("weight_dtype")?.value ?? "bf16";

            ctx.save();
            ctx.font = "bold 10px sans-serif"; ctx.textAlign = "right";
            ctx.fillStyle = GOLD.bright; ctx.shadowColor = GOLD.core; ctx.shadowBlur = 8 + pulse * 6;
            ctx.fillText("⚡ GIGACHAD", W - 52, 14);
            ctx.fillStyle = ELEC.bright; ctx.shadowColor = ELEC.core;
            ctx.shadowBlur = 4 + elecPulse * 8; ctx.globalAlpha = elecPulse * 0.4;
            ctx.fillText("⚡ GIGACHAD", W - 52, 14);
            ctx.globalAlpha = 1; ctx.shadowBlur = 0;

            // dtype pill
            ctx.font = "bold 9px monospace";
            const tw = ctx.measureText(dtype).width;
            const pw = tw + 10, ph = 14, px = W - 8 - pw;
            const TH = LiteGraph.NODE_TITLE_HEIGHT, wH = LiteGraph.NODE_WIDGET_HEIGHT ?? 20;
            const py = TH + 4 + 2 * (wH + 4) - 7;
            ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 4);
            ctx.fillStyle = "#1a1400"; ctx.fill();
            ctx.strokeStyle = GOLD.deep; ctx.lineWidth = 1; ctx.stroke();
            ctx.fillStyle = GOLD.core; ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(dtype, px + pw / 2, py + ph / 2);
            ctx.restore();
        };
    },
});

// ── VAE Decode ────────────────────────────────────────────────────────────────
app.registerExtension({
    name: "Gigachad.VAEDecode",
    async setup() { installElectricLinks(); },
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== "GigachadVAEDecode") return;
        const origCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            origCreated?.call(this);
            this.color = "#2a1f00"; this.bgcolor = "#1a1200";
            this._particles = new GigachadParticleSystem();
            this.title = "⚡ Gigachad VAE Decode";
        };
        const origBg = nodeType.prototype.onDrawBackground;
        nodeType.prototype.onDrawBackground = function (ctx) {
            origBg?.call(this, ctx);
            if (!this._particles) this._particles = new GigachadParticleSystem();
            drawGigachadBorder(ctx, this, this._particles);
        };
        const origFg = nodeType.prototype.onDrawForeground;
        nodeType.prototype.onDrawForeground = function (ctx) {
            origFg?.call(this, ctx);
            if (this.flags?.collapsed) return;
            const W = this.size[0];
            const t = Date.now() / 1000;
            const pulse     = 0.5 + 0.5 * Math.sin(t * (2 * Math.PI / 2.4));
            const elecPulse = 0.5 + 0.5 * Math.sin(t * (2 * Math.PI / 0.7));
            const w = (name) => this.widgets?.find(ww => ww.name === name);
            const tiled = w("tiled")?.value ?? false;

            ctx.save();
            ctx.font = "bold 10px sans-serif"; ctx.textAlign = "right";
            ctx.fillStyle = GOLD.bright; ctx.shadowColor = GOLD.core; ctx.shadowBlur = 8 + pulse * 6;
            ctx.fillText("⚡ GIGACHAD", W - 52, 14);
            ctx.fillStyle = ELEC.bright; ctx.shadowColor = ELEC.core;
            ctx.shadowBlur = 4 + elecPulse * 8; ctx.globalAlpha = elecPulse * 0.4;
            ctx.fillText("⚡ GIGACHAD", W - 52, 14);
            ctx.globalAlpha = 1; ctx.shadowBlur = 0;

            if (tiled) {
                ctx.font = "bold 9px monospace"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
                ctx.fillStyle = ELEC.plasma; ctx.shadowColor = ELEC.core; ctx.shadowBlur = 5;
                ctx.fillText("◈ TILED", 12, LiteGraph.NODE_TITLE_HEIGHT + 10);
            }
            ctx.restore();
        };
    },
});

// ── VAE Encode ────────────────────────────────────────────────────────────────
app.registerExtension({
    name: "Gigachad.VAEEncode",
    async setup() { installElectricLinks(); },
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== "GigachadVAEEncode") return;
        const origCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            origCreated?.call(this);
            this.color = "#2a1f00"; this.bgcolor = "#1a1200";
            this._particles = new GigachadParticleSystem();
            this.title = "⚡ Gigachad VAE Encode";
        };
        const origBg = nodeType.prototype.onDrawBackground;
        nodeType.prototype.onDrawBackground = function (ctx) {
            origBg?.call(this, ctx);
            if (!this._particles) this._particles = new GigachadParticleSystem();
            drawGigachadBorder(ctx, this, this._particles);
        };
        const origFg = nodeType.prototype.onDrawForeground;
        nodeType.prototype.onDrawForeground = function (ctx) {
            origFg?.call(this, ctx);
            if (this.flags?.collapsed) return;
            const W = this.size[0];
            const t = Date.now() / 1000;
            const pulse     = 0.5 + 0.5 * Math.sin(t * (2 * Math.PI / 2.4));
            const elecPulse = 0.5 + 0.5 * Math.sin(t * (2 * Math.PI / 0.7));
            const w = (name) => this.widgets?.find(ww => ww.name === name);
            const tiled = w("tiled")?.value ?? false;

            ctx.save();
            ctx.font = "bold 10px sans-serif"; ctx.textAlign = "right";
            ctx.fillStyle = GOLD.bright; ctx.shadowColor = GOLD.core; ctx.shadowBlur = 8 + pulse * 6;
            ctx.fillText("⚡ GIGACHAD", W - 52, 14);
            ctx.fillStyle = ELEC.bright; ctx.shadowColor = ELEC.core;
            ctx.shadowBlur = 4 + elecPulse * 8; ctx.globalAlpha = elecPulse * 0.4;
            ctx.fillText("⚡ GIGACHAD", W - 52, 14);
            ctx.globalAlpha = 1; ctx.shadowBlur = 0;

            if (tiled) {
                ctx.font = "bold 9px monospace"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
                ctx.fillStyle = ELEC.plasma; ctx.shadowColor = ELEC.core; ctx.shadowBlur = 5;
                ctx.fillText("◈ TILED", 12, LiteGraph.NODE_TITLE_HEIGHT + 10);
            }
            ctx.restore();
        };
    },
});

// ── Gigaresolution (RTX Super Res) ────────────────────────────────────────────
app.registerExtension({
    name: "Gigachad.RTXSuperResolution",
    async setup() { installElectricLinks(); },
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== "GigachadRTXSuperResolution") return;
        const origCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            origCreated?.call(this);
            this.color = "#2a1f00"; this.bgcolor = "#1a1200";
            this._particles = new GigachadParticleSystem();
            this.title = "⚡ Gigaresolution";
        };
        const origBg = nodeType.prototype.onDrawBackground;
        nodeType.prototype.onDrawBackground = function (ctx) {
            origBg?.call(this, ctx);
            if (!this._particles) this._particles = new GigachadParticleSystem();
            drawGigachadBorder(ctx, this, this._particles);
        };
        const origFg = nodeType.prototype.onDrawForeground;
        nodeType.prototype.onDrawForeground = function (ctx) {
            origFg?.call(this, ctx);
            if (this.flags?.collapsed) return;
            const W = this.size[0];
            const t = Date.now() / 1000;
            const pulse     = 0.5 + 0.5 * Math.sin(t * (2 * Math.PI / 2.4));
            const elecPulse = 0.5 + 0.5 * Math.sin(t * (2 * Math.PI / 0.7));
            const w = (name) => this.widgets?.find(ww => ww.name === name);
            // COMBO widgets can return index or string — resolve to string
            const QUALITY_OPTS = ["LOW", "MEDIUM", "HIGH", "ULTRA"];
            const qualityRaw = w("quality")?.value;
            const quality = (typeof qualityRaw === "number")
                ? (QUALITY_OPTS[qualityRaw] ?? "ULTRA")
                : (qualityRaw ?? "ULTRA");
            const scale = w("scale")?.value ?? 2.0;

            ctx.save();

            // Main badge
            ctx.font = "bold 10px sans-serif"; ctx.textAlign = "right";
            ctx.fillStyle = GOLD.bright; ctx.shadowColor = GOLD.core; ctx.shadowBlur = 8 + pulse * 6;
            ctx.fillText("⚡ GIGACHAD", W - 52, 14);
            ctx.fillStyle = ELEC.bright; ctx.shadowColor = ELEC.core;
            ctx.shadowBlur = 4 + elecPulse * 8; ctx.globalAlpha = elecPulse * 0.4;
            ctx.fillText("⚡ GIGACHAD", W - 52, 14);
            ctx.globalAlpha = 1; ctx.shadowBlur = 0;

            // Quality pill
            const qColors = {
                "LOW":    [GOLD.deep,   GOLD.deep,   "#888"],
                "MEDIUM": [GOLD.deep,   GOLD.core,   GOLD.core],
                "HIGH":   ["#1a1400",   GOLD.core,   GOLD.bright],
                "ULTRA":  ["#1a1400",   GOLD.bright, GOLD.hot],
            };
            const [qbg, qborder, qtc] = qColors[quality] ?? qColors["ULTRA"];
            ctx.font = "bold 9px monospace";
            const ql = `RTX ${quality}`;
            const qtw = ctx.measureText(ql).width;
            const qpw = qtw + 10, qph = 14, qpx = W - 8 - qpw;
            ctx.beginPath(); ctx.roundRect(qpx, 22, qpw, qph, 4);
            ctx.fillStyle = qbg; ctx.fill();
            ctx.strokeStyle = qborder; ctx.lineWidth = 1; ctx.stroke();
            ctx.fillStyle = qtc; ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.shadowColor = qborder; ctx.shadowBlur = 4;
            ctx.fillText(ql, qpx + qpw / 2, 22 + qph / 2);
            ctx.shadowBlur = 0;

            // Scale display at bottom — show as float with 2dp
            const scaleNum = parseFloat(scale);
            const label = isNaN(scaleNum) ? "2.00×" : `${scaleNum.toFixed(2)}×`;
            ctx.font = "bold 14px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillStyle = GOLD.core; ctx.shadowColor = GOLD.core; ctx.shadowBlur = 10 + pulse * 8;
            ctx.fillText(label, W / 2, this.size[1] - 14);

            ctx.restore();
        };
    },
});
