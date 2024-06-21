import {Duplex} from "node:stream"

import {MockPromiseReadable} from "./mock-promise-readable.js"

export class MockPromiseDuplex<TDuplex extends Duplex> extends MockPromiseReadable<TDuplex> {
  readonly _isPromiseWritable: boolean = true
  constructor(readonly stream: TDuplex) {
    super(stream as any)
  }
}
