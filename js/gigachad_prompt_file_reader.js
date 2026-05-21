import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";
import { drawGigachadBorder, GigachadParticleSystem, GOLD, ELEC, installElectricLinks } from "./gigachad_shared.js";

const NODE_TYPE = "GigachadPromptFileReader";

// ── Panel section heights (fixed, never overlap) ──────────────────────────────
const RELOAD_BTN_H = 24;   // reload button row
const PROGRESS_H   = 36;   // progress bar + counter + filename
const PROMPT_BOX_H = 80;   // prompt text box
const GAP          = 6;    // gap between sections
const PANEL_PAD    = 8;    // padding inside panel top/bottom

const TOTAL_PANEL_H = PANEL_PAD + RELOAD_BTN_H + GAP + PROGRESS_H + GAP + PROMPT_BOX_H + PANEL_PAD;

// ── Get the Y position where the panel should start ───────────────────────────
// Reads last_y from the last visible widget so we never overlap them.
function getPanelY(node) {
    const widgets = (node.widgets ?? []).filter(w => !w.hidden && w.type !== "hidden");
    if (widgets.length === 0) return LiteGraph.NODE_TITLE_HEIGHT + 6;
    // Find the widget with the largest last_y
    let maxY = 0;
    for (const w of widgets) {
        const y = (w.last_y ?? 0) + (LiteGraph.NODE_WIDGET_HEIGHT ?? 20);
        if (y > maxY) maxY = y;
    }
    // If last_y hasn't been set yet (first draw), fall back to calculation
    if (maxY < LiteGraph.NODE_TITLE_HEIGHT) {
        const TH = LiteGraph.NODE_TITLE_HEIGHT;
        const wH = LiteGraph.NODE_WIDGET_HEIGHT ?? 20;
        return TH + 6 + widgets.length * (wH + 4) + 4;
    }
    return maxY + 6;
}

// ── Stop flag ─────────────────────────────────────────────────────────────────
let _gigachadStopped = false;
let _gigachadAutoQueuing = false; // true when WE fired the queue, not the user

