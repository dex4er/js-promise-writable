import {expect} from "chai"

import {And, Feature, Given, Scenario, Then, When} from "./lib/steps"

import {MockStreamWritable} from "./lib/mock-stream-writable"

import {PromiseWritable} from "../src/promise-writable"

Feature("Test promise-writable module for once method", () => {
  for (const event of ["open", "close", "pipe", "unpipe", "finish"]) {
    Scenario(`Wait for ${event} from stream`, () => {
      let evented = false
      let promiseWritable: PromiseWritable<MockStreamWritable>
      let stream: MockStreamWritable

      Given("Writable object", () => {
        stream = new MockStreamWritable()
      })

      And("PromiseWritable object", () => {
        promiseWritable = new PromiseWritable(stream)
      })

      When(`I wait for "${event}" event`, () => {
        promiseWritable.once(event as any).then(() => {
          evented = true
        })
      })

      And(`"${event}" event is emitted`, () => {
        stream.emit(event)
      })

      Then("promise is fulfilled", () => {
        return expect(evented).to.be.true
      })
    })

    Scenario(`Wait for ${event} from closed stream`, () => {
      let error: Error
      let evented = false
      let promiseWritable: PromiseWritable<MockStreamWritable>
      let stream: MockStreamWritable

      Given("Writable object", () => {
        stream = new MockStreamWritable()
      })

      And("PromiseWritable object", () => {
        promiseWritable = new PromiseWritable(stream)
      })

      When("stream is closed", () => {
        stream.close()
      })

      And(`I wait for "${event}" event`, () => {
        promiseWritable
          .once(event as any)
          .then(() => {
            evented = true
          })
          .catch(err => {
            error = err
          })
      })

      if (event === "close") {
        Then("promise returns undefined", () => {
          return expect(evented).to.be.true
        })
      } else {
        Then("promise is rejected", () => {
          expect(error)
            .to.be.an("error")
            .with.property("message", `once ${event} after close`)
        })
      }
    })

    Scenario(`Wait for ${event} from stream with error`, () => {
      let error: Error
      let promiseWritable: PromiseWritable<MockStreamWritable>
      let stream: MockStreamWritable

      Given("Writable object", () => {
        stream = new MockStreamWritable()
      })

      And("PromiseWritable object", () => {
        promiseWritable = new PromiseWritable(stream)
      })

      When(`I wait for "${event}" event`, () => {
        promiseWritable.once(event as any).catch(err => {
          error = err
        })
      })

      And("error event is emitted", () => {
        stream.emit("error", new Error("boom"))
      })

      Then("promise is rejected", () => {
        expect(error)
          .to.be.an("error")
          .with.property("message", "boom")
      })
    })
  }
})
