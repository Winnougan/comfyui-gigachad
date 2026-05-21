"""
Gigachad VAE Loader
───────────────────
Full-featured VAE loader supporting standard VAEs, TAESD approx VAEs,
video TAEs (taehv, lighttaew2, lighttaehy) and pixel_space mode.
Based on KJNodes VAELoaderKJ with device + dtype control.
"""

import torch
import logging
import folder_paths
from comfy.utils import load_torch_file

log = logging.getLogger("Gigachad")
NODE_NAME = "Gigachad VAE Loader"


class GigachadVAELoader:
    video_taes  = ["taehv", "lighttaew2_2", "lighttaew2_1", "lighttaehy1_5"]
    image_taes  = ["taesd", "taesdxl", "taesd3", "taef1"]

    @staticmethod
    def vae_list(s):
        vaes = folder_paths.get_filename_list("vae")
        approx_vaes = folder_paths.get_filename_list("vae_approx")

        sdxl_enc = sdxl_dec = sd1_enc = sd1_dec = False
        sd3_enc  = sd3_dec  = f1_enc  = f1_dec  = False

        for v in approx_vaes:
            if   v.startswith("taesd_decoder."):    sd1_dec  = True
            elif v.startswith("taesd_encoder."):    sd1_enc  = True
            elif v.startswith("taesdxl_decoder."):  sdxl_dec = True
            elif v.startswith("taesdxl_encoder."):  sdxl_enc = True
            elif v.startswith("taesd3_decoder."):   sd3_dec  = True
            elif v.startswith("taesd3_encoder."):   sd3_enc  = True
            elif v.startswith("taef1_encoder."):    f1_dec   = True
            elif v.startswith("taef1_decoder."):    f1_enc   = True
            else:
                for tae in s.video_taes:
                    if v.startswith(tae):
                        vaes.append(v)

        if sd1_dec  and sd1_enc:  vaes.append("taesd")
        if sdxl_dec and sdxl_enc: vaes.append("taesdxl")
        if sd3_dec  and sd3_enc:  vaes.append("taesd3")
        if f1_dec   and f1_enc:   vaes.append("taef1")
        vaes.append("pixel_space")
        return vaes

    @staticmethod
    def load_taesd(name):
        sd = {}
        approx_vaes = folder_paths.get_filename_list("vae_approx")
        encoder = next(a for a in approx_vaes if a.startswith(f"{name}_encoder."))
        decoder = next(a for a in approx_vaes if a.startswith(f"{name}_decoder."))

        enc = load_torch_file(folder_paths.get_full_path_or_raise("vae_approx", encoder))
        for k in enc:
            sd[f"taesd_encoder.{k}"] = enc[k]
        dec = load_torch_file(folder_paths.get_full_path_or_raise("vae_approx", decoder))
        for k in dec:
            sd[f"taesd_decoder.{k}"] = dec[k]

        scales = {
            "taesd":   (0.18215, 0.0),
            "taesdxl": (0.13025, 0.0),
            "taesd3":  (1.5305,  0.0609),
            "taef1":   (0.3611,  0.1159),
        }
        s, sh = scales.get(name, (1.0, 0.0))
        sd["vae_scale"] = torch.tensor(s)
        sd["vae_shift"] = torch.tensor(sh)
        return sd

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "vae_name":     (s.vae_list(s),),
                "device":       (["main_device", "cpu"],),
                "weight_dtype": (["bf16", "fp16", "fp32"],),
            }
        }

    RETURN_TYPES  = ("VAE",)
    RETURN_NAMES  = ("vae",)
    FUNCTION      = "load_vae"
    CATEGORY      = "Gigachad"

    def load_vae(self, vae_name, device, weight_dtype):
        import comfy.model_management as mm
        from comfy.sd import VAE

        dtype = {"bf16": torch.bfloat16, "fp16": torch.float16, "fp32": torch.float32}[weight_dtype]
        dev   = mm.get_torch_device() if device == "main_device" else torch.device("cpu")

        metadata = None
        if vae_name == "pixel_space":
            sd = {"pixel_space_vae": torch.tensor(1.0)}
        elif vae_name in self.image_taes:
            sd = self.load_taesd(vae_name)
        else:
            if any(vae_name.startswith(t) for t in self.video_taes):
                vae_path = folder_paths.get_full_path_or_raise("vae_approx", vae_name)
            else:
                vae_path = folder_paths.get_full_path_or_raise("vae", vae_name)
            sd, metadata = load_torch_file(vae_path, return_metadata=True)

        vae = VAE(sd=sd, device=dev, dtype=dtype, metadata=metadata)
        vae.throw_exception_if_invalid()
        log.info(f"[{NODE_NAME}] Loaded '{vae_name}' [{weight_dtype}] on {device}")
        return (vae,)


NODE_CLASS_MAPPINGS = {
    "GigachadVAELoader": GigachadVAELoader,
}
NODE_DISPLAY_NAME_MAPPINGS = {
    "GigachadVAELoader": "⚡ Gigachad VAE Loader",
}
