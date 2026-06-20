if (typeof globalThis.DOMException === "undefined") {
  function DOMExceptionPolyfill(message, name) {
    this.message = message ?? "";
    this.name = String(name ?? "Error");
    this.code = 0;

    const error = Error(this.message);
    this.stack = error.stack;
  }

  DOMExceptionPolyfill.prototype = Object.create(Error.prototype);
  DOMExceptionPolyfill.prototype.constructor = DOMExceptionPolyfill;

  globalThis.DOMException = DOMExceptionPolyfill;
}
