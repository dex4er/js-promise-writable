'use strict'

const t = require('tap')
require('tap-given')(t)

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
chai.should()

Feature('Test promise-writable module', () => {
  const PromiseWritable = require('../lib/promise-writable')
  const EventEmitter = require('events')

  class MockStream extends EventEmitter {
    constructor () {
      super()
      this.writable = true
      this._buffer = Buffer.alloc(0)
    }
    write (chunk) {
      this._buffer = Buffer.concat([this._buffer, chunk])
      return !chunk.toString().startsWith('pause')
    }
    end () { }
  }

  Scenario('Write chunks to stream which doesn not pause', () => {
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
      return promise.should.be.fulfilled.and.ok
    })

    And('stream should contain this chunk', () => {
      stream._buffer.should.deep.equal(Buffer.from('chunk1'))
    })

    When('I call write method again', () => {
      promise = promiseWritable.write(Buffer.from('chunk2'))
    })

    Then('promise is fulfilled', () => {
      return promise.should.be.fulfilled.and.ok
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
      return promise.should.be.fulfilled.and.ok
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
      return promise.should.be.fulfilled.and.ok
    })

    And('stream should contain another chunk', () => {
      stream._buffer.should.deep.equal(Buffer.from('pause1pause2'))
    })
  })

  Scenario('Write chunk to already finished stream', () => {
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
      promiseWritable.write(Buffer.from('pause1'))
    })

    And('finish event is emitted', () => {
      stream.emit('finish')
    })

    And('I call write method again', () => {
      promise = promiseWritable.write(Buffer.from('pause2'))
    })

    And('error event is emitted', () => {
      stream.emit('error', new Error('write after end'))
    })

    Then('promise is rejected', () => {
      return promise.should.be.rejectedWith(Error, 'write after end')
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
      return promise.should.be.fulfilled.and.ok
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
      return promise.should.be.fulfilled.and.ok
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
      return promise.should.be.fulfilled.and.ok
    })

    And('stream should contain this chunk', () => {
      stream._buffer.should.deep.equal(Buffer.from('pause1pause2pause3'))
    })
  })

  Scenario('Write all to finished stream', () => {
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

    When('finish event is emitted', () => {
      stream.emit('finish')
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
        stream.emit(event, 'result')
      })

      if (event !== 'finish') {
        Then('promise is fulfilled', () => {
          return promise.should.eventually.equal('result')
        })
      } else {
        Then('promise returns null', () => {
          return promise.should.eventually.be.null
        })
      }
    })

    Scenario(`Wait for ${event} from finished stream`, () => {
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

      And('finish event is emitted', () => {
        stream.emit('finish')
      })

      Then('promise returns null', () => {
        return promise.should.eventually.be.null
      })

      When(`I call ${event} method`, () => {
        promise = promiseWritable.once(event)
      })

      if (event !== 'finish') {
        Then('promise is rejected', () => {
          return promise.should.be.rejectedWith(Error, `once ${event} after end`)
        })
      } else {
        Then('promise is fulfilled', () => {
          return promise.should.eventually.be.null
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

  Scenario('Wait for error from stream without error', () => {
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

    And('finish event is emitted', () => {
      stream.emit('finish')
    })

    Then('promise returns null', () => {
      return promise.should.eventually.be.null
    })
  })

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

  Scenario('End the ended stream', () => {
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

    And('finish event is emitted', () => {
      stream.emit('finish')
    })

    And('I call end method', () => {
      promise = promiseWritable.end()
    })

    And('finish event is emitted', () => {
      stream.emit('finish')
    })

    Then('promise is fulfilled', () => {
      return promise.should.be.fulfilled.and.ok
    })

    When('I call end method', () => {
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
})
