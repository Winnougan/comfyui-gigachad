"""
Gigaresolution — RTX Video Super Resolution
────────────────────────────────────────────
Uses NVIDIA's RTX Video Super Resolution (nvvfx) to upscale images
using RTX-class GPU tensor cores.

Requires:
  - An NVIDIA RTX GPU
  - nvvfx Python package: pip install nvvfx
  - NVIDIA Video Effects SDK installed

Scale modes:
  scale by multiplier — multiplies input resolution (e.g. 2× = 1024→2048)
  target dimensions   — upscales to exact width × height
"""

import torch
import logging
from enum import Enum
from typing import TypedDict

log = logging.getLogger("Gigachad")
NODE_NAME = "Gigaresolution"

QUALITY_LEVELS = ["LOW", "MEDIUM", "HIGH", "ULTRA"]
MAX_PIXELS = 1024 * 1024 * 16   # batch ceiling


class UpscaleType(str, Enum):
    SCALE_BY           = "scale by multiplier"
    TARGET_DIMENSIONS  = "target dimensions"


class GigachadRTXSuperResolution:
    """
    RTX Video Super Resolution via NVIDIA's nvvfx SDK.
    Processes images in batches to stay within GPU memory limits.
    """
    CATEGORY = "Gigachad"
    FUNCTION = "upscale"
    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("upscaled_images",)

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "images":  ("IMAGE",),
                "scale":   ("FLOAT", {
                    "default": 2.0, "min": 1.0, "max": 4.0, "step": 0.01,
                    "tooltip": "Scale factor (e.g. 2.0 = double resolution). RTX VSR supports 1×–4×.",
                }),
                "quality": (QUALITY_LEVELS, {"default": "ULTRA"}),
            }
        }

    def upscale(self, images, scale, quality):
        resize_mode = UpscaleType.SCALE_BY.value
        target_width = target_height = 0
        try:
            import nvvfx
        except ImportError:
            raise RuntimeError(
                "[Gigaresolution] nvvfx is not installed.\n"
                "Install it with: pip install nvvfx\n"
                "Also ensure the NVIDIA Video Effects SDK is installed on your system.\n"
                "https://developer.nvidia.com/rtx/video-effects"
            )

        b, h, w, c = images.shape

        # Resolve output dimensions — scale mode only
        output_width  = int(w * scale)
        output_height = int(h * scale)

        # Snap to multiples of 8
        output_width  = max(8, round(output_width  / 8) * 8)
        output_height = max(8, round(output_height / 8) * 8)

        # Batch size limit based on output pixel count
        out_pixels = output_width * output_height
        batch_size = max(1, MAX_PIXELS // out_pixels)

        quality_mapping = {
            "LOW":    nvvfx.effects.QualityLevel.LOW,
            "MEDIUM": nvvfx.effects.QualityLevel.MEDIUM,
            "HIGH":   nvvfx.effects.QualityLevel.HIGH,
            "ULTRA":  nvvfx.effects.QualityLevel.ULTRA,
        }
        selected_quality = quality_mapping.get(quality, nvvfx.effects.QualityLevel.ULTRA)

        log.info(
            f"[{NODE_NAME}] {w}×{h} → {output_width}×{output_height} "
            f"[{quality}] batch_size={batch_size}"
        )

        out_tensor = torch.empty(
            (b, output_height, output_width, c),
            device=images.device, dtype=images.dtype,
        )

        with nvvfx.VideoSuperRes(selected_quality) as sr:
            sr.output_width  = output_width
            sr.output_height = output_height
            sr.load()

            for i in range(0, b, batch_size):
                batch      = images[i:i + batch_size]
                batch_cuda = batch.cuda().permute(0, 3, 1, 2).float().contiguous()

                for j in range(batch_cuda.shape[0]):
                    frame     = batch_cuda[j]
                    dlpack_out = sr.run(frame).image
                    out_tensor[i + j : i + j + 1] = (
                        torch.from_dlpack(dlpack_out)
                        .movedim(0, -1)
                        .unsqueeze(0)
                    )

        log.info(f"[{NODE_NAME}] Done — output shape: {out_tensor.shape}")
        return (out_tensor.clamp(0.0, 1.0),)


# ── Registration ──────────────────────────────────────────────────────────────

NODE_CLASS_MAPPINGS = {
    "GigachadRTXSuperResolution": GigachadRTXSuperResolution,
}
NODE_DISPLAY_NAME_MAPPINGS = {
    "GigachadRTXSuperResolution": "⚡ Gigaresolution (RTX Super Res)",
}
