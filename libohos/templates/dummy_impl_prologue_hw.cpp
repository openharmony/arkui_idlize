
void RegisterOnClick(Ark_NativePointer node, const Callback_ClickEvent_Void* event) {
    auto frameNode = AsNode(node);
    auto callback = *event;
    callback.resource.hold(callback.resource.resourceId);
    auto onEvent = [callback](Ark_ClickEvent event) {
        if (callback.call) {
            callback.call(callback.resource.resourceId, event);
        }
    };
    frameNode->setClickEvent(std::move(onEvent));
}

// handWritten implementations
namespace OHOS::Ace::NG::GeneratedModifier {
    namespace CommonMethodModifier {
        void SetOnClick0Impl(Ark_NativePointer node,
                      const Opt_Callback_ClickEvent_Void* event)
    {
        RegisterOnClick(node, &event->value);
        if (!needGroupedLog(1)) {
            return;
        }
        string out("onClick(");
        WriteToString(&out, event);
        out.append(") \n");
        appendGroupedLog(1, out);
    }
    void SetOnClick1Impl(Ark_NativePointer node,
                      const Opt_Callback_ClickEvent_Void* event,
                      const Opt_Float64* distanceThreshold)
    {
        RegisterOnClick(node, &event->value);
        if (!needGroupedLog(1)) {
            return;
        }
        string out("onClick(");
        WriteToString(&out, event);
        out.append(", ");
        WriteToString(&out, distanceThreshold);
        out.append(") \n");
        appendGroupedLog(1, out);
    }
    void SetOnClickImpl(Ark_NativePointer node,
        const Callback_ClickEvent_Void* event,
        const Ark_Number* distanceThreshold)
    {
        RegisterOnClick(node, event);
        if (!needGroupedLog(1)) {
            return;
        }
        string out("onClick(");
        WriteToString(&out, event);
        out.append(", ");
        WriteToString(&out, distanceThreshold);
        out.append(") \n");
        appendGroupedLog(1, out);
    }
    void SetDrawModifierImpl(Ark_NativePointer node,
                          const Opt_DrawModifier* value)
    {
        if (value->value) {
            auto frameNode = AsNode(node);
            frameNode->setDrawModifier(value->value);
        }
        if (!needGroupedLog(1)) {
            return;
        }
        string out("drawModifier(");
        WriteToString(&out, value);
        out.append(") \n");
        appendGroupedLog(1, out);
    }
    } // CommonMethodModifier

    namespace EnvironmentBackendAccessor {
    Ark_Boolean IsAccessibilityEnabledImpl()
    {
        if (needGroupedLog(1))
        {
            string out("isAccessibilityEnabled() \n");
            out.append("[return false] \n");
            appendGroupedLog(1, out);
        }
        return false;
    }
    Ark_ColorMode GetColorModeImpl()
    {
        if (needGroupedLog(1))
        {
            string out("getColorMode() \n");
            out.append("[return Ark_ColorMode::ARK_COLOR_MODE_LIGHT] \n");
            appendGroupedLog(1, out);
        }
        return Ark_ColorMode::ARK_COLOR_MODE_LIGHT;
    }
    Ark_Float32 GetFontScaleImpl()
    {
        if (needGroupedLog(1))
        {
            string out("getFontScale() \n");
            out.append("[return 1.0] \n");
            appendGroupedLog(1, out);
        }
        return 1.0;
    }
    Ark_Float32 GetFontWeightScaleImpl()
    {
        if (needGroupedLog(1))
        {
            string out("getFontWeightScale() \n");
            out.append("[return 1.0] \n");
            appendGroupedLog(1, out);
        }
        return 1.0;
    }
    Ark_LayoutDirection GetLayoutDirectionImpl()
    {
        if (needGroupedLog(1))
        {
            string out("getLayoutDirection() \n");
            out.append("[return Ark_LayoutDirection::ARK_LAYOUT_DIRECTION_LTR] \n");
            appendGroupedLog(1, out);
        }
        return Ark_LayoutDirection::ARK_LAYOUT_DIRECTION_LTR;
    }
    Ark_String GetLanguageCodeImpl()
    {
        if (needGroupedLog(1))
        {
            string out("getLanguageCode() \n");
            out.append("[return \"en\"] \n");
            appendGroupedLog(1, out);
        }
        return { "en", 2 };
    }
    } // EnvironmentBackendAccessor

