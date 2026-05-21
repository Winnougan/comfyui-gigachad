import { app } from "../../scripts/app.js";
import { GigachadParticleSystem, GOLD, ELEC, installElectricLinks } from "./gigachad_shared.js";

const NODE_TYPE = "GigachadPromptEncoder";

// ── Gold/electric dual-section border ─────────────────────────────────────────
function drawGigachadDualBorder(ctx, node, particles, dividerBodyY) {
    if (node.flags?.collapsed) return;
    const W = node.size[0], H = node.size[1] + LiteGraph.NODE_TITLE_HEIGHT;
    const yOff = -LiteGraph.NODE_TITLE_HEIGHT, r = 8;
    const t = Date.now() / 1000;
    const goldPulse = 0.5 + 0.5 * Math.sin(t * (2 * Math.PI / 2.4));
    const elecPulse = 0.5 + 0.5 * Math.sin(t * (2 * Math.PI / 0.7) + 0.8);
    const breathe   = 0.5 + 0.5 * Math.sin(t * (2 * Math.PI / 4.0));
    app.graph.setDirtyCanvas(true, false);

    ctx.save();

    // Outer gold aura
    ctx.shadowColor = GOLD.deep; ctx.shadowBlur = 40 + breathe * 20;
    ctx.strokeStyle = GOLD.deep; ctx.lineWidth = 1; ctx.globalAlpha = 0.08 + breathe * 0.10;
    ctx.beginPath(); ctx.roundRect(-4, yOff - 4, W + 8, H + 8, r + 4); ctx.stroke();

    // Main gold border
    ctx.shadowColor = GOLD.core; ctx.shadowBlur = 20 + goldPulse * 25;
    ctx.strokeStyle = GOLD.core; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.55 + goldPulse * 0.35;
    ctx.beginPath(); ctx.roundRect(0, yOff, W, H, r); ctx.stroke();

    // Inner gold rim
    ctx.shadowColor = GOLD.bright; ctx.shadowBlur = 10 + goldPulse * 12;
    ctx.strokeStyle = GOLD.bright; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.35 + goldPulse * 0.45;
    ctx.beginPath(); ctx.roundRect(1.5, yOff + 1.5, W - 3, H - 3, r); ctx.stroke();

    // Electric overlay
    ctx.shadowColor = ELEC.core; ctx.shadowBlur = 14 + elecPulse * 20;
    ctx.strokeStyle = ELEC.plasma; ctx.lineWidth = 1.0; ctx.globalAlpha = 0.10 + elecPulse * 0.25;
    ctx.beginPath(); ctx.roundRect(0.5, yOff + 0.5, W - 1, H - 1, r); ctx.stroke();

    // Gold corners top (positive)
    ctx.shadowColor = GOLD.hot; ctx.shadowBlur = 12; ctx.globalAlpha = 0.5 + goldPulse * 0.5;
    ctx.fillStyle = GOLD.hot;
    const dSize = 3 + goldPulse * 2;
    for (const [cx, cy] of [[0, yOff], [W, yOff]]) {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 4);
        ctx.fillRect(-dSize / 2, -dSize / 2, dSize, dSize); ctx.restore();
    }

    // Electric corners bottom (negative section hint)
    ctx.shadowColor = ELEC.arc; ctx.shadowBlur = 12; ctx.globalAlpha = 0.4 + elecPulse * 0.5;
    ctx.fillStyle = ELEC.plasma;
    for (const [cx, cy] of [[0, yOff + H], [W, yOff + H]]) {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 4);
        ctx.fillRect(-dSize / 2, -dSize / 2, dSize, dSize); ctx.restore();
    }

    ctx.restore();

    const dt = 1 / 60;
    particles.update(W, H, yOff, dt);
    particles.draw(ctx);
}

