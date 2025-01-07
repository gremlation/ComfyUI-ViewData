
let handlers = [];

/**
 * Add a handler that will be called when a script is added to the
 * document. Only calls the handler once.
 *
 * @param handler The function to call.
 * @param test Optional extra test to see if the handler should be called.
 */
export function addScriptAddedHandler(handler, test = () => true) {
    if (test()) {
        handler();
    } else {
        handlers.push({ handler, test });
    }
}

const scriptAddedObserver = new MutationObserver((mutationsList, observer) => {
    const addedNodes = mutationsList.flatMap(mutation => [...mutation.addedNodes]);
    if (!addedNodes.some(node => node.tagName !== 'SCRIPT')) { return };
    const handlersThatRan = [];
    for (const handlerObj of handlers) {
        if (handlerObj.test()) {
            handlerObj.handler();
            handlersThatRan.push(handlerObj);
        }
    }
    handlers = handlers.filter(handler => !handlersThatRan.includes(handler));
});

scriptAddedObserver.observe(document.body, {
    childList: true,
    subtree: true,
});
