
typedef enum {
    %CPP_PREFIX%ARKUI_DIRTY_FLAG_MEASURE = 0b1,
    %CPP_PREFIX%ARKUI_DIRTY_FLAG_LAYOUT = 0b10,
    // mark the node need to do attribute diff to drive update.
    %CPP_PREFIX%ARKUI_DIRTY_FLAG_ATTRIBUTE_DIFF = 0b100,
    %CPP_PREFIX%ARKUI_DIRTY_FLAG_MEASURE_SELF = 0b1000,
    %CPP_PREFIX%ARKUI_DIRTY_FLAG_MEASURE_SELF_AND_PARENT = 0b10000,
    %CPP_PREFIX%ARKUI_DIRTY_FLAG_MEASURE_BY_CHILD_REQUEST = 0b100000,
    %CPP_PREFIX%ARKUI_DIRTY_FLAG_RENDER = 0b1000000,
    %CPP_PREFIX%ARKUI_DIRTY_FLAG_MEASURE_SELF_AND_CHILLD = 0b1000000000,
} %CPP_PREFIX%ArkUIDirtyFlag;

struct %CPP_PREFIX%_Ark_VMContext;
struct %CPP_PREFIX%_Ark_PipelineContext;

typedef struct %CPP_PREFIX%_Ark_VMContext* %CPP_PREFIX%Ark_VMContext;
typedef struct %CPP_PREFIX%_Ark_PipelineContext* %CPP_PREFIX%Ark_PipelineContext;

union %CPP_PREFIX%Ark_EventCallbackArg {
    Ark_Int32 i32;
    Ark_Int32 u32;
    Ark_Int32 f32;
};

typedef union %CPP_PREFIX%Ark_EventCallbackArg %CPP_PREFIX%Ark_EventCallbackArg;

typedef struct %CPP_PREFIX%Ark_APICallbackMethod {
    Ark_Int32 (*CallInt) (%CPP_PREFIX%Ark_VMContext vmContext, Ark_Int32 methodId, Ark_Int32 numArgs, %CPP_PREFIX%Ark_EventCallbackArg* args);
} %CPP_PREFIX%Ark_APICallbackMethod;

typedef struct %CPP_PREFIX%ArkUIBasicNodeAPI {
    Ark_Int32 version;
    void (*setCAllBackMethod)(struct %CPP_PREFIX%Ark_APICallbackMethod* method);
    const %CPP_PREFIX%ArkUIBasicAPI* (*getBasicModifier)();
} %CPP_PREFIX%ArkUIBasicNodeAPI;

typedef struct %CPP_PREFIX%Ark_UtilsModifier {
    Ark_Float32 (*getDensity) (Ark_Int32 deviceId);
    Ark_Float32 (*getFontScale) (Ark_Int32 deviceId);
    Ark_Float32 (*getDesignWidthScale) (Ark_Int32 deviceId);

} %CPP_PREFIX%Ark_UtilsModifier;

typedef struct %CPP_PREFIX%Ark_CustomNodeEvent {
    Ark_Int32 kind;
    Ark_Int32 extraParam;
    Ark_NativePointer canvas;
    Ark_Int32 data[8];
} %CPP_PREFIX%Ark_CustomNodeEvent;


typedef struct %CPP_PREFIX%Ark_APIEventSinglePointer {
    Ark_Int32 x;
    Ark_Int32 y;
    Ark_Int32 state; // 0 - down, 1 - up, 2 - move
} %CPP_PREFIX%Ark_APIEventSinglePointer;

#define %CPP_PREFIX%ARK_MULTIPOINTER_ARGS_COUNT 10

typedef struct %CPP_PREFIX%Ark_APIEventMultiPointer {
    Ark_Int32 count;
    Ark_Int32 xs[%CPP_PREFIX%ARK_MULTIPOINTER_ARGS_COUNT];
    Ark_Int32 ys[%CPP_PREFIX%ARK_MULTIPOINTER_ARGS_COUNT];
    Ark_Int32 state[%CPP_PREFIX%ARK_MULTIPOINTER_ARGS_COUNT];
} %CPP_PREFIX%Ark_APIEventMultiPointer;


#define %CPP_PREFIX%ARK_CALLBACK_ARGS_COUNT 12

typedef struct %CPP_PREFIX%Ark_APIEventCallback {
    Ark_Int32 id;
    Ark_Int32 numArgs;
    Ark_Int32 continuationId;
    %CPP_PREFIX%Ark_EventCallbackArg args[%CPP_PREFIX%ARK_CALLBACK_ARGS_COUNT];
} %CPP_PREFIX%Ark_APIEventCallback;

#define %CPP_PREFIX%ARK_ASYNC_EVENT_COUNT 12

typedef struct %CPP_PREFIX%Ark_APINodeAsyncEvent {
    /// used by c-api, sould be the first place.
    %CPP_PREFIX%Ark_EventCallbackArg data[%CPP_PREFIX%ARK_ASYNC_EVENT_COUNT];
    Ark_Int32 subKind; // Ark_EventSubKind actually
} %CPP_PREFIX%Ark_APINodeAsyncEvent;

