import Chromeless from './'


const chromeless = new Chromeless({
  closeTab: false,
  runRemote: false,
})

// const jobs = JSON.parse(fs.readFileSync('jobs.json', 'utf-8'))
// const cookies = JSON.parse(fs.readFileSync('cookies.json', 'utf-8'))

chromeless
  .goto('http://localhost:8064')
  .click('#submit')
  .wait('div')
  // .screenshot('shot.png')
  .end()
  .then((result) => {
    console.log('done running it remotely result:', result)
  })
  .catch(e => {
    console.error(e)
  })
//   .saveJobs('jobs.json')
// .processJobs(jobs)
// .setCookies(cookies, 'http://localhost:4000')
// .getCookies('http://localhost:4000')
// .evaluate(() => location.href = '/')
