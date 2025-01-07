import json

from torch import Tensor

from comfy.comfy_types import IO


def replace_unserializable(obj, replacement=None):
    """
    Recursively replaces values that are unserializable as JSON with a given replacement.

    Args:
        obj: The object to process (e.g., dict, list, primitive).
        replacement: The value to use for unserializable objects.

    Returns:
        The processed object with unserializable values replaced.
    """
    try:
        json.dumps(obj)
        return obj
    except (TypeError, OverflowError):
        pass

    match obj:
        case _ if isinstance(obj, dict):
            return {key: replace_unserializable(value, replacement) for key, value in obj.items()}
        case _ if isinstance(obj, list):
            return [replace_unserializable(item, replacement) for item in obj]
        case _ if isinstance(obj, Tensor):
            return f"<Tensor{list(obj.shape)}>"

    return replacement


class ViewData:
    """
    Displays the type and contents of whatever is connected to the input.

    In the case of a Tensor object, it shows the shape instead of its value.
    """

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "input": (IO.ANY, {"defaultInput": True}),
            },
        }

    RETURN_TYPES = ()
    FUNCTION = "execute"
    OUTPUT_NODE = True

    CATEGORY = "utils"

    def execute(self, input):
        input_type = type(input).__name__ if input is not None else "None"
        input = replace_unserializable(input, replacement="<Unserializable object>")

        return {
            "ui": {
                "value": [input],
                "type": [input_type],
            },
        }

    @classmethod
    def VALIDATE_INPUTS(cls, input_types):
        return True
