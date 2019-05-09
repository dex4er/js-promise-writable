export class MockPromiseReadable<TReadable extends NodeJS.ReadableStream> {
  isPromiseReadable = true
  constructor(readonly stream: TReadable) {}
}
