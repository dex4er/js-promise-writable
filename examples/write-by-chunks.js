'use strict'

const PromiseReadable = require('promise-readable')
const PromiseWritable = require('../lib/promise-writable')
const fs = require('fs')

async function main () {
  const rstream = new PromiseReadable(process.stdin)
  const wstream = new PromiseWritable(fs.createWriteStream(process.argv[2] || 'a.out'))

  let total = 0

  for (let chunk; (chunk = await rstream.read()) !== null;) {
    console.log(`Read ${chunk.length} bytes chunk`)
    await wstream.write(chunk)
    console.log(`Write ${chunk.length} bytes chunk`)
    total += chunk.length
  }

  console.log(`Write ${total} bytes in total`)
}

main()
