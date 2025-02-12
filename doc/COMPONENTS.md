# All components


| Status       | Components | Classes | Functions |
| -----------  | ---------- | ------- | --------- |
| Total        | 115      | 150     | 2242     |
| In Progress  | 9      | 3     | 64     |
| Done         | 66      | 45     | 1668     |
| Blocked      | 35      | 58     | 318     |


| Name | Kind | Owner | Status |
| ---- | ---- | ----- | ------ |
|*Root*| *Component* |  |  |
|*ComponentRoot*| *Component* |  |  |
|*AbilityComponent*| *Component* | Tuzhilkin Ivan |  |
|`setAbilityComponentOptions`| Function | Tuzhilkin Ivan | deprecated |
|`onConnect`| Function | Tuzhilkin Ivan |  |
|`onDisconnect`| Function | Tuzhilkin Ivan |  |
|*AlphabetIndexer*| *Component* | Ekaterina Stepanova | done |
|`setAlphabetIndexerOptions`| Function | Ekaterina Stepanova | done |
|`onSelected`| Function | Ekaterina Stepanova | done |
|`color`| Function | Ekaterina Stepanova | done |
|`selectedColor`| Function | Ekaterina Stepanova | done |
|`popupColor`| Function | Ekaterina Stepanova | done |
|`selectedBackgroundColor`| Function | Ekaterina Stepanova | done |
|`popupBackground`| Function | Ekaterina Stepanova | done |
|`popupSelectedColor`| Function | Ekaterina Stepanova | done |
|`popupUnselectedColor`| Function | Ekaterina Stepanova | done |
|`popupItemBackgroundColor`| Function | Ekaterina Stepanova | done |
|`usingPopup`| Function | Ekaterina Stepanova | done |
|`selectedFont`| Function | Ekaterina Stepanova | done |
|`popupFont`| Function | Ekaterina Stepanova | done |
|`popupItemFont`| Function | Ekaterina Stepanova | done |
|`itemSize`| Function | Ekaterina Stepanova | done |
|`font`| Function | Ekaterina Stepanova | done |
|`onSelect`| Function | Ekaterina Stepanova | done |
|`onRequestPopupData`| Function | Skroba Gleb | done |
|`onPopupSelect`| Function | Ekaterina Stepanova | done |
|`selected`| Function | Ekaterina Stepanova | done |
|`popupPosition`| Function | Ekaterina Stepanova | done |
|`autoCollapse`| Function | Ekaterina Stepanova | done |
|`popupItemBorderRadius`| Function | Ekaterina Stepanova | done |
|`itemBorderRadius`| Function | Ekaterina Stepanova | done |
|`popupBackgroundBlurStyle`| Function | Ekaterina Stepanova | done |
|`popupTitleBackground`| Function | Ekaterina Stepanova | done |
|`enableHapticFeedback`| Function | Ekaterina Stepanova | done |
|`alignStyle`| Function | Ekaterina Stepanova | done |
|`_onChangeEvent_selected`| Function | Erokhin Ilya | done |
|*Animator*| *Component* | Skroba Gleb | blocked |
|`setAnimatorOptions`| Function | Skroba Gleb | blocked IDL |
|`state`| Function | Skroba Gleb | blocked IDL |
|`duration`| Function | Skroba Gleb | blocked IDL |
|`curve`| Function | Skroba Gleb | blocked IDL |
|`delay`| Function | Skroba Gleb | blocked IDL |
|`fillMode`| Function | Skroba Gleb | blocked IDL |
|`iterations`| Function | Skroba Gleb | blocked IDL |
|`playMode`| Function | Skroba Gleb | blocked IDL |
|`motion`| Function | Skroba Gleb | blocked IDL |
|`onStart`| Function | Skroba Gleb | blocked IDL |
|`onPause`| Function | Skroba Gleb | blocked IDL |
|`onRepeat`| Function | Skroba Gleb | blocked IDL |
|`onCancel`| Function | Skroba Gleb | blocked IDL |
|`onFinish`| Function | Skroba Gleb | managed side |
|`onFrame`| Function | Skroba Gleb | managed side |
|*Badge*| *Component* | Vadim Voronov | done |
|`setBadgeOptions`| Function | Vadim Voronov | done |
|*Blank*| *Component* | Skroba Gleb | done |
|`setBlankOptions`| Function | Skroba Gleb | done |
|`color`| Function | Skroba Gleb | done |
|*Button*| *Component* | Evstigneev Roman | blocked |
|`setButtonOptions`| Function | Evstigneev Roman | done |
|`type`| Function | Evstigneev Roman | done |
|`stateEffect`| Function | Evstigneev Roman | done |
|`buttonStyle`| Function | Evstigneev Roman | done |
|`controlSize`| Function | Evstigneev Roman | done |
|`role`| Function | Evstigneev Roman | done |
|`fontColor`| Function | Evstigneev Roman | done |
|`fontSize`| Function | Evstigneev Roman | done |
|`fontWeight`| Function | Evstigneev Roman | done |
|`fontStyle`| Function | Evstigneev Roman | done |
|`fontFamily`| Function | Evstigneev Roman | done |
|`contentModifier`| Function | Evstigneev Roman | blocked IDL |
|`labelStyle`| Function | Evstigneev Roman | done |
|`minFontScale`| Function | Kovalev Sergey | in progress |
|`maxFontScale`| Function | Kovalev Sergey | in progress |
|*Calendar*| *Component* | Maksimov Nikita | done |
|`setCalendarOptions`| Function | Maksimov Nikita | done |
|`showLunar`| Function | Maksimov Nikita | done |
|`showHoliday`| Function | Maksimov Nikita | done |
|`needSlide`| Function | Maksimov Nikita | done |
|`startOfWeek`| Function | Maksimov Nikita | done |
|`offDays`| Function | Maksimov Nikita | done |
|`direction`| Function | Maksimov Nikita | done |
|`currentDayStyle`| Function | Maksimov Nikita | done |
|`nonCurrentDayStyle`| Function | Maksimov Nikita | done |
|`todayStyle`| Function | Maksimov Nikita | done |
|`weekStyle`| Function | Maksimov Nikita | done |
|`workStateStyle`| Function | Maksimov Nikita | done |
|`onSelectChange`| Function | Maksimov Nikita | done |
|`onRequestData`| Function | Maksimov Nikita | done |
|*CalendarPicker*| *Component* | Politov Mikhail | done |
|`setCalendarPickerOptions`| Function | Politov Mikhail | done |
|`textStyle`| Function | Politov Mikhail | done |
|`onChange`| Function | Politov Mikhail | done |
|`edgeAlign`| Function | Politov Mikhail | done |
|*Canvas*| *Component* | Vadim Voronov, Evstigneev Roman | done |
|`setCanvasOptions`| Function | Vadim Voronov, Evstigneev Roman | blocked AceEngine |
|`onReady`| Function | Vadim Voronov | done |
|`enableAnalyzer`| Function | Vadim Voronov | done |
|*Checkbox*| *Component* | Andrey Khudenkikh | blocked |
|`setCheckboxOptions`| Function | Samarin Sergey | done |
|`select`| Function | Andrey Khudenkikh | done |
|`selectedColor`| Function | Andrey Khudenkikh | done |
|`shape`| Function | Andrey Khudenkikh | done |
|`unselectedColor`| Function | Andrey Khudenkikh | done |
|`mark`| Function | Andrey Khudenkikh | done |
|`onChange`| Function | Andrey Khudenkikh | done |
|`contentModifier`| Function | Andrey Khudenkikh | blocked IDL |
|`_onChangeEvent_select`| Function | Erokhin Ilya | done |
|*CheckboxGroup*| *Component* | Dudkin Sergey | done |
|`setCheckboxGroupOptions`| Function | Dudkin Sergey | done |
|`selectAll`| Function | Dudkin Sergey | done |
|`selectedColor`| Function | Dudkin Sergey | done |
|`unselectedColor`| Function | Dudkin Sergey | done |
|`mark`| Function | Dudkin Sergey | done |
|`onChange`| Function | Dudkin Sergey | done |
|`checkboxShape`| Function | Dudkin Sergey | done |
|`_onChangeEvent_selectAll`| Function | Erokhin Ilya | done |
|*Circle*| *Component* | Erokhin Ilya | done |
|`setCircleOptions`| Function | Erokhin Ilya | done |
|*Column*| *Component* | Politov Mikhail | done |
|`setColumnOptions`| Function | Politov Mikhail | done |
|`alignItems`| Function | Politov Mikhail | done |
|`justifyContent`| Function | Politov Mikhail | done |
|`pointLight`| Function | Evstigneev Roman, Andrey Khudenkikh | done |
|`reverse`| Function | Politov Mikhail | done |
|*ColumnSplit*| *Component* | Dmitry A Smirnov | done |
|`setColumnSplitOptions`| Function | Dmitry A Smirnov | done |
|`resizeable`| Function | Dmitry A Smirnov | done |
|`divider`| Function | Dmitry A Smirnov | done |
|*CommonMethod*| *Component* | Skroba Gleb,Erokhin Ilya | in progress |
|`width`| Function | Roman Sedaikin | done |
|`height`| Function | Roman Sedaikin | done |
|`drawModifier`| Function | Erokhin Ilya | done |
|`responseRegion`| Function | Skroba Gleb | done |
|`mouseResponseRegion`| Function | Skroba Gleb | done |
|`size`| Function | Roman Sedaikin | done |
|`constraintSize`| Function | Roman Sedaikin | done |
|`touchable`| Function | Roman Sedaikin | done |
|`hitTestBehavior`| Function | Roman Sedaikin | done |
|`onChildTouchTest`| Function | Skroba Gleb | done |
|`layoutWeight`| Function | Roman Sedaikin | done |
|`chainWeight`| Function | Politov Mikhail | done |
|`padding`| Function | Skroba Gleb | done |
|`safeAreaPadding`| Function | Dmitry A Smirnov | done |
|`margin`| Function | Skroba Gleb | done |
|`backgroundColor`| Function | Skroba Gleb | done |
|`pixelRound`| Function | Skroba Gleb | done |
|`backgroundImageSize`| Function | Erokhin Ilya | done |
|`backgroundImagePosition`| Function | Erokhin Ilya | done |
|`backgroundEffect`| Function | Skroba Gleb | done |
|`backgroundImageResizable`| Function | Skroba Gleb | done |
|`foregroundEffect`| Function | Skroba Gleb | done |
|`visualEffect`| Function | Skroba Gleb | blocked IDL |
|`backgroundFilter`| Function | Skroba Gleb | blocked IDL |
|`foregroundFilter`| Function | Skroba Gleb | blocked IDL |
|`compositingFilter`| Function | Skroba Gleb | blocked IDL |
|`opacity`| Function | Roman Sedaikin | done |
|`border`| Function | Roman Sedaikin | done |
|`borderStyle`| Function | Roman Sedaikin | done |
|`borderWidth`| Function | Roman Sedaikin | done |
|`borderColor`| Function | Roman Sedaikin | done |
|`borderRadius`| Function | Roman Sedaikin | done |
|`borderImage`| Function | Roman Sedaikin | done |
|`outline`| Function | Skroba Gleb | done |
|`outlineStyle`| Function | Skroba Gleb | done |
|`outlineWidth`| Function | Skroba Gleb | done |
|`outlineColor`| Function | Skroba Gleb | done |
|`outlineRadius`| Function | Skroba Gleb | done |
|`foregroundColor`| Function | Roman Sedaikin | done |
|`onClick`| Function | Roman Sedaikin, Maksimov Nikita | done |
|`onHover`| Function | Andrey Khudenkikh, Tuzhilkin Ivan | done |
|`onAccessibilityHover`| Function | Andrey Khudenkikh, Pavelyev Ivan | in progress |
|`hoverEffect`| Function | Roman Sedaikin | done |
|`onMouse`| Function | Kovalev Sergey | done |
|`onTouch`| Function | Roman Sedaikin, Tuzhilkin Ivan | done |
|`onKeyEvent`| Function | Erokhin Ilya, Maksimov Nikita | done |
|`onDigitalCrown`| Function |  |  |
|`onKeyPreIme`| Function | Erokhin Ilya, Maksimov Nikita | done |
|`onKeyEventDispatch`| Function |  |  |
|`onFocusAxisEvent`| Function |  |  |
|`focusable`| Function | Roman Sedaikin | done |
|`tabStop`| Function |  |  |
|`onFocus`| Function | Roman Sedaikin | done |
|`onBlur`| Function | Roman Sedaikin | done |
|`tabIndex`| Function | Dmitry A Smirnov | done |
|`defaultFocus`| Function | Dmitry A Smirnov | done |
|`groupDefaultFocus`| Function | Dmitry A Smirnov | done |
|`focusOnTouch`| Function | Dmitry A Smirnov | done |
|`focusBox`| Function | Dudkin Sergey | done |
|`animation`| Function | managed side |  |
|`transition`| Function | Dmitry A Smirnov | done |
|`motionBlur`| Function | Dmitry A Smirnov | done |
|`brightness`| Function | Lobah Mikhail | done |
|`contrast`| Function | Lobah Mikhail | done |
|`grayscale`| Function | Lobah Mikhail | done |
|`colorBlend`| Function | Lobah Mikhail | done |
|`saturate`| Function | Lobah Mikhail | done |
|`sepia`| Function | Lobah Mikhail | done |
|`invert`| Function | Lobah Mikhail | done |
|`hueRotate`| Function | Lobah Mikhail | done |
|`useShadowBatching`| Function | Lobah Mikhail | done |
|`useEffect`| Function | Lobah Mikhail | done |
|`renderGroup`| Function | Lobah Mikhail | done |
|`freeze`| Function | Lobah Mikhail | done |
|`translate`| Function | Erokhin Ilya | done |
|`scale`| Function | Erokhin Ilya | done |
|`gridSpan`| Function | Lobah Mikhail | done |
|`gridOffset`| Function | Lobah Mikhail | done |
|`rotate`| Function | Dmitry A Smirnov | done |
|`transform`| Function | Lobah Mikhail | done |
|`onAppear`| Function | Roman Sedaikin | done |
|`onDisAppear`| Function | Roman Sedaikin | done |
|`onAttach`| Function | Andrey Khudenkikh | done |
|`onDetach`| Function | Andrey Khudenkikh | done |
|`onAreaChange`| Function | Roman Sedaikin | done |
|`visibility`| Function | Roman Sedaikin | done |
|`flexGrow`| Function | Dmitry A Smirnov | done |
|`flexShrink`| Function | Dmitry A Smirnov | done |
|`flexBasis`| Function | Dmitry A Smirnov | done |
|`alignSelf`| Function | Roman Sedaikin | done |
|`displayPriority`| Function | Roman Sedaikin | done |
|`zIndex`| Function | Roman Sedaikin | done |
|`direction`| Function | Roman Sedaikin | done |
|`align`| Function | Roman Sedaikin | done |
|`position`| Function | Roman Sedaikin | done |
|`markAnchor`| Function | Dmitry A Smirnov | done |
|`offset`| Function | Skroba Gleb | done |
|`enabled`| Function | Roman Sedaikin | done |
|`useSizeType`| Function | Dmitry A Smirnov | done |
|`alignRules`| Function | Dmitry A Smirnov | done |
|`aspectRatio`| Function | Roman Sedaikin | done |
|`clickEffect`| Function | Lobah Mikhail | done |
|`onDragStart`| Function | Skroba Gleb, Evstigneev Roman | done |
|`onDragEnter`| Function | Lobah Mikhail, Evstigneev Roman | done |
|`onDragMove`| Function | Lobah Mikhail, Evstigneev Roman | done |
|`onDragLeave`| Function | Lobah Mikhail, Evstigneev Roman | done |
|`onDrop`| Function | Lobah Mikhail, Evstigneev Roman | done |
|`onDragEnd`| Function | Lobah Mikhail, Evstigneev Roman | done |
|`allowDrop`| Function | Lobah Mikhail | done |
|`draggable`| Function | Lobah Mikhail | done |
|`dragPreview`| Function | Lobah Mikhail | done |
|`onPreDrag`| Function | Lobah Mikhail | done |
|`linearGradient`| Function | Roman Sedaikin | done |
|`sweepGradient`| Function | Roman Sedaikin | done |
|`radialGradient`| Function | Erokhin Ilya | done |
|`motionPath`| Function | Lobah Mikhail | done |
|`shadow`| Function | Roman Sedaikin | done |
|`clip`| Function | Dudkin Sergey | blocked IDL |
|`clipShape`| Function | Dudkin Sergey | blocked IDL |
|`mask`| Function | Maksimov Nikita | done |
|`maskShape`| Function | Dmitry A Smirnov | blocked IDL |
|`key`| Function | Lobah Mikhail | done |
|`id`| Function | Erokhin Ilya | done |
|`geometryTransition`| Function | Lobah Mikhail | done |
|`stateStyles`| Function | Dudkin Sergey | blocked IDL |
|`restoreId`| Function | Lobah Mikhail | done |
|`sphericalEffect`| Function | Lobah Mikhail | done |
|`lightUpEffect`| Function | Lobah Mikhail | done |
|`pixelStretchEffect`| Function | Lobah Mikhail | done |
|`accessibilityGroup`| Function | Lobah Mikhail | done |
|`accessibilityText`| Function | Lobah Mikhail | done |
|`accessibilityNextFocusId`| Function |  |  |
|`accessibilityDefaultFocus`| Function |  |  |
|`accessibilityUseSamePage`| Function |  |  |
|`accessibilityRole`| Function |  |  |
|`onAccessibilityFocus`| Function |  |  |
|`accessibilityTextHint`| Function | Lobah Mikhail | done |
|`accessibilityDescription`| Function | Lobah Mikhail | done |
|`accessibilityLevel`| Function | Lobah Mikhail | done |
|`accessibilityVirtualNode`| Function | Lobah Mikhail | done |
|`accessibilityChecked`| Function | Lobah Mikhail | done |
|`accessibilitySelected`| Function | Lobah Mikhail | done |
|`obscured`| Function | Dmitry A Smirnov | done |
|`reuseId`| Function | Dmitry A Smirnov | blocked AceEngine |
|`reuse`| Function |  |  |
|`renderFit`| Function | Dmitry A Smirnov | done |
|`gestureModifier`| Function | Erokhin Ilya | blocked IDL |
|`backgroundBrightness`| Function | Skroba Gleb | done |
|`onGestureJudgeBegin`| Function | Skroba Gleb, Maksimov Nikita | done |
|`onGestureRecognizerJudgeBegin`| Function | Skroba Gleb, Maksimov Nikita | done |
|`shouldBuiltInRecognizerParallelWith`| Function | Skroba Gleb | done |
|`monopolizeEvents`| Function | Erokhin Ilya | done |
|`onTouchIntercept`| Function | Andrey Khudenkikh, Tuzhilkin Ivan | done |
|`onSizeChange`| Function | Dmitry A Smirnov | done |
|`customProperty`| Function | Dmitry A Smirnov | blocked IDL |
|`expandSafeArea`| Function | Dmitry A Smirnov | done |
|`background`| Function | Lobah Mikhail | done |
|`backgroundImage`| Function | Erokhin Ilya | done |
|`backgroundBlurStyle`| Function | Skroba Gleb | done |
|`foregroundBlurStyle`| Function | Roman Sedaikin | done |
|`focusScopeId`| Function | Dmitry A Smirnov | done |
|`focusScopePriority`| Function | Dmitry A Smirnov | done |
|`gesture`| Function | Dudkin Sergey | in progress |
|`priorityGesture`| Function | Dudkin Sergey | in progress |
|`parallelGesture`| Function | Dudkin Sergey | in progress |
|`blur`| Function | Roman Sedaikin | done |
|`linearGradientBlur`| Function | Lobah Mikhail | done |
|`systemBarEffect`| Function | Lobah Mikhail | done |
|`backdropBlur`| Function | Berezin Kirill | done |
|`sharedTransition`| Function | Skroba Gleb | done |
|`chainMode`| Function | Berezin Kirill | done |
|`dragPreviewOptions`| Function | Erokhin Ilya | blocked IDL |
|`overlay`| Function | Lobah Mikhail | done |
|`blendMode`| Function | Lobah Mikhail | done |
|`advancedBlendMode`| Function | Erokhin Ilya | blocked IDL |
|`bindPopup`| Function | Erokhin Ilya | done |
|`bindMenu`| Function | Erokhin Ilya | blocked IDL |
|`bindContextMenu`| Function | Erokhin Ilya | blocked IDL |
|`bindContentCover`| Function | Erokhin Ilya | done |
|`bindSheet`| Function | Erokhin Ilya | done |
|`onVisibleAreaChange`| Function | Erokhin Ilya | done |
|`keyboardShortcut`| Function | Erokhin Ilya | done |
|*CommonShapeMethod*| *Component* | Skroba Gleb | done |
|`stroke`| Function | Skroba Gleb | done |
|`fill`| Function | Skroba Gleb | done |
|`strokeDashOffset`| Function | Evstigneev Roman | done |
|`strokeLineCap`| Function | Evstigneev Roman | done |
|`strokeLineJoin`| Function | Evstigneev Roman | done |
|`strokeMiterLimit`| Function | Evstigneev Roman | done |
|`strokeOpacity`| Function | Evstigneev Roman | done |
|`fillOpacity`| Function | Evstigneev Roman | done |
|`strokeWidth`| Function | Evstigneev Roman | done |
|`antiAlias`| Function | Evstigneev Roman | done |
|`strokeDashArray`| Function | Evstigneev Roman | blocked AceEngine |
|*Common*| *Component* | Maksimov Nikita | done |
|`setCommonOptions`| Function | Maksimov Nikita | done |
|*ScrollableCommonMethod*| *Component* | Samarin Sergey | blocked |
|`scrollBar`| Function | Samarin Sergey | done |
|`scrollBarColor`| Function | Samarin Sergey | done |
|`scrollBarWidth`| Function | Samarin Sergey | done |
|`nestedScroll`| Function | Samarin Sergey | done |
|`enableScrollInteraction`| Function | Samarin Sergey | done |
|`friction`| Function | Samarin Sergey | done |
|`onScroll`| Function | Samarin Sergey | deprecated |
|`onWillScroll`| Function | Skroba Gleb | blocked IDL |
|`onDidScroll`| Function | Berezin Kirill | in progress |
|`onReachStart`| Function | Samarin Sergey | done |
|`onReachEnd`| Function | Samarin Sergey | done |
|`onScrollStart`| Function | Samarin Sergey | done |
|`onScrollStop`| Function | Samarin Sergey | done |
|`flingSpeedLimit`| Function | Samarin Sergey | done |
|`clipContent`| Function | Evstigneev Roman | blocked IDL |
|`digitalCrownSensitivity`| Function |  |  |
|`edgeEffect`| Function | Samarin Sergey | done |
|`fadingEdge`| Function | Samarin Sergey | done |
|*Component3D*| *Component* | Kovalev Sergey | blocked |
|`setComponent3DOptions`| Function | Kovalev Sergey | blocked IDL |
|`environment`| Function | Kovalev Sergey | done |
|`shader`| Function | Kovalev Sergey | done |
|`shaderImageTexture`| Function | Kovalev Sergey | done |
|`shaderInputBuffer`| Function | Kovalev Sergey | done |
|`renderWidth`| Function | Kovalev Sergey | done |
|`renderHeight`| Function | Kovalev Sergey | done |
|`customRender`| Function | Kovalev Sergey | done |
|*ContainerSpan*| *Component* | Tuzhilkin Ivan | done |
|`setContainerSpanOptions`| Function | Tuzhilkin Ivan | done |
|`textBackgroundStyle`| Function | Tuzhilkin Ivan | done |
|*Counter*| *Component* | Erokhin Ilya | done |
|`setCounterOptions`| Function | Erokhin Ilya | done |
|`onInc`| Function | Erokhin Ilya | done |
|`onDec`| Function | Erokhin Ilya | done |
|`enableDec`| Function | Erokhin Ilya | done |
|`enableInc`| Function | Erokhin Ilya | done |
|*DataPanel*| *Component* | Morozov Sergey | blocked |
|`setDataPanelOptions`| Function | Morozov Sergey | done |
|`closeEffect`| Function | Morozov Sergey | done |
|`valueColors`| Function | Morozov Sergey | blocked IDL |
|`trackBackgroundColor`| Function | Morozov Sergey | done |
|`strokeWidth`| Function | Morozov Sergey | done |
|`trackShadow`| Function | Morozov Sergey | blocked IDL |
|`contentModifier`| Function | Morozov Sergey | blocked IDL |
|*DatePicker*| *Component* | Vadim Voronov | done |
|`setDatePickerOptions`| Function | Vadim Voronov | done |
|`lunar`| Function | Vadim Voronov | done |
|`disappearTextStyle`| Function | Vadim Voronov | done |
|`textStyle`| Function | Vadim Voronov | done |
|`selectedTextStyle`| Function | Vadim Voronov | done |
|`onChange`| Function | Vadim Voronov | done |
|`onDateChange`| Function | Vadim Voronov | done |
|`digitalCrownSensitivity`| Function | Vadim Voronov | done |
|`_onChangeEvent_selected`| Function | Erokhin Ilya | done |
|*Divider*| *Component* | Tuzhilkin Ivan | done |
|`setDividerOptions`| Function | Tuzhilkin Ivan | done |
|`vertical`| Function | Tuzhilkin Ivan | done |
|`color`| Function | Tuzhilkin Ivan | done |
|`strokeWidth`| Function | Tuzhilkin Ivan | done |
|`lineCap`| Function | Tuzhilkin Ivan | done |
|*EffectComponent*| *Component* | Ekaterina Stepanova | done |
|`setEffectComponentOptions`| Function | Ekaterina Stepanova | done |
|*Ellipse*| *Component* | Ekaterina Stepanova | done |
|`setEllipseOptions`| Function | Ekaterina Stepanova | done |
|*EmbeddedComponent*| *Component* | Ekaterina Stepanova | blocked IDL |
|`setEmbeddedComponentOptions`| Function | Ekaterina Stepanova | blocked IDL |
|`onTerminated`| Function | Ekaterina Stepanova | blocked IDL |
|`onError`| Function | Ekaterina Stepanova | blocked IDL |
|*Flex*| *Component* | Kovalev Sergey | done |
|`setFlexOptions`| Function | Kovalev Sergey | done |
|`pointLight`| Function | Evstigneev Roman, Andrey Khudenkikh | done |
|*FlowItem*| *Component* | Evstigneev Roman | done |
|`setFlowItemOptions`| Function | Evstigneev Roman | done |
|*FolderStack*| *Component* | Politov Mikhail | done |
|`setFolderStackOptions`| Function | Politov Mikhail | done |
|`alignContent`| Function | Politov Mikhail | done |
|`onFolderStateChange`| Function | Politov Mikhail | done |
|`onHoverStatusChange`| Function | Politov Mikhail | done |
|`enableAnimation`| Function | Politov Mikhail | done |
|`autoHalfFold`| Function | Politov Mikhail | done |
|*FormComponent*| *Component* | Vadim Voronov | blocked |
|`setFormComponentOptions`| Function | Vadim Voronov | done |
|`size`| Function | Vadim Voronov | blocked AceEngine |
|`moduleName`| Function | Vadim Voronov | done |
|`dimension`| Function | Vadim Voronov | done |
|`allowUpdate`| Function | Vadim Voronov | done |
|`visibility`| Function | Vadim Voronov | done |
|`onAcquired`| Function | Vadim Voronov | blocked IDL |
|`onError`| Function | Vadim Voronov | blocked IDL |
|`onRouter`| Function | Vadim Voronov | deprecated |
|`onUninstall`| Function | Vadim Voronov | blocked IDL |
|`onLoad`| Function | Vadim Voronov | done |
|*FormLink*| *Component* | Dmitry A Smirnov | done |
|`setFormLinkOptions`| Function | Dmitry A Smirnov | done |
|*Gauge*| *Component* | Maksimov Nikita | blocked |
|`setGaugeOptions`| Function | Maksimov Nikita | done |
|`value`| Function | Maksimov Nikita | done |
|`startAngle`| Function | Maksimov Nikita | done |
|`endAngle`| Function | Maksimov Nikita | done |
|`colors`| Function | Maksimov Nikita | blocked IDL |
|`strokeWidth`| Function | Maksimov Nikita | done |
|`description`| Function | Lobah Mikhail | done |
|`trackShadow`| Function | Maksimov Nikita | done |
|`indicator`| Function | Maksimov Nikita | done |
|`privacySensitive`| Function | Maksimov Nikita | done |
|`contentModifier`| Function | Maksimov Nikita | blocked IDL |
|*Grid*| *Component* | Erokhin Ilya | blocked |
|`setGridOptions`| Function | Erokhin Ilya | in progress |
|`columnsTemplate`| Function | Erokhin Ilya | done |
|`rowsTemplate`| Function | Erokhin Ilya | done |
|`columnsGap`| Function | Erokhin Ilya | done |
|`rowsGap`| Function | Erokhin Ilya | done |
|`scrollBarWidth`| Function | Erokhin Ilya | done |
|`scrollBarColor`| Function | Erokhin Ilya | done |
|`scrollBar`| Function | Erokhin Ilya | done |
|`onScrollBarUpdate`| Function | Skroba Gleb | done |
|`onScrollIndex`| Function | Erokhin Ilya | done |
|`cachedCount`| Function | Erokhin Ilya | done |
|`editMode`| Function | Erokhin Ilya | done |
|`multiSelectable`| Function | Erokhin Ilya | done |
|`maxCount`| Function | Erokhin Ilya | done |
|`minCount`| Function | Erokhin Ilya | done |
|`cellLength`| Function | Erokhin Ilya | done |
|`layoutDirection`| Function | Erokhin Ilya | done |
|`supportAnimation`| Function | Erokhin Ilya | done |
|`onItemDragStart`| Function | Skroba Gleb | done |
|`onItemDragEnter`| Function | Erokhin Ilya | done |
|`onItemDragMove`| Function | Erokhin Ilya | done |
|`onItemDragLeave`| Function | Erokhin Ilya | done |
|`onItemDrop`| Function | Erokhin Ilya | done |
|`nestedScroll`| Function | Erokhin Ilya | done |
|`enableScrollInteraction`| Function | Erokhin Ilya | done |
|`friction`| Function | Erokhin Ilya | done |
|`alignItems`| Function | Erokhin Ilya | done |
|`onScroll`| Function | Erokhin Ilya | done |
|`onReachStart`| Function | Erokhin Ilya | done |
|`onReachEnd`| Function | Erokhin Ilya | done |
|`onScrollStart`| Function | Erokhin Ilya | done |
|`onScrollStop`| Function | Erokhin Ilya | done |
|`onScrollFrameBegin`| Function | Skroba Gleb | done |
|`edgeEffect`| Function | Erokhin Ilya | done |
|*GridItem*| *Component* | Erokhin Ilya | done |
|`setGridItemOptions`| Function | Erokhin Ilya | done |
|`rowStart`| Function | Erokhin Ilya | done |
|`rowEnd`| Function | Erokhin Ilya | done |
|`columnStart`| Function | Erokhin Ilya | done |
|`columnEnd`| Function | Erokhin Ilya | done |
|`forceRebuild`| Function | Erokhin Ilya | done |
|`selectable`| Function | Erokhin Ilya | done |
|`selected`| Function | Erokhin Ilya | done |
|`onSelect`| Function | Erokhin Ilya | done |
|`_onChangeEvent_selected`| Function | Erokhin Ilya | done |
|*GridCol*| *Component* | Lobah Mikhail | done |
|`setGridColOptions`| Function | Lobah Mikhail | done |
|`span`| Function | Lobah Mikhail | done |
|`gridColOffset`| Function | Lobah Mikhail | done |
|`order`| Function | Lobah Mikhail | done |
|*GridContainer*| *Component* | Lobah Mikhail |  |
|`setGridContainerOptions`| Function | Lobah Mikhail | deprecated |
|*GridRow*| *Component* | Lobah Mikhail | done |
|`setGridRowOptions`| Function | Lobah Mikhail | done |
|`onBreakpointChange`| Function | Lobah Mikhail | done |
|`alignItems`| Function | Lobah Mikhail | done |
|*Hyperlink*| *Component* | Morozov Sergey | done |
|`setHyperlinkOptions`| Function | Morozov Sergey | done |
|`color`| Function | Morozov Sergey | done |
|*Image*| *Component* | Evstigneev Roman | in progress |
|`setImageOptions`| Function | Berezin Kirill | in progress |
|`alt`| Function | Evstigneev Roman | done |
|`matchTextDirection`| Function | Evstigneev Roman | done |
|`fitOriginalSize`| Function | Evstigneev Roman | done |
|`fillColor`| Function | Evstigneev Roman | done |
|`objectFit`| Function | Berezin Kirill | done |
|`imageMatrix`| Function |  |  |
|`objectRepeat`| Function | Evstigneev Roman | done |
|`autoResize`| Function | Evstigneev Roman | done |
|`renderMode`| Function | Evstigneev Roman | done |
|`dynamicRangeMode`| Function | Evstigneev Roman | blocked AceEngine |
|`interpolation`| Function | Evstigneev Roman | done |
|`sourceSize`| Function | Evstigneev Roman | done |
|`syncLoad`| Function | Evstigneev Roman | done |
|`colorFilter`| Function | Evstigneev Roman | blocked IDL |
|`copyOption`| Function | Evstigneev Roman | blocked AceEngine |
|`draggable`| Function | Evstigneev Roman | done |
|`pointLight`| Function | Evstigneev Roman, Andrey Khudenkikh | done |
|`edgeAntialiasing`| Function | Evstigneev Roman | done |
|`onComplete`| Function | Evstigneev Roman | done |
|`onError`| Function | Evstigneev Roman | done |
|`onFinish`| Function | Evstigneev Roman | done |
|`enableAnalyzer`| Function | Evstigneev Roman | done |
|`analyzerConfig`| Function | Evstigneev Roman | blocked AceEngine |
|`resizable`| Function | Evstigneev Roman | in progress |
|`privacySensitive`| Function | Evstigneev Roman | done |
|`enhancedImageQuality`| Function | Evstigneev Roman | blocked IDL |
|`orientation`| Function | Samarin Sergey | done |
|*ImageAnimator*| *Component* | Pavelyev Ivan | done |
|`setImageAnimatorOptions`| Function | Pavelyev Ivan | done |
|`images`| Function | Pavelyev Ivan | done |
|`state`| Function | Pavelyev Ivan | done |
|`duration`| Function | Pavelyev Ivan | done |
|`reverse`| Function | Pavelyev Ivan | done |
|`fixedSize`| Function | Pavelyev Ivan | done |
|`preDecode`| Function | Pavelyev Ivan | done |
|`fillMode`| Function | Pavelyev Ivan | done |
|`iterations`| Function | Pavelyev Ivan | done |
|`onStart`| Function | Pavelyev Ivan | done |
|`onPause`| Function | Pavelyev Ivan | done |
|`onRepeat`| Function | Pavelyev Ivan | done |
|`onCancel`| Function | Pavelyev Ivan | done |
|`onFinish`| Function | Pavelyev Ivan | done |
|*ImageSpan*| *Component* | Politov Mikhail | blocked |
|`setImageSpanOptions`| Function | Politov Mikhail | done |
|`verticalAlign`| Function | Politov Mikhail | done |
|`colorFilter`| Function | Politov Mikhail | blocked IDL |
|`objectFit`| Function | Politov Mikhail | done |
|`onComplete`| Function | Politov Mikhail | done |
|`onError`| Function | Politov Mikhail | done |
|`alt`| Function | Politov Mikhail | done |
|*Line*| *Component* | Dudkin Sergey | blocked |
|`setLineOptions`| Function | Dudkin Sergey | done |
|`startPoint`| Function | Dudkin Sergey | blocked AceEngine |
|`endPoint`| Function | Dudkin Sergey | blocked AceEngine |
|*List*| *Component* | Morozov Sergey | done |
|`setListOptions`| Function | Morozov Sergey | done |
|`alignListItem`| Function | Morozov Sergey | done |
|`listDirection`| Function | Morozov Sergey | done |
|`scrollBar`| Function | Morozov Sergey | done |
|`contentStartOffset`| Function | Morozov Sergey | done |
|`contentEndOffset`| Function | Morozov Sergey | done |
|`divider`| Function | Morozov Sergey | done |
|`editMode`| Function | Morozov Sergey | done |
|`multiSelectable`| Function | Morozov Sergey | done |
|`cachedCount`| Function | Morozov Sergey | done |
|`chainAnimation`| Function | Morozov Sergey | done |
|`chainAnimationOptions`| Function | Morozov Sergey | done |
|`sticky`| Function | Morozov Sergey | done |
|`scrollSnapAlign`| Function | Morozov Sergey | done |
|`nestedScroll`| Function | Morozov Sergey | done |
|`enableScrollInteraction`| Function | Morozov Sergey | done |
|`friction`| Function | Morozov Sergey | done |
|`childrenMainSize`| Function | Morozov Sergey | done |
|`maintainVisibleContentPosition`| Function | Morozov Sergey | done |
|`onScroll`| Function | Morozov Sergey | done |
|`onScrollIndex`| Function | Morozov Sergey | done |
|`onScrollVisibleContentChange`| Function | Morozov Sergey | done |
|`onReachStart`| Function | Morozov Sergey | done |
|`onReachEnd`| Function | Morozov Sergey | done |
|`onScrollStart`| Function | Morozov Sergey | done |
|`onScrollStop`| Function | Morozov Sergey | done |
|`onItemDelete`| Function | Skroba Gleb | deprecated |
|`onItemMove`| Function | Skroba Gleb | done |
|`onItemDragStart`| Function | Skroba Gleb | done |
|`onItemDragEnter`| Function | Morozov Sergey | done |
|`onItemDragMove`| Function | Morozov Sergey | done |
|`onItemDragLeave`| Function | Morozov Sergey | done |
|`onItemDrop`| Function | Morozov Sergey | done |
|`onScrollFrameBegin`| Function | Skroba Gleb | done |
|`lanes`| Function | Morozov Sergey | done |
|`edgeEffect`| Function | Morozov Sergey | done |
|*ListItem*| *Component* | Morozov Sergey | done |
|`setListItemOptions`| Function | Morozov Sergey | done |
|`sticky`| Function | Morozov Sergey | done |
|`editable`| Function | Morozov Sergey | done |
|`selectable`| Function | Morozov Sergey | done |
|`selected`| Function | Morozov Sergey | done |
|`swipeAction`| Function | Samarin Sergey | done |
|`onSelect`| Function | Morozov Sergey | done |
|`_onChangeEvent_selected`| Function | Erokhin Ilya | done |
|*ListItemGroup*| *Component* | Morozov Sergey | done |
|`setListItemGroupOptions`| Function | Dmitry A Smirnov | done |
|`divider`| Function | Morozov Sergey | done |
|`childrenMainSize`| Function | Morozov Sergey | done |
|*LoadingProgress*| *Component* | Samarin Sergey | done |
|`setLoadingProgressOptions`| Function | Samarin Sergey | done |
|`color`| Function | Samarin Sergey | done |
|`enableLoading`| Function | Samarin Sergey | done |
|`contentModifier`| Function | Samarin Sergey | blocked IDL |
|*LocationButton*| *Component* | Samarin Sergey | done |
|`setLocationButtonOptions`| Function | Samarin Sergey | done |
|`onClick`| Function | Samarin Sergey, Maksimov Nikita, Pavelyev Ivan | done |
|*Marquee*| *Component* | Andrey Khudenkikh | done |
|`setMarqueeOptions`| Function | Andrey Khudenkikh | done |
|`fontColor`| Function | Andrey Khudenkikh | done |
|`fontSize`| Function | Andrey Khudenkikh | done |
|`allowScale`| Function | Andrey Khudenkikh | done |
|`fontWeight`| Function | Andrey Khudenkikh | done |
|`fontFamily`| Function | Andrey Khudenkikh | done |
|`marqueeUpdateStrategy`| Function | Andrey Khudenkikh | done |
|`onStart`| Function | Andrey Khudenkikh | done |
|`onBounce`| Function | Andrey Khudenkikh | done |
|`onFinish`| Function | Andrey Khudenkikh | done |
|*MediaCachedImage*| *Component* | Skroba Gleb | in progress |
|`setMediaCachedImageOptions`| Function | Skroba Gleb | in progress |
|*Menu*| *Component* | Morozov Sergey | done |
|`setMenuOptions`| Function | Morozov Sergey | done |
|`fontSize`| Function | Morozov Sergey | done |
|`font`| Function | Morozov Sergey | done |
|`fontColor`| Function | Morozov Sergey | done |
|`radius`| Function | Morozov Sergey | done |
|`menuItemDivider`| Function | Morozov Sergey | done |
|`menuItemGroupDivider`| Function | Morozov Sergey | done |
|`subMenuExpandingMode`| Function | Morozov Sergey | done |
|*MenuItem*| *Component* | Morozov Sergey | blocked |
|`setMenuItemOptions`| Function | Kovalev Sergey | blocked IDL |
|`selected`| Function | Morozov Sergey | done |
|`selectIcon`| Function | Morozov Sergey | blocked IDL |
|`onChange`| Function | Morozov Sergey | done |
|`contentFont`| Function | Morozov Sergey | done |
|`contentFontColor`| Function | Morozov Sergey | done |
|`labelFont`| Function | Morozov Sergey | done |
|`labelFontColor`| Function | Morozov Sergey | done |
|`_onChangeEvent_selected`| Function | Erokhin Ilya | done |
|*MenuItemGroup*| *Component* | Morozov Sergey | done |
|`setMenuItemGroupOptions`| Function | Dmitry A Smirnov | done |
|*NavDestination*| *Component* | Kovalev Sergey | blocked IDL |
|`setNavDestinationOptions`| Function | Kovalev Sergey | done |
|`hideTitleBar`| Function | Kovalev Sergey | done |
|`hideBackButton`| Function |  |  |
|`onShown`| Function | Kovalev Sergey | done |
|`onHidden`| Function | Kovalev Sergey | done |
|`onBackPressed`| Function | Kovalev Sergey | blocked IDL |
|`onResult`| Function |  |  |
|`mode`| Function | Kovalev Sergey | done |
|`backButtonIcon`| Function | Kovalev Sergey | blocked IDL |
|`menus`| Function | Kovalev Sergey | blocked IDL |
|`onReady`| Function | Kovalev Sergey | blocked IDL |
|`onWillAppear`| Function | Kovalev Sergey | done |
|`onWillDisappear`| Function | Kovalev Sergey | done |
|`onWillShow`| Function | Kovalev Sergey | done |
|`onWillHide`| Function | Kovalev Sergey | done |
|`systemBarStyle`| Function | Kovalev Sergey | blocked IDL |
|`recoverable`| Function | Kovalev Sergey | done |
|`systemTransition`| Function | Kovalev Sergey | blocked IDL |
|`bindToScrollable`| Function |  |  |
|`bindToNestedScrollable`| Function |  |  |
|`title`| Function | Kovalev Sergey | blocked IDL |
|`toolbarConfiguration`| Function | Kovalev Sergey | blocked IDL |
|`hideToolBar`| Function | Kovalev Sergey | blocked IDL |
|`ignoreLayoutSafeArea`| Function | Kovalev Sergey | done |
|*NavRouter*| *Component* | Evstigneev Roman | blocked IDL |
|`setNavRouterOptions`| Function | Evstigneev Roman | blocked IDL |
|`onStateChange`| Function | Evstigneev Roman | done |
|`mode`| Function | Evstigneev Roman | done |
|*Navigator*| *Component* | Skroba Gleb | managed side |
|`setNavigatorOptions`| Function | Skroba Gleb | done |
|`active`| Function | Skroba Gleb | done |
|`type`| Function | Skroba Gleb | done |
|`target`| Function | Skroba Gleb | done |
|`params`| Function | Skroba Gleb | blocked IDL |
|*NodeContainer*| *Component* | Skroba Gleb | blocked IDL |
|`setNodeContainerOptions`| Function | Skroba Gleb | blocked IDL |
|*Panel*| *Component* | Pavelyev Ivan | done |
|`setPanelOptions`| Function | Pavelyev Ivan | done |
|`mode`| Function | Pavelyev Ivan | done |
|`type`| Function | Pavelyev Ivan | done |
|`dragBar`| Function | Pavelyev Ivan | done |
|`customHeight`| Function | Pavelyev Ivan | done |
|`fullHeight`| Function | Pavelyev Ivan | done |
|`halfHeight`| Function | Pavelyev Ivan | done |
|`miniHeight`| Function | Pavelyev Ivan | done |
|`show`| Function | Pavelyev Ivan | done |
|`backgroundMask`| Function | Pavelyev Ivan | done |
|`showCloseIcon`| Function | Pavelyev Ivan | done |
|`onChange`| Function | Pavelyev Ivan | done |
|`onHeightChange`| Function | Pavelyev Ivan | done |
|`_onChangeEvent_mode`| Function | Erokhin Ilya | done |
|*PasteButton*| *Component* | Samarin Sergey | done |
|`setPasteButtonOptions`| Function | Samarin Sergey | done |
|`onClick`| Function | Samarin Sergey, Maksimov Nikita, Pavelyev Ivan | done |
|*Path*| *Component* | Skroba Gleb | done |
|`setPathOptions`| Function | Skroba Gleb | done |
|`commands`| Function | Skroba Gleb | done |
|*PatternLock*| *Component* | Dmitry A Smirnov | in progress |
|`setPatternLockOptions`| Function | Dmitry A Smirnov | done |
|`sideLength`| Function | Dmitry A Smirnov | done |
|`circleRadius`| Function | Dmitry A Smirnov | done |
|`backgroundColor`| Function | Dmitry A Smirnov | done |
|`regularColor`| Function | Dmitry A Smirnov | done |
|`selectedColor`| Function | Dmitry A Smirnov | done |
|`activeColor`| Function | Dmitry A Smirnov | done |
|`pathColor`| Function | Dmitry A Smirnov | done |
|`pathStrokeWidth`| Function | Dmitry A Smirnov | done |
|`onPatternComplete`| Function | Dmitry A Smirnov | done |
|`autoReset`| Function | Dmitry A Smirnov | done |
|`onDotConnect`| Function | Dmitry A Smirnov | done |
|`activateCircleStyle`| Function | Dmitry A Smirnov | done |
|`skipUnselectedPoint`| Function |  |  |
|*PluginComponent*| *Component* | Evstigneev Roman | blocked IDL |
|`setPluginComponentOptions`| Function | Evstigneev Roman | blocked IDL |
|`onComplete`| Function | Evstigneev Roman | done |
|`onError`| Function | Evstigneev Roman | done |
|*Polygon*| *Component* | Politov Mikhail | blocked |
|`setPolygonOptions`| Function | Politov Mikhail | done |
|`points`| Function | Politov Mikhail | blocked IDL |
|*Polyline*| *Component* | Politov Mikhail | blocked |
|`setPolylineOptions`| Function | Politov Mikhail | done |
|`points`| Function | Politov Mikhail | blocked IDL |
|*Progress*| *Component* | Erokhin Ilya | blocked |
|`setProgressOptions`| Function | Erokhin Ilya | done |
|`value`| Function | Erokhin Ilya | done |
|`color`| Function | Erokhin Ilya | done |
|`style`| Function | Erokhin Ilya | done |
|`privacySensitive`| Function | Erokhin Ilya | done |
|`contentModifier`| Function | Erokhin Ilya | blocked IDL |
|*QRCode*| *Component* | Evstigneev Roman | done |
|`setQRCodeOptions`| Function | Evstigneev Roman | done |
|`color`| Function | Evstigneev Roman | done |
|`backgroundColor`| Function | Evstigneev Roman | done |
|`contentOpacity`| Function | Evstigneev Roman | done |
|*Radio*| *Component* | Evstigneev Roman | done |
|`setRadioOptions`| Function | Dmitry A Smirnov | done |
|`checked`| Function | Evstigneev Roman | done |
|`onChange`| Function | Evstigneev Roman | done |
|`radioStyle`| Function | Evstigneev Roman | done |
|`contentModifier`| Function | Evstigneev Roman | blocked IDL |
|`_onChangeEvent_checked`| Function | Erokhin Ilya | done |
|*Rating*| *Component* | Lobah Mikhail | done |
|`setRatingOptions`| Function | Lobah Mikhail | done |
|`stars`| Function | Lobah Mikhail | done |
|`stepSize`| Function | Lobah Mikhail | done |
|`starStyle`| Function | Lobah Mikhail | done |
|`onChange`| Function | Lobah Mikhail | done |
|`contentModifier`| Function | Lobah Mikhail | blocked IDL |
|`_onChangeEvent_rating`| Function | Erokhin Ilya | done |
|*Rect*| *Component* | Dudkin Sergey | done |
|`setRectOptions`| Function | Dudkin Sergey | done |
|`radiusWidth`| Function | Dudkin Sergey | done |
|`radiusHeight`| Function | Dudkin Sergey | done |
|`radius`| Function | Dudkin Sergey | done |
|*Refresh*| *Component* | Politov Mikhail | blocked |
|`setRefreshOptions`| Function | Samarin Sergey | blocked IDL |
|`onStateChange`| Function | Politov Mikhail | done |
|`onRefreshing`| Function | Politov Mikhail | done |
|`refreshOffset`| Function | Politov Mikhail | done |
|`pullToRefresh`| Function | Politov Mikhail | done |
|`onOffsetChange`| Function | Politov Mikhail | done |
|`pullDownRatio`| Function | Politov Mikhail | done |
|`_onChangeEvent_refreshing`| Function | Erokhin Ilya | done |
|*RelativeContainer*| *Component* | Dmitry A Smirnov | done |
|`setRelativeContainerOptions`| Function | Dmitry A Smirnov | done |
|`guideLine`| Function | Dmitry A Smirnov | done |
|`barrier`| Function | Dmitry A Smirnov | done |
|*RichEditor*| *Component* | Dudkin Sergey | blocked IDL |
|`setRichEditorOptions`| Function | Dudkin Sergey | done |
|`onReady`| Function | Dudkin Sergey | done |
|`onSelect`| Function | Dudkin Sergey | in progress |
|`onSelectionChange`| Function | Dudkin Sergey | done |
|`aboutToIMEInput`| Function | Dudkin Sergey | done |
|`onIMEInputComplete`| Function | Dudkin Sergey | done |
|`onDidIMEInput`| Function | Dudkin Sergey | done |
|`aboutToDelete`| Function | Dudkin Sergey | done |
|`onDeleteComplete`| Function | Dudkin Sergey | done |
|`copyOptions`| Function | Dudkin Sergey | done |
|`onPaste`| Function | Dudkin Sergey | in progress |
|`enableDataDetector`| Function | Dudkin Sergey | done |
|`enablePreviewText`| Function | Dudkin Sergey | done |
|`dataDetectorConfig`| Function | Dudkin Sergey | done |
|`caretColor`| Function | Dudkin Sergey | done |
|`selectedBackgroundColor`| Function | Dudkin Sergey | done |
|`onEditingChange`| Function | Dudkin Sergey | done |
|`enterKeyType`| Function | Dudkin Sergey | done |
|`onSubmit`| Function | Dudkin Sergey | in progress |
|`onWillChange`| Function | Dudkin Sergey | in progress |
|`onDidChange`| Function | Dudkin Sergey | done |
|`onCut`| Function | Dudkin Sergey | done |
|`onCopy`| Function | Dudkin Sergey | done |
|`editMenuOptions`| Function | Maksimov Nikita | blocked IDL |
|`enableKeyboardOnFocus`| Function | Dudkin Sergey | done |
|`enableHapticFeedback`| Function | Dudkin Sergey | done |
|`barState`| Function | Dudkin Sergey | done |
|`maxLength`| Function |  |  |
|`maxLines`| Function |  |  |
|`bindSelectionMenu`| Function | Dmitry A Smirnov | done |
|`customKeyboard`| Function | Dmitry A Smirnov | done |
|`placeholder`| Function | Dudkin Sergey | done |
|*RichText*| *Component* | Dudkin Sergey | done |
|`setRichTextOptions`| Function | Dudkin Sergey | done |
|`onStart`| Function | Dudkin Sergey | done |
|`onComplete`| Function | Dudkin Sergey | done |
|*RootScene*| *Component* | Spirin Andrey | done |
|`setRootSceneOptions`| Function | Spirin Andrey | done |
|*Row*| *Component* | Andrey Khudenkikh | done |
|`setRowOptions`| Function | Andrey Khudenkikh | done |
|`alignItems`| Function | Andrey Khudenkikh | done |
|`justifyContent`| Function | Andrey Khudenkikh | done |
|`pointLight`| Function | Evstigneev Roman, Andrey Khudenkikh | done |
|`reverse`| Function | Andrey Khudenkikh | done |
|*RowSplit*| *Component* | Dmitry A Smirnov | done |
|`setRowSplitOptions`| Function | Dmitry A Smirnov | done |
|`resizeable`| Function | Dmitry A Smirnov | done |
|*SaveButton*| *Component* | Samarin Sergey | done |
|`setSaveButtonOptions`| Function | Samarin Sergey | done |
|`onClick`| Function | Samarin Sergey, Maksimov Nikita, Pavelyev Ivan | done |
|*Screen*| *Component* | Dudkin Sergey | done |
|`setScreenOptions`| Function | Dudkin Sergey | done |
|*Scroll*| *Component* | Berezin Kirill | done |
|`setScrollOptions`| Function | Berezin Kirill | done |
|`scrollable`| Function | Berezin Kirill | done |
|`onScroll`| Function | Berezin Kirill | done |
|`onWillScroll`| Function | Berezin Kirill | done |
|`onDidScroll`| Function | Berezin Kirill | done |
|`onScrollEdge`| Function | Berezin Kirill | done |
|`onScrollStart`| Function | Berezin Kirill | done |
|`onScrollEnd`| Function | Berezin Kirill | done |
|`onScrollStop`| Function | Berezin Kirill | done |
|`scrollBar`| Function | Berezin Kirill | done |
|`scrollBarColor`| Function | Berezin Kirill | done |
|`scrollBarWidth`| Function | Berezin Kirill | done |
|`onScrollFrameBegin`| Function | Dudkin Sergey | done |
|`nestedScroll`| Function | Berezin Kirill | done |
|`enableScrollInteraction`| Function | Berezin Kirill | done |
|`friction`| Function | Berezin Kirill | done |
|`scrollSnap`| Function | Berezin Kirill | done |
|`enablePaging`| Function | Berezin Kirill | done |
|`initialOffset`| Function | Berezin Kirill | done |
|`edgeEffect`| Function | Berezin Kirill | done |
|*ScrollBar*| *Component* | Maksimov Nikita | done |
|`setScrollBarOptions`| Function | Maksimov Nikita | done |
|`enableNestedScroll`| Function | Maksimov Nikita | done |
|*Search*| *Component* | Evstigneev Roman | blocked IDL |
|`setSearchOptions`| Function | Evstigneev Roman | done |
|`fontColor`| Function | Evstigneev Roman | done |
|`searchIcon`| Function | Evstigneev Roman | blocked IDL |
|`cancelButton`| Function | Evstigneev Roman | blocked IDL |
|`textIndent`| Function | Evstigneev Roman | done |
|`onEditChange`| Function | Evstigneev Roman | done |
|`selectedBackgroundColor`| Function | Evstigneev Roman | done |
|`caretStyle`| Function | Evstigneev Roman | done |
|`placeholderColor`| Function | Evstigneev Roman | done |
|`placeholderFont`| Function | Evstigneev Roman | done |
|`textFont`| Function | Evstigneev Roman | done |
|`enterKeyType`| Function | Evstigneev Roman | done |
|`onSubmit`| Function | Evstigneev Roman | in progress |
|`onChange`| Function | Evstigneev Roman | done |
|`onTextSelectionChange`| Function | Evstigneev Roman | done |
|`onContentScroll`| Function | Evstigneev Roman | done |
|`onCopy`| Function | Evstigneev Roman | done |
|`onCut`| Function | Evstigneev Roman | done |
|`onPaste`| Function | Evstigneev Roman | done |
|`copyOption`| Function | Evstigneev Roman | done |
|`maxLength`| Function | Evstigneev Roman | done |
|`textAlign`| Function | Evstigneev Roman | done |
|`enableKeyboardOnFocus`| Function | Evstigneev Roman | done |
|`selectionMenuHidden`| Function | Evstigneev Roman | done |
|`minFontSize`| Function | Evstigneev Roman | done |
|`maxFontSize`| Function | Evstigneev Roman | done |
|`minFontScale`| Function | Kovalev Sergey | done |
|`maxFontScale`| Function | Kovalev Sergey | done |
|`decoration`| Function | Evstigneev Roman | done |
|`letterSpacing`| Function | Evstigneev Roman | done |
|`lineHeight`| Function | Evstigneev Roman | done |
|`type`| Function | Evstigneev Roman | done |
|`fontFeature`| Function | Evstigneev Roman | done |
|`onWillInsert`| Function | Skroba Gleb | done |
|`onDidInsert`| Function | Evstigneev Roman | done |
|`onWillDelete`| Function | Skroba Gleb | done |
|`onDidDelete`| Function | Evstigneev Roman | done |
|`editMenuOptions`| Function | Maksimov Nikita | blocked IDL |
|`enablePreviewText`| Function | Evstigneev Roman | done |
|`enableHapticFeedback`| Function | Evstigneev Roman | done |
|`halfLeading`| Function | Kovalev Sergey | done |
|`stopBackPress`| Function | Kovalev Sergey | done |
|`onWillChange`| Function |  |  |
|`searchButton`| Function | Evstigneev Roman | done |
|`inputFilter`| Function | Evstigneev Roman | in progress |
|`customKeyboard`| Function | Lobah Mikhail | done |
|`_onChangeEvent_value`| Function | Erokhin Ilya | done |
|*SecurityComponentMethod*| *Component* | Samarin Sergey | in progress |
|`iconSize`| Function | Samarin Sergey | done |
|`layoutDirection`| Function | Samarin Sergey | done |
|`position`| Function | Samarin Sergey | done |
|`markAnchor`| Function | Samarin Sergey | done |
|`offset`| Function | Samarin Sergey | done |
|`fontSize`| Function | Samarin Sergey | done |
|`fontStyle`| Function | Samarin Sergey | done |
|`fontWeight`| Function | Samarin Sergey | done |
|`fontFamily`| Function | Samarin Sergey | done |
|`fontColor`| Function | Samarin Sergey | done |
|`iconColor`| Function | Samarin Sergey | done |
|`backgroundColor`| Function | Samarin Sergey | done |
|`borderStyle`| Function | Samarin Sergey | done |
|`borderWidth`| Function | Samarin Sergey | done |
|`borderColor`| Function | Samarin Sergey | done |
|`borderRadius`| Function | Samarin Sergey | done |
|`padding`| Function | Samarin Sergey | done |
|`textIconSpace`| Function | Samarin Sergey | done |
|`key`| Function | Samarin Sergey | done |
|`width`| Function | Samarin Sergey | done |
|`height`| Function | Samarin Sergey | done |
|`size`| Function | Samarin Sergey | done |
|`constraintSize`| Function | Samarin Sergey | done |
|`align`| Function | Samarin Sergey | in progress |
|`alignRules`| Function | Samarin Sergey | in progress |
|`id`| Function | Samarin Sergey | in progress |
|`minFontScale`| Function | Samarin Sergey | in progress |
|`maxFontScale`| Function | Samarin Sergey | in progress |
|`maxLines`| Function | Samarin Sergey | in progress |
|`minFontSize`| Function | Samarin Sergey | in progress |
|`maxFontSize`| Function | Samarin Sergey | in progress |
|`heightAdaptivePolicy`| Function | Samarin Sergey | in progress |
|`enabled`| Function | Samarin Sergey | in progress |
|`chainMode`| Function | Samarin Sergey | in progress |
|*Select*| *Component* | Samarin Sergey | blocked |
|`setSelectOptions`| Function | Samarin Sergey | blocked IDL |
|`selected`| Function | Samarin Sergey | done |
|`value`| Function | Samarin Sergey | done |
|`font`| Function | Samarin Sergey | done |
|`fontColor`| Function | Samarin Sergey | done |
|`selectedOptionBgColor`| Function | Samarin Sergey | done |
|`selectedOptionFont`| Function | Samarin Sergey | done |
|`selectedOptionFontColor`| Function | Samarin Sergey | done |
|`optionBgColor`| Function | Samarin Sergey | done |
|`optionFont`| Function | Samarin Sergey | done |
|`optionFontColor`| Function | Samarin Sergey | done |
|`onSelect`| Function | Samarin Sergey | done |
|`space`| Function | Samarin Sergey | done |
|`arrowPosition`| Function | Samarin Sergey | done |
|`optionWidth`| Function | Samarin Sergey | done |
|`optionHeight`| Function | Samarin Sergey | done |
|`menuBackgroundColor`| Function | Samarin Sergey | done |
|`menuBackgroundBlurStyle`| Function | Samarin Sergey | done |
|`controlSize`| Function | Samarin Sergey | done |
|`menuItemContentModifier`| Function | Samarin Sergey | blocked IDL |
|`divider`| Function | Samarin Sergey | done |
|`textModifier`| Function | Samarin Sergey | in progress |
|`arrowModifier`| Function | Samarin Sergey | in progress |
|`menuAlign`| Function | Samarin Sergey | done |
|`_onChangeEvent_selected`| Function | Erokhin Ilya | done |
|`_onChangeEvent_value`| Function | Erokhin Ilya | done |
|*Shape*| *Component* | Dudkin Sergey | done |
|`setShapeOptions`| Function | Dudkin Sergey | in progress |
|`viewPort`| Function | Dudkin Sergey | done |
|`stroke`| Function | Dudkin Sergey | done |
|`fill`| Function | Dudkin Sergey | done |
|`strokeDashOffset`| Function | Dudkin Sergey | done |
|`strokeDashArray`| Function | Dudkin Sergey | blocked AceEngine |
|`strokeLineCap`| Function | Dudkin Sergey | done |
|`strokeLineJoin`| Function | Dudkin Sergey | done |
|`strokeMiterLimit`| Function | Dudkin Sergey | done |
|`strokeOpacity`| Function | Dudkin Sergey | done |
|`fillOpacity`| Function | Dudkin Sergey | done |
|`strokeWidth`| Function | Dudkin Sergey | done |
|`antiAlias`| Function | Dudkin Sergey | done |
|`mesh`| Function | Dudkin Sergey | blocked AceEngine |
|*Slider*| *Component* | Morozov Sergey | blocked |
|`setSliderOptions`| Function | Morozov Sergey | done |
|`blockColor`| Function | Morozov Sergey | done |
|`trackColor`| Function | Morozov Sergey | blocked IDL |
|`selectedColor`| Function | Morozov Sergey | done |
|`minLabel`| Function | Morozov Sergey | done |
|`maxLabel`| Function | Morozov Sergey | done |
|`showSteps`| Function | Morozov Sergey | done |
|`trackThickness`| Function | Morozov Sergey | done |
|`onChange`| Function | Morozov Sergey | done |
|`blockBorderColor`| Function | Morozov Sergey | done |
|`blockBorderWidth`| Function | Morozov Sergey | done |
|`stepColor`| Function | Morozov Sergey | done |
|`trackBorderRadius`| Function | Morozov Sergey | done |
|`selectedBorderRadius`| Function | Morozov Sergey | done |
|`blockSize`| Function | Morozov Sergey | done |
|`blockStyle`| Function | Morozov Sergey | in progress |
|`stepSize`| Function | Morozov Sergey | done |
|`sliderInteractionMode`| Function | Morozov Sergey | done |
|`minResponsiveDistance`| Function | Morozov Sergey | done |
|`contentModifier`| Function | Morozov Sergey | blocked IDL |
|`slideRange`| Function | Morozov Sergey | done |
|`digitalCrownSensitivity`| Function |  |  |
|`showTips`| Function | Morozov Sergey | done |
|`_onChangeEvent_value`| Function | Erokhin Ilya | done |
|*BaseSpan*| *Component* | Politov Mikhail | done |
|`textBackgroundStyle`| Function | Politov Mikhail | done |
|`baselineOffset`| Function | Politov Mikhail | done |
|*Span*| *Component* | Politov Mikhail | done |
|`setSpanOptions`| Function | Politov Mikhail | done |
|`font`| Function | Politov Mikhail | done |
|`fontColor`| Function | Politov Mikhail | done |
|`fontSize`| Function | Politov Mikhail | done |
|`fontStyle`| Function | Politov Mikhail | done |
|`fontWeight`| Function | Politov Mikhail | done |
|`fontFamily`| Function | Politov Mikhail | done |
|`decoration`| Function | Politov Mikhail | done |
|`letterSpacing`| Function | Politov Mikhail | done |
|`textCase`| Function | Politov Mikhail | done |
|`lineHeight`| Function | Politov Mikhail | done |
|`textShadow`| Function | Politov Mikhail | done |
|*Stack*| *Component* | Korobeinikov Evgeny | done |
|`setStackOptions`| Function | Korobeinikov Evgeny | done |
|`alignContent`| Function | Korobeinikov Evgeny | done |
|`pointLight`| Function | Evstigneev Roman, Andrey Khudenkikh | done |
|*Stepper*| *Component* | Morozov Sergey | done |
|`setStepperOptions`| Function | Morozov Sergey | done |
|`onFinish`| Function | Morozov Sergey | done |
|`onSkip`| Function | Morozov Sergey | done |
|`onChange`| Function | Morozov Sergey | done |
|`onNext`| Function | Morozov Sergey | done |
|`onPrevious`| Function | Morozov Sergey | done |
|`_onChangeEvent_index`| Function | Erokhin Ilya | done |
|*StepperItem*| *Component* | Morozov Sergey | done |
|`setStepperItemOptions`| Function | Morozov Sergey | done |
|`prevLabel`| Function | Morozov Sergey | done |
|`nextLabel`| Function | Morozov Sergey | done |
|`status`| Function | Morozov Sergey | done |
|*Swiper*| *Component* | Skroba Gleb | done |
|`setSwiperOptions`| Function | Skroba Gleb | done |
|`index`| Function | Skroba Gleb | done |
|`autoPlay`| Function | Skroba Gleb | done |
|`interval`| Function | Skroba Gleb | done |
|`indicator`| Function | Skroba Gleb | done |
|`loop`| Function | Skroba Gleb | done |
|`duration`| Function | Skroba Gleb | done |
|`vertical`| Function | Skroba Gleb | done |
|`itemSpace`| Function | Skroba Gleb | done |
|`displayMode`| Function | Skroba Gleb | done |
|`cachedCount`| Function | Skroba Gleb | done |
|`effectMode`| Function | Skroba Gleb | done |
|`disableSwipe`| Function | Skroba Gleb | done |
|`curve`| Function | Skroba Gleb | done |
|`onChange`| Function | Skroba Gleb | done |
|`indicatorStyle`| Function | Skroba Gleb | done |
|`onAnimationStart`| Function | Skroba Gleb | done |
|`onAnimationEnd`| Function | Skroba Gleb | done |
|`onGestureSwipe`| Function | Skroba Gleb | done |
|`nestedScroll`| Function | Skroba Gleb | done |
|`customContentTransition`| Function | Skroba Gleb | done |
|`onContentDidScroll`| Function | Skroba Gleb | done |
|`indicatorInteractive`| Function | Skroba Gleb | done |
|`pageFlipMode`| Function |  |  |
|`displayArrow`| Function | Skroba Gleb | done |
|`displayCount`| Function | Skroba Gleb | done |
|`prevMargin`| Function | Skroba Gleb | done |
|`nextMargin`| Function | Skroba Gleb | done |
|`_onChangeEvent_index`| Function | Erokhin Ilya | done |
|*IndicatorComponent*| *Component* | Andrey Khudenkikh | done |
|`setIndicatorComponentOptions`| Function | Andrey Khudenkikh | done |
|`initialIndex`| Function | Andrey Khudenkikh | done |
|`count`| Function | Andrey Khudenkikh | done |
|`style`| Function | Andrey Khudenkikh | done |
|`loop`| Function | Andrey Khudenkikh | done |
|`vertical`| Function | Andrey Khudenkikh | done |
|`onChange`| Function | Andrey Khudenkikh | done |
|*SymbolGlyph*| *Component* | Andrey Khudenkikh | in progress |
|`setSymbolGlyphOptions`| Function | Andrey Khudenkikh | done |
|`fontSize`| Function | Andrey Khudenkikh | done |
|`fontColor`| Function | Andrey Khudenkikh | done |
|`fontWeight`| Function | Andrey Khudenkikh | done |
|`effectStrategy`| Function | Andrey Khudenkikh | done |
|`renderingStrategy`| Function | Andrey Khudenkikh | done |
|`minFontScale`| Function | Kovalev Sergey | in progress |
|`maxFontScale`| Function | Kovalev Sergey | in progress |
|`symbolEffect`| Function | Andrey Khudenkikh | blocked IDL |
|*SymbolSpan*| *Component* | Dmitry A Smirnov | done |
|`setSymbolSpanOptions`| Function | Dmitry A Smirnov | done |
|`fontSize`| Function | Dmitry A Smirnov | done |
|`fontColor`| Function | Dmitry A Smirnov | done |
|`fontWeight`| Function | Dmitry A Smirnov | done |
|`effectStrategy`| Function | Dmitry A Smirnov | done |
|`renderingStrategy`| Function | Dmitry A Smirnov | done |
|*Tabs*| *Component* | Tuzhilkin Ivan | done |
|`setTabsOptions`| Function | Skroba Gleb | done |
|`vertical`| Function | Tuzhilkin Ivan | done |
|`barPosition`| Function | Tuzhilkin Ivan | done |
|`scrollable`| Function | Tuzhilkin Ivan | done |
|`barMode`| Function | Tuzhilkin Ivan | done |
|`barWidth`| Function | Tuzhilkin Ivan | done |
|`barHeight`| Function | Tuzhilkin Ivan | done |
|`animationDuration`| Function | Tuzhilkin Ivan | done |
|`animationMode`| Function | Tuzhilkin Ivan | done |
|`edgeEffect`| Function | Tuzhilkin Ivan | done |
|`onChange`| Function | Tuzhilkin Ivan | done |
|`onTabBarClick`| Function | Tuzhilkin Ivan | done |
|`onAnimationStart`| Function | Tuzhilkin Ivan | done |
|`onAnimationEnd`| Function | Tuzhilkin Ivan | done |
|`onGestureSwipe`| Function | Tuzhilkin Ivan | done |
|`fadingEdge`| Function | Tuzhilkin Ivan | done |
|`divider`| Function | Tuzhilkin Ivan | done |
|`barOverlap`| Function | Tuzhilkin Ivan | done |
|`barBackgroundColor`| Function | Tuzhilkin Ivan | done |
|`barGridAlign`| Function | Tuzhilkin Ivan | done |
|`customContentTransition`| Function | Dudkin Sergey | done |
|`barBackgroundBlurStyle`| Function | Tuzhilkin Ivan | done |
|`barBackgroundEffect`| Function | Tuzhilkin Ivan | done |
|`pageFlipMode`| Function |  |  |
|`onContentWillChange`| Function | Dudkin Sergey | done |
|`barModeScrollable`| Function | Tuzhilkin Ivan | done |
|`_onChangeEvent_index`| Function | Erokhin Ilya | done |
|*TabContent*| *Component* | Evstigneev Roman | done |
|`setTabContentOptions`| Function | Evstigneev Roman | done |
|`tabBar`| Function | Lobah Mikhail | done |
|`onWillShow`| Function | Evstigneev Roman | done |
|`onWillHide`| Function | Evstigneev Roman | done |
|*Text*| *Component* | Samarin Sergey | blocked |
|`setTextOptions`| Function | Kirill Kirichenko | done |
|`font`| Function | Samarin Sergey | done |
|`fontColor`| Function | Samarin Sergey | done |
|`fontSize`| Function | Samarin Sergey | done |
|`minFontSize`| Function | Samarin Sergey | done |
|`maxFontSize`| Function | Samarin Sergey | done |
|`minFontScale`| Function | Samarin Sergey | done |
|`maxFontScale`| Function | Samarin Sergey | done |
|`fontStyle`| Function | Samarin Sergey | done |
|`fontWeight`| Function | Samarin Sergey | done |
|`lineSpacing`| Function | Samarin Sergey | done |
|`textAlign`| Function | Samarin Sergey | done |
|`lineHeight`| Function | Samarin Sergey | done |
|`textOverflow`| Function | Samarin Sergey | done |
|`fontFamily`| Function | Samarin Sergey | done |
|`maxLines`| Function | Samarin Sergey | done |
|`decoration`| Function | Samarin Sergey | done |
|`letterSpacing`| Function | Samarin Sergey | done |
|`textCase`| Function | Samarin Sergey | done |
|`baselineOffset`| Function | Samarin Sergey | done |
|`copyOption`| Function | Samarin Sergey | done |
|`draggable`| Function | Samarin Sergey | done |
|`textShadow`| Function | Samarin Sergey | done |
|`heightAdaptivePolicy`| Function | Samarin Sergey | done |
|`textIndent`| Function | Samarin Sergey | done |
|`wordBreak`| Function | Samarin Sergey | done |
|`lineBreakStrategy`| Function | Samarin Sergey | done |
|`onCopy`| Function | Kirill Kirichenko | done |
|`caretColor`| Function | Samarin Sergey | done |
|`selectedBackgroundColor`| Function | Samarin Sergey | done |
|`ellipsisMode`| Function | Samarin Sergey | done |
|`enableDataDetector`| Function | Kirill Kirichenko | done |
|`dataDetectorConfig`| Function | Samarin Sergey | done |
|`onTextSelectionChange`| Function | Kirill Kirichenko | done |
|`fontFeature`| Function | Samarin Sergey | done |
|`marqueeOptions`| Function | Samarin Sergey | done |
|`onMarqueeStateChange`| Function | Samarin Sergey | done |
|`privacySensitive`| Function | Samarin Sergey | done |
|`textSelectable`| Function | Samarin Sergey | done |
|`editMenuOptions`| Function | Maksimov Nikita | blocked IDL |
|`halfLeading`| Function | Samarin Sergey | done |
|`enableHapticFeedback`| Function | Samarin Sergey | done |
|`selection`| Function | Samarin Sergey | done |
|`bindSelectionMenu`| Function | Lobah Mikhail | done |
|*TextArea*| *Component* | Tuzhilkin Ivan | blocked IDL |
|`setTextAreaOptions`| Function | Tuzhilkin Ivan | done |
|`placeholderColor`| Function | Tuzhilkin Ivan | done |
|`placeholderFont`| Function | Tuzhilkin Ivan | done |
|`enterKeyType`| Function | Tuzhilkin Ivan | done |
|`textAlign`| Function | Tuzhilkin Ivan | done |
|`caretColor`| Function | Tuzhilkin Ivan | done |
|`fontColor`| Function | Tuzhilkin Ivan | done |
|`fontSize`| Function | Tuzhilkin Ivan | done |
|`fontStyle`| Function | Tuzhilkin Ivan | done |
|`fontWeight`| Function | Tuzhilkin Ivan | done |
|`fontFamily`| Function | Tuzhilkin Ivan | done |
|`textOverflow`| Function | Tuzhilkin Ivan | done |
|`textIndent`| Function | Tuzhilkin Ivan | done |
|`caretStyle`| Function | Tuzhilkin Ivan | done |
|`selectedBackgroundColor`| Function | Tuzhilkin Ivan | done |
|`onSubmit`| Function | Tuzhilkin Ivan, Spirin Andrey | in progress |
|`onChange`| Function | Tuzhilkin Ivan | done |
|`onTextSelectionChange`| Function | Tuzhilkin Ivan | done |
|`onContentScroll`| Function | Tuzhilkin Ivan | done |
|`onEditChange`| Function | Tuzhilkin Ivan | done |
|`onCopy`| Function | Tuzhilkin Ivan | done |
|`onCut`| Function | Tuzhilkin Ivan | done |
|`onPaste`| Function | Tuzhilkin Ivan | done |
|`copyOption`| Function | Tuzhilkin Ivan | done |
|`enableKeyboardOnFocus`| Function | Tuzhilkin Ivan | done |
|`maxLength`| Function | Tuzhilkin Ivan | done |
|`style`| Function | Tuzhilkin Ivan | done |
|`barState`| Function | Tuzhilkin Ivan | done |
|`selectionMenuHidden`| Function | Tuzhilkin Ivan | done |
|`minFontSize`| Function | Tuzhilkin Ivan | done |
|`maxFontSize`| Function | Tuzhilkin Ivan | done |
|`minFontScale`| Function | Kovalev Sergey | done |
|`maxFontScale`| Function | Kovalev Sergey | done |
|`heightAdaptivePolicy`| Function | Tuzhilkin Ivan | done |
|`maxLines`| Function | Tuzhilkin Ivan | done |
|`wordBreak`| Function | Tuzhilkin Ivan | done |
|`lineBreakStrategy`| Function | Tuzhilkin Ivan | done |
|`decoration`| Function | Tuzhilkin Ivan | done |
|`letterSpacing`| Function | Tuzhilkin Ivan | done |
|`lineSpacing`| Function | Tuzhilkin Ivan | done |
|`lineHeight`| Function | Tuzhilkin Ivan | done |
|`type`| Function | Tuzhilkin Ivan | done |
|`enableAutoFill`| Function | Tuzhilkin Ivan | done |
|`contentType`| Function | Tuzhilkin Ivan | done |
|`fontFeature`| Function | Tuzhilkin Ivan | done |
|`onWillInsert`| Function | Skroba Gleb | done |
|`onDidInsert`| Function | Tuzhilkin Ivan | done |
|`onWillDelete`| Function | Skroba Gleb | done |
|`onDidDelete`| Function | Tuzhilkin Ivan | done |
|`editMenuOptions`| Function | Maksimov Nikita | blocked IDL |
|`enablePreviewText`| Function | Tuzhilkin Ivan | done |
|`enableHapticFeedback`| Function | Tuzhilkin Ivan | done |
|`halfLeading`| Function | Kovalev Sergey | done |
|`ellipsisMode`| Function | Kovalev Sergey | done |
|`stopBackPress`| Function | Kovalev Sergey | done |
|`onWillChange`| Function |  |  |
|`inputFilter`| Function | Tuzhilkin Ivan | done |
|`showCounter`| Function | Tuzhilkin Ivan | done |
|`customKeyboard`| Function | Erokhin Ilya | done |
|`_onChangeEvent_text`| Function | Erokhin Ilya | done |
|*TextClock*| *Component* | Pavelyev Ivan | blocked IDL |
|`setTextClockOptions`| Function | Pavelyev Ivan | done |
|`format`| Function | Pavelyev Ivan | done |
|`onDateChange`| Function | Pavelyev Ivan | done |
|`fontColor`| Function | Pavelyev Ivan | done |
|`fontSize`| Function | Pavelyev Ivan | done |
|`fontStyle`| Function | Pavelyev Ivan | done |
|`fontWeight`| Function | Pavelyev Ivan | done |
|`fontFamily`| Function | Pavelyev Ivan | done |
|`textShadow`| Function | Pavelyev Ivan | done |
|`fontFeature`| Function | Pavelyev Ivan | done |
|`contentModifier`| Function | Pavelyev Ivan | blocked IDL |
|`dateTimeOptions`| Function | Pavelyev Ivan | blocked IDL |
|*TextInput*| *Component* | Spirin Andrey | in progress |
|`setTextInputOptions`| Function | Spirin Andrey | done |
|`type`| Function | Spirin Andrey | done |
|`contentType`| Function | Spirin Andrey | done |
|`placeholderColor`| Function | Spirin Andrey | done |
|`textOverflow`| Function | Spirin Andrey | blocked AceEngine |
|`textIndent`| Function | Spirin Andrey | done |
|`placeholderFont`| Function | Spirin Andrey | done |
|`enterKeyType`| Function | Spirin Andrey | done |
|`caretColor`| Function | Spirin Andrey | done |
|`onEditChanged`| Function | Spirin Andrey | done |
|`onEditChange`| Function | Spirin Andrey | done |
|`onSubmit`| Function | Spirin Andrey | in progress |
|`onChange`| Function | Lobah Mikhail | done |
|`onTextSelectionChange`| Function | Spirin Andrey | done |
|`onContentScroll`| Function | Spirin Andrey | done |
|`maxLength`| Function | Spirin Andrey | done |
|`fontColor`| Function | Spirin Andrey | done |
|`fontSize`| Function | Spirin Andrey | done |
|`fontStyle`| Function | Spirin Andrey | done |
|`fontWeight`| Function | Spirin Andrey | done |
|`fontFamily`| Function | Spirin Andrey | done |
|`onCopy`| Function | Spirin Andrey | done |
|`onCut`| Function | Spirin Andrey | done |
|`onPaste`| Function | Lobah Mikhail | done |
|`copyOption`| Function | Spirin Andrey | done |
|`showPasswordIcon`| Function | Spirin Andrey | done |
|`textAlign`| Function | Spirin Andrey | done |
|`style`| Function | Spirin Andrey | done |
|`caretStyle`| Function | Spirin Andrey | done |
|`selectedBackgroundColor`| Function | Spirin Andrey | done |
|`caretPosition`| Function | Spirin Andrey | done |
|`enableKeyboardOnFocus`| Function | Spirin Andrey | done |
|`passwordIcon`| Function | Spirin Andrey | done |
|`showError`| Function | Spirin Andrey | done |
|`showUnit`| Function | Erokhin Ilya | done |
|`showUnderline`| Function | Spirin Andrey | done |
|`underlineColor`| Function | Spirin Andrey | done |
|`selectionMenuHidden`| Function | Spirin Andrey | done |
|`barState`| Function | Spirin Andrey | done |
|`maxLines`| Function | Spirin Andrey | done |
|`wordBreak`| Function | Spirin Andrey | done |
|`lineBreakStrategy`| Function | Spirin Andrey | done |
|`cancelButton`| Function | Spirin Andrey, Andrey Khudenkikh | done |
|`selectAll`| Function | Spirin Andrey | done |
|`minFontSize`| Function | Spirin Andrey | done |
|`maxFontSize`| Function | Spirin Andrey | done |
|`minFontScale`| Function | Kovalev Sergey | done |
|`maxFontScale`| Function | Kovalev Sergey | done |
|`heightAdaptivePolicy`| Function | Spirin Andrey | done |
|`enableAutoFill`| Function | Spirin Andrey | done |
|`decoration`| Function | Spirin Andrey | done |
|`letterSpacing`| Function | Spirin Andrey | done |
|`lineHeight`| Function | Spirin Andrey | done |
|`passwordRules`| Function | Spirin Andrey | done |
|`fontFeature`| Function | Spirin Andrey | done |
|`showPassword`| Function | Spirin Andrey | done |
|`onSecurityStateChange`| Function | Spirin Andrey | done |
|`onWillInsert`| Function | Skroba Gleb | done |
|`onDidInsert`| Function | Spirin Andrey | done |
|`onWillDelete`| Function | Skroba Gleb | done |
|`onDidDelete`| Function | Spirin Andrey | done |
|`editMenuOptions`| Function | Maksimov Nikita | blocked IDL |
|`enablePreviewText`| Function | Spirin Andrey | done |
|`enableHapticFeedback`| Function | Spirin Andrey | done |
|`halfLeading`| Function | Kovalev Sergey | done |
|`ellipsisMode`| Function | Kovalev Sergey | done |
|`stopBackPress`| Function | Kovalev Sergey | done |
|`onWillChange`| Function |  |  |
|`inputFilter`| Function | Spirin Andrey | done |
|`customKeyboard`| Function | Lobah Mikhail | done |
|`showCounter`| Function | Spirin Andrey | blocked AceEngine |
|`_onChangeEvent_text`| Function | Erokhin Ilya | done |
|*TextPicker*| *Component* | Ekaterina Stepanova | in progress |
|`setTextPickerOptions`| Function | Tuzhilkin Ivan | done |
|`defaultPickerItemHeight`| Function | Ekaterina Stepanova | done |
|`canLoop`| Function | Ekaterina Stepanova | done |
|`disappearTextStyle`| Function | Ekaterina Stepanova | done |
|`textStyle`| Function | Ekaterina Stepanova | done |
|`selectedTextStyle`| Function | Ekaterina Stepanova | done |
|`disableTextStyleAnimation`| Function |  |  |
|`defaultTextStyle`| Function |  |  |
|`onAccept`| Function | Ekaterina Stepanova | done |
|`onCancel`| Function | Ekaterina Stepanova | done |
|`onChange`| Function | Tuzhilkin Ivan | done |
|`onScrollStop`| Function |  |  |
|`onEnterSelectedArea`| Function |  |  |
|`selectedIndex`| Function | Ekaterina Stepanova | done |
|`divider`| Function | Ekaterina Stepanova | done |
|`gradientHeight`| Function | Ekaterina Stepanova | done |
|`enableHapticFeedback`| Function |  |  |
|`digitalCrownSensitivity`| Function |  |  |
|`_onChangeEvent_selected`| Function | Erokhin Ilya | done |
|`_onChangeEvent_value`| Function | Erokhin Ilya | done |
|*TextTimer*| *Component* | Ekaterina Stepanova | blocked |
|`setTextTimerOptions`| Function | Ekaterina Stepanova | done |
|`format`| Function | Ekaterina Stepanova | done |
|`fontColor`| Function | Ekaterina Stepanova | done |
|`fontSize`| Function | Ekaterina Stepanova | done |
|`fontStyle`| Function | Ekaterina Stepanova | done |
|`fontWeight`| Function | Ekaterina Stepanova | done |
|`fontFamily`| Function | Ekaterina Stepanova | done |
|`onTimer`| Function | Ekaterina Stepanova | blocked IDL |
|`textShadow`| Function | Ekaterina Stepanova | blocked AceEngine |
|`contentModifier`| Function | Ekaterina Stepanova | blocked IDL |
|*TimePicker*| *Component* | Ekaterina Stepanova | blocked |
|`setTimePickerOptions`| Function | Ekaterina Stepanova | blocked IDL |
|`useMilitaryTime`| Function | Ekaterina Stepanova | done |
|`loop`| Function | Ekaterina Stepanova | done |
|`disappearTextStyle`| Function | Ekaterina Stepanova | done |
|`textStyle`| Function | Ekaterina Stepanova | done |
|`selectedTextStyle`| Function | Ekaterina Stepanova | done |
|`dateTimeOptions`| Function | Ekaterina Stepanova | blocked IDL |
|`onChange`| Function | Ekaterina Stepanova | done |
|`onEnterSelectedArea`| Function |  |  |
|`enableHapticFeedback`| Function | Ekaterina Stepanova | done |
|`digitalCrownSensitivity`| Function |  |  |
|`enableCascade`| Function |  |  |
|`_onChangeEvent_selected`| Function | Erokhin Ilya | done |
|*Toggle*| *Component* | Morozov Sergey | blocked |
|`setToggleOptions`| Function | Morozov Sergey | blocked IDL |
|`onChange`| Function | Morozov Sergey | done |
|`contentModifier`| Function | Morozov Sergey | blocked IDL |
|`selectedColor`| Function | Morozov Sergey | done |
|`switchPointColor`| Function | Morozov Sergey | done |
|`switchStyle`| Function | Morozov Sergey | done |
|`_onChangeEvent_isOn`| Function | Erokhin Ilya | done |
|*Video*| *Component* | Erokhin Ilya | blocked |
|`setVideoOptions`| Function | Erokhin Ilya | blocked AceEngine |
|`muted`| Function | Erokhin Ilya | done |
|`autoPlay`| Function | Erokhin Ilya | done |
|`controls`| Function | Erokhin Ilya | done |
|`loop`| Function | Erokhin Ilya | done |
|`objectFit`| Function | Erokhin Ilya | done |
|`onStart`| Function | Erokhin Ilya | done |
|`onPause`| Function | Erokhin Ilya | done |
|`onFinish`| Function | Erokhin Ilya | done |
|`onFullscreenChange`| Function | Erokhin Ilya | done |
|`onPrepared`| Function | Erokhin Ilya | done |
|`onSeeking`| Function | Erokhin Ilya | done |
|`onSeeked`| Function | Erokhin Ilya | done |
|`onUpdate`| Function | Erokhin Ilya | done |
|`onError`| Function | Erokhin Ilya | done |
|`onStop`| Function | Erokhin Ilya | done |
|`enableAnalyzer`| Function | Erokhin Ilya | done |
|`analyzerConfig`| Function | Erokhin Ilya | blocked AceEngine |
|`surfaceBackgroundColor`| Function |  |  |
|`enableShortcutKey`| Function |  |  |
|*Web*| *Component* | Erokhin Ilya | blocked |
|`setWebOptions`| Function | Erokhin Ilya | blocked IDL |
|`javaScriptAccess`| Function | Erokhin Ilya | done |
|`fileAccess`| Function | Erokhin Ilya | done |
|`onlineImageAccess`| Function | Erokhin Ilya | done |
|`domStorageAccess`| Function | Erokhin Ilya | done |
|`imageAccess`| Function | Erokhin Ilya | done |
|`mixedMode`| Function | Erokhin Ilya | done |
|`zoomAccess`| Function | Erokhin Ilya | done |
|`geolocationAccess`| Function | Erokhin Ilya | done |
|`javaScriptProxy`| Function | Erokhin Ilya | blocked IDL |
|`password`| Function | Erokhin Ilya | done |
|`cacheMode`| Function | Erokhin Ilya | done |
|`darkMode`| Function | Erokhin Ilya | done |
|`forceDarkAccess`| Function | Erokhin Ilya | done |
|`mediaOptions`| Function | Erokhin Ilya | done |
|`tableData`| Function | Erokhin Ilya | done |
|`wideViewModeAccess`| Function | Erokhin Ilya | done |
|`overviewModeAccess`| Function | Erokhin Ilya | done |
|`overScrollMode`| Function | Erokhin Ilya | done |
|`blurOnKeyboardHideMode`| Function |  |  |
|`textZoomAtio`| Function | Erokhin Ilya | done |
|`textZoomRatio`| Function | Erokhin Ilya | done |
|`databaseAccess`| Function | Erokhin Ilya | done |
|`initialScale`| Function | Erokhin Ilya | done |
|`userAgent`| Function | Erokhin Ilya | done |
|`metaViewport`| Function | Erokhin Ilya | done |
|`onPageEnd`| Function | Erokhin Ilya | done |
|`onPageBegin`| Function | Erokhin Ilya | done |
|`onProgressChange`| Function | Erokhin Ilya | done |
|`onTitleReceive`| Function | Erokhin Ilya | done |
|`onGeolocationHide`| Function | Erokhin Ilya | done |
|`onGeolocationShow`| Function | Erokhin Ilya | done |
|`onRequestSelected`| Function | Erokhin Ilya | done |
|`onAlert`| Function | Erokhin Ilya, Maksimov Nikita | done |
|`onBeforeUnload`| Function | Erokhin Ilya, Maksimov Nikita | done |
|`onConfirm`| Function | Erokhin Ilya, Maksimov Nikita | done |
|`onPrompt`| Function | Erokhin Ilya, Maksimov Nikita | done |
|`onConsole`| Function | Erokhin Ilya, Maksimov Nikita | done |
|`onErrorReceive`| Function | Erokhin Ilya | done |
|`onHttpErrorReceive`| Function | Erokhin Ilya | done |
|`onDownloadStart`| Function | Erokhin Ilya | done |
|`onRefreshAccessedHistory`| Function | Erokhin Ilya | done |
|`onUrlLoadIntercept`| Function | Erokhin Ilya, Maksimov Nikita | done |
|`onSslErrorReceive`| Function | Erokhin Ilya | done |
|`onRenderExited`| Function | Erokhin Ilya | done |
|`onShowFileSelector`| Function | Erokhin Ilya, Maksimov Nikita | done |
|`onFileSelectorShow`| Function | Erokhin Ilya | done |
|`onResourceLoad`| Function | Erokhin Ilya | done |
|`onFullScreenExit`| Function | Erokhin Ilya | done |
|`onFullScreenEnter`| Function | Erokhin Ilya | done |
|`onScaleChange`| Function | Erokhin Ilya | done |
|`onHttpAuthRequest`| Function | Erokhin Ilya, Maksimov Nikita | done |
|`onInterceptRequest`| Function | Erokhin Ilya, Maksimov Nikita | done |
|`onPermissionRequest`| Function | Erokhin Ilya | done |
|`onScreenCaptureRequest`| Function | Erokhin Ilya | done |
|`onContextMenuShow`| Function | Erokhin Ilya, Maksimov Nikita | done |
|`onContextMenuHide`| Function | Erokhin Ilya | done |
|`mediaPlayGestureAccess`| Function | Erokhin Ilya | done |
|`onSearchResultReceive`| Function | Erokhin Ilya | done |
|`onScroll`| Function | Erokhin Ilya | done |
|`onSslErrorEventReceive`| Function | Erokhin Ilya | done |
|`onSslErrorEvent`| Function | Erokhin Ilya | done |
|`onClientAuthenticationRequest`| Function | Erokhin Ilya | done |
|`onWindowNew`| Function | Erokhin Ilya | done |
|`onWindowExit`| Function | Erokhin Ilya | done |
|`multiWindowAccess`| Function | Erokhin Ilya | done |
|`onInterceptKeyEvent`| Function | Erokhin Ilya, Maksimov Nikita | done |
|`webStandardFont`| Function | Erokhin Ilya | done |
|`webSerifFont`| Function | Erokhin Ilya | done |
|`webSansSerifFont`| Function | Erokhin Ilya | done |
|`webFixedFont`| Function | Erokhin Ilya | done |
|`webFantasyFont`| Function | Erokhin Ilya | done |
|`webCursiveFont`| Function | Erokhin Ilya | done |
|`defaultFixedFontSize`| Function | Erokhin Ilya | done |
|`defaultFontSize`| Function | Erokhin Ilya | done |
|`minFontSize`| Function | Erokhin Ilya | done |
|`minLogicalFontSize`| Function | Erokhin Ilya | done |
|`defaultTextEncodingFormat`| Function | Erokhin Ilya | done |
|`forceDisplayScrollBar`| Function | Erokhin Ilya | done |
|`blockNetwork`| Function | Erokhin Ilya | done |
|`horizontalScrollBarAccess`| Function | Erokhin Ilya | done |
|`verticalScrollBarAccess`| Function | Erokhin Ilya | done |
|`onTouchIconUrlReceived`| Function | Erokhin Ilya | done |
|`onFaviconReceived`| Function | Erokhin Ilya | in progress |
|`onPageVisible`| Function | Erokhin Ilya | done |
|`onDataResubmitted`| Function | Erokhin Ilya | done |
|`pinchSmooth`| Function | Erokhin Ilya | done |
|`allowWindowOpenMethod`| Function | Erokhin Ilya | done |
|`onAudioStateChanged`| Function | Erokhin Ilya | done |
|`onFirstContentfulPaint`| Function | Erokhin Ilya | done |
|`onFirstMeaningfulPaint`| Function | Erokhin Ilya | done |
|`onLargestContentfulPaint`| Function | Erokhin Ilya | done |
|`onLoadIntercept`| Function | Erokhin Ilya, Maksimov Nikita | done |
|`onControllerAttached`| Function | Erokhin Ilya | done |
|`onOverScroll`| Function | Erokhin Ilya | done |
|`onSafeBrowsingCheckResult`| Function | Erokhin Ilya | done |
|`onNavigationEntryCommitted`| Function | Erokhin Ilya | done |
|`onIntelligentTrackingPreventionResult`| Function | Erokhin Ilya | done |
|`javaScriptOnDocumentStart`| Function | Erokhin Ilya | done |
|`javaScriptOnDocumentEnd`| Function | Erokhin Ilya | done |
|`layoutMode`| Function | Erokhin Ilya | done |
|`nestedScroll`| Function | Erokhin Ilya | done |
|`enableNativeEmbedMode`| Function | Erokhin Ilya | done |
|`onNativeEmbedLifecycleChange`| Function | Erokhin Ilya, Andrey Khudenkikh | done |
|`onNativeEmbedVisibilityChange`| Function | Erokhin Ilya | done |
|`onNativeEmbedGestureEvent`| Function | Erokhin Ilya, Andrey Khudenkikh | done |
|`copyOptions`| Function | Erokhin Ilya | done |
|`onOverrideUrlLoading`| Function | Erokhin Ilya, Maksimov Nikita | done |
|`textAutosizing`| Function | Erokhin Ilya | done |
|`enableNativeMediaPlayer`| Function | Erokhin Ilya | done |
|`enableSmoothDragResize`| Function | Erokhin Ilya | done |
|`onRenderProcessNotResponding`| Function | Erokhin Ilya | done |
|`onRenderProcessResponding`| Function | Erokhin Ilya | done |
|`selectionMenuOptions`| Function | Erokhin Ilya | done |
|`onViewportFitChanged`| Function | Erokhin Ilya | done |
|`onInterceptKeyboardAttach`| Function | Erokhin Ilya, Maksimov Nikita | done |
|`onAdsBlocked`| Function | Erokhin Ilya | done |
|`keyboardAvoidMode`| Function | Erokhin Ilya | done |
|`editMenuOptions`| Function | Erokhin Ilya, Maksimov Nikita | blocked IDL |
|`enableHapticFeedback`| Function | Erokhin Ilya | done |
|`enableFollowSystemFontWeight`| Function |  |  |
|`enableWebAVSession`| Function |  |  |
|`optimizeParserBudget`| Function |  |  |
|`runJavaScriptOnDocumentStart`| Function |  |  |
|`runJavaScriptOnDocumentEnd`| Function |  |  |
|`runJavaScriptOnHeadEnd`| Function |  |  |
|`registerNativeEmbedRule`| Function | Erokhin Ilya | done |
|`bindSelectionMenu`| Function | Lobah Mikhail | done |
|*WindowScene*| *Component* | Dudkin Sergey | done |
|`setWindowSceneOptions`| Function | Dudkin Sergey | done |
|`attractionEffect`| Function | Dudkin Sergey | done |
|*XComponent*| *Component* | Tuzhilkin Ivan | blocked IDL |
|`setXComponentOptions`| Function | Tuzhilkin Ivan | blocked IDL |
|`onLoad`| Function | Tuzhilkin Ivan | blocked IDL |
|`onDestroy`| Function | Tuzhilkin Ivan | done |
|`enableAnalyzer`| Function | Tuzhilkin Ivan | done |
|`enableSecure`| Function | Tuzhilkin Ivan | done |
|`hdrBrightness`| Function |  |  |
|`enableTransparentLayer`| Function |  |  |
|*SideBarContainer*| *Component* | Dmitry A Smirnov | in progress |
|`setSideBarContainerOptions`| Function | Dmitry A Smirnov | done |
|`showSideBar`| Function | Dmitry A Smirnov | done |
|`controlButton`| Function | Dmitry A Smirnov | in progress |
|`showControlButton`| Function | Dmitry A Smirnov | done |
|`onChange`| Function | Dmitry A Smirnov | done |
|`sideBarWidth`| Function | Dmitry A Smirnov | done |
|`minSideBarWidth`| Function | Dmitry A Smirnov | done |
|`maxSideBarWidth`| Function | Dmitry A Smirnov | done |
|`autoHide`| Function | Dmitry A Smirnov | done |
|`sideBarPosition`| Function | Dmitry A Smirnov | done |
|`divider`| Function | Dmitry A Smirnov | done |
|`minContentWidth`| Function | Dmitry A Smirnov | done |
|`_onChangeEvent_showSideBar`| Function | Erokhin Ilya | done |
|*RemoteWindow*| *Component* | Spirin Andrey, Evstigneev Roman | done |
|`setRemoteWindowOptions`| Function | Spirin Andrey, Evstigneev Roman | blocked AceEngine |
|*WaterFlow*| *Component* | Kovalev Sergey | done |
|`setWaterFlowOptions`| Function | Kovalev Sergey | done |
|`columnsTemplate`| Function | Kovalev Sergey | done |
|`itemConstraintSize`| Function | Kovalev Sergey | done |
|`rowsTemplate`| Function | Kovalev Sergey | done |
|`columnsGap`| Function | Kovalev Sergey | done |
|`rowsGap`| Function | Kovalev Sergey | done |
|`layoutDirection`| Function | Kovalev Sergey | done |
|`nestedScroll`| Function | Kovalev Sergey | done |
|`enableScrollInteraction`| Function | Kovalev Sergey | done |
|`friction`| Function | Kovalev Sergey | done |
|`cachedCount`| Function | Kovalev Sergey | done |
|`onReachStart`| Function | Kovalev Sergey | done |
|`onReachEnd`| Function | Kovalev Sergey | done |
|`onScrollFrameBegin`| Function | Dudkin Sergey | done |
|`onScrollIndex`| Function | Kovalev Sergey | done |
|*UIExtensionComponent*| *Component* | Tuzhilkin Ivan | blocked IDL |
|`setUIExtensionComponentOptions`| Function | Tuzhilkin Ivan | blocked IDL |
|`onRemoteReady`| Function | Tuzhilkin Ivan | done |
|`onReceive`| Function | Tuzhilkin Ivan | blocked IDL |
|`onResult`| Function | Tuzhilkin Ivan | deprecated |
|`onRelease`| Function | Tuzhilkin Ivan | deprecated |
|`onError`| Function | Tuzhilkin Ivan | blocked IDL |
|`onTerminated`| Function | Tuzhilkin Ivan | done |
|`onDrawReady`| Function |  |  |
|*LinearIndicator*| *Component* | Kovalev Sergey | done |
|`setLinearIndicatorOptions`| Function | Kovalev Sergey | done |
|`indicatorStyle`| Function | Kovalev Sergey | done |
|`indicatorLoop`| Function | Kovalev Sergey | done |
|`onChange`| Function | Kovalev Sergey | done |
|*AnimationExtender*| *Class* |  |  |
|`SetClipRect`| Function |  |  |
|`OpenImplicitAnimation`| Function |  |  |
|`CloseImplicitAnimation`| Function |  |  |
|`StartDoubleAnimation`| Function |  |  |
|`AnimationTranslate`| Function | | |
|*UnifiedData*| *Class* | Tuzhilkin Ivan | blocked IDL |
|`hasType`| Function | Tuzhilkin Ivan | blocked IDL |
|`getTypes`| Function | Tuzhilkin Ivan | blocked IDL |
|*LazyForEachOps*| *Class* | managed side |  |
|`NeedMoreElements`| Function | managed side |  |
|`OnRangeUpdate`| Function | managed side |  |
|`SetCurrentIndex`| Function | managed side |  |
|`Prepare`| Function | managed side |  |
|*DrawingCanvas*| *Class* | Dudkin Sergey | done |
|`drawRect`| Function | Dudkin Sergey | done |
|*LengthMetrics*| *Class* |  |  |
|`px`| Function |  |  |
|`resource`| Function |  |  |
|`getUnit`| Function |  |  |
|`setUnit`| Function |  |  |
|`getValue`| Function |  |  |
|`setValue`| Function |  |  |
|*WebviewController*| *Class* |  |  |
|`initializeWebEngine`| Function |  |  |
|`loadUrl`| Function |  |  |
|*GlobalScope_ohos_arkui_componentSnapshot*| *Class* |  |  |
|`get`| Function |  |  |
|*GlobalScope_ohos_arkui_performanceMonitor*| *Class* |  |  |
|`begin`| Function |  |  |
|`end`| Function |  |  |
|`recordInputEventTime`| Function |  |  |
|*FrameNode*| *Class* | Tuzhilkin Ivan | done |
|`isModifiable`| Function | Tuzhilkin Ivan | done |
|`appendChild`| Function | Tuzhilkin Ivan | done |
|`insertChildAfter`| Function | Tuzhilkin Ivan | done |
|`removeChild`| Function | Tuzhilkin Ivan | done |
|`clearChildren`| Function | Tuzhilkin Ivan | done |
|`getChild`| Function | Tuzhilkin Ivan | done |
|`getFirstChild`| Function | Tuzhilkin Ivan | done |
|`getNextSibling`| Function | Tuzhilkin Ivan | done |
|`getPreviousSibling`| Function | Tuzhilkin Ivan | done |
|`getParent`| Function | Tuzhilkin Ivan | done |
|`getChildrenCount`| Function | Tuzhilkin Ivan | done |
|`dispose`| Function | Tuzhilkin Ivan | done |
|`getOpacity`| Function |  |  |
|`getPositionToWindowWithTransform`| Function |  |  |
|*PixelMap*| *Class* | Andrey Khudenkikh | blocked |
|`readPixelsToBufferSync`| Function | Andrey Khudenkikh | blocked AceEngine |
|`writeBufferToPixels`| Function | Andrey Khudenkikh | blocked AceEngine |
|`getIsEditable`| Function | Andrey Khudenkikh | blocked AceEngine |
|`setIsEditable`| Function | Andrey Khudenkikh | blocked AceEngine |
|`getIsStrideAlignment`| Function | Andrey Khudenkikh | blocked AceEngine |
|`setIsStrideAlignment`| Function | Andrey Khudenkikh | blocked AceEngine |
|*NavExtender*| *Class* |  |  |
|`setUpdateStackCallback`| Function |  |  |
|*EventEmulator*| *Class* | Dmitry A Smirnov | blocked IDL |
|`emitClickEvent`| Function | Dmitry A Smirnov, Maksimov Nikita | done |
|`emitTextInputEvent`| Function | Dmitry A Smirnov | blocked IDL |
|*ActionSheet*| *Class* | Ekaterina Stepanova | blocked IDL |
|`show`| Function | Ekaterina Stepanova | blocked IDL |
|*AlertDialog*| *Class* | Ekaterina Stepanova | blocked IDL |
|`show`| Function | Ekaterina Stepanova | blocked IDL |
|*SpringProp*| *Class* | | |
|*SpringMotion*| *Class* | | |
|*FrictionMotion*| *Class* | | |
|*ScrollMotion*| *Class* | | |
|*CalendarController*| *Class* | Maksimov Nikita | done |
|`backToToday`| Function | Maksimov Nikita | done |
|`goTo`| Function | Maksimov Nikita | done |
|*CalendarPickerDialog*| *Class* | Ekaterina Stepanova | blocked IDL |
|`show`| Function | Ekaterina Stepanova | blocked IDL |
|*CanvasGradient*| *Class* | Vadim Voronov | done |
|`addColorStop`| Function | Vadim Voronov | done |
|*CanvasPath*| *Class* | Kovalev Sergey | done |
|`arc`| Function | Kovalev Sergey | done |
|`arcTo`| Function | Kovalev Sergey | done |
|`bezierCurveTo`| Function | Kovalev Sergey | done |
|`closePath`| Function | Kovalev Sergey | done |
|`ellipse`| Function | Kovalev Sergey | done |
|`lineTo`| Function | Kovalev Sergey | done |
|`moveTo`| Function | Kovalev Sergey | done |
|`quadraticCurveTo`| Function | Kovalev Sergey | done |
|`rect`| Function | Kovalev Sergey | done |
|*Path2D*| *Class* | Vadim Voronov | done |
|`addPath`| Function | Vadim Voronov | done |
|*CanvasPattern*| *Class* | Andrey Khudenkikh | done |
|`setTransform`| Function | Andrey Khudenkikh | done |
|*ImageBitmap*| *Class* | Pavelyev Ivan | done |
|`close`| Function | Pavelyev Ivan | done |
|`getHeight`| Function | Pavelyev Ivan | done |
|`getWidth`| Function | Pavelyev Ivan | done |
|*ImageData*| *Class* | | |
|`getHeight`| Function | | |
|`getWidth`| Function | | |
|*RenderingContextSettings*| *Class* | | |
|`getAntialias`| Function | | |
|`setAntialias`| Function | | |
|*CanvasRenderer*| *Class* | Vadim Voronov | blocked |
|`drawImage`| Function | Vadim Voronov | blocked IDL |
|`beginPath`| Function | Vadim Voronov | done |
|`clip`| Function | Vadim Voronov | done |
|`fill`| Function | Vadim Voronov | done |
|`stroke`| Function | Vadim Voronov | done |
|`createLinearGradient`| Function | Vadim Voronov | done |
|`createPattern`| Function | Vadim Voronov | done |
|`createRadialGradient`| Function | Vadim Voronov | done |
|`createConicGradient`| Function | Vadim Voronov | done |
|`createImageData`| Function | Vadim Voronov | done |
|`getImageData`| Function | Vadim Voronov | done |
|`getPixelMap`| Function | Vadim Voronov | blocked AceEngine |
|`putImageData`| Function | Vadim Voronov | done |
|`getLineDash`| Function | Vadim Voronov | blocked IDL |
|`setLineDash`| Function | Vadim Voronov | done |
|`clearRect`| Function | Vadim Voronov | done |
|`fillRect`| Function | Vadim Voronov | done |
|`strokeRect`| Function | Vadim Voronov | done |
|`restore`| Function | Vadim Voronov | done |
|`save`| Function | Vadim Voronov | done |
|`fillText`| Function | Vadim Voronov | done |
|`measureText`| Function | Vadim Voronov | done |
|`strokeText`| Function | Vadim Voronov | done |
|`getTransform`| Function | Vadim Voronov | done |
|`resetTransform`| Function | Vadim Voronov | done |
|`rotate`| Function | Vadim Voronov | done |
|`scale`| Function | Vadim Voronov | done |
|`setTransform`| Function | Vadim Voronov | done |
|`transform`| Function | Vadim Voronov | done |
|`translate`| Function | Vadim Voronov | done |
|`setPixelMap`| Function | Vadim Voronov | done |
|`transferFromImageBitmap`| Function | Vadim Voronov | done |
|`saveLayer`| Function | Vadim Voronov | done |
|`restoreLayer`| Function | Vadim Voronov | done |
|`reset`| Function | Vadim Voronov | done |
|`setLetterSpacing`| Function |  |  |
|`getGlobalAlpha`| Function | Vadim Voronov | blocked AceEngine |
|`setGlobalAlpha`| Function | Vadim Voronov | done |
|`getGlobalCompositeOperation`| Function | Vadim Voronov | blocked IDL |
|`setGlobalCompositeOperation`| Function | Vadim Voronov | done |
|`setFillStyle`| Function | Vadim Voronov | done |
|`setStrokeStyle`| Function | Vadim Voronov | done |
|`getFilter`| Function | Vadim Voronov | blocked IDL |
|`setFilter`| Function | Vadim Voronov | done |
|`getImageSmoothingEnabled`| Function | Vadim Voronov | blocked AceEngine |
|`setImageSmoothingEnabled`| Function | Vadim Voronov | done |
|`getImageSmoothingQuality`| Function | Vadim Voronov | blocked IDL |
|`setImageSmoothingQuality`| Function | Vadim Voronov | done |
|`getLineCap`| Function | Vadim Voronov | blocked IDL |
|`setLineCap`| Function | Vadim Voronov | done |
|`getLineDashOffset`| Function | Vadim Voronov | done |
|`setLineDashOffset`| Function | Vadim Voronov | done |
|`getLineJoin`| Function | Vadim Voronov | blocked IDL |
|`setLineJoin`| Function | Vadim Voronov | done |
|`getLineWidth`| Function | Vadim Voronov | blocked AceEngine |
|`setLineWidth`| Function | Vadim Voronov | done |
|`getMiterLimit`| Function | Vadim Voronov | blocked AceEngine |
|`setMiterLimit`| Function | Vadim Voronov | done |
|`getShadowBlur`| Function | Vadim Voronov | blocked AceEngine |
|`setShadowBlur`| Function | Vadim Voronov | done |
|`getShadowColor`| Function | Vadim Voronov | blocked IDL |
|`setShadowColor`| Function | Vadim Voronov | done |
|`getShadowOffsetX`| Function | Vadim Voronov | blocked AceEngine |
|`setShadowOffsetX`| Function | Vadim Voronov | done |
|`getShadowOffsetY`| Function | Vadim Voronov | blocked AceEngine |
|`setShadowOffsetY`| Function | Vadim Voronov | done |
|`getDirection`| Function | Vadim Voronov | blocked IDL |
|`setDirection`| Function | Vadim Voronov | done |
|`getFont`| Function | Vadim Voronov | blocked IDL |
|`setFont`| Function | Vadim Voronov | done |
|`getTextAlign`| Function | Vadim Voronov | blocked IDL |
|`setTextAlign`| Function | Vadim Voronov | done |
|`getTextBaseline`| Function | Vadim Voronov | blocked IDL |
|`setTextBaseline`| Function | Vadim Voronov | done |
|*CanvasRenderingContext2D*| *Class* | Vadim Voronov, Evstigneev Roman | done |
|`toDataURL`| Function | Vadim Voronov | done |
|`startImageAnalyzer`| Function | Vadim Voronov, Tuzhilkin Ivan | done |
|`stopImageAnalyzer`| Function | Vadim Voronov | done |
|`onOnAttach`| Function | Vadim Voronov, Evstigneev Roman | done |
|`offOnAttach`| Function | Vadim Voronov, Evstigneev Roman | done |
|`onOnDetach`| Function | Vadim Voronov, Evstigneev Roman | done |
|`offOnDetach`| Function | Vadim Voronov, Evstigneev Roman | done |
|`getHeight`| Function | Vadim Voronov | done |
|`getWidth`| Function | Vadim Voronov | done |
|*DrawingRenderingContext*| *Class* | Dudkin Sergey | done |
|`invalidate`| Function | Dudkin Sergey | done |
|*ICurve*| *Class* | Erokhin Ilya | blocked |
|`interpolate`| Function | Erokhin Ilya | blocked IDL |
|*DrawModifier*| *Class* | Erokhin Ilya | blocked |
|`drawBehind`| Function | Erokhin Ilya | blocked IDL |
|`drawContent`| Function | Erokhin Ilya | blocked IDL |
|`drawFront`| Function | Erokhin Ilya | blocked IDL |
|`invalidate`| Function | Erokhin Ilya | done |
|*TransitionEffect*| *Class* | Andrey Khudenkikh | done |
|`translate`| Function | Andrey Khudenkikh | done |
|`rotate`| Function | Andrey Khudenkikh | done |
|`scale`| Function | Andrey Khudenkikh | done |
|`opacity`| Function | Andrey Khudenkikh | done |
|`move`| Function | Andrey Khudenkikh | done |
|`asymmetric`| Function | Andrey Khudenkikh | done |
|`animation`| Function | Andrey Khudenkikh | done |
|`combine`| Function | Andrey Khudenkikh | done |
|*BaseEvent*| *Class* | Politov Mikhail | blocked IDL |
|`getModifierKeyState`| Function | Politov Mikhail | done |
|`setTarget`| Function | Politov Mikhail | done |
|`getTimestamp`| Function | Politov Mikhail | blocked IDL |
|`setTimestamp`| Function | Politov Mikhail | blocked IDL |
|`getSource`| Function | Politov Mikhail | blocked IDL |
|`setSource`| Function | Politov Mikhail | done |
|`getAxisHorizontal`| Function | Politov Mikhail | done |
|`setAxisHorizontal`| Function | Politov Mikhail | done |
|`getAxisVertical`| Function | Politov Mikhail | done |
|`setAxisVertical`| Function | Politov Mikhail | done |
|`getPressure`| Function | Politov Mikhail | done |
|`setPressure`| Function | Politov Mikhail | done |
|`getTiltX`| Function | Politov Mikhail | done |
|`setTiltX`| Function | Politov Mikhail | done |
|`getTiltY`| Function | Politov Mikhail | done |
|`setTiltY`| Function | Politov Mikhail | done |
|`getSourceTool`| Function | Politov Mikhail | blocked IDL |
|`setSourceTool`| Function | Politov Mikhail | done |
|`getDeviceId`| Function | Politov Mikhail | done |
|`setDeviceId`| Function | Politov Mikhail | done |
|`getTargetDisplayId`| Function | Politov Mikhail | in progress |
|`setTargetDisplayId`| Function | Politov Mikhail | in progress |
|*ClickEvent*| *Class* | Maksimov Nikita | in progress |
|`getDisplayX`| Function | Maksimov Nikita | in progress |
|`setDisplayX`| Function | Maksimov Nikita | in progress |
|`getDisplayY`| Function | Maksimov Nikita | in progress |
|`setDisplayY`| Function | Maksimov Nikita | in progress |
|`getWindowX`| Function | Maksimov Nikita | in progress |
|`setWindowX`| Function | Maksimov Nikita | in progress |
|`getWindowY`| Function | Maksimov Nikita | in progress |
|`setWindowY`| Function | Maksimov Nikita | in progress |
|`getScreenX`| Function | Maksimov Nikita | in progress |
|`setScreenX`| Function | Maksimov Nikita | in progress |
|`getScreenY`| Function | Maksimov Nikita | in progress |
|`setScreenY`| Function | Maksimov Nikita | in progress |
|`getX`| Function | Maksimov Nikita | in progress |
|`setX`| Function | Maksimov Nikita | in progress |
|`getY`| Function | Maksimov Nikita | in progress |
|`setY`| Function | Maksimov Nikita | in progress |
|`getPreventDefault`| Function | | |
|`setPreventDefault`| Function | Maksimov Nikita | in progress |
|*HoverEvent*| *Class* | Tuzhilkin Ivan | blocked IDL |
|`getStopPropagation`| Function | | |
|`setStopPropagation`| Function | Tuzhilkin Ivan | blocked IDL |
|*MouseEvent*| *Class* | Kovalev Sergey | done |
|`getButton`| Function | Kovalev Sergey | done |
|`setButton`| Function | Kovalev Sergey | done |
|`getAction`| Function | Kovalev Sergey | done |
|`setAction`| Function | Kovalev Sergey | done |
|`getDisplayX`| Function | Kovalev Sergey | done |
|`setDisplayX`| Function | Kovalev Sergey | done |
|`getDisplayY`| Function | Kovalev Sergey | done |
|`setDisplayY`| Function | Kovalev Sergey | done |
|`getWindowX`| Function | Kovalev Sergey | done |
|`setWindowX`| Function | Kovalev Sergey | done |
|`getWindowY`| Function | Kovalev Sergey | done |
|`setWindowY`| Function | Kovalev Sergey | done |
|`getScreenX`| Function | Kovalev Sergey | done |
|`setScreenX`| Function | Kovalev Sergey | done |
|`getScreenY`| Function | Kovalev Sergey | done |
|`setScreenY`| Function | Kovalev Sergey | done |
|`getX`| Function | Kovalev Sergey | done |
|`setX`| Function | Kovalev Sergey | done |
|`getY`| Function | Kovalev Sergey | done |
|`setY`| Function | Kovalev Sergey | done |
|`getStopPropagation`| Function | | |
|`setStopPropagation`| Function | Kovalev Sergey | blocked IDL |
|`getRawDeltaX`| Function |  | blocked |
|`setRawDeltaX`| Function |  | blocked |
|`getRawDeltaY`| Function |  | blocked |
|`setRawDeltaY`| Function |  | blocked |
|`setPressedButtons`| Function |  | blocked |
|*AccessibilityHoverEvent*| *Class* | Pavelyev Ivan | blocked IDL |
|`getType`| Function | Pavelyev Ivan | blocked IDL |
|`setType`| Function | Pavelyev Ivan | done |
|`getX`| Function | Pavelyev Ivan | done |
|`setX`| Function | Pavelyev Ivan | done |
|`getY`| Function | Pavelyev Ivan | done |
|`setY`| Function | Pavelyev Ivan | done |
|`getDisplayX`| Function | Pavelyev Ivan | done |
|`setDisplayX`| Function | Pavelyev Ivan | done |
|`getDisplayY`| Function | Pavelyev Ivan | done |
|`setDisplayY`| Function | Pavelyev Ivan | done |
|`getWindowX`| Function | Pavelyev Ivan | done |
|`setWindowX`| Function | Pavelyev Ivan | done |
|`getWindowY`| Function | Pavelyev Ivan | done |
|`setWindowY`| Function | Pavelyev Ivan | done |
|*TouchEvent*| *Class* | Tuzhilkin Ivan | blocked IDL |
|`getHistoricalPoints`| Function | Tuzhilkin Ivan | blocked IDL |
|`getType`| Function | Tuzhilkin Ivan | blocked IDL |
|`setType`| Function | Tuzhilkin Ivan | blocked IDL |
|`setTouches`| Function | Tuzhilkin Ivan | blocked IDL |
|`setChangedTouches`| Function | Tuzhilkin Ivan | blocked IDL |
|`getStopPropagation`| Function | | |
|`setStopPropagation`| Function | Tuzhilkin Ivan | blocked IDL |
|`getPreventDefault`| Function | | |
|`setPreventDefault`| Function | Tuzhilkin Ivan | blocked IDL |
|*PixelMapMock*| *Class* | Maksimov Nikita | done |
|`release`| Function | Maksimov Nikita | done |
|*DragEvent*| *Class* | Evstigneev Roman | in progress |
|`getDisplayX`| Function | Tuzhilkin Ivan | blocked IDL |
|`getDisplayY`| Function | Tuzhilkin Ivan | blocked IDL |
|`getWindowX`| Function | Evstigneev Roman | blocked IDL |
|`getWindowY`| Function | Evstigneev Roman | blocked IDL |
|`getX`| Function | Evstigneev Roman | blocked IDL |
|`getY`| Function | Evstigneev Roman | blocked IDL |
|`setData`| Function | Evstigneev Roman | done |
|`getData`| Function | Evstigneev Roman | blocked IDL |
|`getSummary`| Function | Tuzhilkin Ivan | blocked IDL |
|`setResult`| Function | Evstigneev Roman | done |
|`getResult`| Function | Evstigneev Roman | blocked IDL |
|`getPreviewRect`| Function | Evstigneev Roman | blocked IDL |
|`getVelocityX`| Function | Tuzhilkin Ivan | blocked IDL |
|`getVelocityY`| Function | Tuzhilkin Ivan | blocked IDL |
|`getVelocity`| Function | Tuzhilkin Ivan | blocked IDL |
|`getModifierKeyState`| Function | Tuzhilkin Ivan | done |
|`executeDropAnimation`| Function | Tuzhilkin Ivan | in progress |
|`getDragBehavior`| Function | Tuzhilkin Ivan | blocked IDL |
|`setDragBehavior`| Function | Tuzhilkin Ivan | done |
|`getUseCustomDropAnimation`| Function | Evstigneev Roman | in progress |
|`setUseCustomDropAnimation`| Function | Evstigneev Roman | in progress |
|*KeyEvent*| *Class* | Maksimov Nikita | blocked IDL |
|`getModifierKeyState`| Function | Maksimov Nikita | done |
|`getType`| Function | Maksimov Nikita | blocked IDL |
|`setType`| Function | Maksimov Nikita | done |
|`getKeyCode`| Function | Maksimov Nikita | done |
|`setKeyCode`| Function | Maksimov Nikita | done |
|`getKeyText`| Function | Maksimov Nikita | blocked IDL |
|`setKeyText`| Function | Maksimov Nikita | done |
|`getKeySource`| Function | Maksimov Nikita | blocked IDL |
|`setKeySource`| Function | Maksimov Nikita | done |
|`getDeviceId`| Function | Maksimov Nikita | done |
|`setDeviceId`| Function | Maksimov Nikita | done |
|`getMetaKey`| Function | Maksimov Nikita | done |
|`setMetaKey`| Function | Maksimov Nikita | done |
|`getTimestamp`| Function | Maksimov Nikita | blocked IDL |
|`setTimestamp`| Function | Maksimov Nikita | blocked IDL |
|`getStopPropagation`| Function | | |
|`setStopPropagation`| Function | Maksimov Nikita | done |
|`setIntentionCode`| Function | Maksimov Nikita | done |
|`getUnicode`| Function | Maksimov Nikita | done |
|`setUnicode`| Function | Maksimov Nikita | done |
|*FocusAxisEvent*| *Class* |  |  |
|`setAxisMap`| Function |  |  |
|`getStopPropagation`| Function | | |
|`setStopPropagation`| Function |  | blocked IDL |
|*ProgressMask*| *Class* | Maksimov Nikita | done |
|`updateProgress`| Function | Maksimov Nikita | done |
|`updateColor`| Function | Maksimov Nikita | done |
|`enableBreathingAnimation`| Function | Maksimov Nikita | done |
|*Measurable*| *Class* |  |  |
|`measure`| Function |  |  |
|`getMargin`| Function |  |  |
|`getPadding`| Function |  |  |
|`getBorderWidth`| Function |  |  |
|*View*| *Class* | Skroba Gleb | blocked IDL |
|`create`| Function | Skroba Gleb | blocked IDL |
|*TextContentControllerBase*| *Class* | Morozov Sergey | blocked IDL |
|`getCaretOffset`| Function | Morozov Sergey | blocked IDL |
|`getTextContentRect`| Function | Morozov Sergey | blocked IDL |
|`getTextContentLineCount`| Function | Morozov Sergey | done |
|`addText`| Function |  |  |
|`deleteText`| Function |  |  |
|`getSelection`| Function |  |  |
|*DynamicNode*| *Class* | Skroba Gleb | blocked ID |
|`onMove`| Function | Skroba Gleb | blocked IDL |
|*ChildrenMainSize*| *Class* | Morozov Sergey | blocked IDL |
|`splice`| Function | Morozov Sergey | done |
|`update`| Function | Morozov Sergey | done |
|`getChildDefaultSize`| Function | Morozov Sergey | blocked IDL |
|`setChildDefaultSize`| Function | Morozov Sergey | done |
|*UICommonEvent*| *Class* |  |  |
|`setOnClick`| Function |  |  |
|`setOnTouch`| Function |  |  |
|`setOnAppear`| Function |  |  |
|`setOnDisappear`| Function |  |  |
|`setOnKeyEvent`| Function |  |  |
|`setOnFocus`| Function |  |  |
|`setOnBlur`| Function |  |  |
|`setOnHover`| Function |  |  |
|`setOnMouse`| Function |  |  |
|`setOnSizeChange`| Function |  |  |
|`setOnVisibleAreaApproximateChange`| Function |  |  |
|*GestureModifier*| *Class* | Tuzhilkin Ivan | blocked IDL |
|`applyGesture`| Function | Tuzhilkin Ivan | blocked IDL |
|*GlobalScope_common*| *Class* | Erokhin Ilya | blocked IDL |
|`getContext`| Function | Erokhin Ilya | blocked IDL |
|`postCardAction`| Function | Erokhin Ilya | blocked IDL |
|`dollar_r`| Function | Erokhin Ilya | blocked IDL |
|`dollar_rawfile`| Function | Erokhin Ilya | blocked IDL |
|`animateTo`| Function | Erokhin Ilya | done |
|`animateToImmediately`| Function | Erokhin Ilya | done |
|`vp2px`| Function | Erokhin Ilya | done |
|`px2vp`| Function | Erokhin Ilya | done |
|`fp2px`| Function | Erokhin Ilya | done |
|`px2fp`| Function | Erokhin Ilya | done |
|`lpx2px`| Function | Erokhin Ilya | done |
|`px2lpx`| Function | Erokhin Ilya | done |
|`requestFocus`| Function | Erokhin Ilya | done |
|`setCursor`| Function | Erokhin Ilya | done |
|`restoreDefault`| Function | Erokhin Ilya | done |
|*ContextMenu*| *Class* | Tuzhilkin Ivan | blocked IDL |
|`close`| Function | Tuzhilkin Ivan | blocked IDL |
|*CustomDialogController*| *Class* | Maksimov Nikita | blocked IDL |
|`open`| Function | Maksimov Nikita | blocked IDL |
|`close`| Function | Maksimov Nikita | blocked IDL |
|*LinearGradient*| *Class* | | |
|*DatePickerDialog*| *Class* | Ekaterina Stepanova | blocked IDL |
|`show`| Function | Ekaterina Stepanova | blocked IDL |
|*BaseGestureEvent*| *Class* | Maksimov Nikita | done |
|`setFingerList`| Function | Maksimov Nikita | done |
|*TapGestureEvent*| *Class* |  |  |
|*LongPressGestureEvent*| *Class* |  |  |
|`getRepeat`| Function |  |  |
|`setRepeat`| Function |  |  |
|*PanGestureEvent*| *Class* |  |  |
|`getOffsetX`| Function |  |  |
|`setOffsetX`| Function |  |  |
|`getOffsetY`| Function |  |  |
|`setOffsetY`| Function |  |  |
|`getVelocityX`| Function |  |  |
|`setVelocityX`| Function |  |  |
|`getVelocityY`| Function |  |  |
|`setVelocityY`| Function |  |  |
|`getVelocity`| Function |  |  |
|`setVelocity`| Function |  |  |
|*PinchGestureEvent*| *Class* |  |  |
|`getScale`| Function |  |  |
|`setScale`| Function |  |  |
|`getPinchCenterX`| Function |  |  |
|`setPinchCenterX`| Function |  |  |
|`getPinchCenterY`| Function |  |  |
|`setPinchCenterY`| Function |  |  |
|*RotationGestureEvent*| *Class* |  |  |
|`getAngle`| Function |  |  |
|`setAngle`| Function |  |  |
|*SwipeGestureEvent*| *Class* |  |  |
|`getAngle`| Function |  |  |
|`setAngle`| Function |  |  |
|`getSpeed`| Function |  |  |
|`setSpeed`| Function |  |  |
|*GestureEvent*| *Class* | Samarin Sergey | blocked |
|`getRepeat`| Function | Samarin Sergey | done |
|`setRepeat`| Function | Samarin Sergey | done |
|`setFingerList`| Function | Samarin Sergey | done |
|`getOffsetX`| Function | Samarin Sergey | blocked IDL |
|`setOffsetX`| Function | Samarin Sergey | done |
|`getOffsetY`| Function | Samarin Sergey | blocked IDL |
|`setOffsetY`| Function | Samarin Sergey | done |
|`getAngle`| Function | Samarin Sergey | blocked IDL |
|`setAngle`| Function | Samarin Sergey | done |
|`getSpeed`| Function | Samarin Sergey | blocked IDL |
|`setSpeed`| Function | Samarin Sergey | done |
|`getScale`| Function | Samarin Sergey | blocked IDL |
|`setScale`| Function | Samarin Sergey | done |
|`getPinchCenterX`| Function | Samarin Sergey | blocked IDL |
|`setPinchCenterX`| Function | Samarin Sergey | done |
|`getPinchCenterY`| Function | Samarin Sergey | blocked IDL |
|`setPinchCenterY`| Function | Samarin Sergey | done |
|`getVelocityX`| Function | Samarin Sergey | blocked IDL |
|`setVelocityX`| Function | Samarin Sergey | done |
|`getVelocityY`| Function | Samarin Sergey | blocked IDL |
|`setVelocityY`| Function | Samarin Sergey | done |
|`getVelocity`| Function | Samarin Sergey | blocked IDL |
|`setVelocity`| Function | Samarin Sergey | blocked |
|*PanGestureOptions*| *Class* | Politov Mikhail | blocked |
|`setDirection`| Function | Politov Mikhail | done |
|`setDistance`| Function | Politov Mikhail | done |
|`setFingers`| Function | Politov Mikhail | done |
|`getDirection`| Function | Politov Mikhail | blocked IDL |
|*ScrollableTargetInfo*| *Class* | Maksimov Nikita | done |
|`isBegin`| Function | Maksimov Nikita | done |
|`isEnd`| Function | Maksimov Nikita | done |
|*EventTargetInfo*| *Class* | Maksimov Nikita | blocked IDL |
|`getId`| Function | Maksimov Nikita | blocked IDL |
|*GestureRecognizer*| *Class* | Kovalev Sergey | blocked IDL |
|`getTag`| Function | Kovalev Sergey | blocked IDL |
|`getType`| Function | Kovalev Sergey | blocked IDL |
|`isBuiltIn`| Function | Kovalev Sergey | done |
|`setEnabled`| Function | Kovalev Sergey | done |
|`isEnabled`| Function | Kovalev Sergey | done |
|`getState`| Function | Kovalev Sergey | done |
|`getEventTargetInfo`| Function | Maksimov Nikita | done |
|`isValid`| Function | Kovalev Sergey | done |
|*PanRecognizer*| *Class* | Politov Mikhail | done |
|`getPanGestureOptions`| Function | Politov Mikhail | done |
|*ImageAnalyzerController*| *Class* | Vadim Voronov | blocked |
|`getImageAnalyzerSupportTypes`| Function | Vadim Voronov | blocked IDL |
|*ListScroller*| *Class* | Morozov Sergey | blocked |
|`getItemRectInGroup`| Function | Morozov Sergey | blocked IDL |
|`scrollToItemInGroup`| Function | Morozov Sergey | done |
|`closeAllSwipeActions`| Function | Morozov Sergey | done |
|`getVisibleListContentInfo`| Function | Morozov Sergey | blocked IDL |
|*Matrix2D*| *Class* | Vadim Voronov | blocked IDL |
|`identity`| Function | Vadim Voronov | done |
|`invert`| Function | Vadim Voronov | done |
|`multiply`| Function | Vadim Voronov |  |
|`rotate`| Function | Vadim Voronov | done |
|`translate`| Function | Vadim Voronov | done |
|`scale`| Function | Vadim Voronov | done |
|`getScaleX`| Function | Vadim Voronov | blocked IDL |
|`setScaleX`| Function | Vadim Voronov | done |
|`getRotateY`| Function | Vadim Voronov | blocked IDL |
|`setRotateY`| Function | Vadim Voronov | done |
|`getRotateX`| Function | Vadim Voronov | blocked IDL |
|`setRotateX`| Function | Vadim Voronov | done |
|`getScaleY`| Function | Vadim Voronov | blocked IDL |
|`setScaleY`| Function | Vadim Voronov | done |
|`getTranslateX`| Function | Vadim Voronov | blocked IDL |
|`setTranslateX`| Function | Vadim Voronov | done |
|`getTranslateY`| Function | Vadim Voronov | blocked IDL |
|`setTranslateY`| Function | Vadim Voronov | done |
|*NavDestinationContext*| *Class* | Morozov Sergey | blocked IDL |
|`getConfigInRouteMap`| Function | Morozov Sergey | blocked IDL |
|`setPathInfo`| Function | Morozov Sergey | blocked IDL |
|`setPathStack`| Function | Morozov Sergey | blocked IDL |
|`getNavDestinationId`| Function | Morozov Sergey | blocked IDL |
|`setNavDestinationId`| Function | Morozov Sergey | done |
|*NavPathInfo*| *Class* | | |
|`getName`| Function | | |
|`setName`| Function | | |
|`setParam`| Function | | |
|`getOnPop`| Function | | |
|`setOnPop`| Function | | |
|`getIsEntry`| Function | | |
|`setIsEntry`| Function | | |
|*NavPathStack*| *Class* | Morozov Sergey | blocked IDL |
|`pushPath`| Function | Skroba Gleb | done |
|`pushDestination`| Function | Morozov Sergey | blocked IDL |
|`pushPathByName`| Function | Morozov Sergey | blocked IDL |
|`pushDestinationByName`| Function | Morozov Sergey | blocked IDL |
|`replacePath`| Function | Morozov Sergey | blocked IDL |
|`replaceDestination`| Function | Morozov Sergey | blocked IDL |
|`replacePathByName`| Function | Morozov Sergey | blocked IDL |
|`removeByIndexes`| Function | Morozov Sergey | blocked IDL |
|`removeByName`| Function | Morozov Sergey | blocked IDL |
|`removeByNavDestinationId`| Function | Morozov Sergey | blocked IDL |
|`pop`| Function | Skroba Gleb | blocked IDL |
|`popToName`| Function | Morozov Sergey | blocked IDL |
|`popToIndex`| Function | Morozov Sergey | blocked IDL |
|`moveToTop`| Function | Morozov Sergey | blocked IDL |
|`moveIndexToTop`| Function | Morozov Sergey | blocked IDL |
|`clear`| Function | Morozov Sergey | blocked IDL |
|`getAllPathName`| Function | Morozov Sergey | blocked IDL |
|`getParamByIndex`| Function | Morozov Sergey | blocked IDL |
|`getParamByName`| Function | Morozov Sergey, Skroba Gleb | blocked IDL |
|`getIndexByName`| Function | Morozov Sergey | blocked IDL |
|`getParent`| Function | Morozov Sergey | blocked IDL |
|`size`| Function | Skroba Gleb | done |
|`disableAnimation`| Function | Morozov Sergey | blocked IDL |
|`setInterception`| Function | Morozov Sergey | blocked IDL |
|*NavigationTransitionProxy*| *Class* | Morozov Sergey | blocked IDL |
|`finishTransition`| Function | Morozov Sergey | done |
|`cancelTransition`| Function | Morozov Sergey | done |
|`updateTransition`| Function | Morozov Sergey | done |
|`setFrom`| Function | Morozov Sergey | blocked IDL |
|`setTo`| Function | Morozov Sergey | blocked IDL |
|`getIsInteractive`| Function | Morozov Sergey | done |
|`setIsInteractive`| Function | Morozov Sergey | done |
|*PatternLockController*| *Class* | Dmitry A Smirnov | done |
|`reset`| Function | Dmitry A Smirnov | done |
|`setChallengeResult`| Function | Dmitry A Smirnov | done |
|*RichEditorBaseController*| *Class* | Dudkin Sergey | blocked |
|`getCaretOffset`| Function | Dudkin Sergey | done |
|`setCaretOffset`| Function | Dudkin Sergey | done |
|`closeSelectionMenu`| Function | Dudkin Sergey | done |
|`getTypingStyle`| Function | Dudkin Sergey | blocked IDL |
|`setTypingStyle`| Function | Dudkin Sergey | done |
|`setSelection`| Function | Dudkin Sergey | done |
|`isEditing`| Function | Dudkin Sergey | done |
|`stopEditing`| Function | Dudkin Sergey | done |
|`getLayoutManager`| Function | Dudkin Sergey | done |
|`getPreviewText`| Function | Dudkin Sergey | blocked IDL |
|`getCaretRect`| Function |  |  |
|*RichEditorController*| *Class* | Dudkin Sergey | blocked |
|`addTextSpan`| Function | Dudkin Sergey, Samarin Sergey | in progress |
|`addImageSpan`| Function | Dudkin Sergey, Maksimov Nikita, Tuzhilkin Ivan, Samarin Sergey | in progress |
|`addBuilderSpan`| Function | Lobah Mikhail | done |
|`addSymbolSpan`| Function | Dudkin Sergey | done |
|`updateSpanStyle`| Function | Dudkin Sergey | done |
|`updateParagraphStyle`| Function | Dudkin Sergey | done |
|`deleteSpans`| Function | Dudkin Sergey | done |
|`getSpans`| Function | Dudkin Sergey | done |
|`getParagraphs`| Function | Dudkin Sergey | blocked IDL |
|`getSelection`| Function | Dudkin Sergey | done |
|`fromStyledString`| Function | Dudkin Sergey | done |
|`toStyledString`| Function | Dudkin Sergey | done |
|*RichEditorStyledStringController*| *Class* | Dudkin Sergey | blocked IDL |
|`setStyledString`| Function | Dudkin Sergey | done |
|`getStyledString`| Function | Maksimov Nikita | done |
|`getSelection`| Function | Dudkin Sergey | blocked IDL |
|`onContentChanged`| Function | Dudkin Sergey | blocked IDL |
|*Scroller*| *Class* | Erokhin Ilya | blocked |
|`scrollTo`| Function | Erokhin Ilya | done |
|`scrollEdge`| Function | Erokhin Ilya | done |
|`fling`| Function | Erokhin Ilya | done |
|`scrollPage`| Function | Erokhin Ilya | done |
|`currentOffset`| Function | Erokhin Ilya | blocked IDL |
|`scrollToIndex`| Function | Erokhin Ilya | done |
|`scrollBy`| Function | Erokhin Ilya | done |
|`isAtEnd`| Function | Erokhin Ilya | done |
|`getItemRect`| Function | Erokhin Ilya | blocked IDL |
|`getItemIndex`| Function | Erokhin Ilya | done |
|*SearchController*| *Class* | Evstigneev Roman | done |
|`caretPosition`| Function | Evstigneev Roman | done |
|`stopEditing`| Function | Evstigneev Roman | done |
|`setTextSelection`| Function | Evstigneev Roman | done |
|*SwiperController*| *Class* | Skroba Gleb | done |
|`showNext`| Function | Skroba Gleb | done |
|`showPrevious`| Function | Skroba Gleb | done |
|`changeIndex`| Function | Skroba Gleb | done |
|`finishAnimation`| Function | Skroba Gleb | done |
|`preloadItems`| Function |  |  |
|*SwiperContentTransitionProxy*| *Class* | Skroba Gleb | blocked IDL |
|`finishTransition`| Function | Skroba Gleb | done |
|`getSelectedIndex`| Function | Skroba Gleb | blocked IDL |
|`setSelectedIndex`| Function | Skroba Gleb | done |
|`getIndex`| Function | Skroba Gleb | blocked IDL |
|`setIndex`| Function | Skroba Gleb | done |
|`getPosition`| Function | Skroba Gleb | blocked IDL |
|`setPosition`| Function | Skroba Gleb | done |
|`getMainAxisLength`| Function | Skroba Gleb | blocked IDL |
|`setMainAxisLength`| Function | Skroba Gleb | done |
|*IndicatorComponentController*| *Class* | Andrey Khudenkikh | done |
|`showNext`| Function | Andrey Khudenkikh | done |
|`showPrevious`| Function | Andrey Khudenkikh | done |
|`changeIndex`| Function | Andrey Khudenkikh | done |
|*ScaleSymbolEffect*| *Class* | | |
|`getScope`| Function | | |
|`setScope`| Function | | |
|`getDirection`| Function | | |
|`setDirection`| Function | | |
|*HierarchicalSymbolEffect*| *Class* | | |
|`getFillStyle`| Function | | |
|`setFillStyle`| Function | | |
|*AppearSymbolEffect*| *Class* | | |
|`getScope`| Function | | |
|`setScope`| Function | | |
|*DisappearSymbolEffect*| *Class* | | |
|`getScope`| Function | | |
|`setScope`| Function | | |
|*BounceSymbolEffect*| *Class* | | |
|`getScope`| Function | | |
|`setScope`| Function | | |
|`getDirection`| Function | | |
|`setDirection`| Function | | |
|*ReplaceSymbolEffect*| *Class* | | |
|`getScope`| Function | | |
|`setScope`| Function | | |
|*TabsController*| *Class* | Skroba Gleb | done |
|`changeIndex`| Function | Skroba Gleb | done |
|`preloadItems`| Function | Skroba Gleb | done |
|`setTabBarTranslate`| Function | Skroba Gleb | done |
|`setTabBarOpacity`| Function | Skroba Gleb | done |
|*TabContentTransitionProxy*| *Class* | Dudkin Sergey | done |
|`finishTransition`| Function | Dudkin Sergey | done |
|`getFrom`| Function | Dudkin Sergey | done |
|`setFrom`| Function | Dudkin Sergey | done |
|`getTo`| Function | Dudkin Sergey | done |
|`setTo`| Function | Dudkin Sergey | done |
|*TextController*| *Class* | Samarin Sergey | done |
|`closeSelectionMenu`| Function | Samarin Sergey | done |
|`setStyledString`| Function | Samarin Sergey | done |
|`getLayoutManager`| Function | Samarin Sergey | done |
|*TextAreaController*| *Class* | Tuzhilkin Ivan | done |
|`caretPosition`| Function | Tuzhilkin Ivan | done |
|`setTextSelection`| Function | Tuzhilkin Ivan | done |
|`stopEditing`| Function | Tuzhilkin Ivan | done |
|*TextClockController*| *Class* | Pavelyev Ivan | done |
|`start`| Function | Pavelyev Ivan | done |
|`stop`| Function | Pavelyev Ivan | done |
|*TextBaseController*| *Class* | Morozov Sergey | done |
|`setSelection`| Function | Morozov Sergey | done |
|`closeSelectionMenu`| Function | Morozov Sergey | done |
|`getLayoutManager`| Function | Morozov Sergey | done |
|*TextEditControllerEx*| *Class* | Morozov Sergey | blocked |
|`isEditing`| Function | Morozov Sergey | done |
|`stopEditing`| Function | Morozov Sergey | done |
|`setCaretOffset`| Function | Morozov Sergey | done |
|`getCaretOffset`| Function | Morozov Sergey | done |
|`getPreviewText`| Function | Morozov Sergey | blocked IDL |
|*StyledStringController*| *Class* | Pavelyev Ivan | done |
|`setStyledString`| Function | Pavelyev Ivan | done |
|`getStyledString`| Function | Pavelyev Ivan | done |
|*LayoutManager*| *Class* | Andrey Khudenkikh | blocked |
|`getLineCount`| Function | Andrey Khudenkikh | done |
|`getGlyphPositionAtCoordinate`| Function | Andrey Khudenkikh | blocked IDL |
|`getLineMetrics`| Function | Andrey Khudenkikh | blocked IDL |
|`getRectsForRange`| Function | Andrey Khudenkikh | blocked IDL |
|*TextMenuItemId*| *Class* | Maksimov Nikita | done |
|`of`| Function | Maksimov Nikita | done |
|`equals`| Function | Maksimov Nikita | done |
|*EditMenuOptions*| *Class* | Maksimov Nikita | blocked IDL |
|`onCreateMenu`| Function | Skroba Gleb | blocked IDL |
|`onMenuItemClick`| Function | Skroba Gleb | blocked IDL |
|*SubmitEvent*| *Class* | Tuzhilkin Ivan | blocked |
|`keepEditableState`| Function | | |
|`getText`| Function | Tuzhilkin Ivan | blocked IDL |
|`setText`| Function | Tuzhilkin Ivan | done |
|*TextInputController*| *Class* | Spirin Andrey | done |
|`caretPosition`| Function | Spirin Andrey | done |
|`setTextSelection`| Function | Spirin Andrey | done |
|`stopEditing`| Function | Spirin Andrey | done |
|*TextPickerDialog*| *Class* | Ekaterina Stepanova | blocked IDL |
|`show`| Function | Ekaterina Stepanova | blocked IDL |
|*TextTimerController*| *Class* | Ekaterina Stepanova | done |
|`start`| Function | Ekaterina Stepanova | done |
|`pause`| Function | Ekaterina Stepanova | done |
|`reset`| Function | Ekaterina Stepanova | done |
|*TimePickerDialog*| *Class* | Ekaterina Stepanova | blocked |
|`show`| Function | Ekaterina Stepanova | blocked IDL |
|*ColorFilter*| *Class* | | |
|*VideoController*| *Class* | Erokhin Ilya | done |
|`start`| Function | Erokhin Ilya | done |
|`pause`| Function | Erokhin Ilya | done |
|`stop`| Function | Erokhin Ilya | done |
|`setCurrentTime`| Function | Erokhin Ilya | done |
|`requestFullscreen`| Function | Erokhin Ilya | done |
|`exitFullscreen`| Function | Erokhin Ilya | done |
|`reset`| Function | Erokhin Ilya | done |
|*WebKeyboardController*| *Class* | Erokhin Ilya | done |
|`insertText`| Function | Erokhin Ilya | done |
|`deleteForward`| Function | Erokhin Ilya | done |
|`deleteBackward`| Function | Erokhin Ilya | done |
|`sendFunctionKey`| Function | Erokhin Ilya | done |
|`close`| Function | Erokhin Ilya | done |
|*FullScreenExitHandler*| *Class* | Erokhin Ilya | done |
|`exitFullScreen`| Function | Erokhin Ilya | done |
|*FileSelectorParam*| *Class* | Erokhin Ilya | blocked |
|`getTitle`| Function | Erokhin Ilya | blocked IDL |
|`getMode`| Function | Erokhin Ilya | blocked IDL |
|`getAcceptType`| Function | Erokhin Ilya | blocked IDL |
|`isCapture`| Function | Erokhin Ilya | done |
|`getMimeTypes`| Function |  |  |
|*JsResult*| *Class* | Erokhin Ilya | done |
|`handleCancel`| Function | Erokhin Ilya | done |
|`handleConfirm`| Function | Erokhin Ilya | done |
|`handlePromptConfirm`| Function | Erokhin Ilya | done |
|*FileSelectorResult*| *Class* | Erokhin Ilya | done |
|`handleFileList`| Function | Erokhin Ilya | done |
|*HttpAuthHandler*| *Class* | Erokhin Ilya | done |
|`confirm`| Function | Erokhin Ilya | done |
|`cancel`| Function | Erokhin Ilya | done |
|`isHttpAuthInfoSaved`| Function | Erokhin Ilya | done |
|*SslErrorHandler*| *Class* | Erokhin Ilya | done |
|`handleConfirm`| Function | Erokhin Ilya | done |
|`handleCancel`| Function | Erokhin Ilya | done |
|*ClientAuthenticationHandler*| *Class* | Erokhin Ilya | done |
|`confirm`| Function | Erokhin Ilya | done |
|`cancel`| Function | Erokhin Ilya | done |
|`ignore`| Function | Erokhin Ilya | done |
|*PermissionRequest*| *Class* | Erokhin Ilya | blocked |
|`deny`| Function | Erokhin Ilya | done |
|`getOrigin`| Function | Erokhin Ilya | blocked IDL |
|`getAccessibleResource`| Function | Erokhin Ilya | blocked IDL |
|`grant`| Function | Erokhin Ilya | done |
|*ScreenCaptureHandler*| *Class* | Erokhin Ilya | blocked |
|`getOrigin`| Function | Erokhin Ilya | blocked IDL |
|`grant`| Function | Erokhin Ilya | done |
|`deny`| Function | Erokhin Ilya | done |
|*DataResubmissionHandler*| *Class* | Erokhin Ilya | done |
|`resend`| Function | Erokhin Ilya | done |
|`cancel`| Function | Erokhin Ilya | done |
|*ControllerHandler*| *Class* | Erokhin Ilya | blocked |
|`setWebController`| Function | Erokhin Ilya | blocked IDL |
|*WebContextMenuParam*| *Class* | Erokhin Ilya | blocked |
|`x`| Function | Erokhin Ilya | done |
|`y`| Function | Erokhin Ilya | done |
|`getLinkUrl`| Function | Erokhin Ilya | blocked IDL |
|`getUnfilteredLinkUrl`| Function | Erokhin Ilya | blocked IDL |
|`getSourceUrl`| Function | Erokhin Ilya | blocked IDL |
|`existsImageContents`| Function | Erokhin Ilya | done |
|`getMediaType`| Function | Erokhin Ilya | blocked IDL |
|`getSelectionText`| Function | Erokhin Ilya | blocked IDL |
|`getSourceType`| Function | Erokhin Ilya | blocked IDL |
|`getInputFieldType`| Function | Erokhin Ilya | blocked IDL |
|`isEditable`| Function | Erokhin Ilya | done |
|`getEditStateFlags`| Function | Erokhin Ilya | done |
|`getPreviewWidth`| Function | Erokhin Ilya | done |
|`getPreviewHeight`| Function | Erokhin Ilya | done |
|*WebContextMenuResult*| *Class* | Erokhin Ilya | done |
|`closeContextMenu`| Function | Erokhin Ilya | done |
|`copyImage`| Function | Erokhin Ilya | done |
|`copy`| Function | Erokhin Ilya | done |
|`paste`| Function | Erokhin Ilya | done |
|`cut`| Function | Erokhin Ilya | done |
|`selectAll`| Function | Erokhin Ilya | done |
|*ConsoleMessage*| *Class* | Erokhin Ilya | blocked |
|`getMessage`| Function | Erokhin Ilya | blocked IDL |
|`getSourceId`| Function | Erokhin Ilya | blocked IDL |
|`getLineNumber`| Function | Erokhin Ilya | done |
|`getMessageLevel`| Function | Erokhin Ilya | blocked IDL |
|*WebResourceRequest*| *Class* | Erokhin Ilya | blocked |
|`getRequestHeader`| Function | Erokhin Ilya | blocked IDL |
|`getRequestUrl`| Function | Erokhin Ilya | blocked IDL |
|`isRequestGesture`| Function | Erokhin Ilya | done |
|`isMainFrame`| Function | Erokhin Ilya | done |
|`isRedirect`| Function | Erokhin Ilya | done |
|`getRequestMethod`| Function | Erokhin Ilya | blocked IDL |
|*WebResourceResponse*| *Class* | Erokhin Ilya | blocked |
|`getResponseData`| Function | Erokhin Ilya | blocked IDL |
|`getResponseDataEx`| Function | Erokhin Ilya | blocked IDL |
|`getResponseEncoding`| Function | Erokhin Ilya | blocked IDL |
|`getResponseMimeType`| Function | Erokhin Ilya | blocked IDL |
|`getReasonMessage`| Function | Erokhin Ilya | blocked IDL |
|`getResponseHeader`| Function | Erokhin Ilya | blocked IDL |
|`getResponseCode`| Function | Erokhin Ilya | done |
|`setResponseData`| Function | Erokhin Ilya | done |
|`setResponseEncoding`| Function | Erokhin Ilya | done |
|`setResponseMimeType`| Function | Erokhin Ilya | done |
|`setReasonMessage`| Function | Erokhin Ilya | done |
|`setResponseHeader`| Function | Erokhin Ilya | done |
|`setResponseCode`| Function | Erokhin Ilya | done |
|`setResponseIsReady`| Function | Erokhin Ilya | done |
|`getResponseIsReady`| Function | Erokhin Ilya | done |
|*WebResourceError*| *Class* | Erokhin Ilya | blocked |
|`getErrorInfo`| Function | Erokhin Ilya | blocked IDL |
|`getErrorCode`| Function | Erokhin Ilya | done |
|*JsGeolocation*| *Class* | Erokhin Ilya | done |
|`invoke`| Function | Erokhin Ilya | done |
|*WebCookie*| *Class* | Erokhin Ilya | done |
|`setCookie`| Function | Erokhin Ilya | done |
|`saveCookie`| Function | Erokhin Ilya | done |
|*EventResult*| *Class* | Erokhin Ilya | done |
|`setGestureEventResult`| Function | Erokhin Ilya | done |
|*WebController*| *Class* | Erokhin Ilya | deprecated |
|`onInactive`| Function | Erokhin Ilya | done |
|`onActive`| Function | Erokhin Ilya | done |
|`zoom`| Function | Erokhin Ilya | done |
|`clearHistory`| Function | Erokhin Ilya | done |
|`runJavaScript`| Function | Erokhin Ilya | deprecated |
|`loadData`| Function | Erokhin Ilya | done |
|`loadUrl`| Function | Erokhin Ilya | deprecated |
|`refresh`| Function | Erokhin Ilya | done |
|`stop`| Function | Erokhin Ilya | done |
|`registerJavaScriptProxy`| Function | Erokhin Ilya | deprecated |
|`deleteJavaScriptRegister`| Function | Erokhin Ilya | done |
|`getHitTest`| Function | Erokhin Ilya | deprecated |
|`requestFocus`| Function | Erokhin Ilya | done |
|`accessBackward`| Function | Erokhin Ilya | done |
|`accessForward`| Function | Erokhin Ilya | done |
|`accessStep`| Function | Erokhin Ilya | done |
|`backward`| Function | Erokhin Ilya | done |
|`forward`| Function | Erokhin Ilya | done |
|`getCookieManager`| Function | Erokhin Ilya | deprecated |
|*XComponentController*| *Class* | Tuzhilkin Ivan | blocked IDL |
|`getXComponentSurfaceId`| Function | Tuzhilkin Ivan | blocked IDL |
|`getXComponentContext`| Function | Tuzhilkin Ivan | blocked IDL |
|`setXComponentSurfaceSize`| Function | Tuzhilkin Ivan | done |
|`setXComponentSurfaceRect`| Function | Tuzhilkin Ivan | done |
|`getXComponentSurfaceRect`| Function | Tuzhilkin Ivan | blocked IDL |
|`setXComponentSurfaceRotation`| Function | Tuzhilkin Ivan | done |
|`getXComponentSurfaceRotation`| Function | Tuzhilkin Ivan | blocked IDL |
|`onSurfaceCreated`| Function | Tuzhilkin Ivan | blocked IDL |
|`onSurfaceChanged`| Function | Tuzhilkin Ivan | blocked IDL |
|`onSurfaceDestroyed`| Function | Tuzhilkin Ivan | blocked IDL |
|`startImageAnalyzer`| Function | Tuzhilkin Ivan | done |
|`stopImageAnalyzer`| Function | Tuzhilkin Ivan | done |
|*WaterFlowSections*| *Class* | Kovalev Sergey | in progress |
|`splice`| Function | Kovalev Sergey | done |
|`push`| Function | Kovalev Sergey | done |
|`update`| Function | Kovalev Sergey | done |
|`values`| Function | Kovalev Sergey | blocked IDL |
|`length`| Function | Kovalev Sergey | done |
|*UIExtensionProxy*| *Class* | Tuzhilkin Ivan | blocked |
|`send`| Function | Tuzhilkin Ivan | blocked IDL |
|`sendSync`| Function | Tuzhilkin Ivan | blocked IDL |
|`onAsyncReceiverRegister`| Function | Tuzhilkin Ivan | done |
|`onSyncReceiverRegister`| Function | Tuzhilkin Ivan | done |
|`offAsyncReceiverRegister`| Function | Tuzhilkin Ivan | done |
|`offSyncReceiverRegister`| Function | Tuzhilkin Ivan | done |
|*StyledString*| *Class* | Pavelyev Ivan | blocked |
|`getString`| Function | Pavelyev Ivan | blocked IDL |
|`getStyles`| Function | Pavelyev Ivan | blocked IDL |
|`equals`| Function | Pavelyev Ivan | done |
|`subStyledString`| Function | Pavelyev Ivan | done |
|`fromHtml`| Function | Pavelyev Ivan | in progress |
|`toHtml`| Function | Pavelyev Ivan | blocked IDL |
|`marshalling`| Function | Pavelyev Ivan | blocked IDL |
|`unmarshalling`| Function | Pavelyev Ivan | in progress |
|`getLength`| Function | Pavelyev Ivan | done |
|*TextStyle_styled_string*| *Class* | | |
|`getFontFamily`| Function | | |
|`getFontSize`| Function | | |
|`getFontWeight`| Function | | |
|`getFontStyle`| Function | | |
|*DecorationStyle*| *Class* | | |
|`getType`| Function | | |
|`getStyle`| Function | | |
|*BaselineOffsetStyle*| *Class* | | |
|`getBaselineOffset`| Function | | |
|*LetterSpacingStyle*| *Class* | | |
|`getLetterSpacing`| Function | | |
|*TextShadowStyle*| *Class* | | |
|*BackgroundColorStyle*| *Class* | | |
|*GestureStyle*| *Class* | | |
|*ParagraphStyle*| *Class* | | |
|`getTextAlign`| Function | | |
|`getTextIndent`| Function | | |
|`getMaxLines`| Function | | |
|`getOverflow`| Function | | |
|`getWordBreak`| Function | | |
|*LineHeightStyle*| *Class* | | |
|`getLineHeight`| Function | | |
|*UrlStyle*| *Class* | | |
|`getUrl`| Function | | |
|*MutableStyledString*| *Class* | Maksimov Nikita | blocked IDL |
|`replaceString`| Function | Maksimov Nikita | done |
|`insertString`| Function | Maksimov Nikita | done |
|`removeString`| Function | Maksimov Nikita | done |
|`replaceStyle`| Function | Maksimov Nikita | done |
|`setStyle`| Function | Maksimov Nikita | done |
|`removeStyle`| Function | Maksimov Nikita | done |
|`removeStyles`| Function | Maksimov Nikita | done |
|`clearStyles`| Function | Maksimov Nikita | done |
|`replaceStyledString`| Function | Maksimov Nikita | done |
|`insertStyledString`| Function | Maksimov Nikita | done |
|`appendStyledString`| Function | Maksimov Nikita | done |
|*ImageAttachment*| *Class* | | |
|`getVerticalAlign`| Function | | |
|`getObjectFit`| Function | | |
|*CustomSpan*| *Class* | Politov Mikhail | blocked IDL |
|`onMeasure`| Function | Politov Mikhail | blocked IDL |
|`onDraw`| Function | Politov Mikhail | blocked IDL |
|`invalidate`| Function | Politov Mikhail | blocked IDL |
|*LinearIndicatorController*| *Class* | Kovalev Sergey | done |
|`setProgress`| Function | Kovalev Sergey | done |
|`start`| Function | Kovalev Sergey | done |
|`pause`| Function | Kovalev Sergey | done |
|`stop`| Function | Kovalev Sergey | done |
|*GlobalScope_inspector*| *Class* |  |  |
|`getInspectorNodes`| Function |  |  |
|`getInspectorNodeById`| Function |  |  |
|`registerVsyncCallback`| Function |  |  |
|`unregisterVsyncCallback`| Function |  |  |
|`setAppBgColor`| Function |  |  |