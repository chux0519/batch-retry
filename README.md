# batch-retry

[![Build Status](https://travis-ci.org/chux0519/batch-retry.svg?branch=master)](https://travis-ci.org/chux0519/batch-retry)
[![codecov](https://codecov.io/gh/chux0519/batch-retry/branch/master/graph/badge.svg)](https://codecov.io/gh/chux0519/batch-retry)

Helps you to retry a batch of tasks.

## Feature

- Only retry failed tasks.
- Retry results can be cached and eventually all returned if you want.
- You can customize the maximum number of retries.
- You can customize whether the result should be retried.

## Install

> npm install --save batch-retry
>
> yarn add batch-retry

## Usage

### Using `BatchRetry` class

It provide a class called `BatchRetry` which should be contructed with a `executor`.

The `executor` is a function that takes an array of size n as input, and returns another array of size n as output.

A `BatchRetry` instance has a `run` method, which will pass param to `executor` and manage the retry process.

When the executor itself throws, the `run` method will throws too, so `executor` must catch all tasks' error and return something for checking retry. You can simplily return the error, `BatchRetry` will check the result, if it is an error(by default, I will discuss this later), it would be recorded and wait for batch retry.

```javascript
const {BatchRetry} = require('batch-retry')

const evenError = new Error('Even')
const simpleExecutor = numbers => Promise.all(numbers
  .map(each =>
    (each % 2 === 0)
      ? Promise.reject(evenError).catch(e => e) // have to catch by hand or it will throw
      : Promise.resolve(each)
  )
)

// Initialize a instance.
const batchRetry = new BatchRetry({
      maxRetries: 5,
      onlyFinalResult: false, // return all the result
      executor: simpleExecutor
    })
const input = [1, 2, 3]

// Run the process
batchRetry.run(input).then(console.log)
// will output all the result [[1],[evenError, evenError, evenError, evenError, evenError],[3]]
// if onlyFinalResult set to true, it will only output [1, evenError, 3]
```

### Using `buildWithBatchRetry` function

It provide a helper function `buildWithBatchRetry`, to compose high order functions.

```javascript
const {buildWithBatchRetry} = require('batch-retry')

const evenError = new Error('Even')
const simpleExecutor = numbers => Promise.all(numbers
  .map(each =>
    (each % 2 === 0)
      ? Promise.reject(evenError).catch(e => e) // have to catch by hand or it will throw
      : Promise.resolve(each)
  )
)

// case 1: use it as a wrapper function
{
  const withBatchRerty = buildWithBatchRetry({
        maxRetries: 5,
        onlyFinalResult: false // return all the result
      })
  // wrap the executor
  const simpleExecutorWithBatchRetry = withBatchRerty(simpleExecutor)
  // Run the process
  simpleExecutorWithBatchRetry([1, 2, 3]).then(console.log)
  // will output all the result [[1],[evenError, evenError, evenError, evenError, evenError],[3]]
  // if onlyFinalResult set to true, it will only output [1, evenError, 3]
}

// case 2: use it directly
{
  const simpleExecutorWithBatchRetry = buildWithBatchRetry({
        maxRetries: 5,
        onlyFinalResult: false, // return all the result
        executor: simpleExecutor
      })
  // Run the process
  simpleExecutorWithBatchRetry([1, 2, 3]).then(console.log)
}
```

## API

### `BatchRetry`

constructor(options) => batchRetry: BatchRetry

- `options.shouldRetry`: Function for checking retry. *Default: Check if the value is of type `error` or `error-like`(has properties `stack` and `message`) or executed times is greater than or euqal to maxRetries.*
  - Function: (task, result, executedTimes) = > Boolean
- `options.maxRetries`: Max retry times. *Default: `5`*
  - Number
- `options.onlyFinalResult`: Representing if it should only returns the final result. If setting to false, it will returns all results instead. For example, having final result: `[1, error, 3]` and all results: `[[1], [error, error, error, error, error], [3]]`, it means only the second task failed, and after five retries, it still failed. *Default: `true`*
  - Boolean
- `options.executor`: Executor function. It takes an array of size `n` as input, and returns another array of the same size as output. *Required*
  - Function: tasks: Array => result: Array