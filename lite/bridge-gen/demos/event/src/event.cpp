/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include <optional>
#include <types.h>

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
    EventEmitter()
    {
        this->_onEventHandler.empty = 1;
    };
    void setEventHandler(_OnEvent handler)
    {
        this->_onEventHandler.empty = 0;
        this->_onEventHandler.value = handler;
    }
    void emit()
    {
        if (this->_onEventHandler.empty) {
            return;
        }
        int eventTypeCount = 5;
        for (int i = 0; i < eventTypeCount; ++i) {
            this->_onEventHandler.value.call(
                this->_onEventHandler.value.resource,
                (_OH_demo_event_EventType) {
                    .kind = 42 + i,
                    .name = "HELLO!" });
        }
    }

private:
    struct {
        UInt8 empty;
        _OnEvent value;
    } _onEventHandler;
};

extern "C" EventEmitter* EventEmitter_getOne()
{
    return new EventEmitter();
}
extern "C" void EventEmitter_setHandler(EventEmitter* self, _OnEvent onEvent)
{
    self->setEventHandler(onEvent);
}
extern "C" void EventEmitter_setOnExitHandler(EventEmitter* self, _OnExit onExit) {}
extern "C" void EventEmitter_emit(EventEmitter* self)
{
    self->emit();
}
