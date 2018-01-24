module.exports = {
  buildBatchRetry
}

const isError = e => e instanceof Error || (e && e.stack && e.message && typeof e.stack === 'string')
const makePromise = promise => {
  if (promise.then) return promise
  return Promise.resolve(promise)
}

function buildBatchRetry (options = {}) {
  const {
    shouldRetry = defaultShouldRetryHandler,
    maxRetries = 5,
    onlyFinalResult = true
  } = options
  function defaultShouldRetryHandler (task, result, count) {
    if (count >= maxRetries || isError(result)) return false
    return true
  }
  function checkShouldRetry (tasks, results, count) {
    for (let i = 0; i < tasks.length; i++) {
      if (shouldRetry(tasks[i], results[i], count)) return true
    }
    return false
  }
  let cnt = 0
  let finished = false
  function executeWithCount (executor, tasks) {
    return makePromise(executor(tasks)).then(results => {
      cnt += 1
      return results
    })
  }
  async function poccess (executor, tasks) {
    const n = tasks.length
    // [[],....]
    let allResults = Array.from(Array(n)).map(each => [])
    let finalResults = []
    while (!finished) {
      await executeWithCount(executor, tasks)
      .then(results => {
        if (!checkShouldRetry(tasks, results, cnt)) finished = true
        if (!onlyFinalResult) allResults.forEach((resN, n) => resN.push(results[n]))
        else finalResults = results
      })
    }
    return onlyFinalResult ? finalResults : allResults
  }
  function curriedProcess (executor) {
    return function (tasks) {
      return poccess(executor, tasks)
    }
  }
  return function withBatchRetry () {
    if (arguments.length === 1) return curriedProcess(...arguments)
    return poccess(...arguments)
  }
}
