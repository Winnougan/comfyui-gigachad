"""
Gigachad Prompt File Reader
────────────────────────────
Reads prompts from .txt files so you never have to type or paste
a prompt into ComfyUI again.

Modes
─────
Single file   — reads one .txt file, splits on blank lines, outputs
                one prompt per execution (cycles through them in order).

Batch folder  — scans a folder for 001.txt, 002.txt … (or any *.txt),
                reads ALL prompts from ALL files in sequence, outputs
                one prompt per execution.

Prompt format
─────────────
Each .txt file can contain ONE prompt or MANY prompts separated by a
blank line (one or more empty lines).

Example — three prompts in one file:
    masterpiece, 2girls, running

    masterpiece, 2girls, flying leaves

    masterpiece, 2girls, spellcasting

Outputs
───────
  prompt      — the current prompt string
  index       — zero-based index of the current prompt in the full list
  total       — total number of prompts loaded
  filename    — which file this prompt came from
  remaining   — how many prompts are left after this one
"""

import os
import re
import glob
import logging

log = logging.getLogger("Gigachad")
NODE_NAME = "Gigachad Prompt File Reader"


def _split_prompts(text: str) -> list[str]:
    """
    Split a text block into individual prompts.
    Prompts are separated by one or more blank lines.
    Each prompt is stripped of leading/trailing whitespace.
    Empty prompts are discarded.
    """
    # Normalise line endings
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Split on one or more blank lines
    blocks = re.split(r"\n\s*\n", text)
    prompts = []
    for block in blocks:
        p = block.strip()
        if p:
            # Collapse internal newlines to spaces so multi-line prompts
            # work correctly as a single conditioning string
            p = " ".join(line.strip() for line in p.splitlines() if line.strip())
            prompts.append(p)
    return prompts


