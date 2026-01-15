const { NameDotSpace } = require("../../bundled/npm")

function test() {
    // const v1 = NameDotSpace.genNewPosition(1)
    // const v2 = NameDotSpace.genNewPosition(2)
    // const v3 = NameDotSpace.genNewPosition(3)
    // const v4 = NameDotSpace.genNewPosition(4)
    // const n1 = { name: "N1", position: v1 }
    // const n2 = { name: "N2", position: v2 }
    // const n3 = { name: "N3", position: v3 }
    // const n4 = { name: "N4", position: v4 }


    const x = NameDotSpace.add3(
        { x: 1, y: 10, z: -5 },
        { x: 10, y: -2, z: 4 }
    )
    console.log(x)
}
test()
