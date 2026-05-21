import { app } from "../../scripts/app.js";
import { drawGigachadBorder, GigachadParticleSystem, GOLD, ELEC, installElectricLinks } from "./gigachad_shared.js";

const NODE_TYPE = "GigachadModelLoader";

app.registerExtension({
    name: "Gigachad.ModelLoader",

    async setup() { installElectricLinks(); },

    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== NODE_TYPE) return;

        const origOnNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            origOnNodeCreated?.call(this);
            this.color   = "#2a1f00";
            this.bgcolor = "#1a1200";
            this.title   = "⚡ Gigachad Model Loader";
            this._particles = new GigachadParticleSystem();

            const modelWidget      = this.widgets?.find(w => w.name === "model_name");
            const loaderTypeWidget = this.widgets?.find(w => w.name === "loader_type");

            if (modelWidget && loaderTypeWidget) {
                if (!this._allModelNames) {
                    this._allModelNames = [...(modelWidget.options?.values ?? [])];
                }

                const isGguf = name => name.toLowerCase().endsWith(".gguf");

                const applyFilter = (loaderType, currentValue) => {
                    const all      = this._allModelNames;
                    const filtered = loaderType === "GGUF" ? all.filter(isGguf) : all.filter(m => !isGguf(m));
                    modelWidget.options.values = [...all];
                    const target = currentValue ?? modelWidget.value;
                    if (filtered.includes(target)) modelWidget.value = target;
                    else if (filtered.length > 0) modelWidget.value = filtered[0];
                    app.graph.setDirtyCanvas(true);
                };

                setTimeout(() => applyFilter(loaderTypeWidget.value, modelWidget.value), 0);
                const origCallback = loaderTypeWidget.callback;
                loaderTypeWidget.callback = (value) => {
                    applyFilter(value, modelWidget.value);
                    origCallback?.call(loaderTypeWidget, value);
                };
            }
        };

        const origOnDrawBackground = nodeType.prototype.onDrawBackground;
        nodeType.prototype.onDrawBackground = function (ctx) {
            origOnDrawBackground?.call(this, ctx);
            if (!this._particles) this._particles = new GigachadParticleSystem();
            drawGigachadBorder(ctx, this, this._particles);
        };

        const origOnDrawForeground = nodeType.prototype.onDrawForeground;
        nodeType.prototype.onDrawForeground = function (ctx) {
            origOnDrawForeground?.call(this, ctx);
            if (this.flags?.collapsed) return;

            const W = this.size[0];
            const t = Date.now() / 1000;
            const pulse     = 0.5 + 0.5 * Math.sin(t * (2 * Math.PI / 2.4));
            const elecPulse = 0.5 + 0.5 * Math.sin(t * (2 * Math.PI / 0.7));

            ctx.save();
            ctx.font = "bold 10px sans-serif"; ctx.textAlign = "right";
            ctx.fillStyle = GOLD.bright; ctx.shadowColor = GOLD.core;
            ctx.shadowBlur = 8 + pulse * 6;
            ctx.fillText("⚡ GIGACHAD", W - 52, 14);
            ctx.fillStyle = ELEC.bright; ctx.shadowColor = ELEC.core;
            ctx.shadowBlur = 4 + elecPulse * 8; ctx.globalAlpha = elecPulse * 0.4;
            ctx.fillText("⚡ GIGACHAD", W - 52, 14);
            ctx.restore();
        };
    },
});
