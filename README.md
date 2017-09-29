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

#### constructor

```js
const promiseWritable = new PromiseWritable(stream)
```

`PromiseWritable` object requires `Writable` object to work.

_Example:_

```js
const { PromiseWritable } = require('promise-writable')
const { createWriteStream } = require('fs')

const stream = createWriteStream('/tmp/test.txt')
const promiseWritable = new PromiseWritable(stream)
```

_Typescript:_

```ts
import { PromiseWritable } from 'promise-writable'
import { createWriteStream } from 'fs'

const stream = createWriteStream('/tmp/test.txt')
const promiseWritable = new PromiseWritable(stream)
```

#### stream

```js
const stream = promiseWritable.stream
```

Original stream object.

_Example:_

```js
console.log(promiseWritable.stream.flags)
```

#### write

```js
const written = await promiseWritable.write(chunk)
```

This method returns `Promise` which is fulfilled when stream accepted a
chunk (`write` method returned that stream is still writable or `drain` event
occured) or stream is ended (`finish` event).

Promise resolves to number of written bytes.

_Example:_

```js
const written = await promiseWritable.write(new Buffer('foo'))
```

#### writeAll

```js
const total = await promiseWritable.writeAll(content, chunkSize)
```

This method returns `Promise` which is fulfilled when stream accepted a
content. This method writes the content chunk by chunk. The default chunk size
is 64 KiB.

Promise resolves to number of written bytes.

_Example:_

```js
const total = await promiseWritable.writeAll(new Buffer('foobarbaz'), 3)
```

#### once

```js
await promiseWritable.once(event)
```

This method returns `Promise` which is fulfilled when stream emits `event`. The
result of this event is returned or `undefined` value if stream is already
finished.

_Example:_

```js
const fd = await promiseWritable.once('open')
process.stdin(promiseWritable.stream)

await promiseWritable.once('close')

const promise = promiseWritable.once('pipe')
process.stdin.pipe(promiseWritable.stream)
const src = await promise

const promise = promiseWritable.once('unpipe')
process.stdin.unpipe(promiseWritable.stream)
const src = await promise
```

#### end

```js
await promiseWritable.end()
```

This method ends the stream and returns `Promise` which is fulfilled when stream
is finished. No value is returned.

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
