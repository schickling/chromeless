// Catch unhandle rejections that can happen using async/await.
// This will cause tests to fail.
if (!process.env.__LISTENING_TO_UNHANDLED_REJECTION) {
  const unhandledRejection = require('unhandled-rejection')
  // Avoid memory leak by adding too many listeners
  process.env.__LISTENING_TO_UNHANDLED_REJECTION = true
  /* istanbul ignore next */
  const rejectionEmitter = unhandledRejection({
    timeout: 20
  })

  rejectionEmitter.on('unhandledRejection', (error, promise) => {
    console.log('Unhandled Rejection Promise:', promise)
    throw error
  })

  rejectionEmitter.on('rejectionHandled', (error, promise) => {
    console.log('Handled Rejection Promise:', error, promise)
  })
}
