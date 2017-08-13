module.exports = jest.fn().mockImplementation(function () {
  return Promise.resolve({
    body: {
      url: 'ws://blah.com',
      channelId: 123,
    }
  })
})