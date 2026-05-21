import { app } from "../../scripts/app.js";
import { drawGigachadBorder, GigachadParticleSystem, GOLD, ELEC, installElectricLinks } from "./gigachad_shared.js";

const NODE_TYPE = "GigachadSamplerCustomAdvanced";

function drawPill(ctx, label, x, y, bg, border, textColor) {
    ctx.font = "bold 9px monospace";
    const tw = ctx.measureText(label).width;
    const pw = tw + 10, ph = 14;
    ctx.beginPath(); ctx.roundRect(x - pw, y, pw, ph, 4);
    ctx.fillStyle = bg; ctx.fill();
    ctx.strokeStyle = border; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = textColor; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(label, x - pw / 2, y + ph / 2);
}

app.registerExtension({
    name: "Gigachad.SamplerCustomAdvanced",

    async setup() { installElectricLinks(); },

    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== NODE_TYPE) return;

        const origCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            origCreated?.call(this);
            this.color = "#2a1f00"; this.bgcolor = "#1a1200";
            this._particles = new GigachadParticleSystem();
            this.title = "⚡ Gigachad SamplerCustomAdvanced";

            for (const wname of ["cfg_rescale", "return_with_leftover_noise", "preview_method", "noise_multiplier", "start_at_step", "end_at_step"]) {
                const ww = this.widgets?.find(w => w.name === wname);
                if (!ww) continue;
                const origCb = ww.callback;
                ww.callback = (val) => { app.graph.setDirtyCanvas(true, false); origCb?.call(ww, val); };
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

            let pillX = W - 8;
            const pillY = 46;
            const preview = w("preview_method")?.value ?? "auto";
            if (preview !== "none") {
                const pc = { "auto": ["#0a1a2a", ELEC.core, ELEC.bright], "latent2rgb": ["#1a1400", GOLD.deep, GOLD.core], "taesd": ["#0a1a1a", ELEC.plasma, ELEC.bright] };
                const [bg, border, tc] = pc[preview] ?? pc["auto"];
                drawPill(ctx, `👁 ${preview}`, pillX, pillY, bg, border, tc);
                pillX -= (ctx.measureText(`👁 ${preview}`).width + 20);
            }

            const cfgR = w("cfg_rescale")?.value ?? 0;
            if (cfgR > 0) {
                drawPill(ctx, `cfg↓${cfgR.toFixed(2)}`, pillX, pillY, "#1a1000", GOLD.ember, GOLD.plasma);
                pillX -= (ctx.measureText(`cfg↓${cfgR.toFixed(2)}`).width + 20);
            }

            const nm = w("noise_multiplier")?.value ?? 1.0;
            if (Math.abs(nm - 1.0) > 0.001) {
                drawPill(ctx, `η×${nm.toFixed(2)}`, pillX, pillY, "#0a1a2a", ELEC.core, ELEC.bright);
            }

            const start = w("start_at_step")?.value ?? 0;
            const end   = w("end_at_step")?.value ?? 10000;
            const leftover = w("return_with_leftover_noise")?.value ?? false;
            const endLabel = end >= 10000 ? "end" : String(end);
            const rangeText = `steps ${start} → ${endLabel}` + (leftover ? "  ·  leftover noise" : "");

            ctx.font = "10px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillStyle = leftover ? GOLD.plasma : GOLD.deep;
            ctx.shadowColor = leftover ? GOLD.core : "transparent";
            ctx.shadowBlur = leftover ? 4 : 0;
            ctx.fillText(rangeText, W / 2, this.size[1] - 10);

            ctx.restore();
        };

        nodeType.prototype.computeSize = function () {
            const wH = LiteGraph.NODE_WIDGET_HEIGHT ?? 20, gap = 4, TH = LiteGraph.NODE_TITLE_HEIGHT;
            return [340, Math.max(TH + 8 + 9 * (wH + gap) + 28, 260)];
        };
    },
});
