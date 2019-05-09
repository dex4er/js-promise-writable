import {expect} from 'chai'
import semver from 'semver'
import {PassThrough} from 'stream'

import {And, Feature, Given, Scenario, Then} from './lib/steps'

import {MockPromiseDuplex} from './lib/mock-promise-duplex'
import {MockStreamWritable} from './lib/mock-stream-writable'

import {PromiseWritable} from '../src/promise-writable'

if (semver.gte(process.version, '6.11.3')) {
  Feature('Test promise-writable module with instanceof operator', () => {
    Scenario('instanceof operator with MockStream class', () => {
      let stream: MockStreamWritable

      Given('Writable object', () => {
        stream = new MockStreamWritable()
      })

      Then('other object is not an instance of PromiseWritable class', () => {
        expect(stream).to.be.not.an.instanceof(PromiseWritable)
      })
    })

    Scenario('instanceof operator with PromiseWritable class', () => {
      let promiseWritable: PromiseWritable<MockStreamWritable>
      let stream: MockStreamWritable

      Given('Writable object', () => {
        stream = new MockStreamWritable()
      })

      And('PromiseWritable object', () => {
        promiseWritable = new PromiseWritable(stream)
      })

      Then('PromiseWritable object is an instance of PromiseWritable class', () => {
        expect(promiseWritable).to.be.an.instanceof(PromiseWritable)
      })
    })

    Scenario('instanceof operator with PromiseDuplex class', () => {
      let promiseDuplex: MockPromiseDuplex<PassThrough>
      let stream: PassThrough

      Given('Duplex object', () => {
        stream = new PassThrough()
      })

      And('PromiseDuplex object', () => {
        promiseDuplex = new MockPromiseDuplex(stream)
      })

      Then('PromiseDuplex object is an instance of PromiseWritable class', () => {
        expect(promiseDuplex).to.be.an.instanceof(PromiseWritable)
      })
    })
  })
}