    namespace EventEmulatorAccessor {
    void EmitClickEventImpl(Ark_NativePointer node,
                            Ark_ClickEvent event)
    {
        auto frameNode = AsNode(node);
        frameNode->callClickEvent(event);
    }
    } // EventEmulatorAccessor
    namespace ScreenshotServiceAccessor {
        void ProvideSettingsImpl(const Ark_String* goldenPath, const Ark_String* outputPath,
                                 Ark_Boolean generateGoldenFiles, Ark_Float64 similarityThreshold) {}
        
        Ark_Boolean MakeScreenshotImpl(Ark_NativePointer data, Ark_Int64 length, Ark_Int32 width,
                                   Ark_Int32 height, Ark_Int64 timeStamp)
        {
            return true;
        }

        Ark_Boolean CompareImpl(const Ark_String* test, const Ark_String* name, Ark_Int64 requestID)
        {
            std::string out("compare() \n");
            out.append("[return true] \n");
            appendGroupedLog(1, out);
            bool envTest = strcmp(test->chars, "__ENVTEST__") == 0;
            if (envTest) {
                return strcmp(name->chars, "XXX") == 0;
            }

            // golden image comparison
            auto testName = std::string(test->chars, test->length);
            auto image = (strcmp(name->chars, "state-change-fail") == 0) ? "snapshot-fail" : "snapshot-success";
            TGAInfo infoGolden;
            TGAInfo infoTarget;
            if (image == std::string("state-change-fail")) {
                StubTGA(OutPath + "snapshot-fail", infoTarget);
            } else {
                if (!(std::filesystem::exists(OutPath) && std::filesystem::is_directory(OutPath))) {
                    std::filesystem::create_directory(OutPath);
                }
                std::filesystem::copy(
                    GoldenPath + std::string("snapshot-success.tga"),
                    OutPath + std::string("snapshot-success.tga"),
                    std::filesystem::copy_options::overwrite_existing
                );
            }
            ReadImageTGA(GoldenPath + image, infoGolden);
            ReadImageTGA(OutPath + image, infoTarget);
            return CompareTwoTGA(testName, image, infoGolden, infoTarget);
        }

        void RequestFrameImpl(Ark_Int64 requestID) {}
    } // ScreenshotServiceAccessor
    namespace RenderServiceNodeAccessor {
        Ark_Int32 GetNodeIdImpl(const Ark_String* nodeId)
        {
            if (!needGroupedLog(1)) {
                return 42;
            }
            string out("getNodeId(");
            WriteToString(&out, nodeId);
            out.append(") \n");
            out.append("[return 42] \n");
            appendGroupedLog(1, out);
            return 42;
        }
    } // RenderServiceNodeAccessor
    namespace DrawModifierAccessor {
        void InvalidateImpl(Ark_DrawModifier peer)
        {
            CallDrawModifierCallbacks(peer);
            if (!needGroupedLog(1)) {
                return;
            }
            string out("invalidate(");
            out.append(") \n");
            appendGroupedLog(1, out);
        }
        void SetDrawBehind_callbackImpl(Ark_DrawModifier peer,
                                        const Callback_DrawContext_Void* drawBehind_callback)
        {
            RegisterDrawModifierCallback(peer, drawBehind_callback, DrawBehind);
            if (!needGroupedLog(1)) {
                return;
            }
            string out("setDrawBehind(");
            WriteToString(&out, drawBehind_callback);
            out.append(") \n");
            appendGroupedLog(1, out);
        }
        void SetDrawContent_callbackImpl(Ark_DrawModifier peer,
                                        const Callback_DrawContext_Void* drawContent_callback)
        {
            RegisterDrawModifierCallback(peer, drawContent_callback, DrawContent);
            if (!needGroupedLog(1)) {
                return;
            }
            string out("setDrawContent(");
            WriteToString(&out, drawContent_callback);
            out.append(") \n");
            appendGroupedLog(1, out);
        }
        void SetDrawFront_callbackImpl(Ark_DrawModifier peer,
                                    const Callback_DrawContext_Void* drawFront_callback)
        {
            RegisterDrawModifierCallback(peer, drawFront_callback, DrawFront);
            if (!needGroupedLog(1)) {
                return;
            }
            string out("setDrawFront(");
            WriteToString(&out, drawFront_callback);
            out.append(") \n");
            appendGroupedLog(1, out);
        }
    } // DrawModifierAccessor

    namespace StageExtenderAccessor {
        std::map<Ark_NativePointer, std::function<void()>> enterAnimations;
        std::map<Ark_NativePointer, std::function<void()>> exitAnimations;
        Ark_NativePointer srcNode = nullptr;

