import { app } from "../../scripts/app.js";
import { drawGigachadBorder, GigachadParticleSystem } from "./gigachad_shared.js";

const NODE_TYPE = "GigachadShowText";

app.registerExtension({
    name: "Gigachad.ShowText",

    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== NODE_TYPE) return;

        const origOnNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            origOnNodeCreated?.call(this);
            this.color      = "#2a1f00";
            this.bgcolor    = "#1a1200";
            this.title      = "⚡ Gigachad Show Text";
            this._particles = new GigachadParticleSystem();
            this.resizable  = true;

            // Plain textarea — selectable, copyable, scrollable
            const ta = document.createElement("textarea");
            ta.readOnly = true;
            ta.placeholder = "Text will appear here after execution…";
            ta.style.cssText = `
                width: 100%;
                box-sizing: border-box;
                background: #1e1e1e;
                color: #d4d4d4;
                border: 1px solid #3a3a3a;
                border-radius: 4px;
                font-family: monospace;
                font-size: 11px;
                line-height: 1.5;
                padding: 6px 8px;
                resize: none;
                outline: none;
                scrollbar-width: thin;
                scrollbar-color: #3a3a3a #1e1e1e;
                min-height: 60px;
                height: 120px;
                cursor: text;
                user-select: text;
                -webkit-user-select: text;
            `;

            this._textarea = ta;
            this.addDOMWidget("gigachad_text_display", "gigachad_text_display", ta, {
                getValue: () => ta.value,
                setValue: (v) => { ta.value = v; },
            });
        };

        // Electric border — stays, it's the only VFX
        const origOnDrawBackground = nodeType.prototype.onDrawBackground;
        nodeType.prototype.onDrawBackground = function (ctx) {
            origOnDrawBackground?.call(this, ctx);
            if (!this._particles) this._particles = new GigachadParticleSystem();
            drawGigachadBorder(ctx, this, this._particles);
        };

        // Receive text from server after execution
        const origOnExecuted = nodeType.prototype.onExecuted;
        nodeType.prototype.onExecuted = function (data) {
            origOnExecuted?.call(this, data);
            const textList = data?.text ?? [];
            const joined = Array.isArray(textList)
                ? textList.flat().join("\n")
                : String(textList);
            if (this._textarea) {
                this._textarea.value = joined;
            }
        };
    },
});