function drawGigachadDivider(ctx, W, bodyY) {
    const t = Date.now() / 1000;
    const p = 0.5 + 0.5 * Math.sin(t * (2 * Math.PI / 2.4));
    ctx.save();
    const grad = ctx.createLinearGradient(8, bodyY, W - 8, bodyY);
    grad.addColorStop(0, GOLD.core); grad.addColorStop(0.5, ELEC.plasma); grad.addColorStop(1, GOLD.ember);
    ctx.shadowColor = GOLD.white; ctx.shadowBlur = 2 + p * 3;
    ctx.globalAlpha = 0.65 + p * 0.20; ctx.strokeStyle = grad; ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(8, bodyY); ctx.lineTo(W - 8, bodyY); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
}

function makeLabelWidget(name, text, color, height = 20) {
    return {
        name, type: "GIGACHAD_LABEL", value: text, _color: color, _height: height,
        draw(ctx, node, widgetWidth, y, H) {
            ctx.save(); ctx.font = "bold 9px sans-serif"; ctx.textAlign = "left";
            ctx.textBaseline = "middle"; ctx.fillStyle = this._color;
            ctx.shadowColor = this._color; ctx.shadowBlur = 4;
            ctx.fillText(this.value, 8, y + this._height / 2); ctx.restore();
        },
        computeSize(width) { return [width, this._height]; },
        mouse() { return false; }, serializeValue() { return undefined; },
    };
}

function makeDividerWidget() {
    return {
        name: "_gigachad_divider", type: "GIGACHAD_DIVIDER", value: null, _divY: null,
        draw(ctx, node, widgetWidth, y, H) {
            this._divY = y + H / 2;
            drawGigachadDivider(ctx, widgetWidth, y + H / 2);
        },
        computeSize(width) { return [width, 20]; },
        mouse() { return false; }, serializeValue() { return undefined; },
    };
}

function _injectWidgets(node, savedZeroNeg) {
    const getW = (name) => node.widgets?.find(ww => ww.name === name);
    if (getW("_pos_label")) { _applyZeroNeg(node, savedZeroNeg ?? getW("zero_neg")?.value ?? false); return; }

    const posW = getW("positive"), negW = getW("negative"), zeroW = getW("zero_neg");
    if (!posW || !negW || !zeroW) return;

    const posLabel = makeLabelWidget("_pos_label", "▲  POSITIVE", GOLD.core, 18);
    const dividerW = makeDividerWidget();
    const negLabel = makeLabelWidget("_neg_label", "▼  NEGATIVE", ELEC.plasma, 18);

    node._negLabel = negLabel; node._dividerW = dividerW;
    node.widgets = [posLabel, posW, dividerW, negLabel, negW, zeroW];
    _applyZeroNeg(node, savedZeroNeg ?? zeroW.value ?? false);

    if (!zeroW._gigachad_hooked) {
        zeroW._gigachad_hooked = true;
        const origCb = zeroW.callback;
        zeroW.callback = (val) => { _applyZeroNeg(node, val); origCb?.call(zeroW, val); };
    }
    node.setSize(node.computeSize());
    app.graph.setDirtyCanvas(true, true);
}

function _applyZeroNeg(node, val) {
    if (!node._negLabel) return;
    node._negLabel.value  = val ? "▽  NEGATIVE  (zeroed out)" : "▼  NEGATIVE";
    node._negLabel._color = val ? "#666666" : ELEC.plasma;
    const negW = node.widgets?.find(ww => ww.name === "negative");
    if (negW) negW.disabled = val;
}

