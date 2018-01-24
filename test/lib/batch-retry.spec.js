const {buildBatchRetry} = require('../../index')

describe('buildBatchRetry', () => {
  it('Should throw error when executor throwing', async () => {
    const errMsg = 'Error here'
    const executor = () => { throw new Error(errMsg) }
    const withBatchRetryExecutor = buildBatchRetry()(executor)
    await withBatchRetryExecutor([]).catch(e => expect(e.message).toBe(errMsg))
  })
})
