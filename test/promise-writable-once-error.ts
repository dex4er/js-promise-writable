import {expect} from "chai"

import {And, Feature, Given, Scenario, Then, When} from "./lib/steps"

import {MockStreamWritable} from "./lib/mock-stream-writable"

import {PromiseWritable} from "../src/promise-writable"

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
      expect(error)
        .to.be.an("error")
        .with.property("message", "boom")
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
      expect(error)
        .to.be.an("error")
        .with.property("message", "boom")
    })
  })
})
