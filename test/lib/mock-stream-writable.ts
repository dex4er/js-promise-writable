import {Writable} from "stream"

export class MockStreamWritable extends Writable {
  writable = true

  closed = false
  destroyed = false

  corked = false

  bytesWritten = 0

  buffer = Buffer.alloc(0)
  buffer2 = Buffer.alloc(0)

  write(chunk: any, cb?: (error: Error | null | undefined) => void): boolean
  write(chunk: any, encoding: string, cb?: (error: Error | null | undefined) => void): boolean
  write(chunk: any, _arg2?: any, _arg3?: any): boolean {
    let cb: ((error?: Error | null) => void) | undefined
    if (typeof _arg2 === "function") {
      cb = _arg2
    } else if (typeof _arg3 === "function") {
      cb = _arg3
    }
    if (this.closed) {
      const error = new Error("writeAll after end")
      if (cb) {
        cb(error)
      }
      this.emit("error", error)
      return true
    }
    if (this.corked) {
      this.buffer2 = Buffer.concat([this.buffer2, chunk])
    } else {
      this.buffer = Buffer.concat([this.buffer, chunk])
    }
    this.bytesWritten = this.buffer.length + this.buffer2.length
    if (chunk.toString().startsWith("pause")) {
      return false
    } else {
      if (cb) {
        cb()
      }
      return true
    }
  }
  close(): void {
    this.closed = true
  }
  destroy(): void {
    this.destroyed = true
  }
  cork(): void {
    this.corked = true
  }
  uncork(): void {
    this.corked = false
    this.buffer = Buffer.concat([this.buffer, this.buffer2])
    this.buffer2 = Buffer.alloc(0)
    this.bytesWritten = this.buffer.length
  }
  end(): void {
    // noop
  }
}
