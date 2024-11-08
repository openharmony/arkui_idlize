#pragma once

#include "expat.h"
#include <cstddef>
#include <cstring>
#include <iostream>
#include <ostream>
#include <string>
#include <string_view>

class ExpatParser {
public:
    ExpatParser(const char* buffer) : m_buffer(buffer) {
        XML_SetUserData(m_parser, this);
        XML_SetStartElementHandler(m_parser, StartElementHandler);
        XML_SetCharacterDataHandler(m_parser, CharacterDataHandler);
    }
    ExpatParser(const ExpatParser&) = delete;
    ExpatParser& operator=(const ExpatParser&) = delete;
    ExpatParser(const ExpatParser&&) = delete;
    ExpatParser& operator=(const ExpatParser&&) = delete;

    virtual ~ExpatParser() {
        XML_ParserFree(m_parser);
    }

    void parse() {
        std::cerr << "parse called on buffer: " << m_buffer << std::endl;
        XML_Parse(m_parser, m_buffer.data(), m_buffer.length(), true);
    }
private:
    static XMLCALL void StartElementHandler(void *userData, const XML_Char *name, const XML_Char **atts) {
        ((ExpatParser*) userData)->onStartElement(name, atts);
    }
    static XMLCALL void CharacterDataHandler(void *userData, const XML_Char *s, int len) {
        ((ExpatParser*) userData)->onText(s, len);
    }

private:
    void onStartElement(const char* name, const char* attrs[]) {
        setCurrentTag(name);
        std::cerr << "onStartElement name=" << name << ", attrs=[";
        // Attrs is NULL-terminated array of consecutive attrubute keys and values
        // e.g. for `<tag attr1="val1" attr2="val2">` it will be like ["attr1", "val1", "attr2", "val2", NULL]
        const char** attr = attrs;
        while (*attr) {
            const char* key = *(attr++);
            const char* value = *(attr++);
            // TODO call attributeValueCallbackFunction(key, value) ?
            std::cerr << key << "=" << value;
        }
        std::cerr << "]" << std::endl;
    }

    void onText(const char* data, size_t len) {
        // TODO call tagValueCallbackFunction(m_currentTag, data) ?
        std::cerr << "TEXT(" << m_currentTag << "): " << std::string_view(data, len) << std::endl;
    }

    void setCurrentTag(const char* name) {
        m_currentTag.clear();
        m_currentTag += name;
    }

private:
    XML_Parser m_parser = XML_ParserCreate("UTF-8");
    std::string m_buffer;
    std::string m_currentTag;
};