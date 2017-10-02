'use strict'

const Promise = require('any-promise')

class PromiseWritable {
  constructor (stream) {
    this.stream = stream
    this._errored = null
    this._finished = false
    this._isPromiseWritable = true
  }

  static [Symbol.hasInstance] (instance) {
    return instance._isPromiseWritable || instance._isPromiseDuplex
  }

  write (chunk, encoding) {
    const stream = this.stream

    return new Promise((resolve, reject) => {
      if (this._finished || !stream.writable || stream.closed || stream.destroyed) {
        return reject(new Error(`write after end`))
      }

      const onceError = (err) => {
        this._errored = err
        reject(err)
      }

      stream.once('error', onceError)

      if (stream.write(chunk)) {
        stream.removeListener('error', onceError)
        if (!this._errored) {
          resolve(chunk.length)
        }
      } else {
        const onceDrain = () => {
          stream.removeListener('close', onceClose)
          stream.removeListener('finish', onceFinish)
          stream.removeListener('error', onceError)
          resolve(chunk.length)
        }

        const onceClose = () => {
          stream.removeListener('drain', onceDrain)
          stream.removeListener('error', onceError)
          stream.removeListener('finish', onceFinish)
          this._finished = true
          resolve(chunk.length)
        }

        const onceFinish = () => {
          stream.removeListener('close', onceClose)
          stream.removeListener('drain', onceDrain)
          stream.removeListener('error', onceError)
          this._finished = true
          resolve(chunk.length)
        }

        stream.once('close', onceClose)
        stream.once('drain', onceDrain)
        stream.once('finish', onceFinish)
      }
    })
  }

  writeAll (content, chunkSize) {
    chunkSize = chunkSize || 64 * 1024

    const stream = this.stream

    return new Promise((resolve, reject) => {
      if (this._finished || !stream.writable || stream.closed || stream.destroyed) {
        return reject(new Error(`writeAll after end`))
      }

      let part = 0

      const onDrain = () => {
        while (stream.writable && !this._errored && part * chunkSize < content.length) {
          const chunk = content.slice(part * chunkSize, ++part * chunkSize)
          stream.write(chunk)
          if (part * chunkSize >= content.length) {
            stream.end()
          }
        }
      }

      const onceClose = () => {
        stream.removeListener('drain', onDrain)
        stream.removeListener('error', onceError)
        stream.removeListener('finish', onceFinish)
        this._finished = true
        resolve(stream.bytesWritten || 0)
      }

      const onceFinish = () => {
        stream.removeListener('close', onceClose)
        stream.removeListener('drain', onDrain)
        stream.removeListener('error', onceError)
        stream.removeListener('finish', onceFinish)
        this._finished = true
        resolve(stream.bytesWritten || 0)
      }

      const onceError = (err) => {
        stream.removeListener('close', onceClose)
        stream.removeListener('finish', onceFinish)
        stream.removeListener('error', onceError)
        this._errored = err
        reject(err)
      }

      stream.on('drain', onDrain)
      stream.once('close', onceClose)
      stream.once('finish', onceFinish)
      stream.once('error', onceError)

      onDrain()
    })
  }

  once (event) {
    const stream = this.stream

    return new Promise((resolve, reject) => {
      if (this._errored) {
        return reject(this._errored)
      } else if (this._finished) {
        if (event === 'finish') {
          return resolve()
        } else {
          return reject(new Error(`once ${event} after end`))
        }
      }

      const onceEvent = event !== 'finish' && event !== 'error' ? (argument) => {
        stream.removeListener('finish', onceFinish)
        stream.removeListener('error', onceError)
        resolve(argument)
      } : undefined

      const onceFinish = () => {
        if (event !== 'finish' && event !== 'error') {
          stream.removeListener(event, onceEvent)
        }
        stream.removeListener('error', onceError)
        this._finished = true
        resolve()
      }

      const onceError = (err) => {
        if (event !== 'finish' && event !== 'error') {
          stream.removeListener(event, onceEvent)
        }
        stream.removeListener('finish', onceFinish)
        this._errored = err
        reject(err)
      }

      if (event !== 'finish' && event !== 'error') {
        stream.once(event, onceEvent)
      }
      stream.once('finish', onceFinish)
      stream.once('error', onceError)
    })
  }

  end () {
    const stream = this.stream

    return new Promise((resolve, reject) => {
      if (this._finished) {
        return resolve()
      }

      const onceFinish = () => {
        stream.removeListener('error', onceError)
        this._finished = true
        resolve()
      }

      const onceError = (err) => {
        stream.removeListener('finish', onceFinish)
        this._errored = err
        reject(err)
      }

      stream.once('finish', onceFinish)
      stream.once('error', onceError)

      stream.end()
    })
  }
}

PromiseWritable.PromiseWritable = PromiseWritable
PromiseWritable.default = PromiseWritable

module.exports = PromiseWritable
