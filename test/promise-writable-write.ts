import {expect} from "chai"

import {PromiseWritable} from "../src/promise-writable.js"

import {And, Feature, Given, Scenario, Then, When} from "./lib/steps.js"

import {MockStreamWritable} from "./lib/mock-stream-writable.js"

Feature("Test promise-writable module for write method", () => {
  Scenario("Write chunks to stream which does not pause", () => {
    let bytes: number
    let promiseWritable: PromiseWritable<MockStreamWritable>
    let stream: MockStreamWritable

    Given("Writable object", () => {
      stream = new MockStreamWritable()
    })

    And("PromiseWritable object", () => {
      promiseWritable = new PromiseWritable(stream)
    })

    When("I call write method", async () => {
      bytes = await promiseWritable.write(Buffer.from("chunk1"))
    })

    Then("promise is fulfilled", () => {
      expect(bytes).to.equal(6)
    })

    And("stream should contain this chunk", () => {
      expect(stream.buffer).be.deep.equal(Buffer.from("chunk1"))
    })

    When("I call write method again", async () => {
      bytes = await promiseWritable.write(Buffer.from("chunk2"))
    })

    Then("promise is fulfilled", () => {
      expect(bytes).to.equal(6)
    })

    And("stream should contain another chunk", () => {
      expect(stream.buffer).to.deep.equal(Buffer.from("chunk1chunk2"))
    })

    And("PromiseWritable object can be destroyed", () => {
      promiseWritable.destroy()
    })

    And("PromiseWritable object can be destroyed", () => {
      promiseWritable.destroy()
    })
  })

  Scenario("Write chunks to stream which pauses", () => {
    let bytes: number
    let promiseWritable: PromiseWritable<MockStreamWritable>
    let stream: MockStreamWritable

    Given("Writable object", () => {
      stream = new MockStreamWritable()
    })

    And("PromiseWritable object", () => {
      promiseWritable = new PromiseWritable(stream)
    })

    When("I call write method which pauses stream", () => {
      promiseWritable.write(Buffer.from("pause1")).then(argument => {
        bytes = argument
      })
    })

    And("drain event is emitted", () => {
      stream.emit("drain")
    })

    Then("promise is fulfilled", () => {
      expect(bytes).to.equal(6)
    })

    And("stream should contain this chunk", () => {
      expect(stream.buffer).to.deep.equal(Buffer.from("pause1"))
    })

    When("I call write method again", () => {
      promiseWritable.write(Buffer.from("pause2")).then(argument => {
        bytes = argument
      })
    })

    And("finish event is emitted", () => {
      stream.emit("finish")
    })

    Then("promise is fulfilled", () => {
      expect(bytes).to.equal(6)
    })

    And("stream should contain another chunk", () => {
      expect(stream.buffer).to.deep.equal(Buffer.from("pause1pause2"))
    })
  })

  Scenario("Write chunk to already closed stream", () => {
    let error: Error
    let promiseWritable: PromiseWritable<MockStreamWritable>
    let stream: MockStreamWritable

    Given("Writable object", () => {
      stream = new MockStreamWritable()
    })

    And("PromiseWritable object", () => {
      promiseWritable = new PromiseWritable(stream)
    })

    When("I call write method", () => promiseWritable.write(Buffer.from("chunk1")))

    And("stream is closed", () => {
      stream.close()
    })

    And("I call write method again", () =>
      promiseWritable.write(Buffer.from("chunk2")).catch(err => {
        error = err
      }),
    )

    Then("promise is rejected", () => {
      expect(error).to.be.an("error").with.property("message", "write after end")
    })
  })

  Scenario("Write chunk to already destroyed stream", () => {
    let error: Error
    let promiseWritable: PromiseWritable<MockStreamWritable>
    let stream: MockStreamWritable

    Given("Writable object", () => {
      stream = new MockStreamWritable()
    })

    And("PromiseWritable object", () => {
      promiseWritable = new PromiseWritable(stream)
    })

    When("I call write method", () => promiseWritable.write(Buffer.from("chunk1")))

    And("stream is destroyed", () => {
      stream.destroy()
    })

    And("I call write method again", () =>
      promiseWritable.write(Buffer.from("chunk2")).catch(err => {
        error = err
      }),
    )

    Then("promise is rejected", () => {
      expect(error).to.be.an("error").with.property("message", "write after end")
    })

    And("PromiseWritable object can be destroyed", () => {
      promiseWritable.destroy()
    })

    And("PromiseWritable object can be destroyed", () => {
      promiseWritable.destroy()
    })
  })

  Scenario("Write chunk to stream with error", () => {
    let error: Error
    let promiseWritable: PromiseWritable<MockStreamWritable>
    let stream: MockStreamWritable

    Given("Writable object", () => {
      stream = new MockStreamWritable()
    })

    And("PromiseWritable object", () => {
      promiseWritable = new PromiseWritable(stream)
    })

    When("I call write method which pauses stream", () => {
      promiseWritable.write(Buffer.from("pause1")).catch(err => {
        error = err
      })
    })

    And("error event is emitted", () => {
      stream.emit("error", new Error("boom"))
    })

    Then("promise is rejected", () => {
      expect(error).to.be.an("error").with.property("message", "boom")
    })

    And("PromiseWritable object can be destroyed", () => {
      promiseWritable.destroy()
    })

    And("PromiseWritable object can be destroyed", () => {
      promiseWritable.destroy()
    })
  })

  Scenario("Write chunk to stream with emitted error", () => {
    let error: Error
    let promiseWritable: PromiseWritable<MockStreamWritable>
    let stream: MockStreamWritable

    Given("Writable object", () => {
      stream = new MockStreamWritable()
    })

    And("PromiseWritable object", () => {
      promiseWritable = new PromiseWritable(stream)
    })

    And("error event is emitted", () => {
      stream.emit("error", new Error("boom"))
    })

    When("I call write method which pauses stream", () => {
      promiseWritable.write(Buffer.from("pause1")).catch(err => {
        error = err
      })
    })

    Then("promise is rejected", () => {
      expect(error).to.be.an("error").with.property("message", "boom")
    })
  })
})
