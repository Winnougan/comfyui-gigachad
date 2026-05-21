"""
Gigachad VAE Encode / Decode
─────────────────────────────
Tiled VAE encode and decode with full control over tile size,
overlap and temporal settings for video VAEs.
"""

import torch
import logging
import comfy.model_management as mm

log = logging.getLogger("Gigachad")


# ── VAE Decode ────────────────────────────────────────────────────────────────

class GigachadVAEDecode:
    """
    Decodes a LATENT to IMAGE.
    Supports tiled decoding for large images / video VAEs.
    """
    CATEGORY = "Gigachad"
    FUNCTION = "decode"
    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("image",)

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "samples": ("LATENT",),
                "vae":     ("VAE",),
                "tiled":   ("BOOLEAN", {
                    "default": False,
                    "label_on":  "tiled",
                    "label_off": "full",
                    "tooltip": "Use tiled decoding to reduce VRAM usage for large images.",
                }),
                "tile_size": ("INT", {
                    "default": 512, "min": 64, "max": 4096, "step": 64,
                    "tooltip": "Spatial tile size in pixels.",
                }),
                "tile_overlap": ("INT", {
                    "default": 64, "min": 0, "max": 512, "step": 32,
                    "tooltip": "Overlap between tiles in pixels.",
                }),
                "temporal_size": ("INT", {
                    "default": 64, "min": 8, "max": 4096, "step": 4,
                    "tooltip": "Temporal tile size (frames) for video VAEs.",
                }),
                "temporal_overlap": ("INT", {
                    "default": 8, "min": 4, "max": 256, "step": 4,
                    "tooltip": "Temporal overlap (frames) for video VAEs.",
                }),
            }
        }

    def decode(self, samples, vae, tiled, tile_size, tile_overlap, temporal_size, temporal_overlap):
        latent = samples["samples"]
        if tiled:
            images = vae.decode_tiled(
                latent,
                tile_x=tile_size, tile_y=tile_size,
                overlap=tile_overlap,
                tile_t=temporal_size,
                overlap_t=temporal_overlap,
            )
        else:
            images = vae.decode(latent)

        # Flatten video batch dimension if present (B T H W C -> B*T H W C)
        if images.ndim == 5:
            images = images.reshape(-1, images.shape[-3], images.shape[-2], images.shape[-1])

        return (images.clamp(0.0, 1.0),)


# ── VAE Encode ────────────────────────────────────────────────────────────────

class GigachadVAEEncode:
    """
    Encodes an IMAGE to a LATENT.
    Supports tiled encoding for large images / video VAEs.
    """
    CATEGORY = "Gigachad"
    FUNCTION = "encode"
    RETURN_TYPES = ("LATENT",)
    RETURN_NAMES = ("latent",)

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "pixels": ("IMAGE",),
                "vae":    ("VAE",),
                "tiled":  ("BOOLEAN", {
                    "default": False,
                    "label_on":  "tiled",
                    "label_off": "full",
                    "tooltip": "Use tiled encoding to reduce VRAM usage for large images.",
                }),
                "tile_size": ("INT", {
                    "default": 512, "min": 64, "max": 4096, "step": 64,
                }),
                "tile_overlap": ("INT", {
                    "default": 64, "min": 0, "max": 512, "step": 32,
                }),
                "temporal_size": ("INT", {
                    "default": 64, "min": 8, "max": 4096, "step": 4,
                    "tooltip": "Temporal tile size (frames) for video VAEs.",
                }),
                "temporal_overlap": ("INT", {
                    "default": 8, "min": 4, "max": 256, "step": 4,
                    "tooltip": "Temporal overlap (frames) for video VAEs.",
                }),
            }
        }

    def encode(self, pixels, vae, tiled, tile_size, tile_overlap, temporal_size, temporal_overlap):
        # VAE expects RGB only
        px = pixels[:, :, :, :3]

        if tiled:
            latent = vae.encode_tiled(
                px,
                tile_x=tile_size, tile_y=tile_size,
                overlap=tile_overlap,
                tile_t=temporal_size,
                overlap_t=temporal_overlap,
            )
        else:
            latent = vae.encode(px)

        return ({"samples": latent},)


# ── Registration ──────────────────────────────────────────────────────────────

NODE_CLASS_MAPPINGS = {
    "GigachadVAEDecode": GigachadVAEDecode,
    "GigachadVAEEncode": GigachadVAEEncode,
}
NODE_DISPLAY_NAME_MAPPINGS = {
    "GigachadVAEDecode": "⚡ Gigachad VAE Decode",
    "GigachadVAEEncode": "⚡ Gigachad VAE Encode",
}
