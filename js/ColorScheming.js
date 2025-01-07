// Helpers to access ComfyUI's color scheme.

/**
 * Get the current color scheme.
 *
 * @returns "dark" | "light"
 */
export function getColorScheme() {
    return document.body.classList.contains("dark-theme") ? "dark" : "light";
}

const handlers = [];

/**
 * Add a handler to be called whenever the color scheme changes.
 *
 * @param handler The handler to call.
 */
export function addColorSchemeChangeListener(handler) {
    handlers.push(handler);
}

let previousColorScheme;
function onBodyClassChange() {
    const newColorScheme = getColorScheme();
    if (newColorScheme !== previousColorScheme) {
        previousColorScheme = newColorScheme;
        handlers.forEach(handler => handler(newColorScheme));
    }
}

const observer = new MutationObserver(onBodyClassChange);
observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['class'],
});

/**
 * Add light and dark stylesheets that dynamically change with the ComfyUI
 * color scheme.
 *
 * @param stylesheets An object with "light" and "dark" keys, with the values
 * being URLs to stylesheets.
 */
export function addColorSchemeReactiveStylesheets(stylesheets) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = stylesheets[getColorScheme()];
    document.head.appendChild(stylesheet);

    addColorSchemeChangeListener((newColorScheme) => {
        stylesheet.href = stylesheets[newColorScheme];
    });
}