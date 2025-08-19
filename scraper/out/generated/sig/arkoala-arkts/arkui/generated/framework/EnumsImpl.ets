import { int32, float32 } from "@koalaui/common"
export namespace AbilityConstant {
    export enum LaunchReason {
        UNKNOWN = 0,
        START_ABILITY = 1,
        CALL = 2,
        CONTINUATION = 3,
        APP_RECOVERY = 4,
        SHARE = 5,
        AUTO_STARTUP = 8,
        INSIGHT_INTENT = 9,
        PREPARE_CONTINUATION = 10,
        PRELOAD = 11
    }
}
export namespace AbilityConstant {
    export enum LastExitReason {
        UNKNOWN = 0,
        NORMAL = 2,
        CPP_CRASH = 3,
        JS_ERROR = 4,
        APP_FREEZE = 5,
        PERFORMANCE_CONTROL = 6,
        RESOURCE_CONTROL = 7,
        UPGRADE = 8,
        USER_REQUEST = 9,
        SIGNAL = 10
    }
}
export namespace AbilityConstant {
    export enum MemoryLevel {
        MEMORY_LEVEL_MODERATE = 0,
        MEMORY_LEVEL_LOW = 1,
        MEMORY_LEVEL_CRITICAL = 2
    }
}
export namespace AbilityConstant {
    export enum OnSaveResult {
        ALL_AGREE = 0,
        CONTINUATION_REJECT = 1,
        CONTINUATION_MISMATCH = 2,
        RECOVERY_AGREE = 3,
        RECOVERY_REJECT = 4,
        ALL_REJECT = 5
    }
}
export namespace AbilityConstant {
    export enum StateType {
        CONTINUATION = 0,
        APP_RECOVERY = 1
    }
}
export namespace appManager {
    export enum ProcessState {
        STATE_CREATE = 0,
        STATE_FOREGROUND = 1,
        STATE_ACTIVE = 2,
        STATE_BACKGROUND = 3,
        STATE_DESTROY = 4
    }
}
export namespace ConfigurationConstant {
    export enum ColorMode {
        COLOR_MODE_NOT_SET = -1,
        COLOR_MODE_DARK = 0,
        COLOR_MODE_LIGHT = 1
    }
}
export namespace ConfigurationConstant {
    export enum Direction {
        DIRECTION_NOT_SET = -1,
        DIRECTION_VERTICAL = 0,
        DIRECTION_HORIZONTAL = 1
    }
}
export namespace ConfigurationConstant {
    export enum ScreenDensity {
        SCREEN_DENSITY_NOT_SET = 0,
        SCREEN_DENSITY_SDPI = 120,
        SCREEN_DENSITY_MDPI = 160,
        SCREEN_DENSITY_LDPI = 240,
        SCREEN_DENSITY_XLDPI = 320,
        SCREEN_DENSITY_XXLDPI = 480,
        SCREEN_DENSITY_XXXLDPI = 640
    }
}
export namespace contextConstant {
    export enum AreaMode {
        EL1 = 0,
        EL2 = 1,
        EL3 = 2,
        EL4 = 3,
        EL5 = 4
    }
}
export namespace contextConstant {
    export enum ProcessMode {
        NEW_PROCESS_ATTACH_TO_PARENT = 1,
        NEW_PROCESS_ATTACH_TO_STATUS_BAR_ITEM = 2,
        ATTACH_TO_STATUS_BAR_ITEM = 3
    }
}
export namespace contextConstant {
    export enum StartupVisibility {
        STARTUP_HIDE = 0,
        STARTUP_SHOW = 1
    }
}
export namespace dragController {
    export enum DragStatus {
        STARTED = 0,
        ENDED = 1
    }
}
export namespace dragController {
    export enum DragStartRequestStatus {
        WAITING = 0,
        READY = 1
    }
}
export namespace uiObserver {
    export enum NavDestinationState {
        ON_SHOWN = 0,
        ON_HIDDEN = 1,
        ON_APPEAR = 2,
        ON_DISAPPEAR = 3,
        ON_WILL_SHOW = 4,
        ON_WILL_HIDE = 5,
        ON_WILL_APPEAR = 6,
        ON_WILL_DISAPPEAR = 7,
        ON_BACKPRESS = 100
    }
}
export namespace uiObserver {
    export enum RouterPageState {
        ABOUT_TO_APPEAR = 0,
        ABOUT_TO_DISAPPEAR = 1,
        ON_PAGE_SHOW = 2,
        ON_PAGE_HIDE = 3,
        ON_BACK_PRESS = 4
    }
}
export namespace uiObserver {
    export enum ScrollEventType {
        SCROLL_START = 0,
        SCROLL_STOP = 1
    }
}
export namespace uiObserver {
    export enum TabContentState {
        ON_SHOW = 0,
        ON_HIDE = 1
    }
}
export enum NodeRenderState {
    ABOUT_TO_RENDER_IN = 0,
    ABOUT_TO_RENDER_OUT = 1
}
export enum GestureActionPhase {
    WILL_START = 0,
    WILL_END = 1
}
export enum GestureListenerType {
    TAP = 0,
    LONG_PRESS = 1,
    PAN = 2,
    PINCH = 3,
    SWIPE = 4,
    ROTATION = 5
}
export enum KeyboardAvoidMode {
    OFFSET = 0,
    RESIZE = 1,
    OFFSET_WITH_CARET = 2,
    RESIZE_WITH_CARET = 3,
    NONE = 4
}
export namespace bundleManager {
    export enum ExtensionAbilityType {
        FORM = 0,
        WORK_SCHEDULER = 1,
        INPUT_METHOD = 2,
        SERVICE = 3,
        ACCESSIBILITY = 4,
        DATA_SHARE = 5,
        FILE_SHARE = 6,
        STATIC_SUBSCRIBER = 7,
        WALLPAPER = 8,
        BACKUP = 9,
        WINDOW = 10,
        ENTERPRISE_ADMIN = 11,
        THUMBNAIL = 13,
        PREVIEW = 14,
        PRINT = 15,
        SHARE = 16,
        PUSH = 17,
        DRIVER = 18,
        ACTION = 19,
        ADS_SERVICE = 20,
        EMBEDDED_UI = 21,
        INSIGHT_INTENT_UI = 22,
        FENCE = 24,
        CALLER_INFO_QUERY = 25,
        ASSET_ACCELERATION = 26,
        FORM_EDIT = 27,
        DISTRIBUTED = 28,
        APP_SERVICE = 29,
        LIVE_FORM = 30,
        UNSPECIFIED = 255
    }
}
export namespace bundleManager {
    export enum SupportWindowMode {
        FULL_SCREEN = 0,
        SPLIT = 1,
        FLOATING = 2
    }
}
export namespace bundleManager {
    export enum LaunchType {
        SINGLETON = 0,
        MULTITON = 1,
        SPECIFIED = 2
    }
}
export namespace bundleManager {
    export enum DisplayOrientation {
        UNSPECIFIED = 0,
        LANDSCAPE = 1,
        PORTRAIT = 2,
        FOLLOW_RECENT = 3,
        LANDSCAPE_INVERTED = 4,
        PORTRAIT_INVERTED = 5,
        AUTO_ROTATION = 6,
        AUTO_ROTATION_LANDSCAPE = 7,
        AUTO_ROTATION_PORTRAIT = 8,
        AUTO_ROTATION_RESTRICTED = 9,
        AUTO_ROTATION_LANDSCAPE_RESTRICTED = 10,
        AUTO_ROTATION_PORTRAIT_RESTRICTED = 11,
        LOCKED = 12,
        AUTO_ROTATION_UNSPECIFIED = 13,
        FOLLOW_DESKTOP = 14
    }
}
export namespace bundleManager {
    export enum ModuleType {
        ENTRY = 1,
        FEATURE = 2,
        SHARED = 3
    }
}
export namespace bundleManager {
    export enum BundleType {
        APP = 0,
        ATOMIC_SERVICE = 1
    }
}
export namespace bundleManager {
    export enum MultiAppModeType {
        UNSPECIFIED = 0,
        MULTI_INSTANCE = 1,
        APP_CLONE = 2
    }
}
export namespace curves {
    export enum Curve {
        LINEAR = 0,
        Linear = 0,
        EASE = 1,
        Ease = 1,
        EASE_IN = 2,
        EaseIn = 2,
        EASE_OUT = 3,
        EaseOut = 3,
        EASE_IN_OUT = 4,
        EaseInOut = 4,
        FAST_OUT_SLOW_IN = 5,
        FastOutSlowIn = 5,
        LINEAR_OUT_SLOW_IN = 6,
        LinearOutSlowIn = 6,
        FAST_OUT_LINEAR_IN = 7,
        FastOutLinearIn = 7,
        EXTREME_DECELERATION = 8,
        ExtremeDeceleration = 8,
        SHARP = 9,
        Sharp = 9,
        RHYTHM = 10,
        Rhythm = 10,
        SMOOTH = 11,
        Smooth = 11,
        FRICTION = 12,
        Friction = 12
    }
}
export namespace uniformTypeDescriptor {
    export enum UniformDataType {
        ENTITY = "'general.entity'",
        OBJECT = "'general.object'",
        COMPOSITE_OBJECT = "'general.composite-object'",
        TEXT = "'general.text'",
        PLAIN_TEXT = "'general.plain-text'",
        HTML = "'general.html'",
        HYPERLINK = "'general.hyperlink'",
        XML = "'general.xml'",
        XHTML = "'general.xhtml'",
        RSS = "'general.rss'",
        SMIL = "'com.real.smil'",
        SOURCE_CODE = "'general.source-code'",
        SCRIPT = "'general.script'",
        SHELL_SCRIPT = "'general.shell-script'",
        CSH_SCRIPT = "'general.csh-script'",
        PERL_SCRIPT = "'general.perl-script'",
        PHP_SCRIPT = "'general.php-script'",
        PYTHON_SCRIPT = "'general.python-script'",
        RUBY_SCRIPT = "'general.ruby-script'",
        TYPE_SCRIPT = "'general.type-script'",
        JAVA_SCRIPT = "'general.java-script'",
        CSS = "'general.css'",
        C_HEADER = "'general.c-header'",
        C_SOURCE = "'general.c-source'",
        C_PLUS_PLUS_HEADER = "'general.c-plus-plus-header'",
        C_PLUS_PLUS_SOURCE = "'general.c-plus-plus-source'",
        JAVA_SOURCE = "'general.java-source'",
        TEX = "'general.tex'",
        MARKDOWN = "'general.markdown'",
        ASC_TEXT = "'general.asc-text'",
        RICH_TEXT = "'general.rich-text'",
        DELIMITED_VALUES_TEXT = "'general.delimited-values-text'",
        COMMA_SEPARATED_VALUES_TEXT = "'general.comma-separated-values-text'",
        TAB_SEPARATED_VALUES_TEXT = "'general.tab-separated-values-text'",
        EBOOK = "'general.ebook'",
        EPUB = "'general.epub'",
        AZW = "'com.amazon.azw'",
        AZW3 = "'com.amazon.azw3'",
        KFX = "'com.amazon.kfx'",
        MOBI = "'com.amazon.mobi'",
        MEDIA = "'general.media'",
        IMAGE = "'general.image'",
        JPEG = "'general.jpeg'",
        PNG = "'general.png'",
        RAW_IMAGE = "'general.raw-image'",
        TIFF = "'general.tiff'",
        BMP = "'com.microsoft.bmp'",
        ICO = "'com.microsoft.ico'",
        PHOTOSHOP_IMAGE = "'com.adobe.photoshop-image'",
        AI_IMAGE = "'com.adobe.illustrator.ai-image'",
        FAX = "'general.fax'",
        JFX_FAX = "'com.j2.jfx-fax'",
        EFX_FAX = "'com.js.efx-fax'",
        XBITMAP_IMAGE = "'general.xbitmap-image'",
        GIF = "'general.gif'",
        TGA_IMAGE = "'com.truevision.tga-image'",
        SGI_IMAGE = "'com.sgi.sgi-image'",
        OPENEXR_IMAGE = "'com.ilm.openexr-image'",
        FLASHPIX_IMAGE = "'com.kodak.flashpix.image'",
        WORD_DOC = "'com.microsoft.word.doc'",
        EXCEL = "'com.microsoft.excel.xls'",
        PPT = "'com.microsoft.powerpoint.ppt'",
        WORD_DOT = "'com.microsoft.word.dot'",
        POWERPOINT_PPS = "'com.microsoft.powerpoint.pps'",
        POWERPOINT_POT = "'com.microsoft.powerpoint.pot'",
        EXCEL_XLT = "'com.microsoft.excel.xlt'",
        VISIO_VSD = "'com.microsoft.visio.vsd'",
        PDF = "'com.adobe.pdf'",
        POSTSCRIPT = "'com.adobe.postscript'",
        ENCAPSULATED_POSTSCRIPT = "'com.adobe.encapsulated-postscript'",
        VIDEO = "'general.video'",
        AVI = "'general.avi'",
        MPEG = "'general.mpeg'",
        MPEG4 = "'general.mpeg-4'",
        VIDEO_3GPP = "'general.3gpp'",
        VIDEO_3GPP2 = "'general.3gpp2'",
        TS = "'general.ts'",
        MPEGURL_VIDEO = "'general.mpegurl-video'",
        WINDOWS_MEDIA_WM = "'com.microsoft.windows-media-wm'",
        WINDOWS_MEDIA_WMV = "'com.microsoft.windows-media-wmv'",
        WINDOWS_MEDIA_WMP = "'com.microsoft.windows-media-wmp'",
        WINDOWS_MEDIA_WVX = "'com.microsoft.windows-media-wvx'",
        WINDOWS_MEDIA_WMX = "'com.microsoft.windows-media-wmx'",
        REALMEDIA = "'com.real.realmedia'",
        MATROSKA_VIDEO = "'org.matroska.mkv'",
        FLASH = "'com.adobe.flash'",
        AUDIO = "'general.audio'",
        AAC = "'general.aac'",
        AIFF = "'general.aiff'",
        ALAC = "'general.alac'",
        FLAC = "'general.flac'",
        MP3 = "'general.mp3'",
        OGG = "'general.ogg'",
        PCM = "'general.pcm'",
        WINDOWS_MEDIA_WMA = "'com.microsoft.windows-media-wma'",
        WAVEFORM_AUDIO = "'com.microsoft.waveform-audio'",
        WINDOWS_MEDIA_WAX = "'com.microsoft.windows-media-wax'",
        AU_AUDIO = "'general.au-audio'",
        AIFC_AUDIO = "'general.aifc-audio'",
        MPEGURL_AUDIO = "'general.mpegurl-audio'",
        MPEG_4_AUDIO = "'general.mpeg-4-audio'",
        MP2 = "'general.mp2'",
        MPEG_AUDIO = "'general.mpeg-audio'",
        ULAW_AUDIO = "'general.ulaw-audio'",
        SD2_AUDIO = "'com.digidesign.sd2-audio'",
        REALAUDIO = "'com.real.realaudio'",
        MATROSKA_AUDIO = "'org.matroska.mka'",
        FILE = "'general.file'",
        DIRECTORY = "'general.directory'",
        FOLDER = "'general.folder'",
        SYMLINK = "'general.symlink'",
        ARCHIVE = "'general.archive'",
        BZ2_ARCHIVE = "'general.bz2-archive'",
        OPG = "'general.opg'",
        TAZ_ARCHIVE = "'general.taz-archive'",
        WEB_ARCHIVE = "'general.web-archive'",
        DISK_IMAGE = "'general.disk-image'",
        ISO = "'general.iso'",
        TAR_ARCHIVE = "'general.tar-archive'",
        ZIP_ARCHIVE = "'general.zip-archive'",
        JAVA_ARCHIVE = "'com.sun.java-archive'",
        GNU_TAR_ARCHIVE = "'org.gnu.gnu-tar-archive'",
        GNU_ZIP_ARCHIVE = "'org.gnu.gnu-zip-archive'",
        GNU_ZIP_TAR_ARCHIVE = "'org.gnu.gnu-zip-tar-archive'",
        OPENXML = "'org.openxmlformats.openxml'",
        WORDPROCESSINGML_DOCUMENT = "'org.openxmlformats.wordprocessingml.document'",
        SPREADSHEETML_SHEET = "'org.openxmlformats.spreadsheetml.sheet'",
        PRESENTATIONML_PRESENTATION = "'org.openxmlformats.presentationml.presentation'",
        DRAWINGML_VISIO = "'org.openxmlformats.drawingml.visio'",
        DRAWINGML_TEMPLATE = "'org.openxmlformats.drawingml.template'",
        WORDPROCESSINGML_TEMPLATE = "'org.openxmlformats.wordprocessingml.template'",
        PRESENTATIONML_TEMPLATE = "'org.openxmlformats.presentationml.template'",
        PRESENTATIONML_SLIDESHOW = "'org.openxmlformats.presentationml.slideshow'",
        SPREADSHEETML_TEMPLATE = "'org.openxmlformats.spreadsheetml.template'",
        OPENDOCUMENT = "'org.oasis.opendocument'",
        OPENDOCUMENT_TEXT = "'org.oasis.opendocument.text'",
        OPENDOCUMENT_SPREADSHEET = "'org.oasis.opendocument.spreadsheet'",
        OPENDOCUMENT_PRESENTATION = "'org.oasis.opendocument.presentation'",
        OPENDOCUMENT_GRAPHICS = "'org.oasis.opendocument.graphics'",
        OPENDOCUMENT_FORMULA = "'org.oasis.opendocument.formula'",
        STUFFIT_ARCHIVE = "'com.allume.stuffit-archive'",
        RAR_ARCHIVE = "'com.rarlab.rar-archive'",
        SEVEN_ZIP_ARCHIVE = "'org.7-zip.7-zip-archive'",
        CALENDAR = "'general.calendar'",
        VCS = "'general.vcs'",
        ICS = "'general.ics'",
        CONTACT = "'general.contact'",
        DATABASE = "'general.database'",
        MESSAGE = "'general.message'",
        EXECUTABLE = "'general.executable'",
        PORTABLE_EXECUTABLE = "'com.microsoft.portable-executable'",
        SUN_JAVA_CLASS = "'com.sun.java-class'",
        VCARD = "'general.vcard'",
        NAVIGATION = "'general.navigation'",
        LOCATION = "'general.location'",
        FONT = "'general.font'",
        TRUETYPE_FONT = "'general.truetype-font'",
        TRUETYPE_COLLECTION_FONT = "'general.truetype-collection-font'",
        OPENTYPE_FONT = "'general.opentype-font'",
        POSTSCRIPT_FONT = "'com.adobe.postscript-font'",
        POSTSCRIPT_PFB_FONT = "'com.adobe.postscript-pfb-font'",
        POSTSCRIPT_PFA_FONT = "'com.adobe.postscript-pfa-font'",
        OPENHARMONY_FORM = "'openharmony.form'",
        OPENHARMONY_APP_ITEM = "'openharmony.app-item'",
        OPENHARMONY_PIXEL_MAP = "'openharmony.pixel-map'",
        OPENHARMONY_ATOMIC_SERVICE = "'openharmony.atomic-service'",
        OPENHARMONY_PACKAGE = "'openharmony.package'",
        OPENHARMONY_HAP = "'openharmony.hap'",
        OPENHARMONY_HDOC = "'openharmony.hdoc'",
        OPENHARMONY_HINOTE = "'openharmony.hinote'",
        OPENHARMONY_STYLED_STRING = "'openharmony.styled-string'",
        OPENHARMONY_WANT = "'openharmony.want'",
        OFD = "'general.ofd'",
        CAD = "'general.cad'",
        OCTET_STREAM = "'general.octet-stream'",
        FILE_URI = "'general.file-uri'",
        CONTENT_FORM = "'general.content-form'"
    }
}
export namespace colorSpaceManager {
    export enum ColorSpace {
        UNKNOWN = 0,
        ADOBE_RGB_1998 = 1,
        DCI_P3 = 2,
        DISPLAY_P3 = 3,
        SRGB = 4,
        BT709 = 6,
        BT601_EBU = 7,
        BT601_SMPTE_C = 8,
        BT2020_HLG = 9,
        BT2020_PQ = 10,
        P3_HLG = 11,
        P3_PQ = 12,
        ADOBE_RGB_1998_LIMIT = 13,
        DISPLAY_P3_LIMIT = 14,
        SRGB_LIMIT = 15,
        BT709_LIMIT = 16,
        BT601_EBU_LIMIT = 17,
        BT601_SMPTE_C_LIMIT = 18,
        BT2020_HLG_LIMIT = 19,
        BT2020_PQ_LIMIT = 20,
        P3_HLG_LIMIT = 21,
        P3_PQ_LIMIT = 22,
        LINEAR_P3 = 23,
        LINEAR_SRGB = 24,
        LINEAR_BT709 = 25,
        LINEAR_BT2020 = 25,
        DISPLAY_SRGB = 26,
        DISPLAY_P3_SRGB = 27,
        DISPLAY_P3_HLG = 28,
        DISPLAY_P3_PQ = 29,
        H_LOG = 26,
        CUSTOM = 5
    }
}
export namespace drawing {
    export enum BlendMode {
        CLEAR = 0,
        SRC = 1,
        DST = 2,
        SRC_OVER = 3,
        DST_OVER = 4,
        SRC_IN = 5,
        DST_IN = 6,
        SRC_OUT = 7,
        DST_OUT = 8,
        SRC_ATOP = 9,
        DST_ATOP = 10,
        XOR = 11,
        PLUS = 12,
        MODULATE = 13,
        SCREEN = 14,
        OVERLAY = 15,
        DARKEN = 16,
        LIGHTEN = 17,
        COLOR_DODGE = 18,
        COLOR_BURN = 19,
        HARD_LIGHT = 20,
        SOFT_LIGHT = 21,
        DIFFERENCE = 22,
        EXCLUSION = 23,
        MULTIPLY = 24,
        HUE = 25,
        SATURATION = 26,
        COLOR = 27,
        LUMINOSITY = 28
    }
}
export namespace drawing {
    export enum FilterMode {
        FILTER_MODE_NEAREST = 0,
        FILTER_MODE_LINEAR = 1
    }
}
export namespace drawing {
    export enum RectType {
        DEFAULT = 0,
        TRANSPARENT = 1,
        FIXEDCOLOR = 2
    }
}
export namespace uiEffect {
    export enum TileMode {
        CLAMP = 0,
        REPEAT = 1,
        MIRROR = 2,
        DECAL = 3
    }
}
export namespace uiEffect {
    export enum WaterRippleMode {
        SMALL2MEDIUM_RECV = 0,
        SMALL2MEDIUM_SEND = 1,
        SMALL2SMALL = 2,
        MINI_RECV = 3
    }
}
export namespace uiEffect {
    export enum FlyMode {
        BOTTOM = 0,
        TOP = 1
    }
}
export namespace image {
    export enum PixelMapFormat {
        UNKNOWN = 0,
        ARGB_8888 = 1,
        RGB_565 = 2,
        RGBA_8888 = 3,
        BGRA_8888 = 4,
        RGB_888 = 5,
        ALPHA_8 = 6,
        RGBA_F16 = 7,
        NV21 = 8,
        NV12 = 9,
        RGBA_1010102 = 10,
        YCBCR_P010 = 11,
        YCRCB_P010 = 12,
        ASTC_4X_4 = 102,
        ASTC_4x4 = 102
    }
}
export namespace image {
    export enum ResolutionQuality {
        LOW = 1,
        MEDIUM = 2,
        HIGH = 3
    }
}
export namespace image {
    export enum AlphaType {
        UNKNOWN = 0,
        OPAQUE = 1,
        PREMUL = 2,
        UNPREMUL = 3
    }
}
export namespace image {
    export enum AntiAliasingLevel {
        NONE = 0,
        LOW = 1,
        MEDIUM = 2,
        HIGH = 3
    }
}
export enum IntentionCode {
    INTENTION_UNKNOWN = -1,
    INTENTION_UP = 1,
    INTENTION_DOWN = 2,
    INTENTION_LEFT = 3,
    INTENTION_RIGHT = 4,
    INTENTION_SELECT = 5,
    INTENTION_ESCAPE = 6,
    INTENTION_BACK = 7,
    INTENTION_FORWARD = 8,
    INTENTION_MENU = 9,
    INTENTION_PAGE_UP = 11,
    INTENTION_PAGE_DOWN = 12,
    INTENTION_ZOOM_OUT = 13,
    INTENTION_ZOOM_IN = 14
}
export namespace pointer {
    export enum PointerStyle {
        DEFAULT = 0,
        EAST = 1,
        WEST = 2,
        SOUTH = 3,
        NORTH = 4,
        WEST_EAST = 5,
        NORTH_SOUTH = 6,
        NORTH_EAST = 7,
        NORTH_WEST = 8,
        SOUTH_EAST = 9,
        SOUTH_WEST = 10,
        NORTH_EAST_SOUTH_WEST = 11,
        NORTH_WEST_SOUTH_EAST = 12,
        CROSS = 13,
        CURSOR_COPY = 14,
        CURSOR_FORBID = 15,
        COLOR_SUCKER = 16,
        HAND_GRABBING = 17,
        HAND_OPEN = 18,
        HAND_POINTING = 19,
        HELP = 20,
        MOVE = 21,
        RESIZE_LEFT_RIGHT = 22,
        RESIZE_UP_DOWN = 23,
        SCREENSHOT_CHOOSE = 24,
        SCREENSHOT_CURSOR = 25,
        TEXT_CURSOR = 26,
        ZOOM_IN = 27,
        ZOOM_OUT = 28,
        MIDDLE_BTN_EAST = 29,
        MIDDLE_BTN_WEST = 30,
        MIDDLE_BTN_SOUTH = 31,
        MIDDLE_BTN_NORTH = 32,
        MIDDLE_BTN_NORTH_SOUTH = 33,
        MIDDLE_BTN_NORTH_EAST = 34,
        MIDDLE_BTN_NORTH_WEST = 35,
        MIDDLE_BTN_SOUTH_EAST = 36,
        MIDDLE_BTN_SOUTH_WEST = 37,
        MIDDLE_BTN_NORTH_SOUTH_WEST_EAST = 38,
        HORIZONTAL_TEXT_CURSOR = 39,
        CURSOR_CROSS = 40,
        CURSOR_CIRCLE = 41,
        LOADING = 42,
        RUNNING = 43,
        MIDDLE_BTN_EAST_WEST = 44
    }
}
export namespace print {
    export enum PrintDirectionMode {
        DIRECTION_MODE_AUTO = 0,
        DIRECTION_MODE_PORTRAIT = 1,
        DIRECTION_MODE_LANDSCAPE = 2
    }
}
export namespace print {
    export enum PrintColorMode {
        COLOR_MODE_MONOCHROME = 0,
        COLOR_MODE_COLOR = 1
    }
}
export namespace print {
    export enum PrintDuplexMode {
        DUPLEX_MODE_NONE = 0,
        DUPLEX_MODE_LONG_EDGE = 1,
        DUPLEX_MODE_SHORT_EDGE = 2
    }
}
export namespace print {
    export enum PrintPageType {
        PAGE_ISO_A3 = 0,
        PAGE_ISO_A4 = 1,
        PAGE_ISO_A5 = 2,
        PAGE_JIS_B5 = 3,
        PAGE_ISO_C5 = 4,
        PAGE_ISO_DL = 5,
        PAGE_LETTER = 6,
        PAGE_LEGAL = 7,
        PAGE_PHOTO_4X6 = 8,
        PAGE_PHOTO_5X7 = 9,
        PAGE_INT_DL_ENVELOPE = 10,
        PAGE_B_TABLOID = 11
    }
}
export namespace print {
    export enum PrintDocumentAdapterState {
        PREVIEW_DESTROY = 0,
        PRINT_TASK_SUCCEED = 1,
        PRINT_TASK_FAIL = 2,
        PRINT_TASK_CANCEL = 3,
        PRINT_TASK_BLOCK = 4
    }
}
export namespace print {
    export enum PrintFileCreationState {
        PRINT_FILE_CREATED = 0,
        PRINT_FILE_CREATION_FAILED = 1,
        PRINT_FILE_CREATED_UNRENDERED = 2
    }
}
export enum LevelMode {
    OVERLAY = 0,
    EMBEDDED = 1
}
export enum ImmersiveMode {
    DEFAULT = 0,
    EXTEND = 1
}
export namespace promptAction {
    export enum ToastShowMode {
        DEFAULT = 0,
        TOP_MOST = 1,
        SYSTEM_TOP_MOST = 2
    }
}
export namespace resourceManager {
    export enum Direction {
        DIRECTION_VERTICAL = 0,
        DIRECTION_HORIZONTAL = 1
    }
}
export namespace resourceManager {
    export enum DeviceType {
        DEVICE_TYPE_PHONE = 0,
        DEVICE_TYPE_TABLET = 1,
        DEVICE_TYPE_CAR = 2,
        DEVICE_TYPE_PC = 3,
        DEVICE_TYPE_TV = 4,
        DEVICE_TYPE_WEARABLE = 6,
        DEVICE_TYPE_2IN1 = 7
    }
}
export namespace resourceManager {
    export enum ScreenDensity {
        SCREEN_SDPI = 120,
        SCREEN_MDPI = 160,
        SCREEN_LDPI = 240,
        SCREEN_XLDPI = 320,
        SCREEN_XXLDPI = 480,
        SCREEN_XXXLDPI = 640
    }
}
export namespace resourceManager {
    export enum ColorMode {
        DARK = 0,
        LIGHT = 1
    }
}
export namespace router {
    export enum RouterMode {
        STANDARD = 0,
        Standard = 0,
        SINGLE = 1,
        Single = 1
    }
}
export namespace cert {
    export enum EncodingFormat {
        FORMAT_DER = 0,
        FORMAT_PEM = 1,
        FORMAT_PKCS7 = 2
    }
}
export namespace cert {
    export enum CertItemType {
        CERT_ITEM_TYPE_TBS = 0,
        CERT_ITEM_TYPE_PUBLIC_KEY = 1,
        CERT_ITEM_TYPE_ISSUER_UNIQUE_ID = 2,
        CERT_ITEM_TYPE_SUBJECT_UNIQUE_ID = 3,
        CERT_ITEM_TYPE_EXTENSIONS = 4
    }
}
export namespace cert {
    export enum ExtensionOidType {
        EXTENSION_OID_TYPE_ALL = 0,
        EXTENSION_OID_TYPE_CRITICAL = 1,
        EXTENSION_OID_TYPE_UNCRITICAL = 2
    }
}
export namespace cert {
    export enum ExtensionEntryType {
        EXTENSION_ENTRY_TYPE_ENTRY = 0,
        EXTENSION_ENTRY_TYPE_ENTRY_CRITICAL = 1,
        EXTENSION_ENTRY_TYPE_ENTRY_VALUE = 2
    }
}
export namespace cert {
    export enum EncodingType {
        ENCODING_UTF8 = 0
    }
}
export namespace cert {
    export enum GeneralNameType {
        GENERAL_NAME_TYPE_OTHER_NAME = 0,
        GENERAL_NAME_TYPE_RFC822_NAME = 1,
        GENERAL_NAME_TYPE_DNS_NAME = 2,
        GENERAL_NAME_TYPE_X400_ADDRESS = 3,
        GENERAL_NAME_TYPE_DIRECTORY_NAME = 4,
        GENERAL_NAME_TYPE_EDI_PARTY_NAME = 5,
        GENERAL_NAME_TYPE_UNIFORM_RESOURCE_ID = 6,
        GENERAL_NAME_TYPE_IP_ADDRESS = 7,
        GENERAL_NAME_TYPE_REGISTERED_ID = 8
    }
}
export namespace cryptoFramework {
    export enum AsyKeySpecItem {
        DSA_P_BN = 101,
        DSA_Q_BN = 102,
        DSA_G_BN = 103,
        DSA_SK_BN = 104,
        DSA_PK_BN = 105,
        ECC_FP_P_BN = 201,
        ECC_A_BN = 202,
        ECC_B_BN = 203,
        ECC_G_X_BN = 204,
        ECC_G_Y_BN = 205,
        ECC_N_BN = 206,
        ECC_H_NUM = 207,
        ECC_SK_BN = 208,
        ECC_PK_X_BN = 209,
        ECC_PK_Y_BN = 210,
        ECC_FIELD_TYPE_STR = 211,
        ECC_FIELD_SIZE_NUM = 212,
        ECC_CURVE_NAME_STR = 213,
        RSA_N_BN = 301,
        RSA_SK_BN = 302,
        RSA_PK_BN = 303,
        DH_P_BN = 401,
        DH_G_BN = 402,
        DH_L_NUM = 403,
        DH_SK_BN = 404,
        DH_PK_BN = 405,
        ED25519_SK_BN = 501,
        ED25519_PK_BN = 502,
        X25519_SK_BN = 601,
        X25519_PK_BN = 602
    }
}
export enum WebNetErrorList {
    NET_OK = 0,
    ERR_IO_PENDING = -1,
    ERR_FAILED = -2,
    ERR_ABORTED = -3,
    ERR_INVALID_ARGUMENT = -4,
    ERR_INVALID_HANDLE = -5,
    ERR_FILE_NOT_FOUND = -6,
    ERR_TIMED_OUT = -7,
    ERR_FILE_TOO_LARGE = -8,
    ERR_UNEXPECTED = -9,
    ERR_ACCESS_DENIED = -10,
    ERR_NOT_IMPLEMENTED = -11,
    ERR_INSUFFICIENT_RESOURCES = -12,
    ERR_OUT_OF_MEMORY = -13,
    ERR_UPLOAD_FILE_CHANGED = -14,
    ERR_SOCKET_NOT_CONNECTED = -15,
    ERR_FILE_EXISTS = -16,
    ERR_FILE_PATH_TOO_LONG = -17,
    ERR_FILE_NO_SPACE = -18,
    ERR_FILE_VIRUS_INFECTED = -19,
    ERR_BLOCKED_BY_CLIENT = -20,
    ERR_NETWORK_CHANGED = -21,
    ERR_BLOCKED_BY_ADMINISTRATOR = -22,
    ERR_SOCKET_CONNECTED = -23,
    ERR_UPLOAD_STREAM_REWIND_NOT_SUPPORTED = -25,
    ERR_CONTEXT_SHUT_DOWN = -26,
    ERR_BLOCKED_BY_RESPONSE = -27,
    ERR_CLEARTEXT_NOT_PERMITTED = -29,
    ERR_BLOCKED_BY_CSP = -30,
    ERR_H2_OR_QUIC_REQUIRED = -31,
    ERR_BLOCKED_BY_ORB = -32,
    ERR_CONNECTION_CLOSED = -100,
    ERR_CONNECTION_RESET = -101,
    ERR_CONNECTION_REFUSED = -102,
    ERR_CONNECTION_ABORTED = -103,
    ERR_CONNECTION_FAILED = -104,
    ERR_NAME_NOT_RESOLVED = -105,
    ERR_INTERNET_DISCONNECTED = -106,
    ERR_SSL_PROTOCOL_ERROR = -107,
    ERR_ADDRESS_INVALID = -108,
    ERR_ADDRESS_UNREACHABLE = -109,
    ERR_SSL_CLIENT_AUTH_CERT_NEEDED = -110,
    ERR_TUNNEL_CONNECTION_FAILED = -111,
    ERR_NO_SSL_VERSIONS_ENABLED = -112,
    ERR_SSL_VERSION_OR_CIPHER_MISMATCH = -113,
    ERR_SSL_RENEGOTIATION_REQUESTED = -114,
    ERR_PROXY_AUTH_UNSUPPORTED = -115,
    ERR_BAD_SSL_CLIENT_AUTH_CERT = -117,
    ERR_CONNECTION_TIMED_OUT = -118,
    ERR_HOST_RESOLVER_QUEUE_TOO_LARGE = -119,
    ERR_SOCKS_CONNECTION_FAILED = -120,
    ERR_SOCKS_CONNECTION_HOST_UNREACHABLE = -121,
    ERR_ALPN_NEGOTIATION_FAILED = -122,
    ERR_SSL_NO_RENEGOTIATION = -123,
    ERR_WINSOCK_UNEXPECTED_WRITTEN_BYTES = -124,
    ERR_SSL_DECOMPRESSION_FAILURE_ALERT = -125,
    ERR_SSL_BAD_RECORD_MAC_ALERT = -126,
    ERR_PROXY_AUTH_REQUESTED = -127,
    ERR_PROXY_CONNECTION_FAILED = -130,
    ERR_MANDATORY_PROXY_CONFIGURATION_FAILED = -131,
    ERR_PRECONNECT_MAX_SOCKET_LIMIT = -133,
    ERR_SSL_CLIENT_AUTH_PRIVATE_KEY_ACCESS_DENIED = -134,
    ERR_SSL_CLIENT_AUTH_CERT_NO_PRIVATE_KEY = -135,
    ERR_PROXY_CERTIFICATE_INVALID = -136,
    ERR_NAME_RESOLUTION_FAILED = -137,
    ERR_NETWORK_ACCESS_DENIED = -138,
    ERR_TEMPORARILY_THROTTLED = -139,
    ERR_HTTPS_PROXY_TUNNEL_RESPONSE_REDIRECT = -140,
    ERR_SSL_CLIENT_AUTH_SIGNATURE_FAILED = -141,
    ERR_MSG_TOO_BIG = -142,
    ERR_WS_PROTOCOL_ERROR = -145,
    ERR_ADDRESS_IN_USE = -147,
    ERR_SSL_HANDSHAKE_NOT_COMPLETED = -148,
    ERR_SSL_BAD_PEER_PUBLIC_KEY = -149,
    ERR_SSL_PINNED_KEY_NOT_IN_CERT_CHAIN = -150,
    ERR_CLIENT_AUTH_CERT_TYPE_UNSUPPORTED = -151,
    ERR_SSL_DECRYPT_ERROR_ALERT = -153,
    ERR_WS_THROTTLE_QUEUE_TOO_LARGE = -154,
    ERR_SSL_SERVER_CERT_CHANGED = -156,
    ERR_SSL_UNRECOGNIZED_NAME_ALERT = -159,
    ERR_SOCKET_SET_RECEIVE_BUFFER_SIZE_ERROR = -160,
    ERR_SOCKET_SET_SEND_BUFFER_SIZE_ERROR = -161,
    ERR_SOCKET_RECEIVE_BUFFER_SIZE_UNCHANGEABLE = -162,
    ERR_SOCKET_SEND_BUFFER_SIZE_UNCHANGEABLE = -163,
    ERR_SSL_CLIENT_AUTH_CERT_BAD_FORMAT = -164,
    ERR_ICANN_NAME_COLLISION = -166,
    ERR_SSL_SERVER_CERT_BAD_FORMAT = -167,
    ERR_CT_STH_PARSING_FAILED = -168,
    ERR_CT_STH_INCOMPLETE = -169,
    ERR_UNABLE_TO_REUSE_CONNECTION_FOR_PROXY_AUTH = -170,
    ERR_CT_CONSISTENCY_PROOF_PARSING_FAILED = -171,
    ERR_SSL_OBSOLETE_CIPHER = -172,
    ERR_WS_UPGRADE = -173,
    ERR_READ_IF_READY_NOT_IMPLEMENTED = -174,
    ERR_NO_BUFFER_SPACE = -176,
    ERR_SSL_CLIENT_AUTH_NO_COMMON_ALGORITHMS = -177,
    ERR_EARLY_DATA_REJECTED = -178,
    ERR_WRONG_VERSION_ON_EARLY_DATA = -179,
    ERR_TLS13_DOWNGRADE_DETECTED = -180,
    ERR_SSL_KEY_USAGE_INCOMPATIBLE = -181,
    ERR_INVALID_ECH_CONFIG_LIST = -182,
    ERR_ECH_NOT_NEGOTIATED = -183,
    ERR_ECH_FALLBACK_CERTIFICATE_INVALID = -184,
    ERR_CERT_COMMON_NAME_INVALID = -200,
    ERR_CERT_DATE_INVALID = -201,
    ERR_CERT_AUTHORITY_INVALID = -202,
    ERR_CERT_CONTAINS_ERRORS = -203,
    ERR_CERT_NO_REVOCATION_MECHANISM = -204,
    ERR_CERT_UNABLE_TO_CHECK_REVOCATION = -205,
    ERR_CERT_REVOKED = -206,
    ERR_CERT_INVALID = -207,
    ERR_CERT_WEAK_SIGNATURE_ALGORITHM = -208,
    ERR_CERT_NON_UNIQUE_NAME = -210,
    ERR_CERT_WEAK_KEY = -211,
    ERR_CERT_NAME_CONSTRAINT_VIOLATION = -212,
    ERR_CERT_VALIDITY_TOO_LONG = -213,
    ERR_CERTIFICATE_TRANSPARENCY_REQUIRED = -214,
    ERR_CERT_SYMANTEC_LEGACY = -215,
    ERR_CERT_KNOWN_INTERCEPTION_BLOCKED = -217,
    ERR_SSL_OBSOLETE_VERSION_OR_CIPHER = -218,
    ERR_CERT_END = -219,
    ERR_INVALID_URL = -300,
    ERR_DISALLOWED_URL_SCHEME = -301,
    ERR_UNKNOWN_URL_SCHEME = -302,
    ERR_INVALID_REDIRECT = -303,
    ERR_TOO_MANY_REDIRECTS = -310,
    ERR_UNSAFE_REDIRECT = -311,
    ERR_UNSAFE_PORT = -312,
    ERR_INVALID_RESPONSE = -320,
    ERR_INVALID_CHUNKED_ENCODING = -321,
    ERR_METHOD_UNSUPPORTED = -322,
    ERR_UNEXPECTED_PROXY_AUTH = -323,
    ERR_EMPTY_RESPONSE = -324,
    ERR_RESPONSE_HEADERS_TOO_BIG = -325,
    ERR_PAC_SCRIPT_FAILED = -327,
    ERR_REQUEST_RANGE_NOT_SATISFIABLE = -328,
    ERR_MALFORMED_IDENTITY = -329,
    ERR_CONTENT_DECODING_FAILED = -330,
    ERR_NETWORK_IO_SUSPENDED = -331,
    ERR_SYN_REPLY_NOT_RECEIVED = -332,
    ERR_ENCODING_CONVERSION_FAILED = -333,
    ERR_UNRECOGNIZED_FTP_DIRECTORY_LISTING_FORMAT = -334,
    ERR_NO_SUPPORTED_PROXIES = -336,
    ERR_HTTP2_PROTOCOL_ERROR = -337,
    ERR_INVALID_AUTH_CREDENTIALS = -338,
    ERR_UNSUPPORTED_AUTH_SCHEME = -339,
    ERR_ENCODING_DETECTION_FAILED = -340,
    ERR_MISSING_AUTH_CREDENTIALS = -341,
    ERR_UNEXPECTED_SECURITY_LIBRARY_STATUS = -342,
    ERR_MISCONFIGURED_AUTH_ENVIRONMENT = -343,
    ERR_UNDOCUMENTED_SECURITY_LIBRARY_STATUS = -344,
    ERR_RESPONSE_BODY_TOO_BIG_TO_DRAIN = -345,
    ERR_RESPONSE_HEADERS_MULTIPLE_CONTENT_LENGTH = -346,
    ERR_INCOMPLETE_HTTP2_HEADERS = -347,
    ERR_PAC_NOT_IN_DHCP = -348,
    ERR_RESPONSE_HEADERS_MULTIPLE_CONTENT_DISPOSITION = -349,
    ERR_RESPONSE_HEADERS_MULTIPLE_LOCATION = -350,
    ERR_HTTP2_SERVER_REFUSED_STREAM = -351,
    ERR_HTTP2_PING_FAILED = -352,
    ERR_CONTENT_LENGTH_MISMATCH = -354,
    ERR_INCOMPLETE_CHUNKED_ENCODING = -355,
    ERR_QUIC_PROTOCOL_ERROR = -356,
    ERR_RESPONSE_HEADERS_TRUNCATED = -357,
    ERR_QUIC_HANDSHAKE_FAILED = -358,
    ERR_HTTP2_INADEQUATE_TRANSPORT_SECURITY = -360,
    ERR_HTTP2_FLOW_CONTROL_ERROR = -361,
    ERR_HTTP2_FRAME_SIZE_ERROR = -362,
    ERR_HTTP2_COMPRESSION_ERROR = -363,
    ERR_PROXY_AUTH_REQUESTED_WITH_NO_CONNECTION = -364,
    ERR_HTTP_1_1_REQUIRED = -365,
    ERR_PROXY_HTTP_1_1_REQUIRED = -366,
    ERR_PAC_SCRIPT_TERMINATED = -367,
    ERR_INVALID_HTTP_RESPONSE = -370,
    ERR_CONTENT_DECODING_INIT_FAILED = -371,
    ERR_HTTP2_RST_STREAM_NO_ERROR_RECEIVED = -372,
    ERR_HTTP2_PUSHED_STREAM_NOT_AVAILABLE = -373,
    ERR_HTTP2_CLAIMED_PUSHED_STREAM_RESET_BY_SERVER = -374,
    ERR_TOO_MANY_RETRIES = -375,
    ERR_HTTP2_STREAM_CLOSED = -376,
    ERR_HTTP2_CLIENT_REFUSED_STREAM = -377,
    ERR_HTTP2_PUSHED_RESPONSE_DOES_NOT_MATCH = -378,
    ERR_HTTP_RESPONSE_CODE_FAILURE = -379,
    ERR_QUIC_UNKNOWN_CERT_ROOT = -380,
    ERR_QUIC_GOAWAY_REQUEST_CAN_BE_RETRIED = -381,
    ERR_TOO_MANY_ACCEPT_CH_RESTARTS = -382,
    ERR_INCONSISTENT_IP_ADDRESS_SPACE = -383,
    ERR_CACHED_IP_ADDRESS_SPACE_BLOCKED_BY_LOCAL_NETWORK_ACCESS_POLICY = -384,
    ERR_CACHE_MISS = -400,
    ERR_CACHE_READ_FAILURE = -401,
    ERR_CACHE_WRITE_FAILURE = -402,
    ERR_CACHE_OPERATION_UNSUPPORTED = -403,
    ERR_CACHE_OPEN_FAILURE = -404,
    ERR_CACHE_CREATE_FAILURE = -405,
    ERR_CACHE_RACE = -406,
    ERR_CACHE_CHECKSUM_READ_FAILURE = -407,
    ERR_CACHE_CHECKSUM_MISMATCH = -408,
    ERR_CACHE_LOCK_TIMEOUT = -409,
    ERR_CACHE_AUTH_FAILURE_AFTER_READ = -410,
    ERR_CACHE_ENTRY_NOT_SUITABLE = -411,
    ERR_CACHE_DOOM_FAILURE = -412,
    ERR_CACHE_OPEN_OR_CREATE_FAILURE = -413,
    ERR_INSECURE_RESPONSE = -501,
    ERR_NO_PRIVATE_KEY_FOR_CERT = -502,
    ERR_ADD_USER_CERT_FAILED = -503,
    ERR_INVALID_SIGNED_EXCHANGE = -504,
    ERR_INVALID_WEB_BUNDLE = -505,
    ERR_TRUST_TOKEN_OPERATION_FAILED = -506,
    ERR_TRUST_TOKEN_OPERATION_SUCCESS_WITHOUT_SENDING_REQUEST = -507,
    ERR_FTP_FAILED = -601,
    ERR_FTP_SERVICE_UNAVAILABLE = -602,
    ERR_FTP_TRANSFER_ABORTED = -603,
    ERR_FTP_FILE_BUSY = -604,
    ERR_FTP_SYNTAX_ERROR = -605,
    ERR_FTP_COMMAND_UNSUPPORTED = -606,
    ERR_FTP_BAD_COMMAND_SEQUENCE = -607,
    ERR_PKCS12_IMPORT_BAD_PASSWORD = -701,
    ERR_PKCS12_IMPORT_FAILED = -702,
    ERR_IMPORT_CA_CERT_NOT_CA = -703,
    ERR_IMPORT_CERT_ALREADY_EXISTS = -704,
    ERR_IMPORT_CA_CERT_FAILED = -705,
    ERR_IMPORT_SERVER_CERT_FAILED = -706,
    ERR_PKCS12_IMPORT_INVALID_MAC = -707,
    ERR_PKCS12_IMPORT_INVALID_FILE = -708,
    ERR_PKCS12_IMPORT_UNSUPPORTED = -709,
    ERR_KEY_GENERATION_FAILED = -710,
    ERR_PRIVATE_KEY_EXPORT_FAILED = -712,
    ERR_SELF_SIGNED_CERT_GENERATION_FAILED = -713,
    ERR_CERT_DATABASE_CHANGED = -714,
    ERR_CERT_VERIFIER_CHANGED = -716,
    ERR_DNS_MALFORMED_RESPONSE = -800,
    ERR_DNS_SERVER_REQUIRES_TCP = -801,
    ERR_DNS_SERVER_FAILED = -802,
    ERR_DNS_TIMED_OUT = -803,
    ERR_DNS_CACHE_MISS = -804,
    ERR_DNS_SEARCH_EMPTY = -805,
    ERR_DNS_SORT_ERROR = -806,
    ERR_DNS_SECURE_RESOLVER_HOSTNAME_RESOLUTION_FAILED = -808,
    ERR_DNS_NAME_HTTPS_ONLY = -809,
    ERR_DNS_REQUEST_CANCELED = -810,
    ERR_DNS_NO_MATCHING_SUPPORTED_ALPN = -811
}
export namespace webview {
    export enum WebHitTestType {
        EDIT_TEXT = 0,
        EditText = 0,
        EMAIL = 1,
        Email = 1,
        HTTP_ANCHOR = 2,
        HttpAnchor = 2,
        HTTP_ANCHOR_IMG = 3,
        HttpAnchorImg = 3,
        IMG = 4,
        Img = 4,
        MAP = 5,
        Map = 5,
        PHONE = 6,
        Phone = 6,
        UNKNOWN = 7,
        Unknown = 7
    }
}
export namespace webview {
    export enum SecureDnsMode {
        OFF = 0,
        AUTO = 1,
        SECURE_ONLY = 2
    }
}
export namespace webview {
    export enum SecurityLevel {
        NONE = 0,
        SECURE = 1,
        WARNING = 2,
        DANGEROUS = 3
    }
}
export namespace webview {
    export enum MediaPlaybackState {
        NONE = 0,
        PLAYING = 1,
        PAUSED = 2,
        STOPPED = 3
    }
}
export namespace webview {
    export enum PressureLevel {
        MEMORY_PRESSURE_LEVEL_MODERATE = 1,
        MEMORY_PRESSURE_LEVEL_CRITICAL = 2
    }
}
export namespace webview {
    export enum WebMessageType {
        NOT_SUPPORT = 0,
        STRING = 1,
        NUMBER = 2,
        BOOLEAN = 3,
        ARRAY_BUFFER = 4,
        ARRAY = 5,
        ERROR = 6
    }
}
export namespace webview {
    export enum JsMessageType {
        NOT_SUPPORT = 0,
        STRING = 1,
        NUMBER = 2,
        BOOLEAN = 3,
        ARRAY_BUFFER = 4,
        ARRAY = 5
    }
}
export namespace webview {
    export enum RenderProcessMode {
        SINGLE = 0,
        MULTIPLE = 1
    }
}
export namespace webview {
    export enum OfflineResourceType {
        IMAGE = 0,
        CSS = 1,
        CLASSIC_JS = 2,
        MODULE_JS = 3
    }
}
export namespace webview {
    export enum ScrollType {
        EVENT = 0
    }
}
export namespace webview {
    export enum WebDownloadState {
        IN_PROGRESS = 0,
        COMPLETED = 1,
        CANCELED = 2,
        INTERRUPTED = 3,
        PENDING = 4,
        PAUSED = 5,
        UNKNOWN = 6
    }
}
export namespace webview {
    export enum WebDownloadErrorCode {
        ERROR_UNKNOWN = 0,
        FILE_FAILED = 1,
        FILE_ACCESS_DENIED = 2,
        FILE_NO_SPACE = 3,
        FILE_NAME_TOO_LONG = 5,
        FILE_TOO_LARGE = 6,
        FILE_TRANSIENT_ERROR = 10,
        FILE_BLOCKED = 11,
        FILE_TOO_SHORT = 13,
        FILE_HASH_MISMATCH = 14,
        FILE_SAME_AS_SOURCE = 15,
        NETWORK_FAILED = 20,
        NETWORK_TIMEOUT = 21,
        NETWORK_DISCONNECTED = 22,
        NETWORK_SERVER_DOWN = 23,
        NETWORK_INVALID_REQUEST = 24,
        SERVER_FAILED = 30,
        SERVER_NO_RANGE = 31,
        SERVER_BAD_CONTENT = 33,
        SERVER_UNAUTHORIZED = 34,
        SERVER_CERT_PROBLEM = 35,
        SERVER_FORBIDDEN = 36,
        SERVER_UNREACHABLE = 37,
        SERVER_CONTENT_LENGTH_MISMATCH = 38,
        SERVER_CROSS_ORIGIN_REDIRECT = 39,
        USER_CANCELED = 40,
        USER_SHUTDOWN = 41,
        CRASH = 50
    }
}
export namespace webview {
    export enum WebResourceType {
        MAIN_FRAME = 0,
        SUB_FRAME = 1,
        STYLE_SHEET = 2,
        SCRIPT = 3,
        IMAGE = 4,
        FONT_RESOURCE = 5,
        SUB_RESOURCE = 6,
        OBJECT = 7,
        MEDIA = 8,
        WORKER = 9,
        SHARED_WORKER = 10,
        PREFETCH = 11,
        FAVICON = 12,
        XHR = 13,
        PING = 14,
        SERVICE_WORKER = 15,
        CSP_REPORT = 16,
        PLUGIN_RESOURCE = 17,
        NAVIGATION_PRELOAD_MAIN_FRAME = 19,
        NAVIGATION_PRELOAD_SUB_FRAME = 20
    }
}
export namespace webview {
    export enum PlaybackStatus {
        PAUSED = 0,
        PLAYING = 1
    }
}
export namespace webview {
    export enum NetworkState {
        EMPTY = 0,
        IDLE = 1,
        LOADING = 2,
        NETWORK_ERROR = 3
    }
}
export namespace webview {
    export enum ReadyState {
        HAVE_NOTHING = 0,
        HAVE_METADATA = 1,
        HAVE_CURRENT_DATA = 2,
        HAVE_FUTURE_DATA = 3,
        HAVE_ENOUGH_DATA = 4
    }
}
export namespace webview {
    export enum MediaError {
        NETWORK_ERROR = 1,
        FORMAT_ERROR = 2,
        DECODE_ERROR = 3
    }
}
export namespace webview {
    export enum SuspendType {
        ENTER_BACK_FORWARD_CACHE = 0,
        ENTER_BACKGROUND = 1,
        AUTO_CLEANUP = 2
    }
}
export namespace webview {
    export enum MediaType {
        VIDEO = 0,
        AUDIO = 1
    }
}
export namespace webview {
    export enum SourceType {
        URL = 0,
        MSE = 1
    }
}
export namespace webview {
    export enum Preload {
        NONE = 0,
        METADATA = 1,
        AUTO = 2
    }
}
export namespace window {
    export enum WindowType {
        TYPE_APP = 0,
        TYPE_STATUS_BAR = 3,
        TYPE_PANEL = 4,
        TYPE_KEYGUARD = 5,
        TYPE_VOLUME_OVERLAY = 6,
        TYPE_NAVIGATION_BAR = 7,
        TYPE_FLOAT = 8,
        TYPE_WALLPAPER = 9,
        TYPE_DESKTOP = 10,
        TYPE_LAUNCHER_RECENT = 11,
        TYPE_LAUNCHER_DOCK = 12,
        TYPE_VOICE_INTERACTION = 13,
        TYPE_POINTER = 14,
        TYPE_FLOAT_CAMERA = 15,
        TYPE_DIALOG = 16,
        TYPE_SCREENSHOT = 17,
        TYPE_SYSTEM_TOAST = 18,
        TYPE_DIVIDER = 19,
        TYPE_GLOBAL_SEARCH = 20,
        TYPE_HANDWRITE = 21,
        TYPE_WALLET_SWIPE_CARD = 22,
        TYPE_SCREEN_CONTROL = 23,
        TYPE_FLOAT_NAVIGATION = 24
    }
}
export namespace window {
    export enum AvoidAreaType {
        TYPE_SYSTEM = 0,
        TYPE_CUTOUT = 1,
        TYPE_SYSTEM_GESTURE = 2,
        TYPE_KEYBOARD = 3,
        TYPE_NAVIGATION_INDICATOR = 4
    }
}
export namespace window {
    export enum WindowStatusType {
        UNDEFINED = 0,
        FULL_SCREEN = 1,
        MAXIMIZE = 2,
        MINIMIZE = 3,
        FLOATING = 4,
        SPLIT_SCREEN = 5
    }
}
export namespace window {
    export enum ColorSpace {
        DEFAULT = 0,
        WIDE_GAMUT = 1
    }
}
export namespace window {
    export enum RectChangeReason {
        UNDEFINED = 0,
        MAXIMIZE = 1,
        RECOVER = 2,
        MOVE = 3,
        DRAG = 4,
        DRAG_START = 5,
        DRAG_END = 6
    }
}
export namespace window {
    export enum Orientation {
        UNSPECIFIED = 0,
        PORTRAIT = 1,
        LANDSCAPE = 2,
        PORTRAIT_INVERTED = 3,
        LANDSCAPE_INVERTED = 4,
        AUTO_ROTATION = 5,
        AUTO_ROTATION_PORTRAIT = 6,
        AUTO_ROTATION_LANDSCAPE = 7,
        AUTO_ROTATION_RESTRICTED = 8,
        AUTO_ROTATION_PORTRAIT_RESTRICTED = 9,
        AUTO_ROTATION_LANDSCAPE_RESTRICTED = 10,
        LOCKED = 11,
        AUTO_ROTATION_UNSPECIFIED = 12,
        USER_ROTATION_PORTRAIT = 13,
        USER_ROTATION_LANDSCAPE = 14,
        USER_ROTATION_PORTRAIT_INVERTED = 15,
        USER_ROTATION_LANDSCAPE_INVERTED = 16,
        FOLLOW_DESKTOP = 17
    }
}
export namespace window {
    export enum WindowEventType {
        WINDOW_SHOWN = 1,
        WINDOW_ACTIVE = 2,
        WINDOW_INACTIVE = 3,
        WINDOW_HIDDEN = 4,
        WINDOW_DESTROYED = 7
    }
}
export namespace window {
    export enum MaximizePresentation {
        FOLLOW_APP_IMMERSIVE_SETTING = 0,
        EXIT_IMMERSIVE = 1,
        ENTER_IMMERSIVE = 2
    }
}
export namespace window {
    export enum WindowStageEventType {
        SHOWN = 1,
        ACTIVE = 2,
        INACTIVE = 3,
        HIDDEN = 4,
        RESUMED = 5,
        PAUSED = 6
    }
}
export enum DialogAlignment {
    TOP = 0,
    Top = 0,
    CENTER = 1,
    Center = 1,
    BOTTOM = 2,
    Bottom = 2,
    DEFAULT = 3,
    Default = 3,
    TOP_START = 4,
    TopStart = 4,
    TOP_END = 5,
    TopEnd = 5,
    CENTER_START = 6,
    CenterStart = 6,
    CENTER_END = 7,
    CenterEnd = 7,
    BOTTOM_START = 8,
    BottomStart = 8,
    BOTTOM_END = 9,
    BottomEnd = 9
}
export enum DialogButtonDirection {
    AUTO = 0,
    HORIZONTAL = 1,
    VERTICAL = 2
}
export enum IndexerAlign {
    LEFT = 0,
    Left = 0,
    RIGHT = 1,
    Right = 1,
    START = 2,
    END = 3
}
export enum BadgePosition {
    RIGHT_TOP = 0,
    RightTop = 0,
    RIGHT = 1,
    Right = 1,
    LEFT = 2,
    Left = 2
}
export enum NodeRenderType {
    RENDER_TYPE_DISPLAY = 0,
    RENDER_TYPE_TEXTURE = 1
}
export enum ButtonType {
    CAPSULE = 0,
    Capsule = 0,
    CIRCLE = 1,
    Circle = 1,
    NORMAL = 2,
    Normal = 2,
    ROUNDED_RECTANGLE = 3
}
export enum ButtonStyleMode {
    NORMAL = 0,
    EMPHASIZED = 1,
    TEXTUAL = 2
}
export enum ButtonRole {
    NORMAL = 0,
    ERROR = 1
}
export enum ControlSize {
    SMALL = "'small'",
    NORMAL = "'normal'"
}
export enum CalendarAlign {
    START = 0,
    CENTER = 1,
    END = 2
}
export enum SelectStatus {
    ALL = 0,
    All = 0,
    PART = 1,
    Part = 1,
    NONE = 2,
    None = 2
}
export enum AccessibilitySamePageMode {
    SEMI_SILENT = 0,
    FULL_SILENT = 1
}
export enum AccessibilityRoleType {
    ACTION_SHEET = 0,
    ALERT_DIALOG = 1,
    INDEXER_COMPONENT = 2,
    BADGE_COMPONENT = 3,
    BLANK = 4,
    BUTTON = 5,
    BACK_BUTTON = 6,
    SHEET_DRAG_BAR = 7,
    CALENDAR_PICKER = 8,
    CALENDAR = 9,
    CANVAS = 10,
    CANVAS_GRADIENT = 11,
    CANVAS_PATTERN = 12,
    CHECKBOX = 13,
    CHECKBOX_GROUP = 14,
    CIRCLE = 15,
    COLUMN_SPLIT = 16,
    COLUMN = 17,
    CANVAS_RENDERING_CONTEXT_2D = 18,
    CHART = 19,
    COUNTER = 20,
    CONTAINER_MODAL = 21,
    DATA_PANEL = 22,
    DATE_PICKER = 23,
    DIALOG = 24,
    DIVIDER = 25,
    DRAG_BAR = 26,
    EFFECT_COMPONENT = 27,
    ELLIPSE = 28,
    FLEX = 29,
    FLOW_ITEM = 30,
    FORM_COMPONENT = 31,
    FORM_LINK = 32,
    GAUGE = 33,
    GRID = 34,
    GRID_COL = 35,
    GRID_CONTAINER = 36,
    GRID_ITEM = 37,
    GRID_ROW = 38,
    HYPERLINK = 39,
    IMAGE = 40,
    IMAGE_ANIMATOR = 41,
    IMAGE_BITMAP = 42,
    IMAGE_DATA = 43,
    IMAGE_SPAN = 44,
    LABEL = 45,
    LINE = 46,
    LIST = 47,
    LIST_ITEM = 48,
    LIST_ITEM_GROUP = 49,
    LOADING_PROGRESS = 50,
    MARQUEE = 51,
    MATRIX2D = 52,
    MENU = 53,
    MENU_ITEM = 54,
    MENU_ITEM_GROUP = 55,
    NAV_DESTINATION = 56,
    NAV_ROUTER = 57,
    NAVIGATION = 58,
    NAVIGATION_BAR = 59,
    NAVIGATION_MENU = 60,
    NAVIGATOR = 61,
    OFFSCREEN_CANVAS = 62,
    OFFSCREEN_CANVAS_RENDERING_CONTEXT2D = 63,
    OPTION = 64,
    PANEL = 65,
    PAPER_PAGE = 66,
    PATH = 67,
    PATH2D = 68,
    PATTERN_LOCK = 69,
    PICKER = 70,
    PICKER_VIEW = 71,
    PLUGIN_COMPONENT = 72,
    POLYGON = 73,
    POLYLINE = 74,
    POPUP = 75,
    PROGRESS = 76,
    QRCODE = 77,
    RADIO = 78,
    RATING = 79,
    RECT = 80,
    REFRESH = 81,
    RELATIVE_CONTAINER = 82,
    REMOTE_WINDOW = 83,
    RICH_EDITOR = 84,
    RICH_TEXT = 85,
    ROLE_PAGER = 86,
    ROW = 87,
    ROW_SPLIT = 88,
    SCROLL = 89,
    SCROLL_BAR = 90,
    SEARCH = 91,
    SEARCH_FIELD = 92,
    SELECT = 93,
    SHAPE = 94,
    SIDEBAR_CONTAINER = 95,
    SLIDER = 96,
    SPAN = 97,
    STACK = 98,
    STEPPER = 99,
    STEPPER_ITEM = 100,
    SWIPER = 101,
    SWIPER_INDICATOR = 102,
    SWITCH = 103,
    SYMBOL_GLYPH = 104,
    TAB_CONTENT = 105,
    TAB_BAR = 106,
    TABS = 107,
    TEXT = 108,
    TEXT_CLOCK = 109,
    TEXT_ENTRY = 110,
    TEXT_INPUT = 111,
    TEXT_PICKER = 112,
    TEXT_TIMER = 113,
    TEXT_AREA = 114,
    TEXT_FIELD = 115,
    TIME_PICKER = 116,
    TITLE_BAR = 117,
    TOGGLER = 118,
    UI_EXTENSION_COMPONENT = 119,
    VIDEO = 120,
    WATER_FLOW = 121,
    WEB = 122,
    XCOMPONENT = 123,
    ROLE_NONE = 124
}
export enum FinishCallbackType {
    REMOVED = 0,
    LOGICALLY = 1
}
export enum TouchTestStrategy {
    DEFAULT = 0,
    FORWARD_COMPETITION = 1,
    FORWARD = 2
}
export enum TransitionHierarchyStrategy {
    NONE = 0,
    ADAPTIVE = 1
}
export enum ChainStyle {
    SPREAD = 0,
    SPREAD_INSIDE = 1,
    PACKED = 2
}
export enum TransitionEdge {
    TOP = 0,
    BOTTOM = 1,
    START = 2,
    END = 3
}
export enum EffectType {
    DEFAULT = 0,
    WINDOW_EFFECT = 1
}
export enum PreDragStatus {
    ACTION_DETECTING_STATUS = 0,
    READY_TO_TRIGGER_DRAG_ACTION = 1,
    PREVIEW_LIFT_STARTED = 2,
    PREVIEW_LIFT_FINISHED = 3,
    PREVIEW_LANDING_STARTED = 4,
    PREVIEW_LANDING_FINISHED = 5,
    ACTION_CANCELED_BEFORE_DRAG = 6,
    PREPARING_FOR_DRAG_DETECTION = 7
}
export enum SourceType {
    UNKNOWN = 0,
    Unknown = 0,
    MOUSE = 1,
    Mouse = 1,
    TOUCH_SCREEN = 2,
    TouchScreen = 2
}
export enum SourceTool {
    UNKNOWN = 0,
    Unknown = 0,
    FINGER = 1,
    Finger = 1,
    PEN = 2,
    Pen = 2,
    MOUSE = 3,
    TOUCHPAD = 4,
    JOYSTICK = 5
}
export enum RepeatMode {
    REPEAT = 0,
    Repeat = 0,
    STRETCH = 1,
    Stretch = 1,
    ROUND = 2,
    Round = 2,
    SPACE = 3,
    Space = 3
}
export enum BlurStyle {
    THIN = 0,
    Thin = 0,
    REGULAR = 1,
    Regular = 1,
    THICK = 2,
    Thick = 2,
    BACKGROUND_THIN = 3,
    BACKGROUND_REGULAR = 4,
    BACKGROUND_THICK = 5,
    BACKGROUND_ULTRA_THICK = 6,
    NONE = 7,
    COMPONENT_ULTRA_THIN = 8,
    COMPONENT_THIN = 9,
    COMPONENT_REGULAR = 10,
    COMPONENT_THICK = 11,
    COMPONENT_ULTRA_THICK = 12
}
export enum BlurStyleActivePolicy {
    FOLLOWS_WINDOW_ACTIVE_STATE = 0,
    ALWAYS_ACTIVE = 1,
    ALWAYS_INACTIVE = 2
}
export enum ThemeColorMode {
    SYSTEM = 0,
    LIGHT = 1,
    DARK = 2
}
export enum AdaptiveColor {
    DEFAULT = 0,
    AVERAGE = 1
}
export enum ModalTransition {
    DEFAULT = 0,
    NONE = 1,
    ALPHA = 2
}
export enum ShadowType {
    COLOR = 0,
    BLUR = 1
}
export enum ShadowStyle {
    OUTER_DEFAULT_XS = 0,
    OUTER_DEFAULT_SM = 1,
    OUTER_DEFAULT_MD = 2,
    OUTER_DEFAULT_LG = 3,
    OUTER_FLOATING_SM = 4,
    OUTER_FLOATING_MD = 5
}
export enum SafeAreaType {
    SYSTEM = 0,
    CUTOUT = 1,
    KEYBOARD = 2
}
export enum SafeAreaEdge {
    TOP = 0,
    BOTTOM = 1,
    START = 2,
    END = 3
}
export enum LayoutSafeAreaType {
    SYSTEM = 0
}
export enum LayoutSafeAreaEdge {
    TOP = 0,
    BOTTOM = 1
}
export enum SheetSize {
    MEDIUM = 0,
    LARGE = 1,
    FIT_CONTENT = 2
}
export enum DragBehavior {
    COPY = 0,
    MOVE = 1
}
export enum DragResult {
    DRAG_SUCCESSFUL = 0,
    DRAG_FAILED = 1,
    DRAG_CANCELED = 2,
    DROP_ENABLED = 3,
    DROP_DISABLED = 4
}
export enum BlendMode {
    NONE = 0,
    CLEAR = 1,
    SRC = 2,
    DST = 3,
    SRC_OVER = 4,
    DST_OVER = 5,
    SRC_IN = 6,
    DST_IN = 7,
    SRC_OUT = 8,
    DST_OUT = 9,
    SRC_ATOP = 10,
    DST_ATOP = 11,
    XOR = 12,
    PLUS = 13,
    MODULATE = 14,
    SCREEN = 15,
    OVERLAY = 16,
    DARKEN = 17,
    LIGHTEN = 18,
    COLOR_DODGE = 19,
    COLOR_BURN = 20,
    HARD_LIGHT = 21,
    SOFT_LIGHT = 22,
    DIFFERENCE = 23,
    EXCLUSION = 24,
    MULTIPLY = 25,
    HUE = 26,
    SATURATION = 27,
    COLOR = 28,
    LUMINOSITY = 29
}
export enum BlendApplyType {
    FAST = 0,
    OFFSCREEN = 1
}
export enum SheetType {
    BOTTOM = 0,
    CENTER = 1,
    POPUP = 2
}
export enum SheetMode {
    OVERLAY = 0,
    EMBEDDED = 1
}
export enum ScrollSizeMode {
    FOLLOW_DETENT = 0,
    CONTINUOUS = 1
}
export enum SheetKeyboardAvoidMode {
    NONE = 0,
    TRANSLATE_AND_RESIZE = 1,
    RESIZE_ONLY = 2,
    TRANSLATE_AND_SCROLL = 3
}
export enum DismissReason {
    PRESS_BACK = 0,
    TOUCH_OUTSIDE = 1,
    CLOSE_BUTTON = 2,
    SLIDE_DOWN = 3
}
export enum MenuPreviewMode {
    NONE = 0,
    IMAGE = 1
}
export enum HapticFeedbackMode {
    DISABLED = 0,
    ENABLED = 1,
    AUTO = 2
}
export enum OutlineStyle {
    SOLID = 0,
    DASHED = 1,
    DOTTED = 2
}
export enum DragPreviewMode {
    AUTO = 1,
    DISABLE_SCALE = 2,
    ENABLE_DEFAULT_SHADOW = 3,
    ENABLE_DEFAULT_RADIUS = 4,
    ENABLE_DRAG_ITEM_GRAY_EFFECT = 5,
    ENABLE_MULTI_TILE_EFFECT = 6,
    ENABLE_TOUCH_POINT_CALCULATION_BASED_ON_FINAL_PREVIEW = 7
}
export enum DraggingSizeChangeEffect {
    DEFAULT = 0,
    SIZE_TRANSITION = 1,
    SIZE_CONTENT_TRANSITION = 2
}
export enum MenuPolicy {
    DEFAULT = 0,
    HIDE = 1,
    SHOW = 2
}
export enum ContentClipMode {
    CONTENT_ONLY = 0,
    BOUNDARY = 1,
    SAFE_AREA = 2
}
export enum EffectEdge {
    START = 1,
    END = 2
}
export enum KeyboardAvoidMode {
    DEFAULT = 0,
    NONE = 1
}
export enum HoverModeAreaType {
    TOP_SCREEN = 0,
    BOTTOM_SCREEN = 1
}
export enum DataPanelType {
    LINE = 0,
    Line = 0,
    CIRCLE = 1,
    Circle = 1
}
export enum DatePickerMode {
    DATE = 0,
    YEAR_AND_MONTH = 1,
    MONTH_AND_DAY = 2
}
export enum CheckBoxShape {
    CIRCLE = 0,
    ROUNDED_SQUARE = 1
}
export enum Color {
    WHITE = 0,
    White = 0,
    BLACK = 1,
    Black = 1,
    BLUE = 2,
    Blue = 2,
    BROWN = 3,
    Brown = 3,
    GRAY = 4,
    Gray = 4,
    GREEN = 5,
    Green = 5,
    GREY = 6,
    Grey = 6,
    ORANGE = 7,
    Orange = 7,
    PINK = 8,
    Pink = 8,
    RED = 9,
    Red = 9,
    YELLOW = 10,
    Yellow = 10,
    TRANSPARENT = 11,
    Transparent = 11
}
export enum ColoringStrategy {
    INVERT = "'invert'",
    AVERAGE = "'average'",
    PRIMARY = "'primary'"
}
export enum ImageFit {
    CONTAIN = 0,
    Contain = 0,
    COVER = 1,
    Cover = 1,
    AUTO = 2,
    Auto = 2,
    FILL = 3,
    Fill = 3,
    SCALE_DOWN = 4,
    ScaleDown = 4,
    NONE = 5,
    None = 5,
    TOP_START = 7,
    TOP = 8,
    TOP_END = 9,
    START = 10,
    CENTER = 11,
    END = 12,
    BOTTOM_START = 13,
    BOTTOM = 14,
    BOTTOM_END = 15,
    MATRIX = 16
}
export enum BorderStyle {
    DOTTED = 0,
    Dotted = 0,
    DASHED = 1,
    Dashed = 1,
    SOLID = 2,
    Solid = 2
}
export enum LineJoinStyle {
    MITER = 0,
    Miter = 0,
    ROUND = 1,
    Round = 1,
    BEVEL = 2,
    Bevel = 2
}
export enum TouchType {
    DOWN = 0,
    Down = 0,
    UP = 1,
    Up = 1,
    MOVE = 2,
    Move = 2,
    CANCEL = 3,
    Cancel = 3
}
export enum InteractionHand {
    NONE = 0,
    LEFT = 1,
    RIGHT = 2
}
export enum MouseButton {
    LEFT = 0,
    Left = 0,
    RIGHT = 1,
    Right = 1,
    MIDDLE = 2,
    Middle = 2,
    BACK = 3,
    Back = 3,
    FORWARD = 4,
    Forward = 4,
    NONE = 5,
    None = 5
}
export enum MouseAction {
    PRESS = 0,
    Press = 0,
    RELEASE = 1,
    Release = 1,
    MOVE = 2,
    Move = 2,
    HOVER = 3,
    Hover = 3,
    CANCEL = 13
}
export enum AnimationStatus {
    INITIAL = 0,
    Initial = 0,
    RUNNING = 1,
    Running = 1,
    PAUSED = 2,
    Paused = 2,
    STOPPED = 3,
    Stopped = 3
}
export enum FillMode {
    NONE = 0,
    None = 0,
    FORWARDS = 1,
    Forwards = 1,
    BACKWARDS = 2,
    Backwards = 2,
    BOTH = 3,
    Both = 3
}
export enum PlayMode {
    NORMAL = 0,
    Normal = 0,
    REVERSE = 1,
    Reverse = 1,
    ALTERNATE = 2,
    Alternate = 2,
    ALTERNATE_REVERSE = 3,
    AlternateReverse = 3
}
export enum KeyType {
    DOWN = 0,
    Down = 0,
    UP = 1,
    Up = 1
}
export enum KeySource {
    UNKNOWN = 0,
    Unknown = 0,
    KEYBOARD = 1,
    Keyboard = 1,
    JOYSTICK = 2
}
export enum Edge {
    TOP = 0,
    Top = 0,
    BOTTOM = 1,
    Bottom = 1,
    START = 2,
    Start = 2,
    END = 3,
    End = 3
}
export enum Week {
    MON = 0,
    Mon = 0,
    TUE = 1,
    Tue = 1,
    WED = 2,
    Wed = 2,
    THUR = 3,
    Thur = 3,
    FRI = 4,
    Fri = 4,
    SAT = 5,
    Sat = 5,
    SUN = 6,
    Sun = 6
}
export enum Direction {
    LTR = 0,
    Ltr = 0,
    RTL = 1,
    Rtl = 1,
    AUTO = 2,
    Auto = 2
}
export enum BarState {
    OFF = 0,
    Off = 0,
    AUTO = 1,
    Auto = 1,
    ON = 2,
    On = 2
}
export enum EdgeEffect {
    SPRING = 0,
    Spring = 0,
    FADE = 1,
    Fade = 1,
    NONE = 2,
    None = 2
}
export enum Alignment {
    TOP_START = 0,
    TopStart = 0,
    TOP = 1,
    Top = 1,
    TOP_END = 2,
    TopEnd = 2,
    START = 3,
    Start = 3,
    CENTER = 4,
    Center = 4,
    END = 5,
    End = 5,
    BOTTOM_START = 6,
    BottomStart = 6,
    BOTTOM = 7,
    Bottom = 7,
    BOTTOM_END = 8,
    BottomEnd = 8
}
export enum TransitionType {
    ALL = 0,
    All = 0,
    INSERT = 1,
    Insert = 1,
    DELETE = 2,
    Delete = 2
}
export enum RelateType {
    FILL = 0,
    FIT = 1
}
export enum Visibility {
    VISIBLE = 0,
    Visible = 0,
    HIDDEN = 1,
    Hidden = 1,
    NONE = 2,
    None = 2
}
export enum LineCapStyle {
    BUTT = 0,
    Butt = 0,
    ROUND = 1,
    Round = 1,
    SQUARE = 2,
    Square = 2
}
export enum Axis {
    VERTICAL = 0,
    Vertical = 0,
    HORIZONTAL = 1,
    Horizontal = 1
}
export enum HorizontalAlign {
    START = 0,
    Start = 0,
    CENTER = 1,
    Center = 1,
    END = 2,
    End = 2
}
export enum FlexAlign {
    START = 0,
    Start = 0,
    CENTER = 1,
    Center = 1,
    END = 2,
    End = 2,
    SPACE_BETWEEN = 3,
    SpaceBetween = 3,
    SPACE_AROUND = 4,
    SpaceAround = 4,
    SPACE_EVENLY = 5,
    SpaceEvenly = 5
}
export enum ItemAlign {
    AUTO = 0,
    Auto = 0,
    START = 1,
    Start = 1,
    CENTER = 2,
    Center = 2,
    END = 3,
    End = 3,
    BASELINE = 4,
    Baseline = 4,
    STRETCH = 5,
    Stretch = 5
}
export enum FlexDirection {
    ROW = 0,
    Row = 0,
    COLUMN = 1,
    Column = 1,
    ROW_REVERSE = 2,
    RowReverse = 2,
    COLUMN_REVERSE = 3,
    ColumnReverse = 3
}
export enum PixelRoundCalcPolicy {
    NO_FORCE_ROUND = 0,
    FORCE_CEIL = 1,
    FORCE_FLOOR = 2
}
export enum PixelRoundMode {
    PIXEL_ROUND_ON_LAYOUT_FINISH = 0,
    PIXEL_ROUND_AFTER_MEASURE = 1
}
export enum FlexWrap {
    NO_WRAP = 0,
    NoWrap = 0,
    WRAP = 1,
    Wrap = 1,
    WRAP_REVERSE = 2,
    WrapReverse = 2
}
export enum VerticalAlign {
    TOP = 0,
    Top = 0,
    CENTER = 1,
    Center = 1,
    BOTTOM = 2,
    Bottom = 2
}
export enum ImageRepeat {
    NO_REPEAT = 0,
    NoRepeat = 0,
    X = 1,
    Y = 2,
    XY = 3
}
export enum ImageSize {
    AUTO = 0,
    Auto = 0,
    COVER = 1,
    Cover = 1,
    CONTAIN = 2,
    Contain = 2,
    FILL = 3
}
export enum GradientDirection {
    LEFT = 0,
    Left = 0,
    TOP = 1,
    Top = 1,
    RIGHT = 2,
    Right = 2,
    BOTTOM = 3,
    Bottom = 3,
    LEFT_TOP = 4,
    LeftTop = 4,
    LEFT_BOTTOM = 5,
    LeftBottom = 5,
    RIGHT_TOP = 6,
    RightTop = 6,
    RIGHT_BOTTOM = 7,
    RightBottom = 7,
    NONE = 8,
    None = 8
}
export enum SharedTransitionEffectType {
    STATIC = 0,
    Static = 0,
    EXCHANGE = 1,
    Exchange = 1
}
export enum FontStyle {
    NORMAL = 0,
    Normal = 0,
    ITALIC = 1,
    Italic = 1
}
export enum FontWeight {
    LIGHTER = 0,
    Lighter = 0,
    NORMAL = 1,
    Normal = 1,
    REGULAR = 2,
    Regular = 2,
    MEDIUM = 3,
    Medium = 3,
    BOLD = 4,
    Bold = 4,
    BOLDER = 5,
    Bolder = 5
}
export enum TextAlign {
    CENTER = 0,
    Center = 0,
    START = 1,
    Start = 1,
    END = 2,
    End = 2,
    JUSTIFY = 3
}
export enum TextOverflow {
    NONE = 0,
    None = 0,
    CLIP = 1,
    Clip = 1,
    ELLIPSIS = 2,
    Ellipsis = 2,
    MARQUEE = 3
}
export enum TextDecorationType {
    NONE = 0,
    None = 0,
    UNDERLINE = 1,
    Underline = 1,
    OVERLINE = 2,
    Overline = 2,
    LINE_THROUGH = 3,
    LineThrough = 3
}
export enum TextCase {
    NORMAL = 0,
    Normal = 0,
    LOWER_CASE = 1,
    LowerCase = 1,
    UPPER_CASE = 2,
    UpperCase = 2
}
export enum TextHeightAdaptivePolicy {
    MAX_LINES_FIRST = 0,
    MIN_FONT_SIZE_FIRST = 1,
    LAYOUT_CONSTRAINT_FIRST = 2
}
export enum ResponseType {
    RIGHT_CLICK = 0,
    RightClick = 0,
    LONG_PRESS = 1,
    LongPress = 1
}
export enum HoverEffect {
    AUTO = 0,
    Auto = 0,
    SCALE = 1,
    Scale = 1,
    HIGHLIGHT = 2,
    Highlight = 2,
    NONE = 3,
    None = 3
}
export enum Placement {
    LEFT = 0,
    Left = 0,
    RIGHT = 1,
    Right = 1,
    TOP = 2,
    Top = 2,
    BOTTOM = 3,
    Bottom = 3,
    TOP_LEFT = 4,
    TopLeft = 4,
    TOP_RIGHT = 5,
    TopRight = 5,
    BOTTOM_LEFT = 6,
    BottomLeft = 6,
    BOTTOM_RIGHT = 7,
    BottomRight = 7,
    LEFT_TOP = 8,
    LeftTop = 8,
    LEFT_BOTTOM = 9,
    LeftBottom = 9,
    RIGHT_TOP = 10,
    RightTop = 10,
    RIGHT_BOTTOM = 11,
    RightBottom = 11
}
export enum ArrowPointPosition {
    START = "'Start'",
    CENTER = "'Center'",
    END = "'End'"
}
export enum CopyOptions {
    NONE = 0,
    None = 0,
    IN_APP = 1,
    InApp = 1,
    LOCAL_DEVICE = 2,
    LocalDevice = 2
}
export enum HitTestMode {
    DEFAULT = 0,
    Default = 0,
    BLOCK = 1,
    Block = 1,
    TRANSPARENT = 2,
    Transparent = 2,
    NONE = 3,
    None = 3
}
export enum TitleHeight {
    MAIN_ONLY = 0,
    MainOnly = 0,
    MAIN_WITH_SUB = 1,
    MainWithSub = 1
}
export enum ModifierKey {
    CTRL = 0,
    SHIFT = 1,
    ALT = 2
}
export enum FunctionKey {
    ESC = 0,
    F1 = 1,
    F2 = 2,
    F3 = 3,
    F4 = 4,
    F5 = 5,
    F6 = 6,
    F7 = 7,
    F8 = 8,
    F9 = 9,
    F10 = 10,
    F11 = 11,
    F12 = 12,
    TAB = 13,
    DPAD_UP = 14,
    DPAD_DOWN = 15,
    DPAD_LEFT = 16,
    DPAD_RIGHT = 17
}
export enum ImageSpanAlignment {
    BASELINE = 0,
    BOTTOM = 1,
    CENTER = 2,
    TOP = 3
}
export enum ObscuredReasons {
    PLACEHOLDER = 0
}
export enum TextContentStyle {
    DEFAULT = 0,
    INLINE = 1
}
export enum ClickEffectLevel {
    LIGHT = 0,
    MIDDLE = 1,
    HEAVY = 2
}
export enum XComponentType {
    SURFACE = 0,
    TEXTURE = 1
}
export enum NestedScrollMode {
    SELF_ONLY = 0,
    SELF_FIRST = 1,
    PARENT_FIRST = 2,
    PARALLEL = 3
}
export enum ScrollSource {
    DRAG = 0,
    FLING = 1,
    EDGE_EFFECT = 2,
    OTHER_USER_INPUT = 3,
    SCROLL_BAR = 4,
    SCROLL_BAR_FLING = 5,
    SCROLLER = 6,
    SCROLLER_ANIMATION = 7
}
export enum RenderFit {
    CENTER = 0,
    TOP = 1,
    BOTTOM = 2,
    LEFT = 3,
    RIGHT = 4,
    TOP_LEFT = 5,
    TOP_RIGHT = 6,
    BOTTOM_LEFT = 7,
    BOTTOM_RIGHT = 8,
    RESIZE_FILL = 9,
    RESIZE_CONTAIN = 10,
    RESIZE_CONTAIN_TOP_LEFT = 11,
    RESIZE_CONTAIN_BOTTOM_RIGHT = 12,
    RESIZE_COVER = 13,
    RESIZE_COVER_TOP_LEFT = 14,
    RESIZE_COVER_BOTTOM_RIGHT = 15
}
export enum DialogButtonStyle {
    DEFAULT = 0,
    HIGHLIGHT = 1
}
export enum WordBreak {
    NORMAL = 0,
    BREAK_ALL = 1,
    BREAK_WORD = 2,
    HYPHENATION = 3
}
export enum LineBreakStrategy {
    GREEDY = 0,
    HIGH_QUALITY = 1,
    BALANCED = 2
}
export enum IlluminatedType {
    NONE = 0,
    BORDER = 1,
    CONTENT = 2,
    BORDER_CONTENT = 3,
    BLOOM_BORDER = 4,
    BLOOM_BORDER_CONTENT = 5
}
export enum EllipsisMode {
    START = 0,
    CENTER = 1,
    END = 2
}
export enum OptionWidthMode {
    FIT_CONTENT = "'fit_content'",
    FIT_TRIGGER = "'fit_trigger'"
}
export enum FoldStatus {
    FOLD_STATUS_UNKNOWN = 0,
    FOLD_STATUS_EXPANDED = 1,
    FOLD_STATUS_FOLDED = 2,
    FOLD_STATUS_HALF_FOLDED = 3
}
export enum AppRotation {
    ROTATION_0 = 0,
    ROTATION_90 = 1,
    ROTATION_180 = 2,
    ROTATION_270 = 3
}
export enum EmbeddedType {
    EMBEDDED_UI_EXTENSION = 0
}
export enum MarqueeUpdateStrategy {
    DEFAULT = 0,
    PRESERVE_POSITION = 1
}
export enum TextDecorationStyle {
    SOLID = 0,
    DOUBLE = 1,
    DOTTED = 2,
    DASHED = 3,
    WAVY = 4
}
export enum TextSelectableMode {
    SELECTABLE_UNFOCUSABLE = 0,
    SELECTABLE_FOCUSABLE = 1,
    UNSELECTABLE = 2
}
export enum AccessibilityHoverType {
    HOVER_ENTER = 0,
    HOVER_MOVE = 1,
    HOVER_EXIT = 2,
    HOVER_CANCEL = 3
}
export enum WidthBreakpoint {
    WIDTH_XS = 0,
    WIDTH_SM = 1,
    WIDTH_MD = 2,
    WIDTH_LG = 3,
    WIDTH_XL = 4
}
export enum HeightBreakpoint {
    HEIGHT_SM = 0,
    HEIGHT_MD = 1,
    HEIGHT_LG = 2
}
export enum AxisModel {
    ABS_X = 0,
    ABS_Y = 1,
    ABS_Z = 2,
    ABS_RZ = 3,
    ABS_GAS = 4,
    ABS_BRAKE = 5,
    ABS_HAT0X = 6,
    ABS_HAT0Y = 7
}
export enum PageFlipMode {
    CONTINUOUS = 0,
    SINGLE = 1
}
export enum CrownAction {
    BEGIN = 0,
    UPDATE = 1,
    END = 2
}
export enum CrownSensitivity {
    LOW = 0,
    MEDIUM = 1,
    HIGH = 2
}
export enum AxisAction {
    NONE = 0,
    BEGIN = 1,
    UPDATE = 2,
    END = 3,
    CANCEL = 4
}
export enum FocusDrawLevel {
    SELF = 0,
    TOP = 1
}
export enum DividerMode {
    FLOATING_ABOVE_MENU = 0,
    EMBEDDED_IN_MENU = 1
}
export enum FocusPriority {
    AUTO = 0,
    PRIOR = 2000,
    PREVIOUS = 3000
}
export enum KeyProcessingMode {
    FOCUS_NAVIGATION = 0,
    ANCESTOR_EVENT = 1
}
export enum FormDimension {
    DIMENSION_1_2 = 0,
    Dimension_1_2 = 0,
    DIMENSION_2_2 = 1,
    Dimension_2_2 = 1,
    DIMENSION_2_4 = 2,
    Dimension_2_4 = 2,
    DIMENSION_4_4 = 3,
    Dimension_4_4 = 3,
    DIMENSION_1_1 = 6,
    DIMENSION_6_4 = 7,
    DIMENSION_2_3 = 8,
    DIMENSION_3_3 = 9
}
export enum FormRenderingMode {
    FULL_COLOR = 0,
    SINGLE_COLOR = 1
}
export enum FormShape {
    RECT = 1,
    CIRCLE = 2
}
export enum ExpandMode {
    NOT_EXPAND = 0,
    EXPAND = 1,
    LAZY_EXPAND = 2
}
export enum PanDirection {
    NONE = 0,
    None = 0,
    HORIZONTAL = 1,
    Horizontal = 1,
    LEFT = 2,
    Left = 2,
    RIGHT = 3,
    Right = 3,
    VERTICAL = 4,
    Vertical = 4,
    UP = 5,
    Up = 5,
    DOWN = 6,
    Down = 6,
    ALL = 7,
    All = 7
}
export enum SwipeDirection {
    NONE = 0,
    None = 0,
    HORIZONTAL = 1,
    Horizontal = 1,
    VERTICAL = 2,
    Vertical = 2,
    ALL = 3,
    All = 3
}
export enum GestureMode {
    SEQUENCE = 0,
    Sequence = 0,
    PARALLEL = 1,
    Parallel = 1,
    EXCLUSIVE = 2,
    Exclusive = 2
}
export enum GestureMask {
    NORMAL = 0,
    Normal = 0,
    IGNORE_INTERNAL = 1,
    IgnoreInternal = 1
}
export enum GestureJudgeResult {
    CONTINUE = 0,
    REJECT = 1
}
export namespace GestureControl {
    export enum GestureType {
        TAP_GESTURE = 0,
        LONG_PRESS_GESTURE = 1,
        PAN_GESTURE = 2,
        PINCH_GESTURE = 3,
        SWIPE_GESTURE = 4,
        ROTATION_GESTURE = 5,
        DRAG = 6,
        CLICK = 7
    }
}
export enum GesturePriority {
    NORMAL = 0,
    PRIORITY = 1
}
export enum GestureRecognizerState {
    READY = 0,
    DETECTING = 1,
    PENDING = 2,
    BLOCKED = 3,
    SUCCESSFUL = 4,
    FAILED = 5
}
export enum LengthUnit {
    PX = 0,
    VP = 1,
    FP = 2,
    PERCENT = 3,
    LPX = 4
}
export enum LengthMetricsUnit {
    DEFAULT = 0,
    PX = 1
}
export enum GridDirection {
    ROW = 0,
    Row = 0,
    COLUMN = 1,
    Column = 1,
    ROW_REVERSE = 2,
    RowReverse = 2,
    COLUMN_REVERSE = 3,
    ColumnReverse = 3
}
export enum GridItemAlignment {
    DEFAULT = 0,
    STRETCH = 1
}
export enum GridItemStyle {
    NONE = 0,
    PLAIN = 1
}
export enum BreakpointsReference {
    WINDOW_SIZE = 0,
    WindowSize = 0,
    COMPONENT_SIZE = 1,
    ComponentSize = 1
}
export enum GridRowDirection {
    ROW = 0,
    Row = 0,
    ROW_REVERSE = 1,
    RowReverse = 1
}
export enum ImageRenderMode {
    ORIGINAL = 0,
    Original = 0,
    TEMPLATE = 1,
    Template = 1
}
export enum ImageContent {
    EMPTY = 0
}
export enum DynamicRangeMode {
    HIGH = 0,
    CONSTRAINT = 1,
    STANDARD = 2
}
export enum ImageInterpolation {
    NONE = 0,
    None = 0,
    LOW = 1,
    Low = 1,
    MEDIUM = 2,
    Medium = 2,
    HIGH = 3,
    High = 3
}
export enum ImageRotateOrientation {
    AUTO = 0,
    UP = 1,
    RIGHT = 2,
    DOWN = 3,
    LEFT = 4,
    UP_MIRRORED = 5,
    RIGHT_MIRRORED = 6,
    DOWN_MIRRORED = 7,
    LEFT_MIRRORED = 8
}
export enum ImageAnalyzerType {
    SUBJECT = 0,
    TEXT = 1,
    OBJECT_LOOKUP = 2
}
export enum ScrollState {
    IDLE = 0,
    Idle = 0,
    SCROLL = 1,
    Scroll = 1,
    FLING = 2,
    Fling = 2
}
export enum ListItemAlign {
    START = 0,
    Start = 0,
    CENTER = 1,
    Center = 1,
    END = 2,
    End = 2
}
export enum ListItemGroupArea {
    NONE = 0,
    IN_LIST_ITEM_AREA = 1,
    IN_HEADER_AREA = 2,
    IN_FOOTER_AREA = 3
}
export enum StickyStyle {
    NONE = 0,
    None = 0,
    HEADER = 1,
    Header = 1,
    FOOTER = 2,
    Footer = 2
}
export enum ChainEdgeEffect {
    DEFAULT = 0,
    STRETCH = 1
}
export enum ScrollSnapAlign {
    NONE = 0,
    START = 1,
    CENTER = 2,
    END = 3
}
export enum SwipeEdgeEffect {
    SPRING = 0,
    Spring = 0,
    NONE = 1,
    None = 1
}
export enum SwipeActionState {
    COLLAPSED = 0,
    EXPANDED = 1,
    ACTIONING = 2
}
export enum ListItemStyle {
    NONE = 0,
    CARD = 1
}
export enum ListItemGroupStyle {
    NONE = 0,
    CARD = 1
}
export enum LoadingProgressStyle {
    DEFAULT = 0,
    Default = 0,
    CIRCULAR = 1,
    Circular = 1,
    ORBITAL = 2,
    Orbital = 2
}
export enum SubMenuExpandingMode {
    SIDE_EXPAND = 0,
    EMBEDDED_EXPAND = 1,
    STACK_EXPAND = 2
}
export enum NavigationSystemTransitionType {
    DEFAULT = 0,
    NONE = 1,
    TITLE = 2,
    CONTENT = 3,
    FADE = 4,
    EXPLODE = 5,
    SLIDE_RIGHT = 6,
    SLIDE_BOTTOM = 7
}
export enum NavDestinationMode {
    STANDARD = 0,
    DIALOG = 1
}
export enum NavDestinationActiveReason {
    TRANSITION = 0,
    CONTENT_COVER = 1,
    SHEET = 2,
    DIALOG = 3,
    OVERLAY = 4,
    APP_STATE = 5
}
export enum NavigationMode {
    STACK = 0,
    Stack = 0,
    SPLIT = 1,
    Split = 1,
    AUTO = 2,
    Auto = 2
}
export enum NavBarPosition {
    START = 0,
    Start = 0,
    END = 1,
    End = 1
}
export enum NavigationTitleMode {
    FREE = 0,
    Free = 0,
    FULL = 1,
    Full = 1,
    MINI = 2,
    Mini = 2
}
export enum LaunchMode {
    STANDARD = 0,
    MOVE_TO_TOP_SINGLETON = 1,
    POP_TO_SINGLETON = 2,
    NEW_INSTANCE = 3
}
export enum ToolbarItemStatus {
    NORMAL = 0,
    DISABLED = 1,
    ACTIVE = 2
}
export enum NavigationOperation {
    PUSH = 1,
    POP = 2,
    REPLACE = 3
}
export enum BarStyle {
    STANDARD = 0,
    STACK = 1,
    SAFE_AREA_PADDING = 2
}
export enum RouteType {
    NONE = 0,
    None = 0,
    PUSH = 1,
    Push = 1,
    POP = 2,
    Pop = 2
}
export enum SlideEffect {
    LEFT = 0,
    Left = 0,
    RIGHT = 1,
    Right = 1,
    TOP = 2,
    Top = 2,
    BOTTOM = 3,
    Bottom = 3,
    START = 5,
    END = 6
}
export enum ParticleType {
    POINT = "'point'",
    IMAGE = "'image'"
}
export enum ParticleEmitterShape {
    RECTANGLE = "'rectangle'",
    CIRCLE = "'circle'",
    ELLIPSE = "'ellipse'",
    ANNULUS = "'annulus'"
}
export enum DistributionType {
    UNIFORM = 0,
    GAUSSIAN = 1
}
export enum ParticleUpdater {
    NONE = "'none'",
    RANDOM = "'random'",
    CURVE = "'curve'"
}
export enum DisturbanceFieldShape {
    RECT = 0,
    CIRCLE = 1,
    ELLIPSE = 2
}
export enum PasteIconStyle {
    LINES = 0
}
export enum PasteDescription {
    PASTE = 0
}
export enum PasteButtonOnClickResult {
    SUCCESS = 0,
    TEMPORARY_AUTHORIZATION_FAILED = 1
}
export enum PatternLockChallengeResult {
    CORRECT = 1,
    WRONG = 2
}
export enum ProgressType {
    LINEAR = 0,
    Linear = 0,
    RING = 1,
    Ring = 1,
    ECLIPSE = 2,
    Eclipse = 2,
    SCALE_RING = 3,
    ScaleRing = 3,
    CAPSULE = 4,
    Capsule = 4
}
export enum ProgressStatus {
    LOADING = 0,
    PROGRESSING = 1
}
export enum ProgressStyle {
    LINEAR = 0,
    Linear = 0,
    RING = 1,
    Ring = 1,
    ECLIPSE = 2,
    Eclipse = 2,
    SCALE_RING = 3,
    ScaleRing = 3,
    CAPSULE = 4,
    Capsule = 4
}
export enum RadioIndicatorType {
    TICK = 0,
    DOT = 1,
    CUSTOM = 2
}
export enum RefreshStatus {
    INACTIVE = 0,
    Inactive = 0,
    DRAG = 1,
    Drag = 1,
    OVER_DRAG = 2,
    OverDrag = 2,
    REFRESH = 3,
    Refresh = 3,
    DONE = 4,
    Done = 4
}
export enum BarrierDirection {
    LEFT = 0,
    RIGHT = 1,
    TOP = 2,
    BOTTOM = 3
}
export enum LocalizedBarrierDirection {
    START = 0,
    END = 1,
    TOP = 2,
    BOTTOM = 3
}
export enum RichEditorDeleteDirection {
    BACKWARD = 0,
    FORWARD = 1
}
export enum RichEditorSpanType {
    TEXT = 0,
    IMAGE = 1,
    MIXED = 2,
    BUILDER = 3,
    DEFAULT = 4
}
export enum RichEditorResponseType {
    RIGHT_CLICK = 0,
    LONG_PRESS = 1,
    SELECT = 2,
    DEFAULT = 3
}
export enum SaveIconStyle {
    FULL_FILLED = 0,
    LINES = 1,
    PICTURE = 2
}
export enum SaveDescription {
    DOWNLOAD = 0,
    DOWNLOAD_FILE = 1,
    SAVE = 2,
    SAVE_IMAGE = 3,
    SAVE_FILE = 4,
    DOWNLOAD_AND_SHARE = 5,
    RECEIVE = 6,
    CONTINUE_TO_RECEIVE = 7,
    SAVE_TO_GALLERY = 8,
    EXPORT_TO_GALLERY = 9,
    QUICK_SAVE_TO_GALLERY = 10,
    RESAVE_TO_GALLERY = 11
}
export enum SaveButtonOnClickResult {
    SUCCESS = 0,
    TEMPORARY_AUTHORIZATION_FAILED = 1
}
export enum ScrollDirection {
    VERTICAL = 0,
    Vertical = 0,
    HORIZONTAL = 1,
    Horizontal = 1,
    NONE = 2,
    None = 2
}
export enum ScrollAlign {
    START = 0,
    CENTER = 1,
    END = 2,
    AUTO = 3
}
export enum ScrollBarDirection {
    VERTICAL = 0,
    Vertical = 0,
    HORIZONTAL = 1,
    Horizontal = 1
}
export enum CancelButtonStyle {
    CONSTANT = 0,
    INVISIBLE = 1,
    INPUT = 2
}
export enum SearchType {
    NORMAL = 0,
    NUMBER = 2,
    PHONE_NUMBER = 3,
    EMAIL = 5,
    NUMBER_DECIMAL = 12,
    URL = 13
}
export enum SecurityComponentLayoutDirection {
    HORIZONTAL = 0,
    VERTICAL = 1
}
export enum ArrowPosition {
    END = 0,
    START = 1
}
export enum MenuAlignType {
    START = 0,
    CENTER = 1,
    END = 2
}
export enum AvoidanceMode {
    COVER_TARGET = 0,
    AVOID_AROUND_TARGET = 1
}
export enum SideBarContainerType {
    EMBED = 0,
    Embed = 0,
    OVERLAY = 1,
    Overlay = 1,
    AUTO = 2
}
export enum SideBarPosition {
    START = 0,
    Start = 0,
    END = 1,
    End = 1
}
export enum SliderStyle {
    OUT_SET = 0,
    OutSet = 0,
    IN_SET = 1,
    InSet = 1,
    NONE = 2
}
export enum SliderChangeMode {
    BEGIN = 0,
    Begin = 0,
    MOVING = 1,
    Moving = 1,
    END = 2,
    End = 2,
    CLICK = 3,
    Click = 3
}
export enum SliderInteraction {
    SLIDE_AND_CLICK = 0,
    SLIDE_ONLY = 1,
    SLIDE_AND_CLICK_UP = 2
}
export enum SliderBlockType {
    DEFAULT = 0,
    IMAGE = 1,
    SHAPE = 2
}
export enum ItemState {
    NORMAL = 0,
    Normal = 0,
    DISABLED = 1,
    Disabled = 1,
    WAITING = 2,
    Waiting = 2,
    SKIP = 3,
    Skip = 3
}
export enum StyledStringKey {
    FONT = 0,
    DECORATION = 1,
    BASELINE_OFFSET = 2,
    LETTER_SPACING = 3,
    TEXT_SHADOW = 4,
    LINE_HEIGHT = 5,
    BACKGROUND_COLOR = 6,
    URL = 7,
    GESTURE = 100,
    PARAGRAPH_STYLE = 200,
    IMAGE = 300,
    CUSTOM_SPAN = 400,
    USER_DATA = 500
}
export enum SwiperDisplayMode {
    STRETCH = 0
}
export enum SwiperNestedScrollMode {
    SELF_ONLY = 0,
    SELF_FIRST = 1
}
export enum SwiperAnimationMode {
    NO_ANIMATION = 0,
    DEFAULT_ANIMATION = 1,
    FAST_ANIMATION = 2
}
export enum SymbolRenderingStrategy {
    SINGLE = 0,
    MULTIPLE_COLOR = 1,
    MULTIPLE_OPACITY = 2
}
export enum SymbolEffectStrategy {
    NONE = 0,
    SCALE = 1,
    HIERARCHICAL = 2
}
export enum EffectDirection {
    DOWN = 0,
    UP = 1
}
export enum EffectScope {
    LAYER = 0,
    WHOLE = 1
}
export enum EffectFillStyle {
    CUMULATIVE = 0,
    ITERATIVE = 1
}
export enum SelectedMode {
    INDICATOR = 0,
    BOARD = 1
}
export enum LayoutMode {
    AUTO = 0,
    VERTICAL = 1,
    HORIZONTAL = 2
}
export enum BarMode {
    SCROLLABLE = 0,
    Scrollable = 0,
    FIXED = 1,
    Fixed = 1
}
export enum AnimationMode {
    CONTENT_FIRST = 0,
    ACTION_FIRST = 1,
    NO_ANIMATION = 2,
    CONTENT_FIRST_WITH_JUMP = 3,
    ACTION_FIRST_WITH_JUMP = 4
}
export enum BarPosition {
    START = 0,
    Start = 0,
    END = 1,
    End = 1
}
export enum LayoutStyle {
    ALWAYS_CENTER = 0,
    ALWAYS_AVERAGE_SPLIT = 1,
    SPACE_BETWEEN_OR_CENTER = 2
}
export enum TabsCacheMode {
    CACHE_BOTH_SIDE = 0,
    CACHE_LATEST_SWITCHED = 1
}
export enum TextSpanType {
    TEXT = 0,
    IMAGE = 1,
    MIXED = 2,
    DEFAULT = 3
}
export enum TextResponseType {
    RIGHT_CLICK = 0,
    LONG_PRESS = 1,
    SELECT = 2,
    DEFAULT = 3
}
export enum MarqueeState {
    START = 0,
    BOUNCE = 1,
    FINISH = 2
}
export enum MarqueeStartPolicy {
    DEFAULT = 0,
    ON_FOCUS = 1
}
export enum TextAreaType {
    NORMAL = 0,
    NUMBER = 2,
    PHONE_NUMBER = 3,
    EMAIL = 5,
    NUMBER_DECIMAL = 12,
    URL = 13
}
export enum TextDataDetectorType {
    PHONE_NUMBER = 0,
    URL = 1,
    EMAIL = 2,
    ADDRESS = 3,
    DATE_TIME = 4
}
export enum TextDeleteDirection {
    BACKWARD = 0,
    FORWARD = 1
}
export enum MenuType {
    SELECTION_MENU = 0,
    PREVIEW_MENU = 1
}
export enum AutoCapitalizationMode {
    NONE = 0,
    WORDS = 1,
    SENTENCES = 2,
    ALL_CHARACTERS = 3
}
export enum TextMenuShowMode {
    DEFAULT = 0,
    PREFER_WINDOW = 1
}
export enum KeyboardAppearance {
    NONE_IMMERSIVE = 0,
    IMMERSIVE = 1,
    LIGHT_IMMERSIVE = 2,
    DARK_IMMERSIVE = 3
}
export enum InputType {
    NORMAL = 0,
    Normal = 0,
    NUMBER = 1,
    Number = 1,
    PHONE_NUMBER = 2,
    PhoneNumber = 2,
    EMAIL = 3,
    Email = 3,
    PASSWORD = 4,
    Password = 4,
    NUMBER_PASSWORD = 8,
    SCREEN_LOCK_PASSWORD = 9,
    USER_NAME = 10,
    NEW_PASSWORD = 11,
    NUMBER_DECIMAL = 12,
    URL = 13
}
export enum ContentType {
    USER_NAME = 0,
    PASSWORD = 1,
    NEW_PASSWORD = 2,
    FULL_STREET_ADDRESS = 3,
    HOUSE_NUMBER = 4,
    DISTRICT_ADDRESS = 5,
    CITY_ADDRESS = 6,
    PROVINCE_ADDRESS = 7,
    COUNTRY_ADDRESS = 8,
    PERSON_FULL_NAME = 9,
    PERSON_LAST_NAME = 10,
    PERSON_FIRST_NAME = 11,
    PHONE_NUMBER = 12,
    PHONE_COUNTRY_CODE = 13,
    FULL_PHONE_NUMBER = 14,
    EMAIL_ADDRESS = 15,
    BANK_CARD_NUMBER = 16,
    ID_CARD_NUMBER = 17,
    NICKNAME = 23,
    DETAIL_INFO_WITHOUT_STREET = 24,
    FORMAT_ADDRESS = 25,
    PASSPORT_NUMBER = 26,
    VALIDITY = 27,
    ISSUE_AT = 28,
    ORGANIZATION = 29,
    TAX_ID = 30,
    ADDRESS_CITY_AND_STATE = 31,
    FLIGHT_NUMBER = 32,
    LICENSE_NUMBER = 33,
    LICENSE_FILE_NUMBER = 34,
    LICENSE_PLATE = 35,
    ENGINE_NUMBER = 36,
    LICENSE_CHASSIS_NUMBER = 37
}
export enum EnterKeyType {
    GO = 2,
    Go = 2,
    SEARCH = 3,
    Search = 3,
    SEND = 4,
    Send = 4,
    NEXT = 5,
    Next = 5,
    DONE = 6,
    Done = 6,
    PREVIOUS = 7,
    NEW_LINE = 8
}
export enum TextInputStyle {
    DEFAULT = 0,
    Default = 0,
    INLINE = 1,
    Inline = 1
}
export enum TimePickerFormat {
    HOUR_MINUTE = 0,
    HOUR_MINUTE_SECOND = 1
}
export enum ToggleType {
    CHECKBOX = 0,
    Checkbox = 0,
    SWITCH = 1,
    Switch = 1,
    BUTTON = 2,
    Button = 2
}
export enum ToolBarItemPlacement {
    TOP_BAR_LEADING = 0,
    TOP_BAR_TRAILING = 1
}
export enum DpiFollowStrategy {
    FOLLOW_HOST_DPI = 0,
    FOLLOW_UI_EXTENSION_ABILITY_DPI = 1
}
export enum WindowModeFollowStrategy {
    FOLLOW_HOST_WINDOW_MODE = 0,
    FOLLOW_UI_EXTENSION_ABILITY_WINDOW_MODE = 1
}
export enum SeekMode {
    PREVIOUS_KEYFRAME = 0,
    PreviousKeyframe = 0,
    NEXT_KEYFRAME = 1,
    NextKeyframe = 1,
    CLOSEST_KEYFRAME = 2,
    ClosestKeyframe = 2,
    ACCURATE = 3,
    Accurate = 3
}
export enum PlaybackSpeed {
    SPEED_FORWARD_0_75_X = 0,
    Speed_Forward_0_75_X = 0,
    SPEED_FORWARD_1_00_X = 1,
    Speed_Forward_1_00_X = 1,
    SPEED_FORWARD_1_25_X = 2,
    Speed_Forward_1_25_X = 2,
    SPEED_FORWARD_1_75_X = 3,
    Speed_Forward_1_75_X = 3,
    SPEED_FORWARD_2_00_X = 4,
    Speed_Forward_2_00_X = 4
}
export enum WaterFlowLayoutMode {
    ALWAYS_TOP_DOWN = 0,
    SLIDING_WINDOW = 1
}
export enum MessageLevel {
    DEBUG = 0,
    Debug = 0,
    ERROR = 1,
    Error = 1,
    INFO = 2,
    Info = 2,
    LOG = 3,
    Log = 3,
    WARN = 4,
    Warn = 4
}
export enum MixedMode {
    ALL = 0,
    All = 0,
    COMPATIBLE = 1,
    Compatible = 1,
    NONE = 2,
    None = 2
}
export enum HitTestType {
    EDIT_TEXT = 0,
    EditText = 0,
    EMAIL = 1,
    Email = 1,
    HTTP_ANCHOR = 2,
    HttpAnchor = 2,
    HTTP_ANCHOR_IMG = 3,
    HttpAnchorImg = 3,
    IMG = 4,
    Img = 4,
    MAP = 5,
    Map = 5,
    PHONE = 6,
    Phone = 6,
    UNKNOWN = 7,
    Unknown = 7
}
export enum CacheMode {
    DEFAULT = 0,
    Default = 0,
    NONE = 1,
    None = 1,
    ONLINE = 2,
    Online = 2,
    ONLY = 3,
    Only = 3
}
export enum OverScrollMode {
    NEVER = 0,
    ALWAYS = 1
}
export enum BlurOnKeyboardHideMode {
    SILENT = 0,
    BLUR = 1
}
export enum WebDarkMode {
    OFF = 0,
    Off = 0,
    ON = 1,
    On = 1,
    AUTO = 2,
    Auto = 2
}
export enum WebCaptureMode {
    HOME_SCREEN = 0
}
export enum ThreatType {
    THREAT_ILLEGAL = 0,
    THREAT_FRAUD = 1,
    THREAT_RISK = 2,
    THREAT_WARNING = 3
}
export enum RenderExitReason {
    PROCESS_ABNORMAL_TERMINATION = 0,
    ProcessAbnormalTermination = 0,
    PROCESS_WAS_KILLED = 1,
    ProcessWasKilled = 1,
    PROCESS_CRASHED = 2,
    ProcessCrashed = 2,
    PROCESS_OOM = 3,
    ProcessOom = 3,
    PROCESS_EXIT_UNKNOWN = 4,
    ProcessExitUnknown = 4
}
export enum SslError {
    INVALID = 0,
    Invalid = 0,
    HOST_MISMATCH = 1,
    HostMismatch = 1,
    DATE_INVALID = 2,
    DateInvalid = 2,
    UNTRUSTED = 3,
    Untrusted = 3
}
export enum FileSelectorMode {
    FILE_OPEN_MODE = 0,
    FileOpenMode = 0,
    FILE_OPEN_MULTIPLE_MODE = 1,
    FileOpenMultipleMode = 1,
    FILE_OPEN_FOLDER_MODE = 2,
    FileOpenFolderMode = 2,
    FILE_SAVE_MODE = 3,
    FileSaveMode = 3
}
export enum WebLayoutMode {
    NONE = 0,
    FIT_CONTENT = 1
}
export enum RenderProcessNotRespondingReason {
    INPUT_TIMEOUT = 0,
    NAVIGATION_COMMIT_TIMEOUT = 1
}
export enum ProtectedResourceType {
    MIDI_SYSEX = "'TYPE_MIDI_SYSEX'",
    MidiSysex = "'TYPE_MIDI_SYSEX'",
    VIDEO_CAPTURE = "'TYPE_VIDEO_CAPTURE'",
    AUDIO_CAPTURE = "'TYPE_AUDIO_CAPTURE'",
    SENSOR = "'TYPE_SENSOR'"
}
export enum ContextMenuSourceType {
    NONE = 0,
    None = 0,
    MOUSE = 1,
    Mouse = 1,
    LONG_PRESS = 2,
    LongPress = 2
}
export enum ContextMenuMediaType {
    NONE = 0,
    None = 0,
    IMAGE = 1,
    Image = 1
}
export enum ContextMenuInputFieldType {
    NONE = 0,
    None = 0,
    PLAIN_TEXT = 1,
    PlainText = 1,
    PASSWORD = 2,
    Password = 2,
    NUMBER = 3,
    Number = 3,
    TELEPHONE = 4,
    Telephone = 4,
    OTHER = 5,
    Other = 5
}
export enum NativeEmbedStatus {
    CREATE = 0,
    UPDATE = 1,
    DESTROY = 2,
    ENTER_BFCACHE = 3,
    LEAVE_BFCACHE = 4
}
export enum ContextMenuEditStateFlags {
    NONE = 0,
    CAN_CUT = 1,
    CAN_COPY = 2,
    CAN_PASTE = 3,
    CAN_SELECT_ALL = 4
}
export enum WebNavigationType {
    UNKNOWN = 0,
    MAIN_FRAME_NEW_ENTRY = 1,
    MAIN_FRAME_EXISTING_ENTRY = 2,
    NAVIGATION_TYPE_NEW_SUBFRAME = 4,
    NAVIGATION_TYPE_AUTO_SUBFRAME = 5
}
export enum RenderMode {
    ASYNC_RENDER = 0,
    SYNC_RENDER = 1
}
export enum ViewportFit {
    AUTO = 0,
    CONTAINS = 1,
    COVER = 2
}
export enum WebKeyboardAvoidMode {
    RESIZE_VISUAL = 0,
    RESIZE_CONTENT = 1,
    OVERLAYS_CONTENT = 2
}
export enum WebElementType {
    IMAGE = 1
}
export enum WebResponseType {
    LONG_PRESS = 1
}
export enum AudioSessionType {
    AMBIENT = 3
}
export enum PerfMonitorActionType {
    LAST_DOWN = 0,
    LAST_UP = 1,
    FIRST_MOVE = 2
}
export enum PerfMonitorSourceType {
    PERF_TOUCH_EVENT = 0,
    PERF_MOUSE_EVENT = 1,
    PERF_TOUCHPAD_EVENT = 2,
    PERF_JOYSTICK_EVENT = 3,
    PERF_KEY_EVENT = 4
}