#!/usr/bin/env -S node --experimental-specifier-resolution=node --no-warnings --loader ts-node/esm

import fs from "node:fs"

import PromiseWritable from "../src/promise-writable"

async function main(): Promise<void> {
  const wstream = new PromiseWritable(fs.createWriteStream(process.argv[2] || "a.out"))
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

  await wstream.end()
  wstream.destroy()
}

main().catch(console.error)
