import { app } from "../../scripts/app.js";
import { drawGigachadBorder, GigachadParticleSystem, GOLD, ELEC, installElectricLinks } from "./gigachad_shared.js";

const NODE_TYPE = "GigachadCheckpointLoader";

app.registerExtension({
    name: "Gigachad.CheckpointLoader",

    async setup() { installElectricLinks(); },

    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== NODE_TYPE) return;

        const origCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            origCreated?.call(this);
            this.color   = "#2a1f00";
            this.bgcolor = "#1a1200";
            this.title   = "⚡ Gigachad Checkpoint Loader";
            this._particles = new GigachadParticleSystem();
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

            const getW = (name) => this.widgets?.find(w => w.name === name);
            const sage   = getW("sage_attention")?.value ?? false;
            const triton = getW("triton")?.value ?? false;

            ctx.save();

            // Gold badge
            ctx.font = "bold 10px sans-serif"; ctx.textAlign = "right";
            ctx.fillStyle = GOLD.bright; ctx.shadowColor = GOLD.core;
            ctx.shadowBlur = 8 + pulse * 6;
            ctx.fillText("⚡ GIGACHAD", W - 52, 14);
            ctx.fillStyle = ELEC.bright; ctx.shadowColor = ELEC.core;
            ctx.shadowBlur = 4 + elecPulse * 8; ctx.globalAlpha = elecPulse * 0.4;
            ctx.fillText("⚡ GIGACHAD", W - 52, 14);
            ctx.globalAlpha = 1; ctx.shadowBlur = 0;

            // Status pills
            const drawPill = (label, color, x, y) => {
                ctx.font = "bold 9px monospace";
                const tw = ctx.measureText(label).width;
                const pw = tw + 10, ph = 14;
                ctx.beginPath(); ctx.roundRect(x, y, pw, ph, 4);
                ctx.fillStyle = color + "22"; ctx.fill();
                ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.stroke();
                ctx.fillStyle = color; ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(label, x + pw / 2, y + ph / 2);
            };

            const TH = LiteGraph.NODE_TITLE_HEIGHT;
            let px = 8;
            if (sage)   { drawPill("SAGE",   GOLD.core,  px, TH + 2); px += ctx.measureText("SAGE").width + 22; }
            if (triton) { drawPill("TRITON", ELEC.core,  px, TH + 2); }

            ctx.restore();
        };

        nodeType.prototype.computeSize = function () {
            const nWidgets = this.widgets?.length ?? 3;
            const wH = LiteGraph.NODE_WIDGET_HEIGHT ?? 20;
            const TH = LiteGraph.NODE_TITLE_HEIGHT;
            return [340, TH + 8 + nWidgets * (wH + 4) + 12];
        };
    },
});
