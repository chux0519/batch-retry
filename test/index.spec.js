const {buildWithBatchRetry} = require('../index')

describe('Function buildWithBatchRetry', () => {
  describe('Given executor in options', () => {
    describe('Should returns a function do things like BatchRetry.run', () => {
      const errMsg = 'Error here'
      const executor = () => { throw new Error(errMsg) }
      const executorWithBatchRetry = buildWithBatchRetry({executor})
      it('Should throw when run any tasks', async () => {
        await executorWithBatchRetry([1, 2, 3]).catch(e => expect(e.message).toBe(errMsg))
      })
      it('Should throw when run an empty tasks', async () => {
        await executorWithBatchRetry([]).catch(e => expect(e.message).toMatch(/No tasks to run!/))
      })
    })
  })
  describe('Given no executor in options', () => {
    describe('Should returns a high order function', () => {
      const errMsg = 'Error here'
      const executor = () => { throw new Error(errMsg) }
      const withBatchRetry = buildWithBatchRetry()
      const executorWithBatchRetry = withBatchRetry(executor)
      it('Should throw when run any tasks', async () => {
        await executorWithBatchRetry([1, 2, 3]).catch(e => expect(e.message).toBe(errMsg))
      })
      it('Should throw when run an empty tasks', async () => {
        await executorWithBatchRetry([]).catch(e => expect(e.message).toMatch(/No tasks to run!/))
      })
    })
  })
})
