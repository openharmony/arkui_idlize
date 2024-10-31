
const OH_AnyAPI* impls[16] = { 0 };


const OH_AnyAPI* GetAnyAPIImpl(int kind, int version) {
    switch (kind) {
        case OH_XML_API_KIND:
            return reinterpret_cast<const OH_AnyAPI*>(GetXMLAPIImpl(version));
        default:
            return nullptr;
    }
}

extern "C" const OH_AnyAPI* GetAnyAPI(int kind, int version) {
    if (kind < 0 || kind > 15) return nullptr;
    if (!impls[kind]) {
        impls[kind] = GetAnyAPIImpl(kind, version);
    }
    return impls[kind];
}

int main(int argc, char** argv) {
    const OH_XML_API* api = (const OH_XML_API*)GetAnyAPI(OH_XML_API_KIND, 1);
    fprintf(stderr, "api=%p\n", api);
    OH_XML_Union_ArrayBuffer_DataView data;
    OH_XML_XmlSerializerHandle handle = api->XmlSerializer()->construct(data, "utf-8");
    fprintf(stderr, "handle=%p\n", handle);
    return 0;
}