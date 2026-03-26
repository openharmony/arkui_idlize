#pragma once

#include <cstddef>
#include <cstring>
#include <functional>
#include <iostream>
#include <ostream>
#include <string>
#include <vector>

#include "expat.h"

struct ParserState {
    std::string tag;
};

class ExpatParser {
public:
    explicit ExpatParser(OH_Buffer buffer) : m_buffer(buffer)
    {
        buffer.resource.hold(buffer.resource.resourceId);
        XML_SetUserData(m_parser, this);
        XML_SetStartElementHandler(m_parser, StartElementHandler);
        XML_SetEndElementHandler(m_parser, EndElementHandler);
        XML_SetCharacterDataHandler(m_parser, CharacterDataHandler);
    }
    ExpatParser(const ExpatParser&) = delete;
    ExpatParser& operator=(const ExpatParser&) = delete;
    ExpatParser(const ExpatParser&&) = delete;
    ExpatParser& operator=(const ExpatParser&&) = delete;

    virtual ~ExpatParser()
    {
        XML_ParserFree(m_parser);
        m_buffer.resource.release(m_buffer.resource.resourceId);
        std::cerr << "Parser destroy" << std::endl;
    }

    void Parse()
    {
        const char* stringData = (const char*)m_buffer.data;
        const int length = static_cast<int>(strlen(stringData));
        XML_Status result = XML_Parse(m_parser, stringData, length, true);
        if (result == XML_STATUS_ERROR) {
            fprintf(stderr, "Parse error at line %lu, symbol %lu:\n  %s\n", XML_GetCurrentLineNumber(m_parser),
                XML_GetCurrentColumnNumber(m_parser), XML_ErrorString(XML_GetErrorCode(m_parser)));
        }
    }

    void SetTagValueCallback(std::function<void(const char*, const char*)>&& callback)
    {
        this->m_tagValueCallback = callback;
    }

    void SetAttributeValueCallback(std::function<void(const char*, const char*)>&& callback)
    {
        this->m_attributeValueCallback = callback;
    }

    void Reset()
    {
        this->m_tagValueCallback = nullptr;
        this->m_attributeValueCallback = nullptr;
    }

private:
    static XMLCALL void StartElementHandler(void* userData, const XML_Char* name, const XML_Char** atts)
    {
        ((ExpatParser*)userData)->OnStartElement(name, atts);
    }
    static XMLCALL void EndElementHandler(void* userData, const XML_Char* name)
    {
        ((ExpatParser*)userData)->OnEndElement(name);
    }
    static XMLCALL void CharacterDataHandler(void* userData, const XML_Char* s, int len)
    {
        ((ExpatParser*)userData)->OnText(s, len);
    }

private:
    void OnStartElement(const char* name, const char* attrs[])
    {
        ParserState ps = { name };
        m_stack.emplace_back(std::move(ps));

        // Attrs is NULL-terminated array of consecutive attrubute keys and values
        // e.g. for `<tag attr1="val1" attr2="val2">` it will be like ["attr1", "val1", "attr2", "val2", NULL]
        const char** attr = attrs;
        while (*attr) {
            const char* key = *(attr++);
            const char* value = *(attr++);
            if (m_attributeValueCallback) {
                m_attributeValueCallback(key, value);
            }
        }
    }

    void OnEndElement(const char* name)
    {
        m_stack.pop_back();
    }

    void OnText(const char* data, size_t len)
    {
        if (m_tagValueCallback) {
            std::string value(data, len);
            m_tagValueCallback(CurrentTag(), value.c_str());
        }
    }

    const char* CurrentTag() const
    {
        if (m_stack.empty()) {
            return "";
        }

        return m_stack.back().tag.c_str();
    }

private:
    XML_Parser m_parser = XML_ParserCreate("UTF-8");
    OH_Buffer m_buffer;
    std::vector<ParserState> m_stack;
    std::function<void(const char*, const char*)> m_tagValueCallback;
    std::function<void(const char*, const char*)> m_attributeValueCallback;
    // std::function<void(const char*, const char*)> m_tokenValueCallback; // Improve implement!
};