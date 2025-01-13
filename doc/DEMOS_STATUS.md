# Components in demos pending implementation

# To sync with COMPONENTS.md:
# $ cd <project_root>
# $ npm run tracker [-- --verbose]

**Demos:**

**ENC - Encourager**\
**WON - Wonderous**\
**HEL - Healphydiet**


| Name                      | Kind      | Generated | Demo        | Owner/libace        | Status/libace    | Owner/ts          | Status/ts | Priority |
|---------------------------|-----------|-----------|-------------|---------------------|------------------|-------------------|-----------|----------|
| @ohos.router              | Class     |           |             | Kirill Kirichenko   | done             |                   |           |          |
| `back`                    | Function  |           | ENC, WON    | Kirill Kirichenko   | done             | Kirill Kirichenko |           | High     |
| `pageTransition`          | Function  |           | ENC, WON    |                     |                  | Kirill Kirichenko |           | High     |
| CustomDialogController    | Class     |           | HEL         | Erokhin Ilya        | blocked          |                   |           | Low      |
| `builder`                 | Function  |           |             | Erokhin Ilya        | blocked          |                   |           |          |
| `autoCancel`              | Function  |           |             | Erokhin Ilya        | done             |                   |           |          |
| `alignment`               | Function  |           |             | Erokhin Ilya        | done             |                   |           |          |
| `offset`                  | Function  |           |             | Erokhin Ilya        | done             |                   |           |          |
| `customStyle`             | Function  |           |             | Erokhin Ilya        | done             |                   |           |          |
| Rect                      | Component | No        | HEL         | Dudkin Sergey       | done             |                   |           | High     |
| `height, width`           | Options   |           | WON         | Dudkin Sergey       | done             |                   |           | High     |
| `height, radius, width`   | Options   |           | WON         | Dudkin Sergey       | done             |                   |           | High     |
| `radius`                  | Function  |           | WON         | Dudkin Sergey       | blocked AceEngine|                   |           |          |
| Navigator                 | Component | No        | HEL         | Skroba Gleb         | done             |                   |           | High     |
| `target`                  | Options   |           | HEL         | Skroba Gleb         | done             |                   |           | High     |
| `setNavigatorOptions`     | Function  |           | HEL         | Skroba Gleb         | done             |                   |           | High     |
| `active`                  | Function  |           | HEL         | Skroba Gleb         | done             |                   |           | High     |
| `type`                    | Function  |           | HEL         | Skroba Gleb         | done             |                   |           | High     |
| `target`                  | Function  |           | HEL         | Skroba Gleb         | done             |                   |           | High     |
| `params`                  | Function  |           | HEL         | Skroba Gleb         | blocked IDL      |                   |           | High     |
| Progress                  | Component | Yes       |             | Erokhin Ilya        | Blocked          |                   |           |          |
| `style, total, value`     | Options   |           | HEL         | Erokhin Ilya        | done             |                   |           | Medium   |
| `type, value`             | Options   |           | HEL         | Erokhin Ilya        | done             |                   |           | Medium   |
| `style`                   | Function  |           | HEL         | Erokhin Ilya        | done             |                   |           | Medium   |
| `color`                   | Function  |           | HEL         | Erokhin Ilya        | done             |                   |           | Medium   |
| Common                    | Component | Yes       |             | Roman Sedaikin      | in progress      | Roman Sedaikin    | done      |          |
| `width`                   | Function  |           | ENC,WON,HEL | Roman Sedaikin      | done             | Roman Sedaikin    | done      | High+    |
| `height`                  | Function  |           | ENC,WON,HEL | Roman Sedaikin      | done             | Roman Sedaikin    | done      | High+    |
| `size`                    | Function  |           | ENC,WON,HEL | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `constraintSize`          | Function  |           | ENC,WON,HEL | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `offset`                  | Function  |           | WON         | Skroba Gleb         | done             | Roman Sedaikin    | done      | High     |
| `position`                | Function  |           | ENC,WON,HEL | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `padding`                 | Function  |           | HEL         | Skroba Gleb         | done             | Roman Sedaikin    | done      | Medium   |
| `margin`                  | Function  |           | ENC,WON,HEL | Skroba Gleb         | done             | Roman Sedaikin    | done      | Medium   |
| `foregroundColor`         | Function  |           | ENC,WON,HEL | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `opacity`                 | Function  |           | ENC,WON,HEL | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `blur`                    | Function  |           |             | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `visibility`              | Function  |           | ENC,WON,HEL | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `enabled`                 | Function  |           | ENC,WON,HEL | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `onTouch`                 | Function  |           | ENC,WON,HEL | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `touchable`               | Function  |           | ENC,WON,HEL | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `onFocus`                 | Function  |           | ENC,WON,HEL | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `onBlur`                  | Function  |           |             | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `focusable`               | Function  |           | ENC,WON,HEL | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `onAppear`                | Function  |           | ENC,WON,HEL | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `onDisAppear`             | Function  |           | ENC,WON,HEL | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `responseRegion`          | Function  |           |             | Skroba Gleb         | done             | Roman Sedaikin    | done      | Medium   |
| `layoutWeight`            | Function  |           |             | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `foregroundBlurStyle`     | Function  |           |             | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `border`                  | Function  |           |             | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `borderStyle`             | Function  |           |             | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `borderWidth`             | Function  |           |             | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `borderColor`             | Function  |           |             | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `borderRadius`            | Function  |           |             | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `borderImage`             | Function  |           |             | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `hoverEffect`             | Function  |           |             | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `onAreaChange`            | Function  |           |             | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `alignSelf`               | Function  |           |             | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `displayPriority`         | Function  |           |             | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `zIndex`                  | Function  |           |             | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `direction`               | Function  |           |             | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `align`                   | Function  |           |             | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `aspectRatio`             | Function  |           |             | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `overlay`                 | Function  |           | ENC         | Lobah Mikhail       | done             | Roman Sedaikin    | done      | Medium   |
| `linearGradient`          | Function  |           | ENC         | Roman Sedaikin      | done             | Roman Sedaikin    | done      | High     |
| `sweepGradient`           | Function  |           | ENC         | Roman Sedaikin      | done             | Roman Sedaikin    | done      | High     |
| `radialGradient`          | Function  |           | ENC         | Erokhin Ilya        | done             | Roman Sedaikin    | done      | High     |
| `shadow`                  | Function  |           |             | Roman Sedaikin      | done             | Roman Sedaikin    | done      | High     |
| `onClick`                 | Function  |           | ENC,WON,HEL | Roman Sedaikin      | done             |                   | done      | High+    |
| `fill`                    | Function  |           | HEL         | Skroba Gleb         | done             |                   |           | Low      |
| `animateTo`               | Function  |           | HEL, ENC    | Erokhin Ilya        | blocked IDL      |                   |           | Medium   |
| `animation`               | Function  |           | HEL, ENC    | Erokhin Ilya        | blocked IDL      |                   |           | Medium   |
| `sharedTransition`        | Function  |           | HEL         | Skroba Gleb         | done             |                   |           | Medium   |
| `backgroundColor($r)`     | Function  |           | HEL         | Skroba Gleb         | done             |                   |           | Low      |
| `backgroundImage`         | Function  |           | WON         | Erokhin Ilya        | blocked IDL      |                   |           | Medium   |
| `backgroundImageSize`     | Function  |           | WON         | Erokhin Ilya        | done             |                   |           | Medium   |
| `backgroundImagePosition` | Function  |           | WON         | Erokhin Ilya        | done             |                   |           | Medium   |
| `clip`                    | Function  |           | HEL, WON    | Skroba Gleb         | blocked IDL      |                   |           | High     |
| `scale`                   | Function  |           | HEL         | Erokhin Ilya        | done             |                   |           | Medium   |
| `translate`               | Function  |           | HEL         | Erokhin Ilya        | done             |                   |           | High     |
| `id`                      | Function  |           | HEL         | Erokhin Ilya        | done             |                   |           | High     |
| `onVisibleAreaChange`     | Function  |           | WON         | Erokhin Ilya        | done             |                   |           | High     |
| `gesture`                 | Function  |           | WON         | Erokhin Ilya        | blocked IDL      |                   |           | Medium   |
| `@Styles function`        | Decorator |           | HEL         | N/A                 | N/A              | A. Tarasov        |           | Low      |
| Button                    | Component | Yes       |             | Evstigneev Roman    | in progress      |                   |           |          |
| `stateEffect, type`       | Options   |           | HEL         | Evstigneev Roman    | done             |                   |           | Medium   |
| `radialGradient`          | Function  |           | ENC         |                     |                  |                   |           | Medium   |
| `ctor($r)`                | Function  |           | ENC         | Kirill Kirichenko   | done             |                   |           | High     |
| Image                     | Component | Yes       |             |                     |                  |                   |           |          |
| `ctor(URL)`               | Function  |           | ENC         | Kirill Berezin      | In progress      |                   |           | Medium   |
| `ctor($rawfile)`          | Function  |           | ENC, WON    | Anton Tarasov       | done             |                   | done      | High     |
| `objectFit`               | Function  |           | WON         | Kirill Berezin      | done             |                   |           | Medium   |
| `autoResize`              | Function  |           | HEL         | Evstigneev Roman    | done             |                   |           | Medium   |
| `fillColor`               | Function  |           | HEL         | Evstigneev Roman    | done             |                   |           | Medium   |
| `onFinish`                | Function  |           | ENC         | Evstigneev Roman    | done             |                   |           | Medium   |
| `onError`                 | Function  |           | ENC         | Evstigneev Roman    | done             |                   |           | Medium   |
| Swiper                    | Component | No        |             | Skroba Gleb         | done             |                   |           |          |
| `itemSpace`               | Function  |           | HEL         | Skroba Gleb         | done             |                   |           | Medium   |
| `indicator`               | Function  |           | HEL, WON    | Skroba Gleb         | done             |                   |           | Medium   |
| `displayCount`            | Function  |           | HEL         | Skroba Gleb         | done             |                   |           | Medium   |
| `indicatorStyle`          | Function  |           | WON         | Skroba Gleb         | done             |                   |           | Low      |
| `priorityGesture`         | Function  |           | WON         | Erokhin Ilya        | blocked          |                   |           | Medium   |
| Text                      | Component | Yes       |             |                     |                  |                   |           |          |
| `ctor($r)`                | Function  |           | HEL         | Kirill Kirichenko   | done             |                   |           | High     |
| Shape                     | Component |           | HEL         | Dudkin Sergey       | done             |                   |           | High     |
| `fill`                    | Function  |           | HEL         | Dudkin Sergey       | done             |                   |           | High     |
| `fillOpacity`             | Function  |           | HEL         | Dudkin Sergey       | done             |                   |           | Medium   |
| `stroke`                  | Function  |           | HEL         | Dudkin Sergey       | done             |                   |           | High     |
| `strokeWidth`             | Function  |           | HEL         | Dudkin Sergey       | done             |                   |           | High     |
| `strokeDashArray`         | Function  |           | HEL         | Dudkin Sergey       | blocked AceEngine|                   |           | High     |
| Path                      | Component | No        |             | Skroba Gleb         | done             |                   |           | High     |
| `commands`                | Function  |           | HEL         | Skroba Gleb         | done             |                   |           | High     |
| Tabs                      | Component | No        | HEL         | Tuzhilkin Ivan      | in progress      |                   |           | High     |
| `barPosition`             | Options   |           | HEL         | Skroba Gleb         | done             |                   |           | High     |
| `animationDuration`       | Function  |           | HEL         | Tuzhilkin Ivan      | done             |                   |           | High     |
| `barMode`                 | Function  |           | HEL         | Tuzhilkin Ivan      | done             |                   |           | High     |
| `onChange`                | Function  |           | HEL         | Tuzhilkin Ivan      | done             |                   |           | High     |
| `vertical`                | Function  |           | HEL         | Tuzhilkin Ivan      | done             |                   |           | High     |
| `barWidth`                | Function  |           | HEL         | Tuzhilkin Ivan      | done             |                   |           | High     |
| `barHeight`               | Function  |           | HEL         | Tuzhilkin Ivan      | done             |                   |           | High     |
| TabContent                | Function  | No        |             | Evstigneev Roman    | in progress      |                   |           | High     |
| `tabBar`                  | Function  |           | HEL         | Evstigneev Roman    | blocked          |                   |           | High     |
| Divider                   | Component |           |             | Tuzhilkin Ivan      | done             |                   |           |          |
| `strokeWidth`             | Function  |           | HEL         | Tuzhilkin Ivan      | done             |                   |           | Low      |
| `color`                   | Function  |           | HEL         | Tuzhilkin Ivan      | done             |                   |           | Low      |
| Grid                      | Component |           |             | Erokhin Ilya        | done             |                   |           |          |
| `columnsTemplate`         | Function  |           | HEL         | Erokhin Ilya        | done             |                   |           | High     |
| `columnsGap`              | Function  |           | HEL         | Erokhin Ilya        | done             |                   |           | High     |
| `rowsGap`                 | Function  |           | HEL         | Erokhin Ilya        | done             |                   |           | High     |
| Canvas                    | Component |           |             | Vadim Voronov       | blocked          |                   |           |          |
| `onReady`                 | Function  |           | HEL         | Vadim Voronov       | done             |                   |           | Medium   |
| TextPicker                | Component |           |             | Tuzhilkin Ivan      | in progress      |                   |           |          |
| `range, selected`         | Options   |           | HEL         | Tuzhilkin Ivan      | done             |                   |           | Medium   |
| `onChange`                | Function  |           | HEL         | Tuzhilkin Ivan      | done             |                   |           | Medium   |
| Scroll                    | Component |           |             | Kirill Berezin      | in progress      |                   |           |          |
| `scrollable`              | Function  |           | WON         | Berezin Kirill      | done             |                   |           | Medium   |
| `scrollBar`               | Function  |           | WON         | Berezin Kirill      | done             |                   |           | Medium   |
| `onScroll`                | Function  |           | WON         | Kirill Berezin      | done             |                   |           | Medium   |
| `onScrollEdge`            | Function  |           | WON         | Berezin Kirill      | done             |                   |           | Medium   |
| Video                     | Component |           |             | Erokhin Ilya        | done             |                   |           |          |
| `controller, src`         | Options   |           | WON         | Erokhin Ilya        | blocked AceEngine|                   |           | Low      |
| `autoPlay`                | Function  |           | WON         | Erokhin Ilya        | done             |                   |           | Low      |
| Search                    | Component |           |             | Evstigneev Roman    | in progress      |                   |           |          |
| `placeholderColor`        | Function  |           | WON         | Evstigneev Roman    | done             |                   |           | Low      |
| `placeholderFont`         | Function  |           | WON         | Evstigneev Roman    | done             |                   |           | Low      |
| `textFont`                | Function  |           | WON         | Evstigneev Roman    | done             |                   |           | Low      |
| `onSubmit`                | Function  |           | WON         | Evstigneev Roman    | done             |                   |           | Low      |
| List                      | Component |           |             | Morozov Sergey      | blocked          |                   |           |          |
| `space`                   | Options   |           | WON         | Morozov Sergey      | done             |                   |           | Medium   |
| `lanes`                   | Function  |           | WON         | Morozov Sergey      | done             |                   |           | Medium   |
| Line                      | Component |           |             |                     | Blocked          |                   |           |          |
| `startPoint`              | Function  |           | WON         | Dudkin Sergey       | blocked AceEngine|                   |           | Medium   |
| `endPoint`                | Function  |           | WON         | Dudkin Sergey       | blocked AceEngine|                   |           | Medium   |
| LoadingProgress           | Component |           |             | Samarin Sergey      | done             |                   |           |    Low      |
| `color`                   | Function  |           | ENC         | Samarin Sergey      | done             |                   |           | Low      |
