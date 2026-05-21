import { app } from "../../scripts/app.js";
import { drawGigachadBorder, GigachadParticleSystem, GOLD, ELEC, installElectricLinks } from "./gigachad_shared.js";

const NODE_TYPE = "GigachadKSampler";

const CAT_COLORS = {
    "multistep":      { bg: "#1a1400", border: GOLD.deep,  text: GOLD.core },
    "exponential":    { bg: "#0a1a2a", border: "#1a5a8a",  text: ELEC.core },
    "hybrid":         { bg: "#1a1a2a", border: "#4a4a9a",  text: "#9999ff" },
    "linear":         { bg: "#2a1a00", border: GOLD.ember,  text: GOLD.plasma },
    "diag_implicit":  { bg: "#2a0a1a", border: "#8a1a5a",  text: "#ff77bb" },
    "fully_implicit": { bg: "#1a0a2a", border: "#6a1a8a",  text: "#cc77ff" },
    "none":           { bg: "#1a1a1a", border: "#3a3a3a",  text: "#888888" },
};

function samplerCategory(name) {
    if (!name || name === "none") return "none";
    const slash = name.indexOf("/");
    return slash >= 0 ? name.slice(0, slash) : "std";
}

function catColor(name) {
    return CAT_COLORS[samplerCategory(name)] ?? { bg: "#1a1400", border: GOLD.deep, text: GOLD.core };
}

app.registerExtension({
    name: "Gigachad.KSampler",

    async setup() { installElectricLinks(); },

    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== NODE_TYPE) return;

        const origCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            origCreated?.call(this);
            this.color = "#2a1f00"; this.bgcolor = "#1a1200";
            this._particles = new GigachadParticleSystem();
            this.title = "⚡ Gigachad KSampler";

            const bongW      = this.widgets?.find(w => w.name === "bongmath");
            const bongCfgW   = this.widgets?.find(w => w.name === "bongmath_cfg_scale");
            const bongScaleW = this.widgets?.find(w => w.name === "bongmath_scale");

            const syncBong = (val) => {
                [bongCfgW, bongScaleW].forEach(ww => {
                    if (!ww) return;
                    if (!val) { ww._savedType = ww._savedType ?? ww.type; ww.type = "hidden"; }
                    else if (ww._savedType) { ww.type = ww._savedType; }
                });
                this.setSize(this.computeSize());
                app.graph.setDirtyCanvas(true, true);
            };

            if (bongW) {
                syncBong(bongW.value);
                const origCb = bongW.callback;
                bongW.callback = (val) => { syncBong(val); origCb?.call(bongW, val); };
            }

            const clownW = this.widgets?.find(w => w.name === "clown_sampler");
            if (clownW) {
                const origCb = clownW.callback;
                clownW.callback = (val) => { app.graph.setDirtyCanvas(true, false); origCb?.call(clownW, val); };
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

            ctx.save();

            ctx.font = "bold 10px sans-serif"; ctx.textAlign = "right";
            ctx.fillStyle = GOLD.bright; ctx.shadowColor = GOLD.core; ctx.shadowBlur = 8 + pulse * 6;
            ctx.fillText("⚡ GIGACHAD", W - 52, 14);
            ctx.fillStyle = ELEC.bright; ctx.shadowColor = ELEC.core;
            ctx.shadowBlur = 4 + elecPulse * 8; ctx.globalAlpha = elecPulse * 0.4;
            ctx.fillText("⚡ GIGACHAD", W - 52, 14);
            ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.shadowColor = "transparent";

            const clownW = this.widgets?.find(w => w.name === "clown_sampler");
            const stdW   = this.widgets?.find(w => w.name === "sampler");
            const active = (clownW?.value && clownW.value !== "none") ? clownW.value : (stdW?.value ?? "");

            if (active && active !== "none") {
                const cat = samplerCategory(active);
                const c   = catColor(active);
                const label = cat === "std" ? "std" : cat.replace("_", " ");
                ctx.font = "bold 9px monospace";
                const tw = ctx.measureText(label).width;
                const pw = tw + 10, ph = 14;
                const px = W - 8 - pw, py = 22;
                ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 4);
                ctx.fillStyle = c.bg; ctx.fill();
                ctx.strokeStyle = c.border; ctx.lineWidth = 1; ctx.stroke();
                ctx.fillStyle = c.text; ctx.textAlign = "center"; ctx.textBaseline = "middle";
                ctx.fillText(label, px + pw / 2, py + ph / 2);
            }

            const bongW = this.widgets?.find(w => w.name === "bongmath");
            if (bongW?.value) {
                ctx.font = "bold 10px sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
                ctx.fillStyle = GOLD.plasma; ctx.shadowColor = GOLD.core; ctx.shadowBlur = 7;
                ctx.fillText("🔔 bongmath", 12, 26);
            }

            ctx.restore();
        };

        nodeType.prototype.computeSize = function () {
            const bongOn  = this.widgets?.find(w => w.name === "bongmath")?.value ?? false;
            const wH = LiteGraph.NODE_WIDGET_HEIGHT ?? 20, gap = 4, TH = LiteGraph.NODE_TITLE_HEIGHT;
            const slots = 12 + (bongOn ? 2 : 0);
            return [360, Math.max(TH + 8 + slots * (wH + gap) + 16, bongOn ? 330 : 280)];
        };
    },
});
