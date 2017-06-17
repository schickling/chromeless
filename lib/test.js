"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require("./");
var chromeless = new _1.default({
    closeTab: false,
    runRemote: false,
});
// const jobs = JSON.parse(fs.readFileSync('jobs.json', 'utf-8'))
// const cookies = JSON.parse(fs.readFileSync('cookies.json', 'utf-8'))
chromeless
    .goto('http://localhost:8064')
    .click('#submit')
    .wait('div')
    .end()
    .then(function (result) {
    console.log('done running it remotely result:', result);
})
    .catch(function (e) {
    console.error(e);
});
//   .saveJobs('jobs.json')
// .processJobs(jobs)
// .setCookies(cookies, 'http://localhost:4000')
// .getCookies('http://localhost:4000')
// .evaluate(() => location.href = '/')
//# sourceMappingURL=test.js.map