typedef struct %CPP_PREFIX%Ark_APIEventTextInput {
    // used by c-api, should be the first place.
    Ark_Int64 nativeStringPtr;
    Ark_Int32 subKind; // Ark_EventSubKind actually
} %CPP_PREFIX%Ark_APIEventTextInput;

typedef struct %CPP_PREFIX%Ark_APIEventGestureAsyncEvent {
    Ark_Int32 subKind;
    Ark_Int32 repeat;
    Ark_Float32 x;
    Ark_Float32 y;
    Ark_Float32 angle;
    Ark_Float32 scale;
    Ark_Float32 pinchCenterX;
    Ark_Float32 pinchCenterY;
    Ark_Int32 speed;
    Ark_Int32 timestamp;
    Ark_Int32 source;
    Ark_Int32 pressure;
    Ark_Int32 tiltX;
    Ark_Int32 tiltY;
    Ark_Int32 sourceTool;
    Ark_Float32 velocityX;
    Ark_Float32 velocityY;
    Ark_Float32 velocity;
    void *rawPinterEvent;
} %CPP_PREFIX%Ark_APIEventGestureAsyncEvent;

typedef struct %CPP_PREFIX%Ark_TouchPoint {
    Ark_Int32 id;
    Ark_Int64 pressedTime;
    Ark_Float32 screenX;
    Ark_Float32 screenY;
    Ark_Float32 windowX;
    Ark_Float32 windowY;
    Ark_Float32 nodeX;
    Ark_Float32 nodeY;
    Ark_Float64 pressure;
    Ark_Float32 contactAreaWidth;
    Ark_Float32 contactAreaHeight;
    Ark_Float64 tiltX;
    Ark_Float64 tiltY;
    Ark_Float32 toolX;
    Ark_Float32 toolY;
    Ark_Float32 toolWidth;
    Ark_Float32 toolHeight;
    Ark_Float32 rawX;
    Ark_Float32 rawY;
    Ark_Int32 toolType;
} %CPP_PREFIX%Ark_TouchPoint;

typedef enum {
    %CPP_PREFIX%ARK_GESTURE_EVENT_ACTION_ACCEPT = 0x01,
    %CPP_PREFIX%ARK_GESTURE_EVENT_ACTION_UPDATE = 0x02,
    %CPP_PREFIX%ARK_GESTURE_EVENT_ACTION_END = 0x04,
    %CPP_PREFIX%ARK_GESTURE_EVENT_ACTION_CANCEL = 0x08,
} %CPP_PREFIX%Ark_GestureEventActionType;

typedef struct %CPP_PREFIX%Ark_HistoryTouchEvent {
    Ark_Int32 action;
    Ark_Int32 sourceType;
    Ark_Int64 timeStamp;
    %CPP_PREFIX%Ark_TouchPoint actionTouchPoint;
    %CPP_PREFIX%Ark_TouchPoint* touchPointes;
    Ark_UInt32 touchPointSize;
} %CPP_PREFIX%Ark_HistoryTouchEvent;

typedef struct %CPP_PREFIX%Ark_TouchEvent {
    Ark_Int32 action;
    /** Time stamp of the current event */
    Ark_Int64 timeStamp;
    %CPP_PREFIX%Ark_TouchPoint actionTouchPoint;
    %CPP_PREFIX%Ark_TouchPoint* touchPoints;
    Ark_Int32 touchPointSize;
    %CPP_PREFIX%Ark_HistoryTouchEvent* historyEvents;
    Ark_Int32 historySize;
    Ark_Int32 sourceType;

    /**
     * @brief Prevents events from bubbling further to the parent node for processing
     */

    Ark_Boolean stopPropagation;

    /**
     * @brief Block the current node's defaultevent handling behaviur, allowing events
     * to bubble up further.
     */
    Ark_Boolean preventDefault;

    Ark_Int32 subKind; // Ark_EventSubKind actually
    Ark_Int32 interceptResult;
} %CPP_PREFIX%Ark_TouchEvent;

typedef struct %CPP_PREFIX%Ark_MouseEvent {
    Ark_Int32 action;
    Ark_Int32 button;
    Ark_Int64 timeStamp;
    %CPP_PREFIX%Ark_TouchPoint actionTouchPoint;
    Ark_Int32 subKind;
} %CPP_PREFIX%Ark_MouseEvent;

typedef struct %CPP_PREFIX%Ark_NodeEvent
{
    Ark_Int32 kind; // Actually %CPP_PREFIX%Ark_EventCategory
    Ark_Int32 nodeId;
    Ark_Int64 extraParam;
    union {
        %CPP_PREFIX%Ark_APIEventSinglePointer singlePointer;
        %CPP_PREFIX%Ark_APIEventMultiPointer multiPointer;
        %CPP_PREFIX%Ark_APIEventCallback callback;
        %CPP_PREFIX%Ark_APINodeAsyncEvent componentAsyncEvent;
        %CPP_PREFIX%Ark_APIEventTextInput textInputEvent;
        %CPP_PREFIX%Ark_APIEventGestureAsyncEvent gestureAsyncEvent;
        %CPP_PREFIX%Ark_TouchEvent touchEvent;
        %CPP_PREFIX%Ark_MouseEvent mouseEvent;
    };
} %CPP_PREFIX%Ark_NodeEvent;

