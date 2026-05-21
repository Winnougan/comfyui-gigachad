"""Gigachad Node Suite for ComfyUI — Exclusive Patreon Subscriber Edition ⚡"""

from .gigachad_prompt_encoder import (
    NODE_CLASS_MAPPINGS as PROMPT_MAPPINGS,
    NODE_DISPLAY_NAME_MAPPINGS as PROMPT_DISPLAY,
)
from .gigachad_clip_loader import (
    NODE_CLASS_MAPPINGS as CLIP_MAPPINGS,
    NODE_DISPLAY_NAME_MAPPINGS as CLIP_DISPLAY,
)
from .gigachad_power_lora_loader import (
    NODE_CLASS_MAPPINGS as LORA_MAPPINGS,
    NODE_DISPLAY_NAME_MAPPINGS as LORA_DISPLAY,
)
from .gigachad_resolution_picker import (
    NODE_CLASS_MAPPINGS as RES_MAPPINGS,
    NODE_DISPLAY_NAME_MAPPINGS as RES_DISPLAY,
)
from .Gigachad_LTX_Resolution_Picker import (
    NODE_CLASS_MAPPINGS as LTX_MAPPINGS,
    NODE_DISPLAY_NAME_MAPPINGS as LTX_DISPLAY,
)
from .gigachad_checkpoint_loader import (
    NODE_CLASS_MAPPINGS as CKPT_MAPPINGS,
    NODE_DISPLAY_NAME_MAPPINGS as CKPT_DISPLAY,
)
from .gigachad_model_loader import (
    NODE_CLASS_MAPPINGS as MODEL_MAPPINGS,
    NODE_DISPLAY_NAME_MAPPINGS as MODEL_DISPLAY,
)
from .gigachad_ksampler import (
    NODE_CLASS_MAPPINGS as KSAMPLER_MAPPINGS,
    NODE_DISPLAY_NAME_MAPPINGS as KSAMPLER_DISPLAY,
)
from .gigachad_sampler_custom_advanced import (
    NODE_CLASS_MAPPINGS as ADV_SAMPLER_MAPPINGS,
    NODE_DISPLAY_NAME_MAPPINGS as ADV_SAMPLER_DISPLAY,
)
from .gigachad_cache_cleanup import (
    NODE_CLASS_MAPPINGS as CACHE_CLEANUP_MAPPINGS,
    NODE_DISPLAY_NAME_MAPPINGS as CACHE_CLEANUP_DISPLAY,
)
from .gigachad_vae_loader import (
    NODE_CLASS_MAPPINGS as VAE_LOADER_MAPPINGS,
    NODE_DISPLAY_NAME_MAPPINGS as VAE_LOADER_DISPLAY,
)
from .gigachad_vae_nodes import (
    NODE_CLASS_MAPPINGS as VAE_NODES_MAPPINGS,
    NODE_DISPLAY_NAME_MAPPINGS as VAE_NODES_DISPLAY,
)
from .gigachad_rtx_superres import (
    NODE_CLASS_MAPPINGS as RTX_MAPPINGS,
    NODE_DISPLAY_NAME_MAPPINGS as RTX_DISPLAY,
)
from .gigachad_prompt_file_reader import (
    NODE_CLASS_MAPPINGS as PROMPT_FILE_MAPPINGS,
    NODE_DISPLAY_NAME_MAPPINGS as PROMPT_FILE_DISPLAY,
)
from .gigachad_show_text import (
    NODE_CLASS_MAPPINGS as SHOW_TEXT_MAPPINGS,
    NODE_DISPLAY_NAME_MAPPINGS as SHOW_TEXT_DISPLAY,
)


def _print_banner():
    PATREON_URL = "https://www.patreon.com/c/u5867556"
    LINK  = f"\033]8;;{PATREON_URL}\033\\{PATREON_URL}\033]8;;\033\\"
    GOLD  = "\033[38;2;255;215;0m"
    ELEC  = "\033[38;2;0;207;255m"
    WHITE = "\033[38;2;255;241;160m"
    DIM   = "\033[38;2;184;134;11m"
    RESET = "\033[0m"
    BOLD  = "\033[1m"

    banner = f"""
{GOLD}{"="*62}{RESET}
{GOLD}  \u26a1\u26a1\u26a1  {BOLD}{WHITE}G I G A C H A D   N O D E S{RESET}{GOLD}  \u26a1\u26a1\u26a1{RESET}
{DIM}{"="*62}{RESET}
{ELEC}  \U0001f4aa Created by Lord Winnougan{RESET}
{ELEC}  \U0001f3a8 AI Art \u00b7 Video \u00b7 LLM \u00b7 SillyTavern{RESET}
{GOLD}  \u2b50 Support the creator on Patreon:{RESET}
{WHITE}  \U0001f449 {LINK}{RESET}
{DIM}{"-"*62}{RESET}
{GOLD}  \u26a1 Nodes loaded:{RESET}
{DIM}     Model Loader \u00b7 Checkpoint Loader \u00b7 CLIP Loader
     Prompt Encoder \u00b7 Prompt File Reader \u00b7 KSampler
     Sampler Custom Advanced \u00b7 Power LoRA Loader
     Resolution Picker \u00b7 LTX Resolution Picker
     VAE Loader \u00b7 VAE Encode \u00b7 VAE Decode
     Gigaresolution (RTX Super Res) \u00b7 Cache Cleanup{RESET}
{GOLD}{"="*62}{RESET}
"""
    print(banner)

_print_banner()


NODE_CLASS_MAPPINGS = {
    **PROMPT_MAPPINGS,
    **CLIP_MAPPINGS,
    **LORA_MAPPINGS,
    **RES_MAPPINGS,
    **LTX_MAPPINGS,
    **CKPT_MAPPINGS,
    **MODEL_MAPPINGS,
    **KSAMPLER_MAPPINGS,
    **ADV_SAMPLER_MAPPINGS,
    **CACHE_CLEANUP_MAPPINGS,
    **VAE_LOADER_MAPPINGS,
    **VAE_NODES_MAPPINGS,
    **RTX_MAPPINGS,
    **PROMPT_FILE_MAPPINGS,
    **SHOW_TEXT_MAPPINGS,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    **PROMPT_DISPLAY,
    **CLIP_DISPLAY,
    **LORA_DISPLAY,
    **RES_DISPLAY,
    **LTX_DISPLAY,
    **CKPT_DISPLAY,
    **MODEL_DISPLAY,
    **KSAMPLER_DISPLAY,
    **ADV_SAMPLER_DISPLAY,
    **CACHE_CLEANUP_DISPLAY,
    **VAE_LOADER_DISPLAY,
    **VAE_NODES_DISPLAY,
    **RTX_DISPLAY,
    **PROMPT_FILE_DISPLAY,
    **SHOW_TEXT_DISPLAY,
}

WEB_DIRECTORY = "./js"
__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
