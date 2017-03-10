'use strict'

const PromiseWritable = require('../lib/promise-writable')
const fs = require('fs')

async function main () {
  const wstream = new PromiseWritable(fs.createWriteStream(process.argv[2] || 'a.out'))
  const size = Number(process.argv[3] || 1000)
  const chunkSize = Number(process.argv[4] || 64 * 1024)

  const content = new Buffer(size)

  await wstream.writeAll(content, chunkSize)
  console.log(`Write ${size} bytes in total`)
}

main()
