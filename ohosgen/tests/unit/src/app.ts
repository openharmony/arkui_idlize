import { test_buffer } from '#compat'

export function run() {
  console.log("Run common unit tests")

  const s = test_buffer.sum(2, 3)
  console.log(`sum: ${s}`)
}