def _load_single_file(path: str) -> list[tuple[str, str]]:
    """Returns list of (prompt, filename) tuples from a single file."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            text = f.read()
    except Exception as e:
        raise RuntimeError(f"[{NODE_NAME}] Cannot read '{path}': {e}") from e
    prompts = _split_prompts(text)
    fname = os.path.basename(path)
    return [(p, fname) for p in prompts]


def _load_batch_folder(folder: str) -> list[tuple[str, str]]:
    """
    Returns list of (prompt, filename) tuples from all *.txt files
    in the folder, sorted numerically by filename so 001 < 002 < 010.
    """
    if not os.path.isdir(folder):
        raise RuntimeError(f"[{NODE_NAME}] Folder not found: '{folder}'")

    pattern = os.path.join(folder, "*.txt")
    files = sorted(glob.glob(pattern), key=lambda p: (
        # Sort by any leading digits, then lexicographically
        int(re.match(r"^(\d+)", os.path.basename(p)).group(1))
        if re.match(r"^(\d+)", os.path.basename(p)) else float("inf"),
        os.path.basename(p).lower()
    ))

    if not files:
        raise RuntimeError(f"[{NODE_NAME}] No .txt files found in '{folder}'")

    all_prompts = []
    for fp in files:
        all_prompts.extend(_load_single_file(fp))

    return all_prompts


# ── Global state store — keyed by node unique_id ─────────────────────────────
# ComfyUI re-instantiates node objects each execution so instance variables
# don't persist. We store state in a module-level dict instead.
_NODE_STATE: dict = {}   # { unique_id: { prompts, index, cache_key } }


class GigachadPromptFileReader:
    """
    Reads prompts from .txt files — one per execution, cycling in order.
    Supports single files (many prompts separated by blank lines)
    and batch folders (001.txt, 002.txt, …).
    """
    NAME     = NODE_NAME
    CATEGORY = "Gigachad"

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "mode": (["single_file", "batch_folder"], {
                    "default": "single_file",
                    "tooltip": (
                        "single_file: read one .txt containing one or more prompts "
                        "separated by blank lines.\n"
                        "batch_folder: read all .txt files in a folder in order."
                    ),
                }),
                "path": ("STRING", {
                    "default": "",
                    "multiline": False,
                    "tooltip": (
                        "single_file: full path to the .txt file, e.g. C:/prompts/myprompts.txt\n"
                        "batch_folder: path to the folder, e.g. C:/prompts/batch/"
                    ),
                }),
                "index_mode": (["sequential", "random", "fixed"], {
                    "default": "sequential",
                    "tooltip": (
                        "sequential: step through prompts one by one each run.\n"
                        "random: pick a random prompt each run.\n"
                        "fixed: always use the prompt at 'fixed_index'."
                    ),
                }),
                "fixed_index": ("INT", {
                    "default": 0, "min": 0, "max": 99999,
                    "tooltip": "Which prompt to use when index_mode='fixed'.",
                }),
                "loop": ("BOOLEAN", {
                    "default": True,
                    "label_on":  "loop (restart at end)",
                    "label_off": "stop at last prompt",
                    "tooltip": "When sequential reaches the last prompt, loop back to 0 or stay.",
                }),
                "reload_each_run": ("BOOLEAN", {
                    "default": False,
                    "label_on":  "reload file each run",
                    "label_off": "cache file (faster)",
                    "tooltip": (
                        "When ON, re-reads the file(s) every execution so edits "
                        "to your .txt are picked up without restarting ComfyUI."
                    ),
                }),
                "auto_queue": ("BOOLEAN", {
                    "default": False,
                    "label_on":  "auto-queue ON",
                    "label_off": "auto-queue OFF",
                    "tooltip": (
                        "When ON, automatically re-queues after each run to step "
                        "through all prompts without clicking Queue repeatedly. "
                        "Stops when the last prompt is reached (unless loop is ON)."
                    ),
                }),
            },
            "hidden": {
                "unique_id": "UNIQUE_ID",
            },
        }

    RETURN_TYPES  = ("STRING", "INT", "INT", "STRING", "INT")
    RETURN_NAMES  = ("prompt", "index", "total", "filename", "remaining")
    FUNCTION      = "read_prompt"
    OUTPUT_NODE   = True

    @classmethod
    def IS_CHANGED(cls, **kwargs):
        return float("NaN")

    def read_prompt(self, mode, path, index_mode, fixed_index, loop, reload_each_run, auto_queue, unique_id=None):
        import random

        # Strip surrounding quotes that users sometimes paste in from Explorer
        path = path.strip().strip('"').strip("'").strip()
        if not path:
            raise ValueError(f"[{NODE_NAME}] 'path' is empty — please set the path to your .txt file or folder.")

        # Get or create per-node state keyed by unique_id
        node_id = str(unique_id) if unique_id is not None else "default"
        state = _NODE_STATE.setdefault(node_id, {
            "prompts": [],
            "index": 0,
            "cache_key": "",
        })

        # Reload if path/mode changed or reload_each_run is on
        cache_key = f"{mode}::{path}"
        if reload_each_run or cache_key != state["cache_key"]:
            if mode == "single_file":
                state["prompts"] = _load_single_file(path)
            else:
                state["prompts"] = _load_batch_folder(path)

            # Reset sequential index only when the source changes
            if cache_key != state["cache_key"]:
                state["index"] = 0

            state["cache_key"] = cache_key
            log.info(f"[{NODE_NAME}] Loaded {len(state['prompts'])} prompt(s) from '{path}'")

        if not state["prompts"]:
            raise RuntimeError(f"[{NODE_NAME}] No prompts found in '{path}'.")

        total = len(state["prompts"])

        # Clamp stored index in case total changed (e.g. file edited, fewer prompts)
        state["index"] = max(0, min(state["index"], total - 1))

        # Resolve which index to use
        if index_mode == "fixed":
            idx = max(0, min(fixed_index, total - 1))
        elif index_mode == "random":
            idx = random.randint(0, total - 1)
        else:  # sequential
            idx = state["index"]
            # Advance for next run
            next_idx = idx + 1
            if next_idx >= total:
                state["index"] = 0 if loop else total - 1
            else:
                state["index"] = next_idx

        prompt, filename = state["prompts"][idx]
        remaining = max(0, total - idx - 1)

        log.info(f"[{NODE_NAME}] [{idx+1}/{total}] {filename}: {prompt[:60]}{'…' if len(prompt) > 60 else ''}")

        # Auto-queue: signal the JS frontend to re-queue if there are prompts left
        # or if loop is enabled. We pass this via the ui dict which the JS reads.
        should_continue = auto_queue and (remaining > 0 or (loop and total > 1))

        return {
            "ui": {
                "auto_queue":    [should_continue],
                "prompt_index":  [idx],
                "prompt_total":  [total],
                "prompt_text":   [prompt],
                "source_file":   [filename],
            },
            "result": (prompt, idx, total, filename, remaining),
        }


# ── Reset endpoint — called by JS on every page load ─────────────────────────
try:
    from aiohttp import web
    from server import PromptServer

    @PromptServer.instance.routes.post("/gigachad_prompt_reset")
    async def gigachad_prompt_reset(request):
        """Resets the sequential index for a node when the page reloads."""
        try:
            data    = await request.json()
            node_id = str(data.get("node_id", ""))
            if node_id and node_id in _NODE_STATE:
                _NODE_STATE[node_id]["index"] = 0
                log.info(f"[{NODE_NAME}] Index reset for node {node_id} (page reload)")
        except Exception as e:
            log.warning(f"[{NODE_NAME}] Reset endpoint error: {e}")
        return web.json_response({"ok": True})

    @PromptServer.instance.routes.post("/gigachad_prompt_reload")
    async def gigachad_prompt_reload(request):
        """Reloads the file/folder from disk and resets index to 0."""
        try:
            data    = await request.json()
            node_id = str(data.get("node_id", ""))
            if node_id and node_id in _NODE_STATE:
                state     = _NODE_STATE[node_id]
                cache_key = state.get("cache_key", "")
                if "::" in cache_key:
                    mode, path = cache_key.split("::", 1)
                    if mode == "single_file":
                        state["prompts"] = _load_single_file(path)
                    else:
                        state["prompts"] = _load_batch_folder(path)
                    state["index"] = 0
                    log.info(f"[{NODE_NAME}] Reloaded {len(state['prompts'])} prompt(s) for node {node_id}")
                    return web.json_response({"ok": True, "total": len(state["prompts"])})
        except Exception as e:
            log.warning(f"[{NODE_NAME}] Reload endpoint error: {e}")
            return web.json_response({"ok": False, "error": str(e)})
        return web.json_response({"ok": False, "error": "node not found"})

except Exception as e:
    log.warning(f"[{NODE_NAME}] Could not register reset endpoint: {e}")


NODE_CLASS_MAPPINGS = {
    "GigachadPromptFileReader": GigachadPromptFileReader,
}
NODE_DISPLAY_NAME_MAPPINGS = {
    "GigachadPromptFileReader": "⚡ Gigachad Prompt File Reader",
}
