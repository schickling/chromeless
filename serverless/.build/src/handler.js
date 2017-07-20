const launch = require('@serverless-chrome/lambda')

const handler = require('./n3xmd7138yzbsu8ti9b4t2o6r___handler.js')
const options = {  }

module.exports.run = function ensureHeadlessChrome (event, context, callback) {
  launch(options)
    .then((instance) => {
      handler.run(event, context, callback, instance)
    })
    .catch((error) => {
      console.error(
        'Error occured in serverless-plugin-chrome wrapper when trying to ' +
          'ensure Chrome for run() handler.',
        options,
        error
      )
    })
}