import { app } from "../../scripts/app.js";
import { drawGigachadBorder, GigachadParticleSystem, GOLD, ELEC, installElectricLinks } from "./gigachad_shared.js";

const NODE_TYPE = "GigachadCLIPLoader";

const DTYPE_COLORS = {
    "default":         { bg: "#1a1400", border: "#5a4a00", text: GOLD.core },
    "fp16":            { bg: "#1a1400", border: "#6a5a00", text: GOLD.bright },
    "bf16":            { bg: "#1a1400", border: "#5a5a00", text: GOLD.plasma },
    "fp8_e4m3fn":      { bg: "#0a1a2a", border: "#1a5a8a", text: ELEC.core },
    "fp8_e4m3fn_fast": { bg: "#0a1a2a", border: "#1a6a9a", text: ELEC.bright },
    "fp8_e5m2":        { bg: "#0a1a2a", border: "#1a4a8a", text: ELEC.plasma },
    "nvfp4":           { bg: "#1a0a2a", border: "#6a1a8a", text: "#cc77ff" },
    "mxfp8":           { bg: "#2a0a1a", border: "#8a1a5a", text: "#ff77bb" },
};

function dtypeColor(dtype) { return DTYPE_COLORS[dtype] ?? DTYPE_COLORS["default"]; }

app.registerExtension({
    name: "Gigachad.CLIPLoader",

    async setup() { installElectricLinks(); },

    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== NODE_TYPE) return;

        const origCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            origCreated?.call(this);
            this.color   = "#2a1f00";
            this.bgcolor = "#1a1200";
            this.title   = "⚡ Gigachad CLIP Loader";
            this._particles = new GigachadParticleSystem();

            const w = (name) => this.widgets?.find(w => w.name === name);
            const dualW  = w("dual_clip");
            const clip2W = w("clip_name_2");
            const dtype2W = w("dtype_2");
            const type2W  = w("clip_type_2");

            const syncDual = (isDual) => {
                [clip2W, dtype2W, type2W].forEach(ww => {
                    if (!ww) return;
                    ww.hidden = !isDual;
                });
                this.setSize(this.computeSize());
                app.graph.setDirtyCanvas(true, true);
            };

            if (dualW) {
                // Defer so widget values are fully restored before we hide
                setTimeout(() => syncDual(dualW.value ?? false), 0);
                const origCb = dualW.callback;
                dualW.callback = (val) => { syncDual(val); origCb?.call(dualW, val); };
            }
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
            const w = (name) => this.widgets?.find(w => w.name === name);

            ctx.save();

            ctx.font = "bold 10px sans-serif"; ctx.textAlign = "right";
            ctx.fillStyle = GOLD.bright; ctx.shadowColor = GOLD.core; ctx.shadowBlur = 8 + pulse * 6;
            ctx.fillText("⚡ GIGACHAD", W - 52, 14);
            ctx.fillStyle = ELEC.bright; ctx.shadowColor = ELEC.core;
            ctx.shadowBlur = 4 + elecPulse * 8; ctx.globalAlpha = elecPulse * 0.4;
            ctx.fillText("⚡ GIGACHAD", W - 52, 14);
            ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.shadowColor = "transparent";

            const drawPill = (label, x, y) => {
                const c = dtypeColor(label);
                ctx.font = "bold 9px monospace";
                const tw = ctx.measureText(label).width;
                const pw = tw + 10, ph = 14;
                ctx.beginPath(); ctx.roundRect(x - pw, y, pw, ph, 4);
                ctx.fillStyle = c.bg; ctx.fill();
                ctx.strokeStyle = c.border; ctx.lineWidth = 1; ctx.stroke();
                ctx.fillStyle = c.text; ctx.textAlign = "center"; ctx.textBaseline = "middle";
                ctx.fillText(label, x - pw / 2, y + ph / 2);
            };

            const TH = LiteGraph.NODE_TITLE_HEIGHT, widgetH = LiteGraph.NODE_WIDGET_HEIGHT ?? 20, gap = 4;
            const slotY = (idx) => TH + 4 + idx * (widgetH + gap) + widgetH / 2;
            const dtype1 = w("dtype_1")?.value ?? "default";
            const dtype2 = w("dtype_2")?.value ?? "default";
            const dual   = w("dual_clip")?.value ?? false;

            drawPill(dtype1, W - 8, slotY(2) - 7);

            ctx.font = "bold 10px sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
            ctx.fillStyle = dual ? GOLD.core : GOLD.deep;
            ctx.shadowColor = dual ? GOLD.core : "transparent";
            ctx.shadowBlur = dual ? 5 : 0;
            ctx.fillText(dual ? "◉ DUAL" : "◎ SINGLE", 12, slotY(3));

            if (dual) { ctx.shadowBlur = 0; ctx.shadowColor = "transparent"; drawPill(dtype2, W - 8, slotY(6) - 7); }

            ctx.restore();
        };

        nodeType.prototype.computeSize = function () {
            const dual = this.widgets?.find(w => w.name === "dual_clip")?.value ?? false;
            const wH = LiteGraph.NODE_WIDGET_HEIGHT ?? 20, gap = 4, TH = LiteGraph.NODE_TITLE_HEIGHT;
            return [340, Math.max(TH + 8 + (dual ? 7 : 4) * (wH + gap) + 12, dual ? 200 : 130)];
        };
    },
});
