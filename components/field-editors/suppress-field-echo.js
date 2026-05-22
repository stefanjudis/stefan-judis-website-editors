// Wraps a Contentful field so onValueChanged listeners registered through the
// wrapper do not fire for echoes of our own setValue/removeValue calls.
//
// Why: @contentful/app-sdk re-dispatches every setValue back as valueChanged
// via postMessage. Inside @contentful/field-editor-markdown the FieldConnector
// compares the echoed value against current React state; if the user typed
// more during the round-trip, the echo is misclassified as an external change,
// externalReset is bumped, and the editor calls CodeMirror.setValue() which
// replaces the buffer and resets the cursor/scroll to (0,0). That manifests
// as a lost keystroke and the editor jumping to the top while typing fast.
// Suppressing local echoes at the field boundary breaks that chain while
// still letting real external changes through.

const valuesEqual = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
};

export function suppressFieldEcho(field) {
  const inFlight = [];
  const listeners = new Set();
  let detachUpstream = null;

  const ensureAttached = () => {
    if (detachUpstream) return;
    detachUpstream = field.onValueChanged((value) => {
      const i = inFlight.findIndex((sent) => valuesEqual(sent, value));
      if (i !== -1) {
        inFlight.splice(i, 1);
        return;
      }
      listeners.forEach((cb) => cb(value));
    });
  };

  return new Proxy(field, {
    get(target, prop) {
      if (prop === 'setValue') {
        return (value) => {
          inFlight.push(value);
          return target.setValue(value);
        };
      }
      if (prop === 'removeValue') {
        return () => {
          inFlight.push(undefined);
          return target.removeValue();
        };
      }
      if (prop === 'onValueChanged') {
        return (cb) => {
          ensureAttached();
          listeners.add(cb);
          return () => listeners.delete(cb);
        };
      }
      const value = Reflect.get(target, prop);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}
