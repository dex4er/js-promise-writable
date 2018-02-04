'use strict'

const t = require('tap')
require('tap-given')(t)

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
chai.should()

const EventEmitter = require('events')
const semver = require('semver')

const PromiseWritable = require('../lib/promise-writable').PromiseWritable

class MockStream extends EventEmitter {
  constructor () {
    super()
    this.bytesWritten = 0
    this.writable = true
    this._buffer = Buffer.alloc(0)
    this._buffer2 = Buffer.alloc(0)
    this._corked = false
  }
  write (chunk) {
    if (this.closed) {
      return this.emit('error', new Error('writeAll after end'))
    }
    if (this._corked) {
      this._buffer2 = Buffer.concat([this._buffer2, chunk])
    } else {
      this._buffer = Buffer.concat([this._buffer, chunk])
      this.bytesWritten = this._buffer.length
    }
    return !chunk.toString().startsWith('pause')
  }
  close () {
    this.closed = true
  }
  destroy () {
    this.destroyed = true
  }
  cork () {
    this._corked = true
  }
  uncork () {
    this._corked = false
    this._buffer = Buffer.concat([this._buffer, this._buffer2])
    this._buffer2 = Buffer.alloc(0)
    this.bytesWritten = this._buffer.length
  }
  end () {}
}

class MockPromiseDuplex {
  constructor () {
    this._isPromiseDuplex = true
  }
}

