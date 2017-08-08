// Catch unhandle rejections that can happen using async/await.
// This will cause tests to fail.
if (!process.env.LISTENING_TO_UNHANDLED_REJECTION) {
  /* istanbul ignore next */
  process.on('unhandledRejection', reason => {
    /* istanbul ignore next */
    throw reason
  })
  // Avoid memory leak by adding too many listeners
  process.env.LISTENING_TO_UNHANDLED_REJECTION = true
}
