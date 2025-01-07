# ComfyUI-ViewData

A ComfyUI node that displays the type and contents of whatever is connected to the input.  In the case of a Tensor object, it shows the shape instead of its value.

![A screenshot showing usage of the node.](docs/workflow.png)

## Installation

### ComfyUI-Manager

- Open the manager
- Pick "Install via Git URL"
- Enter `https://github.com/Gremlation/ComfyUI-ViewData`

You may need to edit `custom_nodes/ComfyUI-Manager/config.ini` and set `security_level = normal-` first.

### Manual

Run the following commands in the terminal:

```shell
cd custom_nodes
git clone https://github.com/Gremlation/ComfyUI-ViewData
```

Then restart ComfyUI.

## Options

You can change the indentation level for dictionaries by going to Settings > View Data ~🅖
