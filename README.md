## promise-writable

[![Build Status](https://secure.travis-ci.org/dex4er/js-promise-writable.svg)](http://travis-ci.org/dex4er/js-promise-writable) [![Coverage Status](https://coveralls.io/repos/github/dex4er/js-promise-writable/badge.svg)](https://coveralls.io/github/dex4er/js-promise-writable) [![npm](https://img.shields.io/npm/v/promise-writable.svg)](https://www.npmjs.com/package/promise-writable)

This module allows to convert
[`Writable`](https://nodejs.org/api/stream.html#stream_class_stream_writable)
stream into its promisified version, which returns [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
object fulfilled when
[`open`](https://nodejs.org/api/fs.html#fs_event_open),
[`close`](https://nodejs.org/api/fs.html#fs_event_close),
[`pipe`](https://nodejs.org/api/stream.html#stream_event_pipe),
[`unpipe`](https://nodejs.org/api/stream.html#stream_event_unpipe),
[`finish`](https://nodejs.org/api/stream.html#stream_event_finish) or
[`error`](https://nodejs.org/api/stream.html#stream_event_error) events
occurred.

### Requirements

This module requires Node >= 4.

### Installation

```shell
npm install promise-writable
```

### Usage

#### constructor(stream)

`PromiseWritable` object requires `Writable` object to work:

```js
const PromiseWritable = require('promise-writable')

const fs = require('fs')
const wstream = fs.createWriteStream('/tmp/test.txt')

const promiseWstream = new PromiseWritable(wstream)
```

Original stream is available with `stream` property:

```js
console.log(promiseWstream.stream.flags)
```

#### write(chunk)

This method returns `Promise` which is fulfilled when stream accepted a
chunk (`write` method returned that stream is still writable or `drain` event
occured) or stream is ended (`finish` event).

```js
const chunk = await promiseWstream.write(new Buffer('foo'))
```

#### writeAll(data)

This method returns `Promise` which is fulfilled when stream accepted a
content. This method writes the content chunk by chunk. The default chunk size
is 16 KiB.

```js
const content = await promiseWstream.writeAll(new Buffer('foobarbaz'), 3)
```

#### once(event)

This method returns `Promise` which is fulfilled when stream emits `event`. The
result of this event is returned or `null` value if stream is already finished.

```js
const fd = await promiseWstream.once('open')
process.stdin(promiseWstream.stream)

await promiseWstream.once('close')

const promise = promiseWstream.once('pipe')
process.stdin.pipe(promiseWstream.stream)
const src = await promise

const promise = promiseWstream.once('unpipe')
process.stdin.unpipe(promiseWstream.stream)
const src = await promise
```

#### end()

This method ends the stream and returns `Promise` which is fulfilled when stream
is finished. No value is returned.

```js
await promiseWstream.end()
```

### Promise

This module uses [any-promise](https://www.npmjs.com/package/any-promise) and
any ES6 Promise library or polyfill is supported.

Ie. [bluebird](https://www.npmjs.com/package/bluebird) can be used as Promise
library for this module, if it is registered before.

```js
require('any-promise/register/bluebird')
const PromiseWritable = require('promise-writable')
```

### License

Copyright (c) 2017 Piotr Roszatycki <piotr.roszatycki@gmail.com>

[MIT](https://opensource.org/licenses/MIT)
