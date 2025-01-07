import { app } from "../../scripts/app.js";
import { addColorSchemeReactiveStylesheets } from "./ColorScheming.js";
import { addScriptAddedHandler } from "./RunOnScriptAvailable.js";

/**
 * A small chip.
 */
function CHIP(node, name, opts, app) {
    const element = document.createElement("div");
    element.classList.add("gremlation", "chip", ...opts[1].extraClasses ?? [])
    element.append(opts[1].default)
    const widget = node.addDOMWidget(name, 'chip', element, {
        getHeight: () => LiteGraph.NODE_SLOT_HEIGHT,
        getValue: () => element.innerText,
        setValue: (newValue) => element.innerText = newValue,
    })
    return { widget }
}

/**
 * A multi-line read-only text field that performs syntax highlighting.
 */
function SYNTAXHIGHLIGHTED(node, name, opts, app) {
    const wrapper = document.createElement("div")
    wrapper.classList.add("gremlation-syntax-highlighted")
    const preElement = document.createElement("pre")
    wrapper.appendChild(preElement)
    const codeElement = document.createElement("code")
    codeElement.textContent = opts[1].default
    preElement.appendChild(codeElement)

    const widget = node.addDOMWidget(name, 'SYNTAXHIGHLIGHTED', wrapper, {
        getValue: () => codeElement.textContent,
        setValue: (newValue) => codeElement.textContent = newValue,
        setLanguage: function (newLanguage) {
            const index = [...codeElement.classList].findIndex(className => className.startsWith("language-"))
            if (index !== -1) codeElement.classList.remove(codeElement.classList[index])
            codeElement.classList.add(`language-${newLanguage}`)
        },
    })
    widget.element = wrapper;
    widget.preElement = preElement;
    widget.codeElement = codeElement;
    return { widget }
}

class ViewDataExtension extends LGraphNode {
    name = "gremlation:ComfyUI-ViewData";
    settings = [
        {
            id: "gremlation:ComfyUI-ViewData:ViewData.Indentation",
            name: "Indentation size",
            type: "number",
            defaultValue: 2,
            tooltip: "How many spaces should be used for indentation?",
            category: ["View Data ~🅖", "Formatting"],
        },
    ];

    configureStylesheets() {
        addColorSchemeReactiveStylesheets({
            light: 'extensions/comfyui-viewdata/prism/light.css',
            dark: 'extensions/comfyui-viewdata/prism/dark.css',
        })
        const extensionStylesheet = document.createElement('link');
        extensionStylesheet.rel = 'stylesheet';
        extensionStylesheet.href = 'extensions/comfyui-viewdata/ViewData.css';
        document.head.appendChild(extensionStylesheet);
    }

    configurePrism() {
        Prism.hooks.add('before-sanity-check', function (env) {
            env.element.innerHTML = env.element.innerHTML.replace(/<br>/g, '\n');
            env.code = env.element.textContent;
        });
    }

    async init() {
        this.configureStylesheets();
        this.configurePrism();
    }

    async getCustomWidgets(app) {
        return {
            CHIP,
            SYNTAXHIGHLIGHTED,
        }
    }

    nodeCreated(node) {
        if (node.comfyClass !== "gremlation:ComfyUI-ViewData:ViewData") { return }
        node.typeWidget = CHIP(node, "type", ["chip", { default: "None", extraClasses: ["code"] }], app).widget
        node.valueWidget = SYNTAXHIGHLIGHTED(node, "value", ["SYNTAXHIGHLIGHTED", {}], app).widget;
    }

    async onConfigure(nodeData) {
        const valueType = this.widgets_values?.length > 0 ? this.widgets_values[0] : "None"
        this.typeWidget.value = valueType;

        let language
        switch (valueType) {
            case "dict":
                language = "json"
                break
            case "Tensor":
                language = "python"
                break
        }
        this.valueWidget.options.setLanguage(language);

        const value = this.widgets_values[1]
        if (valueType === "dict") {
            const indentSize = app.extensionManager.setting.get("gremlation:ComfyUI-ViewData:ViewData.Indentation");
            const formattedSource = await prettier.format(value, {
                parser: "json",
                plugins: prettierPlugins,
                tabWidth: indentSize,
            })
            this.valueWidget.value = formattedSource;
            Prism.highlightElement(this.valueWidget.codeElement);
        } else if (valueType == "None") {
            this.valueWidget.value = "";
        } else {
            this.valueWidget.value = value;
            Prism.highlightElement(this.valueWidget.codeElement);
        }
    }

    async onExecuted(message, nodeData) {
        const valueType = message.type[0]
        const value = message.value[0]
        this.typeWidget.value = valueType

        let language
        switch (valueType) {
            case "dict":
                language = "json"
                break
            case "Tensor":
                language = "python"
                break
        }
        this.valueWidget.options.setLanguage(language);

        if (valueType === "dict") {
            const indentSize = app.extensionManager.setting.get("gremlation:ComfyUI-ViewData:ViewData.Indentation");
            const rawSource = JSON.stringify(value, null, indentSize);
            const formattedSource = await prettier.format(rawSource, {
                parser: "json",
                plugins: prettierPlugins,
                tabWidth: indentSize,
            })
            this.valueWidget.value = formattedSource;
            Prism.highlightElement(this.valueWidget.codeElement);
        } else if (valueType == "None") {
            this.valueWidget.value = value;
        } else {
            this.valueWidget.value = value;
            Prism.highlightElement(this.valueWidget.codeElement);
        }

        onDrawBackgroundOnce.apply(this, [function () {
            const itemHeights = [
                LiteGraph.NODE_TITLE_HEIGHT,
                LiteGraph.NODE_SLOT_HEIGHT * (this.inputs.length),
                this.typeWidget.element.clientHeight,
                this.valueWidget.preElement.clientHeight,
            ]
            const height = Math.ceil(itemHeights.reduce((a, b) => a + b, 0) / 10) * 10
            this.setSize([Math.max(this.width, this.valueWidget.codeElement.clientWidth + (LiteGraph.NODE_SLOT_HEIGHT * 2)), Math.max(this.height, height)])
            this.graph.setDirtyCanvas(true, false)
        }])
    }

    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeType.comfyClass !== "gremlation:ComfyUI-ViewData:ViewData") { return }

        const outerThis = this;

        const onConfigure = nodeType.prototype.onConfigure;
        nodeType.prototype.onConfigure = function (nodeData) {
            onConfigure?.apply(this, [nodeData]);
            outerThis.onConfigure.apply(this, [nodeData, nodeType]);
        }

        const onExecuted = nodeType.prototype.onExecuted;
        nodeType.prototype.onExecuted = function (message) {
            onExecuted?.apply(this, [message])
            outerThis.onExecuted.apply(this, [message, ...arguments]);
        }
    }
}

const viewDataExtension = new ViewDataExtension();


function onDrawBackgroundOnce(handler, ...args) {
    const originalOnDrawBackground = this.onDrawBackground;
    this.onDrawBackground = function (...onDrawBackgroundArgs) {
        originalOnDrawBackground?.apply(this, ...onDrawBackgroundArgs);
        handler.apply(this, ...args);
        this.onDrawBackground = originalOnDrawBackground;
    }
}

async function main() {
    app.registerExtension(viewDataExtension);
}

function isPrismLoaded() {
    return typeof Prism !== 'undefined';
}

addScriptAddedHandler(main, isPrismLoaded);
