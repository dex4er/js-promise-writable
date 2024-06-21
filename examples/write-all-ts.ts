#!/usr/bin/env -S node --experimental-specifier-resolution=node --no-warnings --loader ts-node/esm

import fs from "fs"

import PromiseWritable from "../src/promise-writable"

async function main(): Promise<void> {
  const wstream = new PromiseWritable(fs.createWriteStream(process.argv[2] || "a.out"))
  const size = Number(process.argv[3]) || 1000
  const chunkSize = Number(process.argv[4]) || 64 * 1024

  const content = Buffer.alloc(size)

  const written = await wstream.writeAll(content, chunkSize)
  console.info(`Written ${written} bytes in total`)

  await wstream.end()
  wstream.destroy()
}

main().catch(console.error)
