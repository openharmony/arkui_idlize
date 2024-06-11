
void impl_ShowCrash(const KStringPtr& messagePtr) {
    GetArkUIExtendedNodeAPI()->showCrash(messagePtr.c_str());
}
KOALA_INTEROP_V1(ShowCrash, KStringPtr)
