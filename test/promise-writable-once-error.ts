import {expect} from "chai"

import {PromiseWritable} from "../src/promise-writable.js"

import {And, Feature, Given, Scenario, Then, When} from "./lib/steps.js"

import {MockStreamWritable} from "./lib/mock-stream-writable.js"

Feature('Test promise-writable module for once("error") method', () => {
  Scenario("Wait for error from stream with error", () => {
    let error: Error
    let promiseWritable: PromiseWritable<MockStreamWritable>
    let stream: MockStreamWritable

    Given("Writable object", () => {
      stream = new MockStreamWritable()
    })

    And("PromiseWritable object", () => {
      promiseWritable = new PromiseWritable(stream)
    })

    When("I call once('error') method", () => {
      promiseWritable.once("error").catch(err => {
        error = err
      })
    })

    And("error event is emitted", () => {
      stream.emit("error", new Error("boom"))
    })

    Then("promise is rejected", () => {
      expect(error).to.be.an("error").with.property("message", "boom")
    })
  })

  Scenario("Wait for error from stream with emitted error", () => {
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

    When("I call once('error') method", () => {
      promiseWritable.once("error").catch(err => {
        error = err
      })
    })

    Then("promise is rejected", () => {
      expect(error).to.be.an("error").with.property("message", "boom")
    })
  })
})
