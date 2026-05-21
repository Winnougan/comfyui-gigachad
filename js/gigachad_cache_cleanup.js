import { app } from "../../scripts/app.js";
import { drawGigachadBorder, GigachadParticleSystem, GOLD, ELEC, installElectricLinks } from "./gigachad_shared.js";

const NODE_TYPE = "GigachadCacheCleanup";

app.registerExtension({
    name: "Gigachad.CacheCleanup",

    async setup() { installElectricLinks(); },

    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== NODE_TYPE) return;

        const origCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            origCreated?.call(this);
            this.color = "#2a1f00"; this.bgcolor = "#1a1200";
            this._particles = new GigachadParticleSystem();
            this.title = "⚡ Gigachad Cache Cleanup";
            this._vramFree  = null;
            this._vramTotal = null;
        };

        nodeType.prototype.onExecuted = function (data) {
            if (data?.vram_free_gb !== undefined) {
                this._vramFree  = data.vram_free_gb[0];
                this._vramTotal = data.vram_total_gb[0];
            }
            this.setDirtyCanvas(true);
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
            const W = this.size[0], H = this.size[1];
            const t = Date.now() / 1000;
            const pulse     = 0.5 + 0.5 * Math.sin(t * (2 * Math.PI / 2.4));
            const elecPulse = 0.5 + 0.5 * Math.sin(t * (2 * Math.PI / 0.7));

            ctx.save();

            // Badge
            ctx.font = "bold 10px sans-serif"; ctx.textAlign = "right";
            ctx.fillStyle = GOLD.bright; ctx.shadowColor = GOLD.core; ctx.shadowBlur = 8 + pulse * 6;
            ctx.fillText("⚡ GIGACHAD", W - 52, 14);
            ctx.fillStyle = ELEC.bright; ctx.shadowColor = ELEC.core;
            ctx.shadowBlur = 4 + elecPulse * 8; ctx.globalAlpha = elecPulse * 0.4;
            ctx.fillText("⚡ GIGACHAD", W - 52, 14);
            ctx.globalAlpha = 1; ctx.shadowBlur = 0;

            // VRAM display — simple gold readout, no timer
            if (this._vramFree !== null) {
                ctx.font = "bold 12px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
                ctx.fillStyle = GOLD.core; ctx.shadowColor = GOLD.core; ctx.shadowBlur = 8 + pulse * 6;
                ctx.fillText(`VRAM ${this._vramFree} / ${this._vramTotal} GB`, W / 2, H - 14);
            } else {
                ctx.font = "10px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
                ctx.fillStyle = GOLD.deep; ctx.shadowBlur = 0;
                ctx.fillText("VRAM — run to measure", W / 2, H - 14);
            }

            ctx.restore();
        };

        nodeType.prototype.computeSize = function () {
            const TH = LiteGraph.NODE_TITLE_HEIGHT, wH = LiteGraph.NODE_WIDGET_HEIGHT ?? 20;
            const vis = (this.widgets ?? []).filter(w => !w.hidden && w.type !== "hidden").length;
            return [300, TH + 4 + vis * (wH + 4) + 6 + 40];
        };
    },
});
