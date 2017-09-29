export class PromiseWritable {
  readonly stream: NodeJS.WritableStream

  constructor (stream: NodeJS.WritableStream)

  write (chunk: string | Buffer, encoding?: string): Promise<number>
  writeAll (content: string | Buffer, chunkSize?: number): Promise<number>

  once (event: 'close'): Promise<void>
  once (event: 'error'): Promise<void>
  once (event: 'finish'): Promise<void>
  once (event: 'open'): Promise<number>
  once (event: 'pipe'): Promise<NodeJS.ReadableStream>
  once (event: 'unpipe'): Promise<NodeJS.ReadableStream>

  end (): Promise<void>
}

export default PromiseWritable