        void RunFor(std::function<void(double)> func, unsigned int delay, unsigned int duration, unsigned int granularity) {
            std::thread([func, delay, duration, granularity]()
            {
                if (delay > 0) {
                    std::this_thread::sleep_for(std::chrono::milliseconds(delay));
                }

                auto step = std::chrono::milliseconds(duration / granularity);
                int counter = 0;
                double fractionalStep = 1.0/granularity;
                double lastValue = 0.0;
                auto startTime = std::chrono::steady_clock::now(), x = startTime;

                while (x - startTime < std::chrono::milliseconds(duration))
                {
                    lastValue = (counter++) * fractionalStep;
                    func(lastValue);
                    std::this_thread::sleep_until(x);
                    x = std::chrono::steady_clock::now() + step;
                }

                std::this_thread::sleep_until(startTime + std::chrono::milliseconds(duration));

                if (lastValue < 1.0) {
                    func(1.0);
                }
            }).detach();
        }

        void SetSrcPageImpl(Ark_NativePointer node)
        {
            if (!needGroupedLog(1))
            {
                return;
            }
            string out("SetSrcPage(");
            WriteToString(&out, node);
            out.append(") \n");
            appendGroupedLog(1, out);
            srcNode = node;
        }
        void PushPageImpl(Ark_NativePointer node)
        {
            if (!needGroupedLog(1))
            {
                return;
            }
            string out("PushPage(");
            WriteToString(&out, node);
            out.append(") \n");
            appendGroupedLog(1, out);

            auto enterAnimation = enterAnimations.find(node);
            if (enterAnimation != enterAnimations.end()) {
                enterAnimation->second();
            }

            auto exitAnimation = exitAnimations.find(srcNode);
            if (exitAnimation != exitAnimations.end()) {
                exitAnimation->second();
            }
        }
        void PopPageAndSwitchToImpl(Ark_NativePointer node)
        {
            if (!needGroupedLog(1))
            {
                return;
            }
            string out("PopPageAndSwitchTo(");
            WriteToString(&out, node);
            out.append(") \n");
            appendGroupedLog(1, out);

            auto enterAnimation = enterAnimations.find(node);
            if (enterAnimation != enterAnimations.end()) {
                enterAnimation->second();
            }
            auto exitAnimation = exitAnimations.find(srcNode);
            if (exitAnimation != exitAnimations.end()) {
                exitAnimation->second();
            }
        }
        void ResetTransitionsImpl(Ark_NativePointer node)
        {
            if (!needGroupedLog(1))
            {
                return;
            }
            string out("ResetTransitions(");
            WriteToString(&out, node);
            out.append(") \n");
            appendGroupedLog(1, out);
            enterAnimations.erase(node);
            exitAnimations.erase(node);
        }
        void SetPageTransitionImpl(Ark_NativePointer node,
                                const Ark_TransitionParam* param)
        {
            if (!needGroupedLog(1))
            {
                return;
            }
            string out("SetPageTransition(");
            WriteToString(&out, node);
            out.append(", ");
            WriteToString(&out, param);
            out.append(") \n");
            appendGroupedLog(1, out);

            if (param->onProgress.tag != INTEROP_TAG_UNDEFINED) {
                auto delay = param->pageTransitionOptions.delay.tag != INTEROP_TAG_UNDEFINED ? param->pageTransitionOptions.delay.value : 0;
                auto duration = param->pageTransitionOptions.duration.tag != INTEROP_TAG_UNDEFINED ? param->pageTransitionOptions.duration.value : 0;
                if (duration > 0) {
                    auto callback = param->onProgress.value;
                    auto routeType = param->routeType.tag != INTEROP_TAG_UNDEFINED ? param->routeType.value : ARK_ROUTE_TYPE_NONE;
                    callback.resource.hold(callback.resource.resourceId);
                    auto onProgress = [callback, routeType](double progress) {
                        if (callback.call) {
                            callback.call(callback.resource.resourceId, routeType, (InteropFloat32)progress);
                        }
                    };

                    if (param->pageTransitionType == ARK_PAGE_TRANSITION_TYPE_ENTER) {
                        enterAnimations[node] = std::bind(RunFor, onProgress, delay, duration, 10);
                    } else {
                        exitAnimations[node] = std::bind(RunFor, onProgress, delay, duration, 10);
                    }
                }
            }
        }
    } // StageExtenderAccessor
}

// end of handWritten implementations
