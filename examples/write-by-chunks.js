'use strict'

const { PromiseWritable } = require('../lib/promise-writable')
const { createWriteStream } = require('fs')

async function main () {
  const wstream = new PromiseWritable(createWriteStream(process.argv[2] || 'a.out'))
  const size = Number(process.argv[3]) || 1000
  const chunkSize = Number(process.argv[4]) || 64 * 1024

  const content = Buffer.alloc(size)

  let part = 0
  let total = 0

  while (part * chunkSize < content.length) {
    const chunk = content.slice(part * chunkSize, ++part * chunkSize)
    total += await wstream.write(chunk)
    console.info(`Written ${chunk.length} bytes chunk`)
  }

  console.info(`Written ${total} bytes in total`)
}

main().catch(console.error)
