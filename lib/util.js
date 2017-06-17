"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// export async function nodeAppears(client, selector) {
//   // browser code to register and parse mutations
//   const browserCode = (selector) => {
//     return new Promise((fulfill, reject) => {
//       new MutationObserver((mutations, observer) => {
//         // add all the new nodes
//         const nodes = []
//         mutations.forEach((mutation) => {
//           nodes.push(...mutation.addedNodes)
//         })
//         // fulfills if at least one node matches the selector
//         if (nodes.find((node) => node.matches(selector))) {
//           observer.disconnect()
//           fulfill()
//         }
//       }).observe(document.body, {
//         childList: true
//       })
//     })
//   }
//   // inject the browser code
//   const {Runtime} = client
//   await Runtime.evaluate({
//     expression: `(${browserCode})(\`${selector}\`)`,
//     awaitPromise: true
//   })
// }
function waitForNode(client, selector, waitTimeout) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        var Runtime, getNode, result, start_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    Runtime = client.Runtime;
                    getNode = function (selector) {
                        return document.querySelector(selector);
                    };
                    return [4 /*yield*/, Runtime.evaluate({
                            expression: "(" + getNode + ")(`" + selector + "`)",
                        })];
                case 1:
                    result = _a.sent();
                    if (result.result.value === null) {
                        start_1 = new Date().getTime();
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                var interval = setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
                                    var result;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                if (new Date().getTime() - start_1 > waitTimeout) {
                                                    clearInterval(interval);
                                                    reject(new Error("wait() timed out after " + waitTimeout + "ms"));
                                                }
                                                return [4 /*yield*/, Runtime.evaluate({
                                                        expression: "(" + getNode + ")(`" + selector + "`)",
                                                    })];
                                            case 1:
                                                result = _a.sent();
                                                if (result.result.value !== null) {
                                                    clearInterval(interval);
                                                    resolve();
                                                }
                                                return [2 /*return*/];
                                        }
                                    });
                                }); }, 500);
                            })];
                    }
                    else {
                        return [2 /*return*/];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.waitForNode = waitForNode;
function wait(timeout) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    setTimeout(function () {
                        resolve();
                    }, timeout);
                })];
        });
    });
}
exports.wait = wait;
function nodeExists(client, selector) {
    return __awaiter(this, void 0, void 0, function () {
        var Runtime, exists, expression, result, exists_1, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    Runtime = client.Runtime;
                    exists = function (selector) {
                        return document.querySelector(selector);
                    };
                    expression = "(" + exists + ")(`" + selector + "`)";
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, Runtime.evaluate({
                            expression: expression,
                        })
                        // counter intuitive: if it is a real object and not just null,
                        // the chrome debugger won't return a value but return a objectId
                    ];
                case 2:
                    result = _a.sent();
                    exists_1 = typeof result.result.value === 'undefined';
                    console.log('node exists', exists_1);
                    return [2 /*return*/, exists_1];
                case 3:
                    e_1 = _a.sent();
                    console.error('Error while trying to run nodeExists');
                    console.error(e_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.nodeExists = nodeExists;
function getPosition(client, selector) {
    return __awaiter(this, void 0, void 0, function () {
        var Runtime, getTop, getLeft, topExpression, topResult, leftExpression, leftResult, x, y;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    Runtime = client.Runtime;
                    getTop = function (selector) {
                        return document.querySelector(selector).getBoundingClientRect().top;
                    };
                    getLeft = function (selector) {
                        return document.querySelector(selector).getBoundingClientRect().left;
                    };
                    topExpression = "(" + getTop + ")(`" + selector + "`)";
                    return [4 /*yield*/, Runtime.evaluate({
                            expression: topExpression,
                        })];
                case 1:
                    topResult = _a.sent();
                    leftExpression = "(" + getLeft + ")(`" + selector + "`)";
                    return [4 /*yield*/, Runtime.evaluate({
                            expression: leftExpression,
                        })];
                case 2:
                    leftResult = _a.sent();
                    x = parseInt(leftResult.result.value, 10);
                    y = parseInt(topResult.result.value, 10);
                    if (isNaN(x) || isNaN(y)) {
                        throw new Error("The viewport position for " + selector + " couldn't be determined. x: " + x + " y: " + y);
                    }
                    return [2 /*return*/, {
                            x: x,
                            y: y,
                        }];
            }
        });
    });
}
exports.getPosition = getPosition;
function click(client, useArtificialClick, selector) {
    return __awaiter(this, void 0, void 0, function () {
        var Runtime, click_1, expression, position, Input, options;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!useArtificialClick) return [3 /*break*/, 2];
                    console.log('Using artificial .click()');
                    Runtime = client.Runtime;
                    click_1 = function (selector) {
                        return document.querySelector(selector).click();
                    };
                    expression = "(" + click_1 + ")(`" + selector + "`)";
                    return [4 /*yield*/, Runtime.evaluate({
                            expression: expression,
                        })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 2: return [4 /*yield*/, getPosition(client, selector)];
                case 3:
                    position = _a.sent();
                    Input = client.Input;
                    options = {
                        x: position.x + 0,
                        y: position.y + 0,
                        button: 'left',
                        clickCount: 1
                    };
                    return [4 /*yield*/, Input.dispatchMouseEvent(__assign({}, options, { type: 'mousePressed' }))];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, Input.dispatchMouseEvent(__assign({}, options, { type: 'mouseReleased' }))];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports.click = click;
function focus(client, selector) {
    return __awaiter(this, void 0, void 0, function () {
        var Runtime, focus, expression;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    Runtime = client.Runtime;
                    focus = function (selector) {
                        return document.querySelector(selector).focus();
                    };
                    expression = "(" + focus + ")(`" + selector + "`)";
                    return [4 /*yield*/, Runtime.evaluate({
                            expression: expression,
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.focus = focus;
function evaluate(client, fn) {
    return __awaiter(this, void 0, void 0, function () {
        var Runtime, expression, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    Runtime = client.Runtime;
                    expression = "(" + fn + ")()";
                    return [4 /*yield*/, Runtime.evaluate({
                            expression: expression,
                        })];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.result.value];
            }
        });
    });
}
exports.evaluate = evaluate;
function type(client, useArtificialClick, text, selector) {
    return __awaiter(this, void 0, void 0, function () {
        var Input, i, char, options, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!selector) return [3 /*break*/, 3];
                    return [4 /*yield*/, focus(client, selector)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, wait(500)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    Input = client.Input;
                    i = 0;
                    _a.label = 4;
                case 4:
                    if (!(i < text.length)) return [3 /*break*/, 7];
                    char = text[i];
                    options = {
                        type: 'char',
                        text: char,
                        unmodifiedText: char,
                    };
                    return [4 /*yield*/, Input.dispatchKeyEvent(options)];
                case 5:
                    res = _a.sent();
                    _a.label = 6;
                case 6:
                    i++;
                    return [3 /*break*/, 4];
                case 7: return [2 /*return*/];
            }
        });
    });
}
exports.type = type;
function sendKeyCode(client, useArtificialClick, keyCode, selector, modifiers) {
    return __awaiter(this, void 0, void 0, function () {
        var Input, options;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!selector) return [3 /*break*/, 3];
                    return [4 /*yield*/, click(client, useArtificialClick, selector)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, wait(500)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    Input = client.Input;
                    options = {
                        nativeVirtualKeyCode: keyCode,
                        windowsVirtualKeyCode: keyCode,
                    };
                    if (modifiers) {
                        options['modifiers'] = modifiers;
                    }
                    return [4 /*yield*/, Input.dispatchKeyEvent(__assign({}, options, { type: 'rawKeyDown' }))];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, Input.dispatchKeyEvent(__assign({}, options, { type: 'keyUp' }))];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.sendKeyCode = sendKeyCode;
function backspace(client, useArtificialClick, n, selector) {
    return __awaiter(this, void 0, void 0, function () {
        var Input, i, options_1, options, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!selector) return [3 /*break*/, 3];
                    return [4 /*yield*/, click(client, useArtificialClick, selector)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, wait(500)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    Input = client.Input;
                    i = 0;
                    _a.label = 4;
                case 4:
                    if (!(i < n)) return [3 /*break*/, 8];
                    options_1 = {
                        modifiers: 8,
                        key: 'Backspace',
                        code: 'Backspace',
                        nativeVirtualKeyCode: 8,
                        windowsVirtualKeyCode: 8,
                    };
                    return [4 /*yield*/, Input.dispatchKeyEvent(__assign({}, options_1, { type: 'rawKeyDown' }))];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, Input.dispatchKeyEvent(__assign({}, options_1, { type: 'keyUp' }))];
                case 6:
                    _a.sent();
                    console.log('sent backspace', options_1);
                    _a.label = 7;
                case 7:
                    i++;
                    return [3 /*break*/, 4];
                case 8:
                    options = {
                        type: 'rawKeyDown',
                        nativeVirtualKeyCode: 46,
                    };
                    return [4 /*yield*/, Input.dispatchKeyEvent(options)];
                case 9:
                    res = _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.backspace = backspace;
function getValue(client, selector) {
    return __awaiter(this, void 0, void 0, function () {
        var Runtime, browserCode, expression, result, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    Runtime = client.Runtime;
                    browserCode = function (selector) {
                        return document.querySelector(selector).value;
                    };
                    expression = "(" + browserCode + ")(`" + selector + "`)";
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, Runtime.evaluate({
                            expression: expression,
                        })];
                case 2:
                    result = _a.sent();
                    return [2 /*return*/, result.result.value];
                case 3:
                    e_2 = _a.sent();
                    console.error(e_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.getValue = getValue;
function getCookies(client, url) {
    return __awaiter(this, void 0, void 0, function () {
        var Network, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    Network = client.Network;
                    return [4 /*yield*/, Network.getCookies([url])];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.cookies];
            }
        });
    });
}
exports.getCookies = getCookies;
function setCookies(client, cookies, url) {
    return __awaiter(this, void 0, void 0, function () {
        var Network, successes, _i, cookies_1, cookie, success;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    Network = client.Network;
                    successes = [];
                    _i = 0, cookies_1 = cookies;
                    _a.label = 1;
                case 1:
                    if (!(_i < cookies_1.length)) return [3 /*break*/, 4];
                    cookie = cookies_1[_i];
                    return [4 /*yield*/, Network.setCookie(__assign({}, cookie, { url: url }))];
                case 2:
                    success = _a.sent();
                    successes.push(success);
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, successes];
            }
        });
    });
}
exports.setCookies = setCookies;
function clearCookies(client) {
    return __awaiter(this, void 0, void 0, function () {
        var Network;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    Network = client.Network;
                    return [4 /*yield*/, Network.clearBrowserCookies()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.clearCookies = clearCookies;
function screenshot(client) {
    return __awaiter(this, void 0, void 0, function () {
        var Page, screenshot;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    Page = client.Page;
                    return [4 /*yield*/, Page.captureScreenshot({ format: 'png' })];
                case 1:
                    screenshot = _a.sent();
                    return [2 /*return*/, screenshot.data];
            }
        });
    });
}
exports.screenshot = screenshot;
//# sourceMappingURL=util.js.map