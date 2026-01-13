const { Point, Printer } = require('../../bundled/npm')

function main() {
    const p1 = Point.create(42, 42)
    const p2 = Point.create(1, 2)

    const printer = Printer.createPrinter()
    printer.print("X: " + (p1.x() + p2.x()) + ", " + (p1.y() + p2.y()))
}
main()
