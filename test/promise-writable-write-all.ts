import {expect} from 'chai'

import {And, Feature, Given, Scenario, Then, When} from './lib/steps'

import {MockStreamWritable} from './lib/mock-stream-writable'

import {PromiseWritable} from '../src/promise-writable'

Feature('Test promise-writable module for writeAll method', () => {
  Scenario('Write all in one chunk', () => {
    let bytes: number
    let promiseWritable: PromiseWritable<MockStreamWritable>
    let stream: MockStreamWritable

    Given('Writable object', () => {
      stream = new MockStreamWritable()
    })

    And('PromiseWritable object', () => {
      promiseWritable = new PromiseWritable(stream)
    })

    When('I call writeAll method', () => {
      promiseWritable.writeAll(Buffer.from('chunk1chunk2chunk3')).then(argument => {
        bytes = argument
      })
    })

    And('finish event is emitted', () => {
      stream.emit('finish')
    })

    Then('promise is fulfilled', () => {
      return expect(bytes).to.equal(18)
    })

    And('stream should contain this chunk', () => {
      expect(stream.buffer).to.deep.equal(Buffer.from('chunk1chunk2chunk3'))
    })
  })

  Scenario('Write all chunk by chunk in non paused mode', () => {
    let bytes: number
    let promiseWritable: PromiseWritable<MockStreamWritable>
    let stream: MockStreamWritable

    Given('Writable object', () => {
      stream = new MockStreamWritable()
    })

    And('PromiseWritable object', () => {
      promiseWritable = new PromiseWritable(stream)
    })

    When('I call writeAll method', () => {
      promiseWritable.writeAll(Buffer.from('chunk1chunk2chunk3'), 6).then(argument => {
        bytes = argument
      })
    })

    And('finish event is emitted', () => {
      stream.emit('finish')
    })

    Then('promise is fulfilled', () => {
      return expect(bytes).to.equal(18)
    })

    And('stream should contain this chunk', () => {
      expect(stream.buffer).to.deep.equal(Buffer.from('chunk1chunk2chunk3'))
    })
  })

  Scenario('Write all chunk by chunk in paused mode', () => {
    let bytes: number
    let promiseWritable: PromiseWritable<MockStreamWritable>
    let stream: MockStreamWritable

    Given('Writable object', () => {
      stream = new MockStreamWritable()
    })

    And('PromiseWritable object', () => {
      promiseWritable = new PromiseWritable(stream)
    })

    When('I call writeAll method which pauses stream', () => {
      promiseWritable.writeAll(Buffer.from('pause1pause2pause3'), 6).then(argument => {
        bytes = argument
      })
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
      return expect(bytes).to.equal(18)
    })

    And('stream should contain this chunk', () => {
      expect(stream.buffer).to.deep.equal(Buffer.from('pause1pause2pause3'))
    })
  })

  Scenario('Write all to closed stream', () => {
    let error: Error
    let promiseWritable: PromiseWritable<MockStreamWritable>
    let stream: MockStreamWritable

    Given('Writable object', () => {
      stream = new MockStreamWritable()
    })

    And('PromiseWritable object', () => {
      promiseWritable = new PromiseWritable(stream)
    })

    When('stream is closed', () => {
      stream.close()
    })

    And('I call writeAll method', () => {
      promiseWritable.writeAll(Buffer.from('pause1pause2pause3')).catch(err => {
        error = err
      })
    })

    Then('promise is rejected', () => {
      expect(error)
        .to.be.an('error')
        .with.property('message', 'writeAll after end')
    })
  })

  Scenario('Write all to destroyed stream', () => {
    let error: Error
    let promiseWritable: PromiseWritable<MockStreamWritable>
    let stream: MockStreamWritable

    Given('Writable object', () => {
      stream = new MockStreamWritable()
    })

    And('PromiseWritable object', () => {
      promiseWritable = new PromiseWritable(stream)
    })

    When('stream is destroyed', () => {
      stream.destroy()
    })

    And('I call writeAll method', () => {
      promiseWritable.writeAll(Buffer.from('pause1pause2pause3')).catch(err => {
        error = err
      })
    })

    Then('promise is rejected', () => {
      expect(error)
        .to.be.an('error')
        .with.property('message', 'writeAll after end')
    })
  })

  Scenario('Write all to stream with error', () => {
    let error: Error
    let promiseWritable: PromiseWritable<MockStreamWritable>
    let stream: MockStreamWritable

    Given('Writable object', () => {
      stream = new MockStreamWritable()
    })

    And('PromiseWritable object', () => {
      promiseWritable = new PromiseWritable(stream)
    })

    When('I call writeAll method which pauses stream', () => {
      promiseWritable.writeAll(Buffer.from('pause1pause2pause3')).catch(err => {
        error = err
      })
    })

    And('error event is emitted', () => {
      stream.emit('error', new Error('boom'))
    })

    Then('promise is rejected', () => {
      expect(error)
        .to.be.an('error')
        .with.property('message', 'boom')
    })
  })

  Scenario('Write all to stream with emitted error', () => {
    let error: Error
    let promiseWritable: PromiseWritable<MockStreamWritable>
    let stream: MockStreamWritable

    Given('Writable object', () => {
      stream = new MockStreamWritable()
    })

    And('PromiseWritable object', () => {
      promiseWritable = new PromiseWritable(stream)
    })

    And('error event is emitted', () => {
      stream.emit('error', new Error('boom'))
    })

    When('I call writeAll method which pauses stream', () => {
      promiseWritable.writeAll(Buffer.from('pause1pause2pause3')).catch(err => {
        error = err
      })
    })

    Then('promise is rejected', () => {
      expect(error)
        .to.be.an('error')
        .with.property('message', 'boom')
    })
  })
})
