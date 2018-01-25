const echo = input => input
const isNotNull = n => n !== null
const isError = e => e instanceof Error || (e && e.stack && e.message && typeof e.stack === 'string')
const makePromise = promise => {
  if (promise && promise.then) return promise
  return Promise.resolve(promise)
}

class BatchRetryError extends Error {
  constructor (msg) {
    super(msg)
    this.name = 'BatchRetryError'
  }
}

class BatchRetry {
  constructor (options) {
    const defaultOptions = {
      shouldRetry: defaultShouldRetryHandler,
      maxRetries: 5,
      onlyFinalResult: true,
      executor: echo
    }
    this.options = Object.assign({}, defaultOptions, options)
    function defaultShouldRetryHandler (task, result, count) {
      if (count >= this.maxRetries || isError(result)) return true
      return false
    }
    this.init()
  }
  init () {
    this.n = 0
    this.reg = {}
    this.count = 0
    this.tasks = null
    this.allResults = []
    this.finished = false
  }

  register (tasks) {
    this.tasks = tasks
    this.n = tasks.length
    this.reg = Object.assign({}, tasks)
    this.allResults = Array.from(Array(this.n)).map(each => [])
  }

  proccess (indexes) {
    const tasks = indexes.map(i => this.reg[i])
    return makePromise(this.executor(tasks))
      .then(results => {
        this.count += 1
        indexes.forEach((index, n) => this.allResults[index].push(results[n]))
        const failedIndexes = indexes.map((index, n) =>
            this.shouldRetry(this.reg[index], results[n], this.count)
            ? index
            : null
          )
          .filter(isNotNull)
        if (failedIndexes.length === 0 || this.count >= this.maxRetries) this.finished = true
        return failedIndexes
      })
  }

  async run (tasks) {
    this.register(tasks)
    if (this.n === 0 || !this.tasks) throw new BatchRetryError('No tasks to run!')
    let indexes = this.tasks.map((task, index) => index)
    while (!this.finished) {
      indexes = await this.proccess(indexes)
    }
    return Promise.resolve(this.ret)
  }

  get shouldRetry () {
    return this.options.shouldRetry
  }
  get maxRetries () {
    return this.options.maxRetries
  }
  get executor () {
    return this.options.executor
  }
  get onlyFinalResult () {
    return this.options.onlyFinalResult
  }
  get ret () {
    if (!this.onlyFinalResult) return this.allResults
    return this.allResults.map(each => each[each.length - 1])
  }
}

module.exports = BatchRetry
