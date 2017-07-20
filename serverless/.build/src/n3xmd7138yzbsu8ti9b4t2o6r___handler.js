"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = require("debug");
const chromeless_1 = require("chromeless");
const ably_1 = require("ably");
const debug = debug_1.default('handler');
function run(event, context, callback, chromeInstance) {
    return __awaiter(this, void 0, void 0, function* () {
        debug('started', chromeInstance);
        // @TODO: lazy
        let eventBody = { options: {}, pusherChannelName: '' };
        try {
            eventBody = JSON.parse(event.body);
        }
        catch (error) {
            return callback(null, {
                statusCode: 400,
                eventBody: JSON.stringify({
                    error: 'Malformed request eventBody. Expected JSON.',
                }),
            });
        }
        const chrome = new chromeless_1.LocalChrome({
            chromelessOptions: Object.assign({}, eventBody.options, { runRemote: false }),
        });
        const queue = new chromeless_1.Queue(chrome);
        const ably = new ably_1.Realtime('eiPuOw.DUAicQ:yq9jJ5164vdtBFIA');
        const channel = ably.channels.get(eventBody.pusherChannelName);
        console.log(eventBody.pusherChannelName);
        channel.publish('connected', '');
        console.log('triggered connection');
        channel.subscribe('request', (msg) => __awaiter(this, void 0, void 0, function* () {
            const command = JSON.parse(msg.data);
            console.log('command', command);
            try {
                const result = yield queue.process(command);
                const remoteResult = JSON.stringify({
                    value: result,
                });
                console.log(result);
                channel.publish('response', remoteResult);
            }
            catch (error) {
                const remoteResult = JSON.stringify({
                    error: error.toString(),
                });
                channel.publish('response', remoteResult);
            }
        }));
        channel.subscribe('end', () => __awaiter(this, void 0, void 0, function* () {
            channel.unsubscribe('end');
            ably.close();
            yield queue.end();
            callback(null, {
                statusCode: 204,
            });
        }));
    });
}
exports.run = run;
//# sourceMappingURL=handler.js.map