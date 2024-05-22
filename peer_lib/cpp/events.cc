#include <deque>
#include "events.h"

std::deque<EventBuffer> eventQueue;

void sendEvent(const EventBuffer* event) {
    eventQueue.push_back(*event);
}