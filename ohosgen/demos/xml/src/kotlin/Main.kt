import idlize.*
import koalaui.arkoala.*
import koalaui.interop.*

class XmlAppView: UserView() {
    override fun getBuilder(): UserViewBuilder {
        return {
            registerOhosXmlApiHandler()
            run()
            val builder: UserViewBuilder = {}
            builder
        }
    }
}

@kotlin.experimental.ExperimentalNativeApi
@CName("set_user_view_factory")
fun set_user_view_factory(): Unit {
    Application.setUserViewFactory({ appUrl ->
        XmlAppView()
    })
}
