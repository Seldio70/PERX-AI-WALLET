const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function patchFile(relativePath, patcher) {
  const filePath = path.join(root, relativePath);

  if (!fs.existsSync(filePath)) {
    console.warn(`[patch-react-native-startup] Missing ${relativePath}`);
    return;
  }

  const before = fs.readFileSync(filePath, "utf8");
  const after = patcher(before);

  if (after !== before) {
    fs.writeFileSync(filePath, after);
    console.log(`[patch-react-native-startup] Patched ${relativePath}`);
  }
}

patchFile("node_modules/react-native/Libraries/Core/setUpGlobals.js", source => {
  if (source.includes("function DOMExceptionPolyfill(message, name)")) {
    return source;
  }

  const anchor = `if (global.self === undefined) {
  // $FlowExpectedError[cannot-write] The global isn't writable anywhere but here, where we define it.
  global.self = global;
}
`;

  const patch = `
if (global.DOMException === undefined) {
  function DOMExceptionPolyfill(message, name) {
    this.message = message ?? '';
    this.name = String(name ?? 'Error');
    this.code = 0;

    const error = Error(this.message);
    this.stack = error.stack;
  }

  DOMExceptionPolyfill.prototype = Object.create(Error.prototype);
  DOMExceptionPolyfill.prototype.constructor = DOMExceptionPolyfill;

  // $FlowExpectedError[cannot-write] The global isn't writable anywhere but here, where we define it.
  global.DOMException = DOMExceptionPolyfill;
}
`;

  if (!source.includes(anchor)) {
    console.warn("[patch-react-native-startup] DOMException anchor not found");
    return source;
  }

  return source.replace(anchor, anchor + patch);
});

patchFile(
  "node_modules/react-native/src/private/setup/setUpDefaultReactNativeEnvironment.js",
  source => {
    const line = "  require('./setUpPerformanceObserver').default();";

    return source.replace(`${line}\n`, "");
  },
);

patchFile("node_modules/react-native/Libraries/Core/setUpPerformance.js", source => {
  if (!source.includes("src/private/webapis/performance/Performance")) {
    return source;
  }

  return `/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

if (!global.performance) {
  // $FlowExpectedError[cannot-write]
  global.performance = {
    mark: () => {},
    measure: () => {},
    now: () => {
      const performanceNow = global.nativePerformanceNow || Date.now;
      return performanceNow();
    },
  };
}
`;
});
