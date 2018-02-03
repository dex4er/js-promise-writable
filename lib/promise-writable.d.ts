/// <reference types="node" />

import { Readable, Writable } from 'stream'

export class PromiseWritable<TWritable extends Writable> {
  readonly stream: TWritable

  constructor (stream: TWritable)

  write (chunk: string | Buffer, encoding?: string): Promise<number>
  writeAll (content: string | Buffer, chunkSize?: number): Promise<number>

  once (event: 'close' | 'error' | 'finish'): Promise<void>
  once (event: 'open'): Promise<number>
  once (event: 'pipe' | 'unpipe'): Promise<Readable>

  end (): Promise<void>

  destroy (): void
}

export default PromiseWritable
