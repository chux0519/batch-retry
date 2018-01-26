const BatchRetry = require('../../lib/batch-retry')

describe('Class BatchRetry', () => {
  describe('Given an executor which will throw error', () => {
    const errMsg = 'Error here'
    const executor = () => { throw new Error(errMsg) }
    const batchRetry = new BatchRetry({executor})
    it('Should throw when run any tasks', async () => {
      await batchRetry.run([1, 2, 3]).catch(e => expect(e.message).toBe(errMsg))
    })
    it('Should throw when run an empty tasks', async () => {
      await batchRetry.run([]).catch(e => expect(e.message).toMatch(/No tasks to run!/))
    })
  })

  describe('Given an executor which will return input', () => {
    const executor = input => input
    const batchRetry = new BatchRetry({executor})
    it('Should throw when run an empty tasks', async () => {
      await batchRetry.run([]).catch(e => expect(e.message).toMatch(/No tasks to run!/))
    })
    it('Should directly return without retrying', async () => {
      const input = [1, 2, 3]
      await batchRetry.run(input).then(results => expect(results).toEqual(input))
    })
  })

  describe('Given an executor which will only return input when input is odd and returns all retries results', () => {
    const evenError = new Error('Even')
    const executor = numbers => numbers.map(each => (each % 2 === 0) ? evenError : each)
    const batchRetry = new BatchRetry({executor, onlyFinalResult: false, maxRetries: 5})
    it('Should throw when run an empty tasks', async () => {
      await batchRetry.run([]).catch(e => expect(e.message).toMatch(/No tasks to run!/))
    })
    it('Should return after maxRetries', async () => {
      const input = [1, 2, 3]
      const output = [
        [1],
        [evenError, evenError, evenError, evenError, evenError],
        [3]
      ]
      await batchRetry.run(input).then(results => expect(results).toEqual(output))
    })
  })

  describe('Given an async executor which will resolve input', () => {
    const executor = input => Promise.resolve(input)
    const batchRetry = new BatchRetry({executor})
    it('Should throw when run an empty tasks', async () => {
      await batchRetry.run([]).catch(e => expect(e.message).toMatch(/No tasks to run!/))
    })
    it('Should directly resolve without retrying', async () => {
      const input = [1, 2, 3]
      await batchRetry.run(input).then(results => expect(results).toEqual(input))
    })
  })

  describe('Given an async executor which will only resolve input when input is odd and returns all retries results', () => {
    const evenError = new Error('Even')
    const executor = numbers => Promise.all(numbers
      .map(each =>
        (each % 2 === 0)
          ? Promise.reject(evenError).catch(e => e) // have to catch by hand or it will throw
          : Promise.resolve(each)
      )
    )
    const batchRetry = new BatchRetry({executor, onlyFinalResult: false, maxRetries: 5})
    it('Should throw when run an empty tasks', async () => {
      await batchRetry.run([]).catch(e => expect(e.message).toMatch(/No tasks to run!/))
    })
    it('Should resolve after maxRetries', async () => {
      const input = [1, 2, 3]
      const output = [
        [1],
        [evenError, evenError, evenError, evenError, evenError],
        [3]
      ]
      await batchRetry.run(input).then(results => expect(results).toEqual(output))
    })
  })
})
