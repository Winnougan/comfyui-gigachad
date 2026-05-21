# ⚡ Gigachad Nodes — ComfyUI Custom Node Suite

<img width="1200" height="896" alt="Woman_holding_golden_sign__GIGAC…_202605211143" src="https://github.com/user-attachments/assets/54bb8be0-1de2-4f2a-972c-21e212976916" />

> A collection of custom, novelty nodes for ComfyUI by **Lord Winnougan**  
> 🎨 AI Art · Video · LLM Workflows · Generative Pipelines

---

## 📦 Included Nodes

| Node | Description |
|---|---|
| **Gigachad Model Loader** | Load diffusion models with Gigachad energy |
| **Gigachad Checkpoint Loader** | Checkpoint loading, streamlined |
| **Gigachad CLIP Loader** | Load CLIP models cleanly |
| **Gigachad Prompt Encoder** | Encode prompts like a chad |
| **Gigachad Prompt File Reader** | Read prompts from external text files |
| **Gigachad KSampler** | Feature-packed sampler with ClownSampler/RES4LYF support and bongmath |
| **Gigachad Sampler Custom Advanced** | Advanced custom sampling controls |
| **Gigachad Power LoRA Loader** | Load multiple LoRAs with power |
| **Gigachad Resolution Picker** | Pick standard resolutions fast, outputs WIDTH + HEIGHT + LATENT |
| **Gigachad LTX Resolution Picker** | Resolution picker tuned for LTX Video |
| **Gigachad VAE Loader** | Clean VAE loading node |
| **Gigachad VAE Encode / Decode** | VAE encode and decode utilities |
| **Gigaresolution (RTX Super Res)** | RTX-powered super resolution upscaling |
| **Gigachad Cache Cleanup** | Free up VRAM/RAM with one node, reports timing and free VRAM |
| **Gigachad Show Text** | Display text output inline in the graph |

---

## 🚀 Installation

### Option 1 — ComfyUI Manager (Recommended)
Search for **`comfyui-gigachad`** in the ComfyUI Manager and install directly.

### Option 2 — Manual Install

1. Navigate to your ComfyUI custom nodes folder:
   ```bash
   cd ComfyUI/custom_nodes
   ```

2. Clone this repo:
   ```bash
   git clone https://github.com/Winnougan/comfyui-gigachad.git
   ```

3. Restart ComfyUI.

No extra dependencies required — pure ComfyUI native.

---

## 🖥️ Requirements

- [ComfyUI](https://github.com/comfyanonymous/ComfyUI)
- Python 3.10+
- A GPU that doesn't fear greatness

---

## 📖 How to Use the Nodes

All Gigachad nodes live under the **Gigachad** category in the node menu. Right-click the canvas → Add Node → Gigachad.

---

### 🔧 Basic txt2img Workflow

A typical Gigachad pipeline looks like this:

```
Gigachad Checkpoint Loader
        ↓
Gigachad CLIP Loader → Gigachad Prompt Encoder (positive + negative)
        ↓
Gigachad Resolution Picker → Gigachad KSampler
        ↓
Gigachad VAE Decode → Save Image
```

---

### 🖼️ Gigachad Resolution Picker

Outputs `WIDTH`, `HEIGHT`, and an empty `LATENT` — wire all three directly into the KSampler.

| Input | Description |
|---|---|
| `width` | Image width in pixels (default 1024, step 8) |
| `height` | Image height in pixels (default 1024, step 8) |
| `batch_size` | Number of images to generate at once |

> **Tip:** Use the **LTX Resolution Picker** instead if you're running LTX Video workflows — it uses LTX-specific aspect ratios.

---

### ⚡ Gigachad KSampler

The star of the show. Drop-in replacement for the standard KSampler with extra firepower.

| Input | Description |
|---|---|
| `model` | Connect your loaded model |
| `positive` / `negative` | Conditioning from Prompt Encoder |
| `latent_image` | Connect from Resolution Picker or VAE Encode |
| `seed` | Generation seed |
| `steps` | Number of sampling steps (default 20) |
| `cfg` | Classifier-free guidance scale (default 7.0) |
| `sampler` | Standard ComfyUI sampler list |
| `clown_sampler` | RES4LYF/ClownSampler list — **overrides `sampler` when not set to `none`** |
| `scheduler` | Noise schedule (includes beta57, linear_quadratic extras) |
| `denoise` | Denoising strength (1.0 = full generation, lower = img2img) |
| `bongmath` | Toggle high-precision denoising for Flux/DiT models |
| `bongmath_cfg_scale` | CFG scale inside bongmath (independent of outer cfg) |
| `bongmath_scale` | Bongmath noise scale / step multiplier |
| `sigmas` *(optional)* | Override the scheduler with a custom sigma schedule |
| `options` *(optional)* | RES4LYF OPTIONS block for advanced ClownSampler control |

**Outputs:** `latent` and `denoised_output` — use `latent` for normal workflows, `denoised_output` for chaining into further processing.

> **Tip:** If you're not using RES4LYF, leave `clown_sampler` on `none` and it'll use the standard sampler list as normal. Bongmath is specifically for Flux/DiT models — leave it off for SD1.5/SDXL.

---

### 🧹 Gigachad Cache Cleanup

A passthrough node you can drop anywhere in your workflow to free VRAM between heavy operations. Accepts and returns any type — it won't break your connections.

| Input | Description |
|---|---|
| `any_input` | Connect anything (optional) — it passes straight through |
| `empty_cache` | Toggle `torch.cuda.empty_cache()` |
| `gc_collect` | Toggle Python garbage collection |

After running, it displays elapsed time in milliseconds and your current free/total VRAM in the node UI.

> **Tip:** Place one after your KSampler and before upscaling to reclaim VRAM before the next big operation.

---

### 📄 Gigachad Prompt File Reader

Load prompts from a `.txt` file on disk instead of typing into the graph. Great for batch workflows and prompt libraries.

Connect its output to the **Gigachad Prompt Encoder** positive or negative input.

---

### 📝 Gigachad Show Text

Displays any text string directly in the graph as a read-only node. Useful for debugging prompt outputs, displaying metadata, or just labeling sections of a complex workflow.

---

### 🔍 Gigaresolution (RTX Super Res)

Upscale your generated images using RTX Super Resolution. Connect the output image from your VAE Decode into this node for a clean upscale pass.

> **Note:** Requires an NVIDIA RTX GPU with NIS/RTX Super Resolution support.

---

## 💡 Example: Minimal Workflow

```
Gigachad Checkpoint Loader
    ↓ MODEL, CLIP, VAE
    
Gigachad CLIP Loader (if needed)

Gigachad Prompt Encoder
    ← CLIP
    ← positive prompt text
    ← negative prompt text
    ↓ CONDITIONING (positive + negative)

Gigachad Resolution Picker
    ↓ WIDTH, HEIGHT, LATENT

Gigachad KSampler
    ← MODEL
    ← positive CONDITIONING
    ← negative CONDITIONING  
    ← LATENT (from Resolution Picker)
    ↓ latent

Gigachad Cache Cleanup  ← (optional, drop here to free VRAM)
    ↓ passthrough latent

Gigachad VAE Decode
    ← VAE
    ← latent
    ↓ IMAGE

Save Image
```

---

## ❤️ Support

If these nodes save you time or spark something cool, consider supporting on Patreon — exclusive workflows, nodes, and LLM setups drop there first.

👉 [patreon.com/Winnougan](https://www.patreon.com/c/u5867556)  
☕ [Ko-fi tip jar](https://ko-fi.com/winnougan)

---

## 📄 License

Apache 2.0 — use it, build on it, don't be lame about it.