struct %CPP_PREFIX%ArkUIExtendedNodeAPI {
    Ark_Int32 version;

    const %CPP_PREFIX%Ark_UtilsModifier* (*getUtilsModifier)();

    void (*setCallbackMethod)(%CPP_PREFIX%Ark_APICallbackMethod* method);

    // for ndk side, the custom node is not set in create.
    void (*setCustomMethodFlag)(Ark_NodeHandle node, Ark_Int32 flag);
    Ark_Int32 (*getCustomMethodFlag)(Ark_NodeHandle node);

    void (*registerCustomNodeAsyncEvent)(Ark_NodeHandle nodePtr, Ark_Int32 kind, void* extraParam);
    Ark_Int32(*unregisterCustomNodeAsyncEvent)(Ark_NodeHandle nodePtr, Ark_Int32 kind);
    void (*registerCustomNodeAsyncEventReceiver)(void* eventReceiver, %CPP_PREFIX%Ark_CustomNodeEvent* event);

    void (*setCustomCallback) (%CPP_PREFIX%Ark_VMContext vmContext, Ark_NodeHandle node, Ark_Int32 callbackId);
    Ark_Int32 (*measureLayoutAndDraw) (%CPP_PREFIX%Ark_VMContext vmContext, Ark_NodeHandle node);
    Ark_Int32 (*measureNode) (%CPP_PREFIX%Ark_VMContext vmContext, Ark_NodeHandle node, Ark_Float32* data);
    Ark_Int32 (*layoutNode) (%CPP_PREFIX%Ark_VMContext vmContext, Ark_NodeHandle node, Ark_Float32* data);
    Ark_Int32 (*drawNode) (%CPP_PREFIX%Ark_VMContext vmContext, Ark_NodeHandle node, Ark_Float32* data);
    void (*setAttachNodePtr) (Ark_NodeHandle node, void* value);
    void* (*getAttachNodePtr) (Ark_NodeHandle node);

    // may be better to use int in px unit
    void (*setMeasureWidth)(Ark_NodeHandle node, Ark_Int32 value);
    Ark_Int32 (*getMeasureWidth)(Ark_NodeHandle node);
    void (*setMeasureHeight)(Ark_NodeHandle node, Ark_Int32 value);
    Ark_Int32 (*getMeasureHeight)(Ark_NodeHandle node);
    void (*setX)(Ark_NodeHandle node, Ark_Int32 value);
    Ark_Int32 (*getX)(Ark_NodeHandle node);
    void (*setY)(Ark_NodeHandle node, Ark_Int32 value);
    Ark_Int32 (*getY)(Ark_NodeHandle node);

    void (*getLayoutConstraint)(Ark_NodeHandle node, Ark_Int32* value);
    void (*setAlignment)(Ark_NodeHandle node, Ark_Int32 value);
    Ark_Int32 (*getAlignment)(Ark_NodeHandle node);

    Ark_Int32 (*indexerChecker) (%CPP_PREFIX%Ark_VMContext vmContext, Ark_NodeHandle node);
    void (*setRangeUpdater)(Ark_NodeHandle node, Ark_Int32 updatedId);
    void (*setLazyItemIndexer) (%CPP_PREFIX%Ark_VMContext vmContext, Ark_NodeHandle node, Ark_Int32 indexerId);

    /// Vsync support
    %CPP_PREFIX%Ark_PipelineContext (*getPipelineContext)(Ark_NodeHandle node);
    void (*setVsyncCallback)(%CPP_PREFIX%Ark_VMContext vmContext, %CPP_PREFIX%Ark_PipelineContext pipelineContext, Ark_Int32 callbackId);
    void (*unblockVsyncWait)(%CPP_PREFIX%Ark_VMContext vmContext, %CPP_PREFIX%Ark_PipelineContext pipelineContext);

    /// Events
    /**
     * Returns != 0 if an event was received,
     * fills in supplied buffer in such a case
     * Must not block, blockint is performed by
     * ArkoalaHostApi.waitForVsync().
    */
   Ark_Int32 (*checkEvent)(%CPP_PREFIX%Ark_NodeEvent* event);
   /**
    * Add an event to the event queue, so that
    * it will be picked up later by checkEvent().
   */
  void (*sendEvent)(%CPP_PREFIX%Ark_NodeEvent* event);

  /// Continuations on native sid
  void (*callContinuation)(Ark_Int32 continuationId, Ark_Int32 argCount, %CPP_PREFIX%Ark_EventCallbackArg* args);
  void (*setChildTotalCount)(Ark_NodeHandle node, Ark_Int32 totalCount);

  /// Error reporting.
  void (*showCrash)(Ark_CharPtr message);

};

struct Ark_AnyAPI {
    Ark_Int32 version;
};

#ifdef __cplusplus
};
#endif

#endif  // GENERATED_FOUNDATION_ACE_FRAMEWORKS_CORE_INTERFACES_ARKOALA_API_H
