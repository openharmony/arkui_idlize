
import { dtsDummy, idlDummy } from "#compat"
// import { DTSDummyClass } from "#compat"
// import { IDLDummyClass } from "#compat"

import {
  SampleI,
  SampleC,
  getSampleI,
  getSampleC,
} from "#compat"

export function run() {

  console.log("Run dummy sample")

  // dtsDummy()
  // idlDummy()


  const sampleI = getSampleI()
  sampleI.flag = true
  if (!sampleI.flag) throw Error(`sampleI.flag is not true: ${sampleI.flag}`)
  sampleI.flag = false
  if (sampleI.flag) throw Error(`sampleI.flag is true: ${sampleI.flag}`)

  const sampleC = getSampleC()
  sampleC.flag = true
  if (!sampleC.flag) throw Error(`sampleC.flag is not true: ${sampleC.flag}`)
  sampleC.flag = false
  if (sampleC.flag) throw Error(`sampleC.flag is true: ${sampleC.flag}`)

  // new DTSDummyClass().dummy()
  // new IDLDummyClass().dummy()
}

