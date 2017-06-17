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
var CDP = require("chrome-remote-interface");
var fetch = require("isomorphic-fetch");
var FormData = require("form-data");
var util_1 = require("./util");
var fs = require("fs");
var aws_sdk_1 = require("aws-sdk");
var Chromeless = (function () {
    function Chromeless(options) {
        var _this = this;
        this.options = __assign({ useArtificialClick: false, closeTab: true, waitTimeout: 10000, runRemote: false }, options);
        this.queue = [];
        this.lambda = new aws_sdk_1.Lambda({
            region: process.env.AWS_REGION || 'eu-west-1',
            accessKeyId: options.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: options.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
        });
        if (!this.options.runRemote) {
            CDP.New().then(function (target) {
                _this.target = target;
                return CDP({ target: target });
            }).then(function (client) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    console.log('Booted the CDP client');
                    this.client = client;
                    if (this.processCallback) {
                        this.processCallback();
                        this.processCallback = undefined;
                    }
                    return [2 /*return*/];
                });
            }); });
        }
    }
    Chromeless.prototype.goto = function (url) {
        var _this = this;
        console.log('Going to ' + url);
        this.queue.push({
            fn: function (client, url) { return __awaiter(_this, void 0, void 0, function () {
                var Network, Page, e_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            Network = client.Network, Page = client.Page;
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 7, , 8]);
                            return [4 /*yield*/, Promise.all([Network.enable(), Page.enable()])];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, Network.setUserAgentOverride({ userAgent: 'chromeless' })];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, Page.navigate({ url: url })];
                        case 4:
                            _a.sent();
                            return [4 /*yield*/, Page.loadEventFired()];
                        case 5:
                            _a.sent();
                            return [4 /*yield*/, util_1.wait(500)];
                        case 6:
                            _a.sent();
                            console.log('Navigated to', url);
                            return [3 /*break*/, 8];
                        case 7:
                            e_1 = _a.sent();
                            console.error(e_1);
                            return [3 /*break*/, 8];
                        case 8: return [2 /*return*/];
                    }
                });
            }); },
            args: { url: url },
        });
        return this;
    };
    Chromeless.prototype.click = function (selector, artificialClick) {
        var _this = this;
        this.queue.push({
            fn: function (client, selector, artificialClick) { return __awaiter(_this, void 0, void 0, function () {
                var exists, fakeClick;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, util_1.nodeExists(client, selector)];
                        case 1:
                            exists = _a.sent();
                            if (!exists) {
                                throw new Error("click(): node for selector " + selector + " doesn't exist");
                            }
                            fakeClick = typeof artificialClick === 'boolean' ? artificialClick : this.options.useArtificialClick;
                            return [4 /*yield*/, util_1.click(client, fakeClick, selector)];
                        case 2:
                            _a.sent();
                            console.log('Clicked on ', selector);
                            return [2 /*return*/];
                    }
                });
            }); },
            args: {
                selector: selector,
                artificialClick: artificialClick || null,
            },
        });
        return this;
    };
    Chromeless.prototype.type = function (text, selector) {
        var _this = this;
        this.queue.push({
            fn: function (client, text, selector) { return __awaiter(_this, void 0, void 0, function () {
                var exists;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!selector) return [3 /*break*/, 2];
                            return [4 /*yield*/, util_1.nodeExists(client, selector)];
                        case 1:
                            exists = _a.sent();
                            if (!exists) {
                                console.log('throwing');
                                throw new Error("type(): node for selector " + selector + " doesn't exist");
                            }
                            console.log('Node exists', exists);
                            _a.label = 2;
                        case 2: return [4 /*yield*/, util_1.type(client, this.options.useArtificialClick, text, selector)];
                        case 3:
                            _a.sent();
                            console.log("Typed " + text + " in " + selector);
                            return [2 /*return*/];
                    }
                });
            }); },
            args: {
                text: text,
                selector: selector || null,
            },
        });
        return this;
    };
    Chromeless.prototype.backspace = function (n, selector) {
        var _this = this;
        this.queue.push({
            fn: function (client, n, selector) { return __awaiter(_this, void 0, void 0, function () {
                var exists;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!selector) return [3 /*break*/, 2];
                            return [4 /*yield*/, util_1.nodeExists(client, selector)];
                        case 1:
                            exists = _a.sent();
                            if (!exists) {
                                throw new Error("type(): node for selector " + selector + " doesn't exist");
                            }
                            console.log('Node exists', exists);
                            _a.label = 2;
                        case 2: return [4 /*yield*/, util_1.backspace(client, this.options.useArtificialClick, n, selector)];
                        case 3:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); },
            args: {
                n: n,
                selector: selector || null,
            },
        });
        return this;
    };
    Chromeless.prototype.getCookies = function (url) {
        var _this = this;
        this.queue.push({
            fn: function (client, url) { return __awaiter(_this, void 0, void 0, function () {
                var value;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, util_1.getCookies(client, url)];
                        case 1:
                            value = _a.sent();
                            console.log('got cookies', value);
                            this.lastValue = value;
                            return [2 /*return*/];
                    }
                });
            }); },
            args: { url: url },
        });
        return this;
    };
    Chromeless.prototype.setCookies = function (cookies, url) {
        var _this = this;
        this.queue.push({
            fn: function (client, cookies, url) { return __awaiter(_this, void 0, void 0, function () {
                var result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, util_1.setCookies(client, cookies, url)];
                        case 1:
                            result = _a.sent();
                            console.log('Done with setting cookies');
                            console.log(result);
                            return [2 /*return*/];
                    }
                });
            }); },
            args: { cookies: cookies, url: url },
        });
        return this;
    };
    Chromeless.prototype.clearCookies = function () {
        var _this = this;
        this.queue.push({
            fn: function (client) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, util_1.clearCookies(client)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); },
        });
        return this;
    };
    Chromeless.prototype.sendKeyCode = function (keyCode, selector, modifiers) {
        var _this = this;
        this.queue.push({
            fn: function (client, keyCode, selector, modifiers) { return __awaiter(_this, void 0, void 0, function () {
                var exists;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!selector) return [3 /*break*/, 2];
                            return [4 /*yield*/, util_1.nodeExists(client, selector)];
                        case 1:
                            exists = _a.sent();
                            if (!exists) {
                                throw new Error("type(): node for selector " + selector + " doesn't exist");
                            }
                            console.log('Node exists', exists);
                            _a.label = 2;
                        case 2:
                            console.log('Sending keyCode', keyCode, modifiers);
                            return [4 /*yield*/, util_1.sendKeyCode(client, this.options.useArtificialClick, keyCode, selector, modifiers)];
                        case 3:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); },
            args: {
                keyCode: keyCode,
                selector: selector || null,
                modifiers: modifiers || null,
            },
        });
        return this;
    };
    Chromeless.prototype.wait = function (selector) {
        var _this = this;
        if (typeof selector === 'number') {
            this.queue.push({
                fn: function (client, selector) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                console.log("Waiting for " + selector + "ms");
                                return [4 /*yield*/, util_1.wait(selector)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); },
                args: { selector: selector },
            });
        }
        else {
            this.queue.push({
                fn: function (client, selector) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                console.log("Waiting for " + selector);
                                return [4 /*yield*/, util_1.waitForNode(client, selector, this.options.waitTimeout)];
                            case 1:
                                _a.sent();
                                console.log("Waited for " + selector);
                                return [2 /*return*/];
                        }
                    });
                }); },
                args: { selector: selector },
            });
        }
        return this;
    };
    Chromeless.prototype.evaluate = function (fn) {
        var _this = this;
        this.queue.push({
            fn: function (client, fn) { return __awaiter(_this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            console.log('Evaluating', "" + fn);
                            _a = this;
                            return [4 /*yield*/, util_1.evaluate(client, fn)];
                        case 1:
                            _a.lastValue = _b.sent();
                            return [2 /*return*/];
                    }
                });
            }); },
            args: { fn: fn.toString() },
        });
        return this;
    };
    Chromeless.prototype.value = function (selector) {
        var _this = this;
        this.queue.push({
            fn: function (client, selector) { return __awaiter(_this, void 0, void 0, function () {
                var exists, value;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, util_1.nodeExists(client, selector)];
                        case 1:
                            exists = _a.sent();
                            if (!exists) {
                                throw new Error("value: node for selector " + selector + " doesn't exist");
                            }
                            return [4 /*yield*/, util_1.getValue(client, selector)];
                        case 2:
                            value = _a.sent();
                            this.lastValue = value;
                            return [2 /*return*/];
                    }
                });
            }); },
            args: { selector: selector },
        });
        return this;
    };
    Chromeless.prototype.screenshot = function () {
        var _this = this;
        this.queue.push({
            fn: function (client, outputPath) { return __awaiter(_this, void 0, void 0, function () {
                var data, form;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, util_1.screenshot(client)];
                        case 1:
                            data = _a.sent();
                            form = new FormData();
                            form.append('data', new Buffer(data, 'base64'));
                            console.log('uploading screenshot');
                            fetch("https://api.graph.cool/file/v1/asdf", {
                                type: 'POST',
                                body: form,
                            })
                                .then(function (res) { return res.json(); })
                                .then(function (res) {
                                console.log('uploaded screenshot');
                                console.log(res);
                            })
                                .catch(function (e) {
                                console.error('Error uploading screenshot');
                            });
                            return [2 /*return*/];
                    }
                });
            }); },
        });
        return this;
    };
    Chromeless.prototype.processJobs = function (jobs) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.queue = this.deserializeJobs(jobs);
                console.log("Successfully deserialized " + this.queue.length + " jobs");
                return [2 /*return*/, this.end()];
            });
        });
    };
    Chromeless.prototype.end = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.options.runRemote) {
                    return [2 /*return*/, this.processRemote()];
                }
                else {
                    return [2 /*return*/, this.processLocal()];
                }
                return [2 /*return*/];
            });
        });
    };
    Chromeless.prototype.processRemote = function () {
        return __awaiter(this, void 0, void 0, function () {
            var jobs, Payload, result, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        jobs = this.serializeJobs();
                        Payload = JSON.stringify({
                            body: JSON.stringify({
                                jobs: this.getSerializableJobs(),
                                options: this.options,
                            })
                        });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 10]);
                        return [4 /*yield*/, this.invokeFunction(Payload)];
                    case 2:
                        result = _a.sent();
                        if (!(result === null)) return [3 /*break*/, 4];
                        console.log('Result is null, retry');
                        return [4 /*yield*/, this.processRemote()];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4: return [2 /*return*/, result];
                    case 5: return [3 /*break*/, 10];
                    case 6:
                        e_2 = _a.sent();
                        console.log('getting an error', e_2);
                        if (!(e_2.message === 'Internal server error')) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.processRemote()];
                    case 7: return [2 /*return*/, _a.sent()];
                    case 8: throw e_2;
                    case 9: return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    Chromeless.prototype.invokeFunction = function (Payload) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        console.log('Invoking lambda function ' + Chromeless.lambdaFunctionName);
                        _this.lambda.invoke({
                            FunctionName: Chromeless.lambdaFunctionName,
                            Payload: Payload,
                        }, function (err, data) {
                            if (err) {
                                console.log('received error from lambda function', err);
                                reject(err);
                            }
                            else {
                                console.log(data);
                                var response = data.Payload.toString();
                                console.log(response);
                                var json = JSON.parse(response);
                                console.log('received json from lambda function', json);
                                var result = null;
                                try {
                                    result = JSON.parse(json.body).result;
                                }
                                catch (e) {
                                    //
                                }
                                console.log('Result of invocation', result);
                                resolve(result);
                            }
                        });
                    })];
            });
        });
    };
    Chromeless.prototype.processLocal = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var process = function () { return __awaiter(_this, void 0, void 0, function () {
                var jobs, _loop_1, this_1, _i, jobs_1, job, state_1, id;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            jobs = this.queue;
                            _loop_1 = function (job) {
                                var args, e_3;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            _a.trys.push([0, 2, , 3]);
                                            args = [];
                                            if (job.args) {
                                                args = Object.keys(job.args).map(function (key) { return job.args[key]; });
                                            }
                                            return [4 /*yield*/, job.fn.apply(this_1, [this_1.client].concat(args))];
                                        case 1:
                                            _a.sent();
                                            return [3 /*break*/, 3];
                                        case 2:
                                            e_3 = _a.sent();
                                            return [2 /*return*/, { value: reject(e_3) }];
                                        case 3: return [2 /*return*/];
                                    }
                                });
                            };
                            this_1 = this;
                            _i = 0, jobs_1 = jobs;
                            _a.label = 1;
                        case 1:
                            if (!(_i < jobs_1.length)) return [3 /*break*/, 4];
                            job = jobs_1[_i];
                            return [5 /*yield**/, _loop_1(job)];
                        case 2:
                            state_1 = _a.sent();
                            if (typeof state_1 === "object")
                                return [2 /*return*/, state_1.value];
                            _a.label = 3;
                        case 3:
                            _i++;
                            return [3 /*break*/, 1];
                        case 4:
                            if (this.options.closeTab) {
                                id = this.target.id;
                                CDP.Close({ id: id });
                            }
                            resolve(this.lastValue);
                            return [2 /*return*/];
                    }
                });
            }); };
            if (_this.client) {
                return process();
            }
            else {
                _this.processCallback = process;
            }
        });
    };
    Chromeless.prototype.saveJobs = function (path) {
        return __awaiter(this, void 0, void 0, function () {
            var str;
            return __generator(this, function (_a) {
                str = this.serializeJobs();
                fs.writeFileSync(path, str, 'utf-8');
                return [2 /*return*/];
            });
        });
    };
    Chromeless.prototype.serializeJobs = function () {
        return JSON.stringify(this.getSerializableJobs(), null, 2);
    };
    Chromeless.prototype.getSerializableJobs = function () {
        return this.queue.map(function (job) {
            return {
                fn: job.fn.toString(),
                args: job.args,
            };
        });
    };
    Chromeless.prototype.deserializeJobs = function (jobs) {
        var _this = this;
        // const jobs = JSON.parse(str)
        global['_this'] = this;
        return jobs.map(function (job) {
            var fnString = _this.prepareFunction(job);
            var fn = eval(fnString);
            return {
                fn: fn,
                args: job.args,
            };
        });
    };
    Chromeless.prototype.prepareFunction = function (job) {
        var body = this.extractFunctionBody(job.fn);
        var args = ['client'].concat(job.args ? Object.keys(job.args) : []);
        return "(" + args + ") => " + body;
    };
    Chromeless.prototype.extractFunctionBody = function (fn) {
        var startIndex = fn.indexOf('{');
        return fn.slice(startIndex, fn.length);
    };
    return Chromeless;
}());
Chromeless.lambdaFunctionName = 'testless-dev-test';
Chromeless.screenshotProjectId = 'asdf';
exports.default = Chromeless;
//# sourceMappingURL=index.js.map