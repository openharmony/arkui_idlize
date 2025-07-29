import idlize.*
import koalaui.interop.*
// import kotlinx.coroutines.*

interface PeerNodeStub {}

interface VMLoaderApplication {
    fun start(): PeerNodeStub
    fun enter(arg0: Int, arg1: Int): Boolean 
}

internal class PeerNodeStubImpl: PeerNodeStub {}

internal class VMLoaderApplicationImpl(private val appUrl: String, private val appParams: String): VMLoaderApplication {
    init {
        println("Kotlin koala: Application.constructor($appUrl, $appParams)")
    }
    override fun start(): PeerNodeStub {
        println("Kotlin koala: Application.start()")
        run()
        return PeerNodeStubImpl()
    }
    override fun enter(arg0: Int, arg1: Int): Boolean {
        println("Kotlin koala: Application.enter($arg0, $arg1)")
        pullEvents()
        return true
    }
}

@kotlin.experimental.ExperimentalNativeApi
@CName("application_create")
fun application_create(appUrl: String, appParams: String): VMLoaderApplication {
    return VMLoaderApplicationImpl(appUrl, appParams)
}

@kotlin.experimental.ExperimentalNativeApi
@CName("application_start")
fun application_start(app: VMLoaderApplication): PeerNodeStub {
    return app.start()
}

@kotlin.experimental.ExperimentalNativeApi
@CName("application_enter")
fun application_enter(app: VMLoaderApplication, arg0: Int, arg1: Int): Boolean {
    return app.enter(arg0, arg1)
}