// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

(function (modules, entry, mainEntry, parcelRequireName, globalName) {
  /* eslint-disable no-undef */
  var globalObject =
    typeof globalThis !== 'undefined'
      ? globalThis
      : typeof self !== 'undefined'
      ? self
      : typeof window !== 'undefined'
      ? window
      : typeof global !== 'undefined'
      ? global
      : {};
  /* eslint-enable no-undef */

  // Save the require from previous bundle to this closure if any
  var previousRequire =
    typeof globalObject[parcelRequireName] === 'function' &&
    globalObject[parcelRequireName];

  var cache = previousRequire.cache || {};
  // Do not use `require` to prevent Webpack from trying to bundle this call
  var nodeRequire =
    typeof module !== 'undefined' &&
    typeof module.require === 'function' &&
    module.require.bind(module);

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire =
          typeof globalObject[parcelRequireName] === 'function' &&
          globalObject[parcelRequireName];
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error("Cannot find module '" + name + "'");
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = (cache[name] = new newRequire.Module(name));

      modules[name][0].call(
        module.exports,
        localRequire,
        module,
        module.exports,
        globalObject
      );
    }

    return cache[name].exports;

    function localRequire(x) {
      var res = localRequire.resolve(x);
      return res === false ? {} : newRequire(res);
    }

    function resolve(x) {
      var id = modules[name][1][x];
      return id != null ? id : x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [
      function (require, module) {
        module.exports = exports;
      },
      {},
    ];
  };

  Object.defineProperty(newRequire, 'root', {
    get: function () {
      return globalObject[parcelRequireName];
    },
  });

  globalObject[parcelRequireName] = newRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (mainEntry) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(mainEntry);

    // CommonJS
    if (typeof exports === 'object' && typeof module !== 'undefined') {
      module.exports = mainExports;

      // RequireJS
    } else if (typeof define === 'function' && define.amd) {
      define(function () {
        return mainExports;
      });

      // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }
})({"7tSz9":[function(require,module,exports,__globalThis) {
require("27eb2bc3af6e974d")(require("b23fa2c1e78907d1").getBundleURL('izxdV') + "index.c0fd3053.js");

},{"27eb2bc3af6e974d":"61B45","b23fa2c1e78907d1":"lgJ39"}],"61B45":[function(require,module,exports,__globalThis) {
"use strict";
var cacheLoader = require("ca2a84f7fa4a3bb0");
module.exports = cacheLoader(function(bundle) {
    return new Promise(function(resolve, reject) {
        // Don't insert the same script twice (e.g. if it was already in the HTML)
        var existingScripts = document.getElementsByTagName('script');
        if ([].concat(existingScripts).some(function(script) {
            return script.src === bundle;
        })) {
            resolve();
            return;
        }
        var preloadLink = document.createElement('link');
        preloadLink.href = bundle;
        preloadLink.rel = 'preload';
        preloadLink.as = 'script';
        document.head.appendChild(preloadLink);
        var script = document.createElement('script');
        script.async = true;
        script.type = 'text/javascript';
        script.src = bundle;
        script.onerror = function(e) {
            var error = new TypeError("Failed to fetch dynamically imported module: ".concat(bundle, ". Error: ").concat(e.message));
            script.onerror = script.onload = null;
            script.remove();
            reject(error);
        };
        script.onload = function() {
            script.onerror = script.onload = null;
            resolve();
        };
        document.getElementsByTagName('head')[0].appendChild(script);
    });
});

},{"ca2a84f7fa4a3bb0":"j49pS"}],"j49pS":[function(require,module,exports,__globalThis) {
"use strict";
var cachedBundles = {};
var cachedPreloads = {};
var cachedPrefetches = {};
function getCache(type) {
    switch(type){
        case 'preload':
            return cachedPreloads;
        case 'prefetch':
            return cachedPrefetches;
        default:
            return cachedBundles;
    }
}
module.exports = function(loader, type) {
    return function(bundle) {
        var cache = getCache(type);
        if (cache[bundle]) return cache[bundle];
        return cache[bundle] = loader.apply(null, arguments).catch(function(e) {
            delete cache[bundle];
            throw e;
        });
    };
};

},{}],"lgJ39":[function(require,module,exports,__globalThis) {
"use strict";
var bundleURL = {};
function getBundleURLCached(id) {
    var value = bundleURL[id];
    if (!value) {
        value = getBundleURL();
        bundleURL[id] = value;
    }
    return value;
}
function getBundleURL() {
    try {
        throw new Error();
    } catch (err) {
        var matches = ('' + err.stack).match(/(https?|file|ftp|(chrome|moz|safari-web)-extension):\/\/[^)\n]+/g);
        if (matches) // The first two stack frames will be this function and getBundleURLCached.
        // Use the 3rd one, which will be a runtime in the original bundle.
        return getBaseURL(matches[2]);
    }
    return '/';
}
function getBaseURL(url) {
    return ('' + url).replace(/^((?:https?|file|ftp|(chrome|moz|safari-web)-extension):\/\/.+)\/[^/]+$/, '$1') + '/';
}
// TODO: Replace uses with `new URL(url).origin` when ie11 is no longer supported.
function getOrigin(url) {
    var matches = ('' + url).match(/(https?|file|ftp|(chrome|moz|safari-web)-extension):\/\/[^/]+/);
    if (!matches) throw new Error('Origin not found');
    return matches[0];
}
exports.getBundleURL = getBundleURLCached;
exports.getBaseURL = getBaseURL;
exports.getOrigin = getOrigin;

},{}],"434tO":[function(require,module,exports,__globalThis) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
var _backgroundsJson = require("./backgrounds.json");
var _backgroundsJsonDefault = parcelHelpers.interopDefault(_backgroundsJson);
var _paletteJson = require("./palette.json");
var _paletteJsonDefault = parcelHelpers.interopDefault(_paletteJson);
var _levelsJson = require("./levels.json");
var _levelsJsonDefault = parcelHelpers.interopDefault(_levelsJson);
var _getLevelBackground = require("./getLevelBackground");
const backgrounds = (0, _backgroundsJsonDefault.default);
const palette = (0, _paletteJsonDefault.default);
let allLevels = (0, _levelsJsonDefault.default);
let currentCode = '_';
const paletteEl = document.getElementById('palette');
Object.entries(palette).forEach(([code, color])=>{
    const btn = document.createElement('button');
    Object.assign(btn.style, {
        background: color || 'linear-gradient(45deg,black,white)',
        display: 'inline-block',
        width: '40px',
        height: '40px',
        border: '1px solid black'
    });
    if (code === currentCode) btn.className = 'active';
    paletteEl.appendChild(btn);
    btn.addEventListener('click', (e)=>{
        currentCode = code;
        e.preventDefault();
        document.querySelector('#palette button.active')?.classList.remove('active');
        btn.classList.add('active');
    });
});
function renderAllLevels() {
    allLevels.forEach((level, levelIndex)=>{
        addLevelEditorToList(level, levelIndex);
    });
}
const levelsListEl = document?.getElementById('levels');
function addLevelEditorToList(level, levelIndex) {
    const { name, bricks, size, svg, color } = level;
    let div = document.createElement('div');
    div.innerHTML = ` 
            <input type="text" value="${level.name || ''}" data-level="${levelIndex}" data-text-val="name" /> 
            <div>
            <button data-level="${levelIndex}" data-delete="yep">Delete</button>
            <button data-offset-level-size="-1" data-level="${levelIndex}">-</button>
            <button data-offset-level-size="1" data-level="${levelIndex}">+</button>
            <button data-offset-x="-1"  data-offset-y="0" data-level="${levelIndex}">L</button>
            <button data-offset-x="1"  data-offset-y="0" data-level="${levelIndex}">R</button>
            <button data-offset-x="0"  data-offset-y="-1" data-level="${levelIndex}">U</button>
            <button data-offset-x="0"  data-offset-y="1" data-level="${levelIndex}">D</button>
            <input type="color" value="${level.color || ''}" data-level="${levelIndex}" data-text-val="color" />
            <input type="number" value="${level.svg || (0, _getLevelBackground.hashCode)(level.name) % backgrounds.length}" data-level="${levelIndex}" data-num-val="svg" />
             
 
           
            </div>
            
            <div class="level-bricks-preview" id="bricks-of-${levelIndex}" > 
            </div>
       `;
    levelsListEl.appendChild(div);
    renderLevelBricks(levelIndex);
    updateLevelBackground(levelIndex);
}
function updateLevelBackground(levelIndex) {
    const div = document.getElementById("bricks-of-" + levelIndex);
    const level = allLevels[levelIndex];
    const { svg, color } = level;
    if (color) Object.assign(div.style, {
        backgroundImage: 'none',
        backgroundColor: color
    });
    else {
        const svgSource = (0, _getLevelBackground.getLevelBackground)(level);
        div.setAttribute('data-svg', svgSource);
        Object.assign(div.style, {
            backgroundImage: `url("data:image/svg+xml;UTF8,${encodeURIComponent(svgSource)}")`,
            backgroundColor: 'transparent'
        });
    }
}
function renderLevelBricks(levelIndex) {
    const { size, bricks } = allLevels[levelIndex];
    const buttons = [];
    for(let x = 0; x < size; x++)for(let y = 0; y < size; y++){
        const index = y * size + x;
        buttons.push(`<button style="background: ${palette[bricks[index]] || 'transparent'}; left:${x * 40}px;top:${y * 40}px;width:40px;height: 40px; position: absolute" data-set-color-of="${index}" data-level="${levelIndex}"></button>`);
    }
    const div = document.getElementById("bricks-of-" + levelIndex);
    div.innerHTML = buttons.join('');
    Object.assign(div.style, {
        width: size * 40 + 'px',
        height: size * 40 + 'px'
    });
}
levelsListEl.addEventListener('change', (e)=>{
    const target = e.target;
    const levelIndexStr = target.getAttribute('data-level');
    if (!levelIndexStr) return;
    const levelIndex = parseInt(levelIndexStr);
    const level = allLevels[levelIndex];
    if (target.getAttribute('data-text-val') == 'name') level.name = target.value;
    if (target.getAttribute('data-text-val') == 'color') {
        level.color = target.value;
        level.svg = null;
    }
    if (target.getAttribute('data-num-val') == 'svg') {
        level.color = '';
        level.svg = parseFloat(target.value);
    }
    updateLevelBackground(levelIndex);
    save();
});
levelsListEl.addEventListener('click', (e)=>{
    const target = e.target;
    if (target.tagName !== 'BUTTON') return;
    const resize = target.getAttribute('data-offset-level-size');
    const moveX = target.getAttribute('data-offset-x');
    const moveY = target.getAttribute('data-offset-y');
    const levelIndexStr = target.getAttribute('data-level');
    if (!levelIndexStr) return;
    const levelIndex = parseInt(levelIndexStr);
    const level = allLevels[levelIndex];
    const { bricks, size } = level;
    if (resize) {
        const newSize = size + parseInt(resize);
        const newBricks = new Array(newSize * newSize).fill('_');
        for(let x = 0; x < Math.min(size, newSize); x++)for(let y = 0; y < Math.min(size, newSize); y++)newBricks[y * newSize + x] = bricks.split('')[y * size + x] || '_';
        level.size = newSize;
        level.bricks = newBricks.map((b)=>b || '_').join('');
    } else if (moveX && moveY) {
        const dx = parseInt(moveX), dy = parseInt(moveY);
        const newBricks = new Array(size * size).fill('_');
        for(let x = 0; x < size; x++)for(let y = 0; y < size; y++)newBricks[(y + dy) * size + (x + dx)] = bricks.split('')[y * size + x] || '_';
        level.bricks = newBricks.map((b)=>b || '_').join('');
    } else if (target.getAttribute('data-rename')) {
        const newName = prompt('Name ? ', level.name);
        if (newName) {
            level.name = newName;
            target.textContent = newName;
        }
    } else if (target.getAttribute('data-delete')) {
        if (confirm('Delete level')) {
            allLevels = allLevels.filter((l, i)=>i !== levelIndex);
            save().then(()=>window.location.reload());
        }
    }
    renderLevelBricks(levelIndex);
    save();
}, true);
let applying = '';
function colorPixel(e) {
    const target = e.target;
    if (applying === '') return;
    console.log('colorPixel', applying);
    const index = target.getAttribute('data-set-color-of');
    const level = target.getAttribute('data-level');
    if (index && level) {
        const levelIndex = parseInt(level);
        target.style.background = palette[applying] || 'transparent';
        setBrick(levelIndex, parseInt(index), applying);
    }
}
function setBrick(levelIndex, index, chr) {
    const bricks = allLevels[levelIndex].bricks;
    allLevels[levelIndex].bricks = bricks.substring(0, index) + chr + bricks.substring(index + 1);
}
let changed = 0;
levelsListEl.addEventListener('mousedown', (e)=>{
    const target = e.target;
    const index = target.getAttribute('data-set-color-of');
    const level = target.getAttribute('data-level');
    if (index && level) {
        changed = 0;
        const before = allLevels[parseInt(level)].bricks[parseInt(index)] || '';
        applying = before === currentCode ? '_' : currentCode;
        console.log({
            before,
            applying,
            currentCode
        });
        colorPixel(e);
    }
});
levelsListEl.addEventListener('mouseenter', (e)=>{
    if (applying !== '') {
        colorPixel(e);
        changed++;
    }
}, true);
document.addEventListener('mouseup', (e)=>{
    applying = '';
    if (changed) save();
});
document.getElementById('new-level').addEventListener('click', (e)=>{
    const name = prompt("Name ? ");
    if (!name) return;
    allLevels.push({
        name,
        size: 8,
        bricks: '________________________________________________________________',
        svg: null,
        color: ''
    });
    const levelIndex = allLevels.length - 1;
    addLevelEditorToList(allLevels[levelIndex], levelIndex);
    save();
}, true);
renderAllLevels();
function save() {
    return fetch('http://localhost:4400/src/levels.json', {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain'
        },
        body: JSON.stringify(allLevels, null, 2)
    });
}

},{"./backgrounds.json":"el6Kx","./palette.json":"jhnsJ","./levels.json":"kqnNl","@parcel/transformer-js/src/esmodule-helpers.js":"gkKU3","./getLevelBackground":"7OIPf"}]},["7tSz9","434tO"], "434tO", "parcelRequire94c2")

//# sourceMappingURL=levels_editor.227fd609.js.map
