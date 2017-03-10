'use strict'

const Promise = require('any-promise')

class PromiseWritable {
  constructor (stream) {
    this.stream = stream
    this._errored = false
  }

  write (chunk, encoding) {
    const stream = this.stream

    return new Promise((resolve, reject) => {
      if (this._errored || !stream.writable) {
        return resolve(null)
      }

      const onceError = e => {
        this._errored = true
        reject(e)
      }

      stream.once('error', onceError)

      if (stream.write(chunk)) {
        stream.removeListener('error', onceError)
        if (!this._errored) {
          resolve()
        }
      } else {
        const onceDrain = () => {
          stream.removeListener('finish', onceFinish)
          stream.removeListener('error', onceError)
          resolve()
        }

        const onceFinish = () => {
          stream.removeListener('drain', onceDrain)
          stream.removeListener('error', onceError)
          resolve()
        }

        stream.once('drain', onceDrain)
        stream.once('finish', onceFinish)
      }
    })
  }

  writeAll (content, chunkSize) {
    chunkSize = chunkSize || 16 * 1024

    const stream = this.stream

    return new Promise((resolve, reject) => {
      let part = 0

      const writer = () => {
        while (stream.writable && !this._errored && part * chunkSize < content.length) {
          stream.write(content.slice(part * chunkSize, ++part * chunkSize), writer)
          if (part * chunkSize >= content.length) {
            stream.end()
          }
        }
      }

      const onDrain = () => {
        writer()
      }

      const onceFinish = () => {
        stream.removeListener('drain', onDrain)
        stream.removeListener('error', onceError)
        resolve()
      }

      const onceError = e => {
        stream.removeListener('finish', onceFinish)
        stream.removeListener('error', onceError)
        this._errored = true
        reject(e)
      }

      stream.on('drain', onDrain)
      stream.once('finish', onceFinish)
      stream.once('error', onceError)
      writer()
    })
  }

  pipe () {
    return this._event('pipe')
  }

  unpipe () {
    return this._event('unpipe')
  }

  open () {
    return this._event('open')
  }

  close () {
    return this._event('close')
  }

  _event (event) {
    const stream = this.stream
    return new Promise((resolve, reject) => {
      if (this._ended) {
        return resolve(null)
      }

      const onceEvent = argument => {
        stream.removeListener('finish', onceFinish)
        stream.removeListener('error', onceError)
        resolve(argument)
      }

      const onceFinish = () => {
        stream.removeListener(event, onceEvent)
        stream.removeListener('error', onceError)
        resolve(null)
      }

      const onceError = e => {
        stream.removeListener(event, onceEvent)
        stream.removeListener('finish', onceFinish)
        this._errored = true
        reject(e)
      }

      stream.once(event, onceEvent)
      stream.once('finish', onceFinish)
      stream.once('error', onceError)
    })
  }

  end () {
    const stream = this.stream
    return new Promise((resolve, reject) => {
      if (this._ended) {
        return resolve(null)
      }

      const onceFinish = () => {
        stream.removeListener('error', onceError)
        resolve()
      }

      const onceError = e => {
        stream.removeListener('finish', onceFinish)
        this._errored = true
        reject(e)
      }

      stream.once('finish', onceFinish)
      stream.once('error', onceError)
    })
  }
}

module.exports = PromiseWritable
