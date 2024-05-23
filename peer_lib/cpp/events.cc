#include <deque>
#include "events.h"
#include "Interop.h"

std::deque<EventBuffer> eventQueue;

void sendEvent(const EventBuffer* event) {
    eventQueue.push_back(*event);
}

KInt impl_CheckArkoalaEvents(KByte* result, KInt size) {
    if (((size_t)size) < sizeof(EventBuffer::buffer))
        throw std::invalid_argument("Expected buffer size be not less than sizeof(EventBuffer) bytes");

    if (!eventQueue.size())
        return 0;

    memcpy(result, eventQueue.front().buffer, sizeof(EventBuffer::buffer));
    eventQueue.pop_front();
    return 1;
}
KOALA_INTEROP_2(CheckArkoalaEvents, KInt, KByte*, KInt)