export const __mocks = {
  putObject: jest.fn(() => {
    return {
      promise: () => Promise.resolve(),
    }
  }),
}

export function S3() {
  return {
    putObject: __mocks.putObject,
  }
}