app.registerExtension({
    name: "Gigachad.PromptEncoder",

    async setup() { installElectricLinks(); },

    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== NODE_TYPE) return;

        const origCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            origCreated?.call(this);
            this.color = "#2a1f00"; this.bgcolor = "#1a1200";
            this._particles = new GigachadParticleSystem();
            this.title = "⚡ Gigachad Prompt Encoder";
            _injectWidgets(this);
        };

        const origConfigure = nodeType.prototype.onConfigure;
        nodeType.prototype.onConfigure = function (data) {
            origConfigure?.call(this, data);
            this.color = this.color ?? "#2a1f00"; this.bgcolor = this.bgcolor ?? "#1a1200";
            this._particles = this._particles ?? new GigachadParticleSystem();
            this.title = "⚡ Gigachad Prompt Encoder";
            const savedZeroNeg = data?.widgets_values?.[2] ?? false;
            if (this.widgets) {
                this.widgets = this.widgets.filter(w => !["_pos_label", "_gigachad_divider", "_neg_label"].includes(w.name));
            }
            this._negLabel = null; this._dividerW = null;
            _injectWidgets(this, savedZeroNeg);
        };

        const origBg = nodeType.prototype.onDrawBackground;
        nodeType.prototype.onDrawBackground = function (ctx) {
            origBg?.call(this, ctx);
            if (!this._particles) this._particles = new GigachadParticleSystem();
            drawGigachadDualBorder(ctx, this, this._particles, this._dividerW?._divY ?? null);
        };

        const origFg = nodeType.prototype.onDrawForeground;
        nodeType.prototype.onDrawForeground = function (ctx) {
            origFg?.call(this, ctx);
            if (this.flags?.collapsed) return;
            const W = this.size[0];
            const t = Date.now() / 1000;
            const pulse     = 0.5 + 0.5 * Math.sin(t * (2 * Math.PI / 2.4));
            const elecPulse = 0.5 + 0.5 * Math.sin(t * (2 * Math.PI / 0.7));
            const getW = (name) => this.widgets?.find(ww => ww.name === name);
            const isZero = getW("zero_neg")?.value ?? false;

            ctx.save();
            ctx.font = "bold 10px sans-serif"; ctx.textAlign = "right";
            ctx.fillStyle = GOLD.bright; ctx.shadowColor = GOLD.core; ctx.shadowBlur = 8 + pulse * 6;
            ctx.fillText("⚡ GIGACHAD", W - 52, 14);
            ctx.fillStyle = ELEC.bright; ctx.shadowColor = ELEC.core;
            ctx.shadowBlur = 4 + elecPulse * 8; ctx.globalAlpha = elecPulse * 0.4;
            ctx.fillText("⚡ GIGACHAD", W - 52, 14);
            ctx.globalAlpha = 1; ctx.shadowBlur = 0;

            if (isZero) {
                const negLabelW = getW("_neg_label");
                if (negLabelW?.last_y != null) {
                    const label = "COND ZERO OUT";
                    ctx.font = "bold 9px monospace";
                    const tw = ctx.measureText(label).width;
                    const pw = tw + 12, ph = 14;
                    const px = W - pw - 8, py = negLabelW.last_y + 2;
                    ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 4);
                    ctx.fillStyle = "#1a0a00"; ctx.fill();
                    ctx.strokeStyle = GOLD.ember; ctx.lineWidth = 1; ctx.stroke();
                    ctx.fillStyle = GOLD.plasma; ctx.textAlign = "center"; ctx.textBaseline = "middle";
                    ctx.fillText(label, px + pw / 2, py + ph / 2);
                }
            }
            ctx.restore();
        };

        nodeType.prototype.computeSize = function () {
            const W = 360;
            if (!this.widgets?.length) return [W, 300];
            let h = LiteGraph.NODE_TITLE_HEIGHT + 4;
            const slotH = LiteGraph.NODE_SLOT_HEIGHT ?? 20;
            h += Math.max(this.inputs?.length ?? 0, this.outputs?.length ?? 0) * slotH;
            for (const ww of this.widgets) {
                const [, wh] = ww.computeSize ? ww.computeSize(W) : [W, LiteGraph.NODE_WIDGET_HEIGHT ?? 20];
                h += wh + 4;
            }
            return [W, Math.max(h + 12, 280)];
        };
    },
});
