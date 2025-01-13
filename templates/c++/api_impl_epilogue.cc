const OH_AnyAPI* impls[16] = { 0 };


const OH_AnyAPI* GetAnyAPIImpl(int kind, int version) {
    switch (kind) {
        case OH_%LIBRARY_NAME%_API_KIND:
            return reinterpret_cast<const OH_AnyAPI*>(Get%LIBRARY_NAME%APIImpl(version));
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

// ArkUINativeModule::Callbacks

#undef KOALA_INTEROP_MODULE
#define KOALA_INTEROP_MODULE ArkUINativeModule
enum CallbackEventKind {
    Event_CallCallback = 0,
    Event_HoldManagedResource = 1,
    Event_ReleaseManagedResource = 2,
};

static bool needReleaseFront = false;
static std::deque<CallbackEventKind> callbackEventsQueue;
static std::deque<CallbackBuffer> callbackCallSubqueue;
static std::deque<OH_Int32> callbackResourceSubqueue;
KInt impl_CheckArkoalaCallbackEvent(KByte* result, KInt size) {
    if (needReleaseFront)
    {
        switch (callbackEventsQueue.front())
        {
            case Event_CallCallback:
                callbackCallSubqueue.front().resourceHolder.release();
                callbackCallSubqueue.pop_front();
                break;
            case Event_HoldManagedResource:
            case Event_ReleaseManagedResource:
                callbackResourceSubqueue.pop_front();
                break;
            default:
                throw "Unknown event kind";
        }
        callbackEventsQueue.pop_front();
        needReleaseFront = false;
    }
    if (callbackEventsQueue.empty()) {
        return 0;
    }
    const CallbackEventKind frontEventKind = callbackEventsQueue.front();
    Serializer serializer(result);
    serializer.writeInt32(frontEventKind);
    switch (frontEventKind)
    {
        case Event_CallCallback:
            serializer.append(callbackCallSubqueue.front().buffer, sizeof(CallbackBuffer::buffer));
            break;
        case Event_HoldManagedResource:
        case Event_ReleaseManagedResource:
            serializer.writeInt32(callbackResourceSubqueue.front());
            break;
        default:
            throw "Unknown event kind";
    }
    needReleaseFront = true;
    return 1;
}
KOALA_INTEROP_2(CheckArkoalaCallbackEvent, KInt, KByte*, KInt)

void impl_ReleaseArkoalaResource(OH_Int32 resourceId) {
    releaseManagedCallbackResource(resourceId);
}
KOALA_INTEROP_V1(ReleaseArkoalaResource, KInt)

void impl_HoldArkoalaResource(OH_Int32 resourceId) {
    holdManagedCallbackResource(resourceId);
}
KOALA_INTEROP_V1(HoldArkoalaResource, KInt)

void enqueueArkoalaCallback(const CallbackBuffer* event) {
    callbackEventsQueue.push_back(Event_CallCallback);
    callbackCallSubqueue.push_back(*event);
}

void holdManagedCallbackResource(OH_Int32 resourceId) {
    callbackEventsQueue.push_back(Event_HoldManagedResource);
    callbackResourceSubqueue.push_back(resourceId);
}

void releaseManagedCallbackResource(OH_Int32 resourceId) {
    callbackEventsQueue.push_back(Event_ReleaseManagedResource);
    callbackResourceSubqueue.push_back(resourceId);
}
