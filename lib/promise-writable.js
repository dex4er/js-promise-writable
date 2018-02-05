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

    let rejected = false

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
        rejected = true
        reject(err)
      }

      stream.once('error', errorHandler)

      const canWrite = stream.write(chunk)
      stream.removeListener('error', errorHandler)

      if (canWrite) {
        if (!rejected) {
          resolve(chunk.length)
        }
      } else {
        const errorHandler = (err) => {
          delete this._errored
          removeListeners()
          reject(err)
        }

        const drainHandler = () => {
          removeListeners()
          resolve(chunk.length)
        }

        const closeHandler = () => {
          removeListeners()
          resolve(chunk.length)
        }

        const finishHandler = () => {
          removeListeners()
          resolve(chunk.length)
        }

        const removeListeners = () => {
          stream.removeListener('close', closeHandler)
          stream.removeListener('drain', drainHandler)
          stream.removeListener('error', errorHandler)
          stream.removeListener('finish', finishHandler)
        }

        stream.on('close', closeHandler)
        stream.on('drain', drainHandler)
        stream.on('error', errorHandler)
        stream.on('finish', finishHandler)
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

      const closeHandler = () => {
        removeListeners()
        resolve(stream.bytesWritten || 0)
      }

      const drainHandler = () => {
        stream.cork()
        while (stream.writable && !this._errored && part * chunkSize < content.length) {
          const chunk = content.slice(part * chunkSize, ++part * chunkSize)
          const canWrite = stream.write(chunk)
          if (part * chunkSize >= content.length) {
            stream.end()
          }
          if (!canWrite) {
            break
          }
        }
        stream.uncork()
      }

      const errorHandler = (err) => {
        delete this._errored
        removeListeners()
        reject(err)
      }

      const finishHandler = () => {
        removeListeners()
        resolve(stream.bytesWritten || 0)
      }

      const removeListeners = () => {
        stream.removeListener('close', closeHandler)
        stream.removeListener('drain', drainHandler)
        stream.removeListener('error', errorHandler)
        stream.removeListener('finish', finishHandler)
      }

      stream.on('drain', drainHandler)
      stream.on('close', closeHandler)
      stream.on('finish', finishHandler)
      stream.on('error', errorHandler)

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
        removeListeners()
        resolve()
      }

      const eventHandler = event !== 'close' && event !== 'finish' && event !== 'error' ? (argument) => {
        removeListeners()
        resolve(argument)
      } : undefined

      const errorHandler = (err) => {
        delete this._errored
        removeListeners()
        reject(err)
      }

      const finishHandler = event !== 'close' ? () => {
        removeListeners()
        resolve()
      } : undefined

      const removeListeners = () => {
        if (eventHandler) {
          stream.once(event, eventHandler)
        }
        stream.removeListener('close', closeHandler)
        stream.removeListener('error', errorHandler)
        if (finishHandler) {
          stream.removeListener('finish', finishHandler)
        }
      }

      if (eventHandler) {
        stream.on(event, eventHandler)
      }
      stream.on('close', closeHandler)
      stream.on('error', errorHandler)
      if (finishHandler) {
        stream.on('finish', finishHandler)
      }
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
        removeListeners()
        resolve()
      }

      const errorHandler = (err) => {
        delete this._errored
        removeListeners()
        reject(err)
      }

      const removeListeners = () => {
        stream.removeListener('error', errorHandler)
        stream.removeListener('finish', finishHandler)
      }

      stream.on('finish', finishHandler)
      stream.on('error', errorHandler)

      stream.end()
    })
  }

  destroy () {
    if (this.stream) {
      if (this._errorHandler) {
        this.stream.removeListener('error', this._errorHandler)
        delete this._errorHandler
      }
      if (typeof this.stream.destroy === 'function') {
        this.stream.destroy()
      }
      delete this.stream
    }
  }
}

PromiseWritable.PromiseWritable = PromiseWritable
PromiseWritable.default = PromiseWritable

module.exports = PromiseWritable