app.registerExtension({
    name: "Gigachad.PromptFileReader",

    async setup() {
        installElectricLinks();

        // Set stop flag on interrupt/error
        api.addEventListener("execution_interrupted", () => {
            _gigachadStopped   = true;
            _gigachadAutoQueuing = false;
        });
        api.addEventListener("execution_error", () => {
            _gigachadStopped   = true;
            _gigachadAutoQueuing = false;
        });

        // Only clear stop flag when the user manually triggers a queue run,
        // NOT when our auto-queue fires (which would immediately undo the stop).
        // We detect manual queuing by patching app.queuePrompt and checking
        // whether _gigachadAutoQueuing is set.
        const _origQueuePrompt = app.queuePrompt.bind(app);
        app.queuePrompt = function(num, batchCount) {
            if (!_gigachadAutoQueuing) {
                // User-initiated queue — clear the stop flag
                _gigachadStopped = false;
            }
            return _origQueuePrompt(num, batchCount);
        };
    },

    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== NODE_TYPE) return;

        const origCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            origCreated?.call(this);
            this.color   = "#2a1f00";
            this.bgcolor = "#1a1200";
            this._particles    = new GigachadParticleSystem();
            this.title         = "⚡ Gigachad Prompt File Reader";
            this._lastPrompt   = null;
            this._lastIndex    = null;
            this._lastTotal    = null;
            this._lastFilename = null;
            this._reloadBtnArea  = null;
            this._reloadFlash    = 0;

            const nodeId = this.id;
            if (nodeId != null) {
                fetch("/gigachad_prompt_reset", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ node_id: String(nodeId) }),
                }).catch(() => {});
            }
        };

        // ── onExecuted ────────────────────────────────────────────────────────
        nodeType.prototype.onExecuted = function (data) {
            if (data?.prompt_text)                this._lastPrompt   = data.prompt_text[0]  ?? null;
            if (data?.prompt_index !== undefined) this._lastIndex    = data.prompt_index[0] ?? null;
            if (data?.prompt_total !== undefined) this._lastTotal    = data.prompt_total[0] ?? null;
            if (data?.source_file)                this._lastFilename = data.source_file[0]  ?? null;
            this.setDirtyCanvas(true);

            const shouldContinue = data?.auto_queue?.[0] ?? false;
            if (shouldContinue && !_gigachadStopped) {
                setTimeout(() => {
                    if (!_gigachadStopped) {
                        _gigachadAutoQueuing = true;
                        app.queuePrompt(0, 1);
                        // Reset flag after a tick so the patched queuePrompt
                        // sees it, then clears for next cycle
                        setTimeout(() => { _gigachadAutoQueuing = false; }, 100);
                    }
                }, 300);
            }
        };

        // ── Mouse — Reload button ─────────────────────────────────────────────
        const origMouseDown = nodeType.prototype.onMouseDown;
        nodeType.prototype.onMouseDown = function (event, pos) {
            if (this._reloadBtnArea) {
                const [mx, my] = pos;
                const r = this._reloadBtnArea;
                if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                    fetch("/gigachad_prompt_reload", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ node_id: String(this.id) }),
                    })
                    .then(r => r.json())
                    .then(() => { this._reloadFlash = Date.now(); this.setDirtyCanvas(true); })
                    .catch(() => {});
                    return true;
                }
            }
            return origMouseDown?.call(this, event, pos) ?? false;
        };

        // ── Background ────────────────────────────────────────────────────────
        const origBg = nodeType.prototype.onDrawBackground;
        nodeType.prototype.onDrawBackground = function (ctx) {
            origBg?.call(this, ctx);
            if (!this._particles) this._particles = new GigachadParticleSystem();
            drawGigachadBorder(ctx, this, this._particles);
        };

        // ── Foreground ────────────────────────────────────────────────────────
        const origFg = nodeType.prototype.onDrawForeground;
        nodeType.prototype.onDrawForeground = function (ctx) {
            origFg?.call(this, ctx);
            if (this.flags?.collapsed) return;

            const W = this.size[0];
            const t = Date.now() / 1000;
            const pulse     = 0.5 + 0.5 * Math.sin(t * (2 * Math.PI / 2.4));
            const elecPulse = 0.5 + 0.5 * Math.sin(t * (2 * Math.PI / 0.7));

            ctx.save();

            // ── Badge ─────────────────────────────────────────────────────────
            ctx.font = "bold 10px sans-serif"; ctx.textAlign = "right";
            ctx.fillStyle = GOLD.bright; ctx.shadowColor = GOLD.core;
            ctx.shadowBlur = 8 + pulse * 6;
            ctx.fillText("⚡ GIGACHAD", W - 52, 14);
            ctx.fillStyle = ELEC.bright; ctx.shadowColor = ELEC.core;
            ctx.shadowBlur = 4 + elecPulse * 8; ctx.globalAlpha = elecPulse * 0.4;
            ctx.fillText("⚡ GIGACHAD", W - 52, 14);
            ctx.globalAlpha = 1; ctx.shadowBlur = 0;

            // ── Panel: sits below all widgets, fixed height ───────────────────
            const panelY = getPanelY(this);
            const panelW = W - 20;
            const panelX = 10;

            // Outer panel background
            ctx.fillStyle = "rgba(15,10,0,0.95)";
            ctx.beginPath(); ctx.roundRect(panelX, panelY, panelW, TOTAL_PANEL_H, 7); ctx.fill();
            ctx.strokeStyle = GOLD.deep; ctx.lineWidth = 1; ctx.globalAlpha = 0.45;
            ctx.beginPath(); ctx.roundRect(panelX, panelY, panelW, TOTAL_PANEL_H, 7); ctx.stroke();
            ctx.globalAlpha = 1;

            const innerX = panelX + 8;
            const innerW = panelW - 16;

            // ── SECTION 1: Reload button — top of panel, full width ───────────
            const reloadY  = panelY + PANEL_PAD;
            const reloadH  = RELOAD_BTN_H;
            const flashing = this._reloadFlash && (Date.now() - this._reloadFlash < 600);

            ctx.beginPath(); ctx.roundRect(innerX, reloadY, innerW, reloadH, 5);
            ctx.fillStyle   = flashing ? GOLD.core : "#2a1800";
            ctx.fill();
            ctx.strokeStyle = flashing ? GOLD.bright : GOLD.deep;
            ctx.lineWidth   = 1.2;
            ctx.shadowColor = flashing ? GOLD.bright : GOLD.core;
            ctx.shadowBlur  = flashing ? 12 : 3;
            ctx.stroke();
            ctx.shadowBlur  = 0;

            ctx.font         = `bold 11px monospace`;
            ctx.textAlign    = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle    = flashing ? "#111" : GOLD.plasma;
            ctx.shadowColor  = flashing ? "transparent" : GOLD.core;
            ctx.shadowBlur   = flashing ? 0 : 4;
            ctx.fillText("↺  Reload File / Folder", innerX + innerW / 2, reloadY + reloadH / 2);
            ctx.shadowBlur  = 0;

            this._reloadBtnArea = { x: innerX, y: reloadY, w: innerW, h: reloadH };

            // ── SECTION 2: Progress — bar + counter + filename ────────────────
            const progressY = reloadY + reloadH + GAP;

            if (this._lastPrompt !== null && this._lastTotal !== null) {
                // Progress bar
                const barH = 5, barY = progressY;
                const frac = this._lastTotal > 1
                    ? (this._lastIndex + 1) / this._lastTotal : 1;

                ctx.fillStyle = "#1a1200";
                ctx.beginPath(); ctx.roundRect(innerX, barY, innerW, barH, 2); ctx.fill();
                ctx.fillStyle = GOLD.core; ctx.shadowColor = GOLD.core; ctx.shadowBlur = 5;
                ctx.beginPath(); ctx.roundRect(innerX, barY, innerW * frac, barH, 2); ctx.fill();
                ctx.shadowBlur = 0;

                // Counter
                const counterY = barY + barH + 9;
                ctx.font = "bold 12px monospace"; ctx.textAlign = "left";
                ctx.fillStyle = GOLD.bright; ctx.shadowColor = GOLD.core; ctx.shadowBlur = 4;
                ctx.fillText(`${this._lastIndex + 1} / ${this._lastTotal}`, innerX, counterY);
                ctx.shadowBlur = 0;

                // Filename — right aligned
                if (this._lastFilename) {
                    let fn = this._lastFilename;
                    ctx.font = "9px monospace"; ctx.fillStyle = ELEC.plasma;
                    ctx.textAlign = "right";
                    const maxFnW = innerW - 60;
                    while (fn.length > 1 && ctx.measureText(fn).width > maxFnW)
                        fn = fn.slice(0, -1);
                    if (fn !== this._lastFilename) fn += "…";
                    ctx.fillText(fn, innerX + innerW, counterY);
                }

                // ── SECTION 3: Prompt text box — plain grey, no glow ─────────
                const boxY = progressY + PROGRESS_H;
                const boxH = PROMPT_BOX_H;

                ctx.save();

                // Reset ALL shadow state before drawing the box
                ctx.shadowColor = "transparent";
                ctx.shadowBlur  = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;

                // Plain grey box
                ctx.fillStyle   = "#1e1e1e";
                ctx.strokeStyle = "#444";
                ctx.lineWidth   = 1;
                ctx.beginPath(); ctx.roundRect(innerX, boxY, innerW, boxH, 4);
                ctx.fill();
                ctx.stroke();

                // Clip text strictly inside the box
                ctx.beginPath(); ctx.rect(innerX + 4, boxY + 4, innerW - 8, boxH - 8);
                ctx.clip();

                // Plain white text, no shadow
                ctx.font         = "11px sans-serif";
                ctx.fillStyle    = "#e0e0e0";
                ctx.textBaseline = "top";
                ctx.textAlign    = "left";

                const words    = (this._lastPrompt || "").split(" ");
                const lineH    = 14;
                const textX    = innerX + 6;
                const textW    = innerW - 12;
                const textY    = boxY + 6;
                const maxLines = Math.floor((boxH - 12) / lineH);

                let line = "", lines = [];
                for (const word of words) {
                    const test = line ? line + " " + word : word;
                    if (ctx.measureText(test).width > textW && line) {
                        lines.push(line);
                        line = word;
                        if (lines.length >= maxLines) break;
                    } else {
                        line = test;
                    }
                }
                if (line && lines.length < maxLines) lines.push(line);
                if (lines.length === maxLines) {
                    let last = lines[maxLines - 1];
                    while (last.length > 1 && ctx.measureText(last + "…").width > textW)
                        last = last.slice(0, -1);
                    lines[maxLines - 1] = last + "…";
                }

                lines.forEach((l, i) => ctx.fillText(l, textX, textY + i * lineH));
                ctx.restore();

            } else {
                // Idle — show placeholder in progress area
                const midY = progressY + PROGRESS_H / 2;
                ctx.font = "9px monospace"; ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = GOLD.deep; ctx.globalAlpha = 0.45;
                ctx.fillText("queue to load prompts", innerX + innerW / 2, midY);
                ctx.globalAlpha = 1;

                // Empty prompt box
                const boxY = progressY + PROGRESS_H;
                ctx.fillStyle = "rgba(0,0,0,0.35)";
                ctx.beginPath(); ctx.roundRect(innerX, boxY, innerW, PROMPT_BOX_H, 4); ctx.fill();
                ctx.strokeStyle = "#1a1408"; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.roundRect(innerX, boxY, innerW, PROMPT_BOX_H, 4); ctx.stroke();
                ctx.font = "bold 8px monospace"; ctx.textAlign = "left";
                ctx.fillStyle = GOLD.deep; ctx.textBaseline = "top";
                ctx.fillText("PROMPT", innerX + 5, boxY + 4);
            }

            ctx.restore();
        };

        // ── computeSize — node height = widgets + panel ───────────────────────
        nodeType.prototype.computeSize = function () {
            const panelY = getPanelY(this);
            return [400, panelY + TOTAL_PANEL_H + 6];
        };
    },
});
