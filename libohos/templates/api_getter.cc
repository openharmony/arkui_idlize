const OH_AnyAPI* GetAnyImpl(int kind, int version, std::string* result = nullptr);
static const %API_NAME%* Get%API_NAME%(int32_t apiVersion) {
    return reinterpret_cast<const %API_NAME%*>(
        GetAnyImpl(static_cast<int>(%API_KIND%),
        apiVersion, nullptr));
}