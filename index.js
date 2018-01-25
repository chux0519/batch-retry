const BatchRetry = require('./lib/batch-retry')

function buildWithBatchRetry (options = {}) {
  if (options.executor) return withBatchRetry(options)
  return executor => withBatchRetry({...options, executor})
}

function withBatchRetry (options) {
  const batchRetry = new BatchRetry(options)
  return tasks => batchRetry.run(tasks)
}

module.exports = {
  BatchRetry,
  buildWithBatchRetry
}
