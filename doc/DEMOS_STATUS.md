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
| `back`                    | Function  |           | ENC, WON    | Kirill Kirichenko   | done             | Kirill Kirichenko |           | High     
| `pageTransition`          | Function  |           | ENC, WON    | Kirill Kirichenko   | In Progress      | Kirill Kirichenko |           | High     
| CustomDialogController    | Class     |           | HEL         | Erokhin Ilya        | Blocked          |                   |           | Low      |
| `builder`                 | Function  |           |             | ?                   | N\A              |                   |           |          |
| `autoCancel`              | Function  |           |             | ?                   | N\A              |                   |           |          |
| `alignment`               | Function  |           |             | ?                   |                  |                   |           |          |
| `offset`                  | Function  |           |             | ?                   |                  |                   |           |          |
| `customStyle`             | Function  |           |             | ?                   | N\A              |                   |           |          |
| Rect                      | Component | No        | HEL         | Dudkin Sergey       | done             |                   |           | High     |
| `height, width`           | Options   |           | WON         | Dudkin Sergey       | done             |                   |           | High     |
| `height, radius, width`   | Options   |           | WON         | Dudkin Sergey       | done             |                   |           | High     |
| `radius`                  | Function  |           | WON         | Dudkin Sergey       | blocked          |                   |           |          |
| Navigator                 | Component | No        | HEL         | Skroba Gleb         | done             |                   |           | High     |
| `target`                  | Options   |           | HEL         | Skroba Gleb         | done             |                   |           | High     |
| `setNavigatorOptions`     | Function  |           | HEL         | Skroba Gleb         | done             |                   |           | High     |
| `active`                  | Function  |           | HEL         | Skroba Gleb         | done             |                   |           | High     |
| `type`                    | Function  |           | HEL         | Skroba Gleb         | done             |                   |           | High     |
| `target`                  | Function  |           | HEL         | Skroba Gleb         | done             |                   |           | High     |
| `params`                  | Function  |           | HEL         | Skroba Gleb         | blocked          |                   |           | High     |
| Progress                  | Component | Yes       |             | Erokhin Ilya        | Blocked          |                   |           |          |
| `style, total, value`     | Options   |           | HEL         | ?                   |                  |                   |           | Medium   |
| `type, value`             | Options   |           | HEL         | ?                   |                  |                   |           | Medium   |
| `style`                   | Function  |           | HEL         | ?                   |                  |                   |           | Medium   |
| `color`                   | Function  |           | HEL         | ?                   |                  |                   |           | Medium   |
| Common                    | Component | Yes       |             | Roman Sedaikin      | in progress      | Roman Sedaikin    | done      |          |
| `width`                   | Function  |           | ENC,WON,HEL | Roman Sedaikin      | done             | Roman Sedaikin    | done      | High+    |
| `height`                  | Function  |           | ENC,WON,HEL | Roman Sedaikin      | done             | Roman Sedaikin    | done      | High+    |
| `size`                    | Function  |           | ENC,WON,HEL | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `constraintSize`          | Function  |           | ENC,WON,HEL | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `offset`                  | Function  |           | WON         | Erokhin Ilya        | blocked arkoala  | Roman Sedaikin    | done      | High     |
| `position`                | Function  |           | ENC,WON,HEL | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `padding`                 | Function  |           | HEL         | Erokhin Ilya        | blocked arkoala  | Roman Sedaikin    | done      | Medium   |
| `margin`                  | Function  |           | ENC,WON,HEL | Erokhin Ilya        | blocked arkoala  | Roman Sedaikin    | done      | Medium   |
| `foregroundColor`         | Function  |           | ENC,WON,HEL | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `opacity`                 | Function  |           | ENC,WON,HEL | Roman Sedaikin      | done             | Roman Sedaikin    | done      | Medium   |
| `blur`                    | Function  |           |             | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `visibility`              | Function  |           | ENC,WON,HEL | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `enabled`                 | Function  |           | ENC,WON,HEL | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `onTouch`                 | Function  |           | ENC,WON,HEL | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `touchable`               | Function  |           | ENC,WON,HEL | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `onFocus`                 | Function  |           | ENC,WON,HEL | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `onBlur`                  | Function  |           |             | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `focusable`               | Function  |           | ENC,WON,HEL | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `onAppear`                | Function  |           | ENC,WON,HEL | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `onDisappear`             | Function  |           | ENC,WON,HEL | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `responseRegion`          | Function  |           |             | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `layoutWeight`            | Function  |           |             | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `foregroundBlurStyle`     | Function  |           |             | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `border`                  | Function  |           |             | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `borderStyle`             | Function  |           |             | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `borderWidth`             | Function  |           |             | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `borderColor`             | Function  |           |             | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `borderRadius`            | Function  |           |             | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `borderImage`             | Function  |           |             | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `hoverEffect`             | Function  |           |             | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `onAreaChange`            | Function  |           |             | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `alignSelf`               | Function  |           |             | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `displayPriority`         | Function  |           |             | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `zIndex`                  | Function  |           |             | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `direction`               | Function  |           |             | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `align`                   | Function  |           |             | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `aspectRatio`             | Function  |           |             | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `overlay`                 | Function  |           | ENC         | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | Medium   |
| `linearGradient`          | Function  |           | ENC         | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | High     |
| `sweepGradient`           | Function  |           | ENC         | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | High     |
| `radialGradient`          | Function  |           | ENC         | Erokhin Ilya        | done             | Roman Sedaikin    | done      | High     |
| `shadow`                  | Function  |           |             | Roman Sedaikin      | done/no test     | Roman Sedaikin    | done      | High     |
| `onClick`                 | Function  |           | ENC,WON,HEL | Roman Sedaikin      | in progress      |                   | done      | High+    |
| `fill`                    | Function  |           | HEL         | Skroba Gleb         | done             |                   |           | Low      |
| `animateTo`               | Function  |           | HEL, ENC    | Erokhin Ilya        | blocked ArKoala  |                   |           | Medium   |
| `animation`               | Function  |           | HEL, ENC    | Erokhin Ilya        | blocked          |                   |           | Medium   |
| `sharedTransition`        | Function  |           | HEL         | Skroba Gleb         | done             |                   |           | Medium   |
| `backgroundColor($r)`     | Function  |           | HEL         | Skroba Gleb         | done             |                   |           | Low      |
| `backgroundImage`         | Function  |           | WON         | Erokhin Ilya        | blocked          |                   |           | Medium   |
| `backgroundImageSize`     | Function  |           | WON         | Erokhin Ilya        | done             |                   |           | Medium   |
| `backgroundImagePosition` | Function  |           | WON         | Erokhin Ilya        | done             |                   |           | Medium   |
| `clip`                    | Function  |           | HEL, WON    | Erokhin Ilya        | blocked          |                   |           | High     |
| `scale`                   | Function  |           | HEL         | Erokhin Ilya        | done             |                   |           | Medium   |
| `translate`               | Function  |           | HEL         | Erokhin Ilya        | done             |                   |           | High     |
| `id`                      | Function  |           | HEL         | Erokhin Ilya        | done             |                   |           | High     |
| `onVisibleAreaChange`     | Function  |           | WON         | Erokhin Ilya        | done             |                   |           | High     |
| `gesture`                 | Function  |           | WON         | Erokhin Ilya        | blocked ArKoala  |                   |           | Medium   |
| `@Styles function`        | Decorator |           | HEL         | N/A                 | N/A              | A. Tarasov        |           | Low      |
| Button                    | Component | Yes       |             | Evstigneev Roman    | in progress      |                   |           |          |
| `stateEffect, type`       | Options   |           | HEL         | Evstigneev Roman    | done             |                   |           | Medium   |
| `radialGradient`          | Function  |           | ENC         | Kirill Kirichenko   |                  |                   |           | Medium   |
| `ctor($r)`                | Function  |           | ENC         | Kirill Kirichenko   | done             |                   |           | High     |
| Image                     | Component | Yes       |             |                     |                  |                   |           |          |
| `ctor(URL)`               | Function  |           | ENC         | Kirill Berezin      | In progress      |                   |           | Medium   |
| `ctor($rawfile)`          | Function  |           | ENC, WON    | Anton Tarasov       | done             |                   | done      | High     |
| `objectFit`               | Function  |           | WON         | Kirill Berezin      | Done/No test     |                   |           | Medium   |
| `autoResize`              | Function  |           | HEL         | Evstigneev Roman    | blocked ut       |                   |           | Medium   |
| `fillColor`               | Function  |           | HEL         | Evstigneev Roman    | in progress      |                   |           | Medium   |
| `onFinish`                | Function  |           | ENC         | Evstigneev Roman    | in progress      |                   |           | Medium   |
| `onError`                 | Function  |           | ENC         | Evstigneev Roman    | in progress      |                   |           | Medium   |
| Swiper                    | Component | No        |             | Skroba Gleb         | done             |                   |           |          |
| `itemSpace`               | Function  |           | HEL         | Skroba Gleb         | done             |                   |           | Medium   |
| `indicator`               | Function  |           | HEL, WON    | Skroba Gleb         | done             |                   |           | Medium   |
| `displayCount`            | Function  |           | HEL         | Skroba Gleb         | done             |                   |           | Medium   |
| `indicatorStyle`          | Function  |           | WON         | Skroba Gleb         | done             |                   |           | Low      |
| `priorityGesture`         | Function  |           | WON         | Erokhin Ilya        | blocked          |                   |           | Medium   |
| Text                      | Component | Yes       |             | Kirill Kirichenko   | in progress      |                   |           |          |
| `ctor($r)`                | Function  |           | HEL         | Kirill Kirichenko   | done             |                   |           | High     |
| Shape                     | Component |           | HEL         | Dudkin Sergey       | done             |                   |           | High     |
| `fill`                    | Function  |           | HEL         | Dudkin Sergey       | done             |                   |           | High     |
| `fillOpacity`             | Function  |           | HEL         | Dudkin Sergey       | done             |                   |           | Medium   |
| `stroke`                  | Function  |           | HEL         | Dudkin Sergey       | done             |                   |           | High     |
| `strokeWidth`             | Function  |           | HEL         | Dudkin Sergey       | done             |                   |           | High     |
| `strokeDashArray`         | Function  |           | HEL         | Dudkin Sergey       | blocked          |                   |           | High     |
| Path                      | Component | No        |             | Skroba Gleb         | done             |                   |           | High     |
| `commands`                | Function  |           | HEL         | Skroba Gleb         | done             |                   |           | High     |
| Tabs                      | Component | No        | HEL         | Tuzhilkin Ivan      | in progress      |                   |           | High     |
| `barPosition`             | Options   |           | HEL         | Skroba Gleb         | done             |                   |           | High     |
| `animationDuration`       | Function  |           | HEL         | Tuzhilkin Ivan      | blocked ut       |                   |           | High     |
| `barMode`                 | Function  |           | HEL         | Tuzhilkin Ivan      | done             |                   |           | High     |
| `onChange`                | Function  |           | HEL         | Tuzhilkin Ivan      | done             |                   |           | High     |
| `vertical`                | Function  |           | HEL         | Tuzhilkin Ivan      | done             |                   |           | High     |
| `barWidth`                | Function  |           | HEL         | Tuzhilkin Ivan      | done             |                   |           | High     |
| `barHeight`               | Function  |           | HEL         | Tuzhilkin Ivan      | done             |                   |           | High     |
| TabContent                | Function  | No        |             | Evstigneev Roman    | in progress      |                   |           | High     |
| `tabBar`                  | Function  |           | HEL         | Evstigneev Roman    | in progress      |                   |           | High     |
| Divider                   | Component |           |             | Tuzhilkin Ivan      | done             |                   |           |          |
| `strokeWidth`             | Function  |           | HEL         | Tuzhilkin Ivan      | done             |                   |           | Low      |
| `color`                   | Function  |           | HEL         | Tuzhilkin Ivan      | done             |                   |           | Low      |
| Grid                      | Component |           |             | Erokhin Ilya        | done             |                   |           |          |
| `columnsTemplate`         | Function  |           | HEL         | Erokhin Ilya        | done             |                   |           | High     |
| `columnsGap`              | Function  |           | HEL         | Erokhin Ilya        | done             |                   |           | High     |
| `rowsGap`                 | Function  |           | HEL         | Erokhin Ilya        | done             |                   |           | High     |
| Canvas                    | Component |           |             | Tuzhilkin Ivan      | in progress      |                   |           |          |
| `onReady`                 | Function  |           | HEL         | Vadim Voronov       | in progress      |                   |           | Medium   |
| TextPicker                | Component |           |             | Tuzhilkin Ivan      | in progress      |                   |           |          |
| `range, selected`         | Options   |           | HEL         | Tuzhilkin Ivan      | in progress      |                   |           | Medium   |
| `onChange`                | Function  |           | HEL         | Tuzhilkin Ivan      | in progress      |                   |           | Medium   |
| Scroll                    | Component |           |             | Kirill Berezin      | in progress      |                   |           |          |
| `scrollable`              | Function  |           | WON         | Kirill Berezin      | in progress      |                   |           | Medium   |
| `scrollBar`               | Function  |           | WON         | Kirill Berezin      | in progress      |                   |           | Medium   |
| `onScroll`                | Function  |           | WON         | Kirill Berezin      | done             |                   |           | Medium   |
| `onScrollEdge`            | Function  |           | WON         | Kirill Berezin      | in progress      |                   |           | Medium   |
| Video                     | Component |           |             | Tuzhilkin Ivan      | in progress      |                   |           |          |
| `controller, src`         | Options   |           | WON         | Erokhin Ilya        | in progress      |                   |           | Low      |
| `autoPlay`                | Function  |           | WON         | Erokhin Ilya        | in progress      |                   |           | Low      |
| Search                    | Component |           |             | Evstigneev Roman    | in progress      |                   |           |          |
| `placeholderColor`        | Function  |           | WON         | Evstigneev Roman    | in progress      |                   |           | Low      |
| `placeholderFont`         | Function  |           | WON         | Evstigneev Roman    | in progress      |                   |           | Low      |
| `textFont`                | Function  |           | WON         | Evstigneev Roman    | in progress      |                   |           | Low      |
| `onSubmit`                | Function  |           | WON         | Evstigneev Roman    | done             |                   |           | Low      |
| List                      | Component |           |             | Morozov Sergey      | in progress      |                   |           |          |
| `space`                   | Options   |           | WON         | Morozov Sergey      | blocked Arkoala  |                   |           | Medium   |
| `lanes`                   | Function  |           | WON         | Morozov Sergey      | done             |                   |           | Medium   |
| Line                      | Component |           |             |                     | Blocked          |                   |           |          |
| `startPoint`              | Function  |           | WON         | Dudkin Sergey       | Blocked          |                   |           | Medium   |
| `endPoint`                | Function  |           | WON         | Dudkin Sergey       | Blocked          |                   |           | Medium   |
| LoadingProgress           | Component |           |             | Samarin Sergey      |                  |                   |           |    Low      |
| `color`                   | Function  |           | ENC         | Samarin Sergey      | done             |                   |           | Low      |
