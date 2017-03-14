'use strict'

const Promise = require('any-promise')

class PromiseWritable {
  constructor (stream) {
    this.stream = stream
    this._errored = false
    this._finished = false
  }

  write (chunk, encoding) {
    const stream = this.stream

    return new Promise((resolve, reject) => {
      const onceError = e => {
        this._errored = e
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
          this._finished = true
          resolve()
        }

        stream.once('drain', onceDrain)
        stream.once('finish', onceFinish)
      }
    })
  }

  writeAll (content, chunkSize) {
    chunkSize = chunkSize || 64 * 1024

    const stream = this.stream

    return new Promise((resolve, reject) => {
      if (this._finished) {
        return reject(new Error(`writeAll after end`))
      }

      let part = 0

      const onDrain = () => {
        while (stream.writable && !this._errored && part * chunkSize < content.length) {
          stream.write(content.slice(part * chunkSize, ++part * chunkSize))
          if (part * chunkSize >= content.length) {
            stream.end()
          }
        }
      }

      const onceFinish = () => {
        stream.removeListener('drain', onDrain)
        stream.removeListener('error', onceError)
        this._finished = true
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
          return resolve(null)
        } else {
          return reject(new Error(`once ${event} after end`))
        }
      }

      const onceEvent = event !== 'finish' && event !== 'error' ? argument => {
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
        resolve(null)
      }

      const onceError = e => {
        if (event !== 'finish' && event !== 'error') {
          stream.removeListener(event, onceEvent)
        }
        stream.removeListener('finish', onceFinish)
        this._errored = e
        reject(e)
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

      const onceError = e => {
        stream.removeListener('finish', onceFinish)
        this._errored = e
        reject(e)
      }

      stream.once('finish', onceFinish)
      stream.once('error', onceError)

      stream.end()
    })
  }
}

module.exports = PromiseWritable
