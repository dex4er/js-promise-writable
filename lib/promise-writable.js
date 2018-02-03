'use strict'

class PromiseWritable {
  constructor (stream) {
    this.stream = stream
    this._isPromiseWritable = true

    this._errorHandler = (err) => {
      this._errored = err
    }

    stream.on('error', this._errorHandler)
  }

  static [Symbol.hasInstance] (instance) {
    return instance._isPromiseWritable || instance._isPromiseDuplex
  }

  write (chunk, encoding) {
    const stream = this.stream

    return new Promise((resolve, reject) => {
      if (this._errored) {
        const err = this._errored
        delete this._errored
        return reject(err)
      }

      if (!stream.writable || stream.closed || stream.destroyed) {
        return reject(new Error(`write after end`))
      }

      const errorHandler = (err) => {
        delete this._errored
        reject(err)
      }

      stream.once('error', errorHandler)

      if (stream.write(chunk)) {
        stream.removeListener('error', errorHandler)
        if (!this._errored) {
          resolve(chunk.length)
        }
      } else {
        const drainHandler = () => {
          stream.removeListener('close', closeHandler)
          stream.removeListener('finish', finishHandler)
          stream.removeListener('error', errorHandler)
          resolve(chunk.length)
        }

        const closeHandler = () => {
          stream.removeListener('drain', drainHandler)
          stream.removeListener('error', errorHandler)
          stream.removeListener('finish', finishHandler)
          resolve(chunk.length)
        }

        const finishHandler = () => {
          stream.removeListener('close', closeHandler)
          stream.removeListener('drain', drainHandler)
          stream.removeListener('error', errorHandler)
          resolve(chunk.length)
        }

        stream.once('close', closeHandler)
        stream.once('drain', drainHandler)
        stream.once('finish', finishHandler)
      }
    })
  }

  writeAll (content, chunkSize) {
    chunkSize = chunkSize || 64 * 1024

    const stream = this.stream

    return new Promise((resolve, reject) => {
      if (this._errored) {
        const err = this._errored
        delete this._errored
        return reject(err)
      }

      if (!stream.writable || stream.closed || stream.destroyed) {
        return reject(new Error(`writeAll after end`))
      }

      let part = 0

      const drainHandler = () => {
        while (stream.writable && !this._errored && part * chunkSize < content.length) {
          const chunk = content.slice(part * chunkSize, ++part * chunkSize)
          stream.write(chunk)
          if (part * chunkSize >= content.length) {
            stream.end()
          }
        }
      }

      const closeHandler = () => {
        stream.removeListener('drain', drainHandler)
        stream.removeListener('error', errorHandler)
        stream.removeListener('finish', finishHandler)
        resolve(stream.bytesWritten || 0)
      }

      const finishHandler = () => {
        stream.removeListener('close', closeHandler)
        stream.removeListener('drain', drainHandler)
        stream.removeListener('error', errorHandler)
        resolve(stream.bytesWritten || 0)
      }

      const errorHandler = (err) => {
        delete this._errored
        stream.removeListener('close', closeHandler)
        stream.removeListener('finish', finishHandler)
        stream.removeListener('error', errorHandler)
        reject(err)
      }

      stream.on('drain', drainHandler)
      stream.once('close', closeHandler)
      stream.once('finish', finishHandler)
      stream.once('error', errorHandler)

      drainHandler()
    })
  }

  once (event) {
    const stream = this.stream

    return new Promise((resolve, reject) => {
      if (this._errored) {
        const err = this._errored
        delete this._errored
        return reject(err)
      }

      if (this._errored) {
        return reject(this._errored)
      } else if (stream.closed) {
        if (event === 'close') {
          return resolve()
        } else {
          return reject(new Error(`once ${event} after close`))
        }
      } else if (stream.destroyed) {
        if (event === 'close' || event === 'finish') {
          return resolve()
        } else {
          return reject(new Error(`once ${event} after destroy`))
        }
      }

      const closeHandler = () => {
        if (eventHandler) {
          stream.removeListener(event, eventHandler)
        }
        stream.removeListener('error', errorHandler)
        if (finishHandler) {
          stream.removeListener('finish', finishHandler)
        }
        resolve()
      }

      const eventHandler = event !== 'close' && event !== 'finish' && event !== 'error' ? (argument) => {
        stream.removeListener('close', closeHandler)
        stream.removeListener('error', errorHandler)
        if (finishHandler) {
          stream.removeListener('finish', finishHandler)
        }
        resolve(argument)
      } : undefined

      const errorHandler = (err) => {
        delete this._errored
        if (eventHandler) {
          stream.removeListener(event, eventHandler)
        }
        stream.removeListener('close', closeHandler)
        if (finishHandler) {
          stream.removeListener('finish', finishHandler)
        }
        reject(err)
      }

      const finishHandler = event !== 'close' ? () => {
        if (eventHandler) {
          stream.removeListener(event, eventHandler)
        }
        stream.removeListener('close', closeHandler)
        stream.removeListener('error', errorHandler)
        resolve()
      } : undefined

      if (eventHandler) {
        stream.once(event, eventHandler)
      }
      stream.once('close', closeHandler)
      if (finishHandler) {
        stream.once('finish', finishHandler)
      }
      stream.once('error', errorHandler)
    })
  }

  end () {
    const stream = this.stream

    return new Promise((resolve, reject) => {
      if (this._errored) {
        const err = this._errored
        delete this._errored
        return reject(err)
      }

      if (!stream.writable || stream.closed || stream.destroyed) {
        return resolve()
      }

      const finishHandler = () => {
        stream.removeListener('error', errorHandler)
        resolve()
      }

      const errorHandler = (err) => {
        delete this._errored
        stream.removeListener('finish', finishHandler)
        reject(err)
      }

      stream.once('finish', finishHandler)
      stream.once('error', errorHandler)

      stream.end()
    })
  }

  destroy () {
    this.stream.removeListener('error', this._errorHandler)
    if (typeof this.stream.destroy === 'function') {
      this.stream.destroy()
    }
    delete this.stream
  }
}

PromiseWritable.PromiseWritable = PromiseWritable
PromiseWritable.default = PromiseWritable

module.exports = PromiseWritable
