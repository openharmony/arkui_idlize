# Current Issues

**(2025.2.28 Update)**
Unexpected output as below:
```
Starting demo: test_promise
Foo_constructImpl(value)
Foo_getNumberDelayedImpl(vmContest, asyncWorker, thisPtr, seconds, outputArgumentForReturningPromise)
  seconds = 3 (int32)
asyncWorker->createWork() done.
TestPromiseHandler::Execute() done.
callback.call() done.
callback.resource.release() done.
work.queue() done.
Promise created.
Returned value = 1042
```

Notice that the **order** of output is still incorrect:
It seems that `work.queue()` is still a **blocking** call, which is not our expectation.
