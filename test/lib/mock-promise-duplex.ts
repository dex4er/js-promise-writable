import {Duplex} from 'stream'

import {PromiseWritable} from '../../src/promise-writable'

import {MockPromiseReadable} from './mock-promise-readable'

export class MockPromiseDuplex<TDuplex extends Duplex> extends MockPromiseReadable<TDuplex>
  implements PromiseWritable<TDuplex> {
  readonly isPromiseWritable: boolean = true
  constructor(readonly stream: TDuplex) {
    super(stream as any)
  }
  async write(_chunk: string | Buffer, _encoding?: string): Promise<number> {
    return 0
  }
  async writeAll(_content: string | Buffer, _chunkSize: number = 64 * 1024): Promise<number> {
    return 0
  }
  once(event: 'close' | 'error' | 'finish'): Promise<void>
  once(event: 'open'): Promise<number>
  once(event: 'pipe' | 'unpipe'): Promise<NodeJS.ReadableStream>
  async once(_event: string): Promise<void | number | NodeJS.ReadableStream> {
    return
  }
  async end(): Promise<void> {
    return
  }
  destroy(): void {
    return
  }
}
