"""
Gigachad Show Text — ComfyUI Custom Node
A styled clone of pysssss ShowText, integrated into the Gigachad family.
Displays any STRING input directly on the node canvas.
"""


class GigachadShowText:

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "text": ("STRING", {"forceInput": True}),
            },
            "hidden": {
                "unique_id":    "UNIQUE_ID",
                "extra_pnginfo": "EXTRA_PNGINFO",
            },
        }

    INPUT_IS_LIST  = True
    RETURN_TYPES   = ("STRING",)
    RETURN_NAMES   = ("text",)
    FUNCTION       = "show"
    OUTPUT_NODE    = True
    OUTPUT_IS_LIST = (True,)
    CATEGORY       = "Gigachad"

    def show(self, text, unique_id=None, extra_pnginfo=None):
        # Persist text in the workflow JSON so it survives reload
        if unique_id is not None and extra_pnginfo is not None:
            if (
                isinstance(extra_pnginfo, list)
                and isinstance(extra_pnginfo[0], dict)
                and "workflow" in extra_pnginfo[0]
            ):
                workflow = extra_pnginfo[0]["workflow"]
                node = next(
                    (x for x in workflow["nodes"] if str(x["id"]) == str(unique_id[0])),
                    None,
                )
                if node:
                    node["widgets_values"] = [text]

        return {"ui": {"text": text}, "result": (text,)}


NODE_CLASS_MAPPINGS = {
    "GigachadShowText": GigachadShowText,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "GigachadShowText": "⚡ Gigachad Show Text",
}
