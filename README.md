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

`PromiseWritable` object requires `Writable` object to work:

```js
const PromiseWritable = require('promise-writable')

const wstream = require('fs').createWriteStream('/tmp/test.txt')

const promiseWstream = new PromiseWritable(wstream)
```

Original stream is available with `stream` property:

```js
console.log(promiseWstream.stream.flags)
```

#### write

This method returns `Promise` which is fulfilled when stream accepted a
chunk (`write` method returned that stream is still writable or `drain` event
occured) or stream is ended (`finish` event).

```js
const chunk = await promiseWstream.write(new Buffer('foo'))
```

#### writeAll

This method returns `Promise` which is fulfilled when stream accepted a
content. This method writes the content chunk by chunk. The default chunk size
is 16 KiB.

```js
const content = await promiseWstream.writeAll(new Buffer('foobarbaz'), 3)
```

#### onceOpen

This method returns `Promise` which is fulfilled when stream is opened. File
descriptor is returned. It works only for
[`fd.WriteStream`](https://nodejs.org/api/fs.html#fs_class_fs_writestream)
streams. It returns `null` if stream was already ended.

```js
const fd = await promiseWstream.onceOpen()
process.stdin(promiseWstream.stream)
```

#### onceClose

This method returns `Promise` which is fulfilled when stream is closed.
`undefined` value is returned. It works only for
[`fd.WriteStream`](https://nodejs.org/api/fs.html#fs_class_fs_writestream)
streams. It returns `null` if stream was already ended.

```js
await promiseWstream.close()
```

#### oncePipe

This method returns `Promise` which is fulfilled when `pipe` method is called on
a readable stream, adding this writable to its set of destinations. It returns
source stream that is piping to this writable.

```js
const promise = promiseWstream.oncePipe()
process.stdin.pipe(promiseWstream.stream)
const rstream = await promise
```

#### onceUnpipe

This method returns `Promise` which is fulfilled when `unpipe` method is called
on a readable stream, removing this writable from its set of destinations. It
returns source stream that is unpiping this writable.

```js
const promise = promiseWstream.oncePipe()
process.stdin.pipe(promiseWstream.stream)
process.stdin.unpipe(promiseWstream.stream)
const rstream = await promise
```

#### onceFinish

This method returns `Promise` which is fulfilled when stream is ended. No value
is returned.

```js
await promiseWstream.onceFinish()
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