Feature('Test promise-writable module', () => {
  Scenario('Write chunks to stream which does not pause', () => {
    let promise
    let promiseWritable
    let stream

    Given('Writable object', () => {
      stream = new MockStream()
    })

    And('PromiseWritable object', () => {
      promiseWritable = new PromiseWritable(stream)
    })

    When('I call write method', () => {
      promise = promiseWritable.write(Buffer.from('chunk1'))
    })

    Then('promise is fulfilled', () => {
      return promise.should.eventually.equal(6)
    })

    And('stream should contain this chunk', () => {
      stream._buffer.should.deep.equal(Buffer.from('chunk1'))
    })

    When('I call write method again', () => {
      promise = promiseWritable.write(Buffer.from('chunk2'))
    })

    Then('promise is fulfilled', () => {
      return promise.should.eventually.equal(6)
    })

    And('stream should contain another chunk', () => {
      stream._buffer.should.deep.equal(Buffer.from('chunk1chunk2'))
    })
  })

  Scenario('Write chunks to stream which pauses', () => {
    let promise
    let promiseWritable
    let stream

    Given('Writable object', () => {
      stream = new MockStream()
    })

    And('PromiseWritable object', () => {
      promiseWritable = new PromiseWritable(stream)
    })

    When('I call write method which pauses stream', () => {
      promise = promiseWritable.write(Buffer.from('pause1'))
    })

    And('drain event is emitted', () => {
      stream.emit('drain')
    })

    Then('promise is fulfilled', () => {
      return promise.should.eventually.equal(6)
    })

    And('stream should contain this chunk', () => {
      stream._buffer.should.deep.equal(Buffer.from('pause1'))
    })

    When('I call write method again', () => {
      promise = promiseWritable.write(Buffer.from('pause2'))
    })

    And('finish event is emitted', () => {
      stream.emit('finish')
    })

    Then('promise is fulfilled', () => {
      return promise.should.eventually.equal(6)
    })

    And('stream should contain another chunk', () => {
      stream._buffer.should.deep.equal(Buffer.from('pause1pause2'))
    })
  })

  Scenario('Write chunk to already closed stream', () => {
    let error
    let promiseWritable
    let stream

    Given('Writable object', () => {
      stream = new MockStream()
    })

    And('PromiseWritable object', () => {
      promiseWritable = new PromiseWritable(stream)
    })

    When('I call write method', () => {
      return promiseWritable.write(Buffer.from('chunk1'))
    })

    And('stream is closed', () => {
      stream.close()
    })

    And('I call write method again', () => {
      return promiseWritable.write(Buffer.from('chunk2')).catch((err) => {
        error = err
      })
    })

    Then('promise is rejected', () => {
      return error.should.be.an('error', 'write after end')
    })
  })

  Scenario('Write chunk to already destroyed stream', () => {
    let error
    let promiseWritable
    let stream

    Given('Writable object', () => {
      stream = new MockStream()
    })

    And('PromiseWritable object', () => {
      promiseWritable = new PromiseWritable(stream)
    })

    When('I call write method', () => {
      return promiseWritable.write(Buffer.from('chunk1'))
    })

    And('stream is destroyed', () => {
      stream.destroy()
    })

    And('I call write method again', () => {
      return promiseWritable.write(Buffer.from('chunk2')).catch((err) => {
        error = err
      })
    })

    Then('promise is rejected', () => {
      return error.should.be.an('error', 'write after end')
    })
  })

  Scenario('Write chunk to stream with error', () => {
    let promise
    let promiseWritable
    let stream

    Given('Writable object', () => {
      stream = new MockStream()
    })

    And('PromiseWritable object', () => {
      promiseWritable = new PromiseWritable(stream)
    })

    When('I call write method which pauses stream', () => {
      promise = promiseWritable.write(Buffer.from('pause1'))
    })

    And('error event is emitted', () => {
      stream.emit('error', new Error('boom'))
    })

    Then('promise is rejected', () => {
      return promise.should.be.rejectedWith(Error, 'boom')
    })
  })

  Scenario('Write chunk to stream with emitted error', () => {
    let promise
    let promiseWritable
    let stream

    Given('Writable object', () => {
      stream = new MockStream()
    })

    And('PromiseWritable object', () => {
      promiseWritable = new PromiseWritable(stream)
    })

    And('error event is emitted', () => {
      stream.emit('error', new Error('boom'))
    })

    When('I call write method which pauses stream', () => {
      promise = promiseWritable.write(Buffer.from('pause1'))
    })

    Then('promise is rejected', () => {
      return promise.should.be.rejectedWith(Error, 'boom')
    })
  })

  Scenario('Write all in one chunk', () => {
    let promise
    let promiseWritable
    let stream

    Given('Writable object', () => {
      stream = new MockStream()
    })

    And('PromiseWritable object', () => {
      promiseWritable = new PromiseWritable(stream)
    })

    When('I call writeAll method', () => {
      promise = promiseWritable.writeAll(Buffer.from('chunk1chunk2chunk3'))
    })

    And('finish event is emitted', () => {
      stream.emit('finish')
    })

    Then('promise is fulfilled', () => {
      return promise.should.eventually.equal(18)
    })

    And('stream should contain this chunk', () => {
      stream._buffer.should.deep.equal(Buffer.from('chunk1chunk2chunk3'))
    })
  })

  Scenario('Write all chunk by chunk in non paused mode', () => {
    let promise
    let promiseWritable
    let stream

    Given('Writable object', () => {
      stream = new MockStream()
    })

    And('PromiseWritable object', () => {
      promiseWritable = new PromiseWritable(stream)
    })

    When('I call writeAll method', () => {
      promise = promiseWritable.writeAll(Buffer.from('chunk1chunk2chunk3'), 6)
    })

    And('finish event is emitted', () => {
      stream.emit('finish')
    })

    Then('promise is fulfilled', () => {
      return promise.should.eventually.equal(18)
    })

    And('stream should contain this chunk', () => {
      stream._buffer.should.deep.equal(Buffer.from('chunk1chunk2chunk3'))
    })
  })

  Scenario('Write all chunk by chunk in paused mode', () => {
    let promise
    let promiseWritable
    let stream

    Given('Writable object', () => {
      stream = new MockStream()
    })

    And('PromiseWritable object', () => {
      promiseWritable = new PromiseWritable(stream)
    })

    When('I call writeAll method which pauses stream', () => {
      promise = promiseWritable.writeAll(Buffer.from('pause1pause2pause3'), 6)
    })

    for (let i = 1; i <= 3; i++) {
      And('drain event is emitted', () => {
        stream.emit('drain')
      })
    }

    And('finish event is emitted', () => {
      stream.emit('finish')
    })

    Then('promise is fulfilled', () => {
      return promise.should.eventually.equal(18)
    })

    And('stream should contain this chunk', () => {
      stream._buffer.should.deep.equal(Buffer.from('pause1pause2pause3'))
    })
  })

  Scenario('Write all to closed stream', () => {
    let promise
    let promiseWritable
    let stream

    Given('Writable object', () => {
      stream = new MockStream()
    })

    And('PromiseWritable object', () => {
      promiseWritable = new PromiseWritable(stream)
    })

    When('stream is closed', () => {
      stream.close()
    })

    And('I call writeAll method', () => {
      promise = promiseWritable.writeAll(Buffer.from('pause1pause2pause3'))
    })

    Then('promise is rejected', () => {
      return promise.should.be.rejectedWith(Error, 'writeAll after end')
    })
  })

  Scenario('Write all to destroyed stream', () => {
    let promise
    let promiseWritable
    let stream

    Given('Writable object', () => {
      stream = new MockStream()
    })

    And('PromiseWritable object', () => {
      promiseWritable = new PromiseWritable(stream)
    })

    When('stream is destroyed', () => {
      stream.destroy()
    })

    And('I call writeAll method', () => {
      promise = promiseWritable.writeAll(Buffer.from('pause1pause2pause3'))
    })

    Then('promise is rejected', () => {
      return promise.should.be.rejectedWith(Error, 'writeAll after end')
    })
  })

  Scenario('Write all to stream with error', () => {
    let promise
    let promiseWritable
    let stream

    Given('Writable object', () => {
      stream = new MockStream()
    })

    And('PromiseWritable object', () => {
      promiseWritable = new PromiseWritable(stream)
    })

    When('I call writeAll method which pauses stream', () => {
      promise = promiseWritable.writeAll(Buffer.from('pause1pause2pause3'))
    })

    And('error event is emitted', () => {
      stream.emit('error', new Error('boom'))
    })

    Then('promise is rejected', () => {
      return promise.should.be.rejectedWith(Error, 'boom')
    })
  })

  Scenario('Write all to stream with emitted error', () => {
    let promise
    let promiseWritable
    let stream

    Given('Writable object', () => {
      stream = new MockStream()
    })

    And('PromiseWritable object', () => {
      promiseWritable = new PromiseWritable(stream)
    })

    And('error event is emitted', () => {
      stream.emit('error', new Error('boom'))
    })

    When('I call writeAll method which pauses stream', () => {
      promise = promiseWritable.writeAll(Buffer.from('pause1pause2pause3'))
    })

    Then('promise is rejected', () => {
      return promise.should.be.rejectedWith(Error, 'boom')
    })
  })

  for (const event of ['open', 'close', 'pipe', 'unpipe', 'finish']) {
    Scenario(`Wait for ${event} from stream`, () => {
      let promise
      let promiseWritable
      let stream

      Given('Writable object', () => {
        stream = new MockStream()
      })

      And('PromiseWritable object', () => {
        promiseWritable = new PromiseWritable(stream)
      })

      When(`I call once('${event}') method`, () => {
        promise = promiseWritable.once(event)
      })

      And(`${event} event is emitted`, () => {
        stream.emit(event)
      })

      if (event !== 'finish') {
        Then('promise is fulfilled', () => {
          return promise.should.be.fulfilled
        })
      } else {
        Then('promise returns undefined', () => {
          return promise.should.eventually.be.undefined
        })
      }
    })

    Scenario(`Wait for ${event} from closed stream`, () => {
      let promise
      let promiseWritable
      let stream

      Given('Writable object', () => {
        stream = new MockStream()
      })

      And('PromiseWritable object', () => {
        promiseWritable = new PromiseWritable(stream)
      })

      When('stream is closed', () => {
        stream.close()
      })

      And(`I call once('${event}') method`, () => {
        promise = promiseWritable.once(event)
      })

      if (event === 'close') {
        Then('promise returns undefined', () => {
          return promise.should.eventually.be.undefined
        })
      } else {
        Then('promise is rejected', () => {
          return promise.should.be.rejectedWith(Error, `once ${event} after close`)
        })
      }
    })

    Scenario(`Wait for ${event} from stream with error`, () => {
      let promise
      let promiseWritable
      let stream

      Given('Writable object', () => {
        stream = new MockStream()
      })

      And('PromiseWritable object', () => {
        promiseWritable = new PromiseWritable(stream)
      })

      When(`I call once('${event}') method`, () => {
        promise = promiseWritable.once(event)
      })

      And('error event is emitted', () => {
        stream.emit('error', new Error('boom'))
      })

      Then('promise is rejected', () => {
        return promise.should.be.rejectedWith(Error, 'boom')
      })
    })
  }

  Scenario('Wait for error from stream with error', () => {
    let promise
    let promiseWritable
    let stream

    Given('Writable object', () => {
      stream = new MockStream()
    })

    And('PromiseWritable object', () => {
      promiseWritable = new PromiseWritable(stream)
    })

    When("I call once('error') method", () => {
      promise = promiseWritable.once('error')
    })

    And('error event is emitted', () => {
      stream.emit('error', new Error('boom'))
    })

    Then('promise is rejected', () => {
      return promise.should.be.rejectedWith(Error, 'boom')
    })
  })

  Scenario('Wait for error from stream with emitted error', () => {
    let promise
    let promiseWritable
    let stream

    Given('Writable object', () => {
      stream = new MockStream()
    })

    And('PromiseWritable object', () => {
      promiseWritable = new PromiseWritable(stream)
    })

    And('error event is emitted', () => {
      stream.emit('error', new Error('boom'))
    })

    When("I call once('error') method", () => {
      promise = promiseWritable.once('error')
    })

    Then('promise is rejected', () => {
      return promise.should.be.rejectedWith(Error, 'boom')
    })
  })

  Scenario('End the stream', () => {
    let promise
    let promiseWritable
    let stream

    Given('Writable object', () => {
      stream = new MockStream()
    })

    And('PromiseWritable object', () => {
      promiseWritable = new PromiseWritable(stream)
    })

    When('I call end method', () => {
      promise = promiseWritable.end()
    })

    And('finish event is emitted', () => {
      stream.emit('finish')
    })

    Then('promise is fulfilled', () => {
      return promise.should.be.fulfilled.and.ok
    })
  })

  Scenario('End the closed stream', () => {
    let promise
    let promiseWritable
    let stream

    Given('Writable object', () => {
      stream = new MockStream()
    })

    And('PromiseWritable object', () => {
      promiseWritable = new PromiseWritable(stream)
    })

    When('I call end method', () => {
      promiseWritable.end()
    })

    And('stream is closed', () => {
      stream.close()
    })

    And('I call end method', () => {
      promise = promiseWritable.end()
    })

    Then('promise is fulfilled', () => {
      return promise.should.be.fulfilled.and.ok
    })
  })

  Scenario('End the stream with error', () => {
    let promise
    let promiseWritable
    let stream

    Given('Writable object', () => {
      stream = new MockStream()
    })

    And('PromiseWritable object', () => {
      promiseWritable = new PromiseWritable(stream)
    })

    When('I call end method', () => {
      promise = promiseWritable.end()
    })

    And('error event is emitted', () => {
      stream.emit('error', new Error('boom'))
    })

    Then('promise is rejected', () => {
      return promise.should.be.rejectedWith(Error, 'boom')
    })
  })

  Scenario('End the stream with emitted error', () => {
    let promise
    let promiseWritable
    let stream

    Given('Writable object', () => {
      stream = new MockStream()
    })

    And('PromiseWritable object', () => {
      promiseWritable = new PromiseWritable(stream)
    })

    And('error event is emitted', () => {
      stream.emit('error', new Error('boom'))
    })

    When('I call end method', () => {
      promise = promiseWritable.end()
    })

    Then('promise is rejected', () => {
      return promise.should.be.rejectedWith(Error, 'boom')
    })
  })

  if (semver.gte(process.version, '6.11.3')) {
    Scenario('instanceof operator with MockStream class', () => {
      let stream

      Given('Writable object', () => {
        stream = new MockStream()
      })

      Then('other object is not an instance of PromiseWritable class', () => {
        stream.should.be.not.an.instanceof(PromiseWritable)
      })
    })

    Scenario('instanceof operator with PromiseWritable class', () => {
      let promiseWritable
      let stream

      Given('Writable object', () => {
        stream = new MockStream()
      })

      And('PromiseWritable object', () => {
        promiseWritable = new PromiseWritable(stream)
      })

      Then('PromiseWritable object is an instance of PromiseWritable class', () => {
        promiseWritable.should.be.an.instanceof(PromiseWritable)
      })
    })

    Scenario('instanceof operator with PromiseDuplex class', () => {
      let promiseDuplex
      let stream

      Given('Writable object', () => {
        stream = new MockStream()
      })

      And('PromiseWritable object', () => {
        promiseDuplex = new MockPromiseDuplex(stream)
      })

      Then('PromiseWritable object is an instance of PromiseWritable class', () => {
        promiseDuplex.should.be.an.instanceof(PromiseWritable)
      })
    })
  }
})
