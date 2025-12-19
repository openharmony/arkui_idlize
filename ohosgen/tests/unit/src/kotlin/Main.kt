import kotlinx.coroutines.runBlocking

import ohosgen_unit.init
import ohosgen_unit.pullEvents
import ohosgen_unit.run

fun main() = runBlocking {
    init()
    run()
    pullEvents()
}
