#include <types.h>
#include <optional>

/// TAKEN FROM api.h, this is temporary solution
struct _OH_demo_event_EventType {
  Int32 kind;
  String name;
};
struct _ResourceBox {
  Int32 resourceId;
};
struct _OnEvent {
  _ResourceBox resource;
  void (*call)(_ResourceBox, _OH_demo_event_EventType);
};
struct _OnExit {
  _ResourceBox resource;
  void (*call)(_ResourceBox, Int32);
};

///

class EventEmitter {
public:
    EventEmitter() {
        this->_onEventHandler.empty = 1;
    };
    void setEventHandler(_OnEvent handler) {
        this->_onEventHandler.empty = 0;
        this->_onEventHandler.value = handler;
    }
    void emit() {
        if (this->_onEventHandler.empty) {
            return;
        }
        for (int i = 0; i < 5; ++i) {
            this->_onEventHandler.value.call(
                this->_onEventHandler.value.resource,
                (_OH_demo_event_EventType) {
                    .kind = 42 + i,
                    .name = "HELLO!"
                }
            );
        }
    }
private:
    struct {
        UInt8 empty;
        _OnEvent value;
    } _onEventHandler;
};

extern "C" EventEmitter* EventEmitter_getOne() {
    return new EventEmitter();
}
extern "C" void EventEmitter_setHandler(EventEmitter* self, _OnEvent onEvent) {
    self->setEventHandler(onEvent);
}
extern "C" void EventEmitter_setOnExitHandler(EventEmitter* self, _OnExit onExit) {}
extern "C" void EventEmitter_emit(EventEmitter* self) {
    self->emit();
}
