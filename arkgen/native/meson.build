project('NativeBridge', 'c', 'cpp',
    version: '0.1',
    default_options: ['cpp_std=c++17', 'buildtype=release']
)

if get_option('source_set') != ''
source_set = get_option('source_set')
else
source_set = 'ts_peers'
endif
use_libace = true
if get_option('arkts')
is_arkts = true
else
is_arkts = false
endif

java_home = run_command('node', '-e', 'console.log(process.env.JAVA_HOME)').stdout().strip()

is_node = true
is_arkts = true
is_cj = (source_set == 'cangjie' or source_set == 'cangjie-subset')
is_jni = java_home != 'undefined'
is_ani = true
is_ohos_demo = (source_set == 'ts-ohos-context')

compile_events_test = get_option('events_test')
compile_callbacks_test = get_option('callbacks_test')
if ['ets-ts-peers', 'ets-arkts-peers', 'ts-peers', 'ts-subset', 'java-subset', 'arkts-subset', 'arkts-peers', 'cangjie', 'cangjie-subset', 'ts-ohos-context'].contains(source_set)
    gen_dir = '../out/' / source_set / 'generated'
else
endif
arkoala_dir = gen_dir + '/sig/arkoala-arkts/framework/native/src/generated'
external_framework_dir = '../../external/arkoala-arkts/framework/native/src'
external_interop_dir = '../../external/interop/src/cpp'
external_incremental_cj_dir = '../../external/incremental-cj'
libace_dir = gen_dir / 'libace'

cxx = meson.get_compiler('cpp')

cflags = ['-DKOALA_INTEROP_MODULE=NotConfiguredNativeModule']
ldflags = []

include_dirs = [
   arkoala_dir,
   arkoala_dir / 'legacy',
   external_interop_dir,
   external_interop_dir / 'types',
   external_framework_dir,
]

sources = [
    arkoala_dir / 'bridge_custom.cc',
    arkoala_dir / 'bridge_generated.cc',
    arkoala_dir / 'custom.cc',
    arkoala_dir / 'library.cc',
    arkoala_dir / 'callback_deserialize_call.cc',
    arkoala_dir / 'callback_managed_caller.cc',
    external_interop_dir / 'common-interop.cc',
    external_interop_dir / 'callback-resource.cc',
    external_interop_dir / 'interop-logging.cc',
    external_framework_dir / 'vsync.cc'
]
if compile_events_test
    sources += [
        arkoala_dir / 'events_test.cc',
    ]
else
    sources += [
        arkoala_dir / 'events_test_dummy.cc',
    ]
endif
if compile_callbacks_test
    sources += [
        arkoala_dir + '/callbacks_test.cc',
    ]
else
    sources += [
        arkoala_dir + '/callbacks_test_dummy.cc',
    ]
endif
sources += [
    arkoala_dir + '/buffer_test.cc',
]

if is_ohos_demo
    arkoala_dir = gen_dir + '/native'

    include_dirs = [
        arkoala_dir,
        # arkoala_dir / 'legacy',
        external_interop_dir,
        external_interop_dir / 'types',
        external_framework_dir,
    ]

    sources = [
        # arkoala_dir / 'all_events.cc',
        # arkoala_dir / 'bridge_custom.cc',
        # arkoala_dir / 'bridge_generated.cc',
        # arkoala_dir / 'custom.cc',
        # arkoala_dir / 'library.cc',
        # arkoala_dir / 'callback_deserialize_call.cc',
        # arkoala_dir / 'callback_managed_caller.cc',
        external_interop_dir / 'common-interop.cc',
        # external_interop_dir / 'callback-resource.cc',
        # external_interop_dir / 'interop-logging.cc',
        # external_framework_dir / 'events.cc',
        # external_framework_dir / 'vsync.cc'
    ]
endif

is_msvc = meson.get_compiler('cpp').get_id() == 'msvc'
is_clang = meson.get_compiler('cpp').get_id() == 'clang'
is_gcc = meson.get_compiler('cpp').get_id() == 'gcc'

oses = { 'emscripten': 'wasm', 'darwin': 'macos' }  # rename meson default names to convienient ones
archs = { 'x86_64': 'x64', 'aarch64': 'arm64', 'wasm32': 'wasm', 'armv7a': 'arm' }
jni_oses = { 'windows': 'win32' }
os = target_machine.system()
os = oses.get(os, os)
arch = target_machine.cpu()
arch = archs.get(arch, arch)
jni_os = target_machine.system()
jni_os = jni_oses.get(jni_os, jni_os)
is_ohos = os == 'ohos'

if is_ohos
is_arkts = false
use_libace = true
endif

if use_libace
libace_name = 'ace_compatible_mock'
libace_sources = [
    arkoala_dir + '/dummy_impl.cc',
    external_interop_dir / 'interop-logging.cc',
]
endif

node_library_name = 'NativeBridgeNapi'
arkts_library_name = 'ArkoalaNative_ark'
ani_library_name = 'ArkoalaNative_ani'
jni_library_name = 'NativeBridgeJni'
cj_library_name = 'NativeBridgeCJ'
ohos_library_name = 'NativeBridge_ohos'

if is_clang
# TODO: remove all -Wno-* when generation is fixed.
cflags += [
    '-Wall', '-Werror', '-Wno-unused-variable', '-Wno-unused-but-set-variable',
    '-Wno-extern-c-compat', '-Wno-error=deprecated-declarations',
    '-Wno-unknown-warning-option', '-Wno-unused-function', '-Wno-macro-redefined',
    '-Wno-enum-compare', '-Wno-tautological-constant-out-of-range-compare', '-fno-exceptions'
]
endif

if is_msvc
# Avoid using COMDAT to not exceed COFF file limits, see https://learn.microsoft.com/en-us/cpp/error-messages/compiler-errors-1/fatal-error-c1128?view=msvc-170
cflags += ['/Gy-']
endif

node_api_headers = run_command('node', '-p', 'require.resolve("node-api-headers/package.json").slice(0, -12)', check: true).stdout().strip()

node_cflags = ['-DKOALA_USE_NODE_VM', '-DKOALA_NAPI', '-DINTEROP_LIBRARY_NAME=' + node_library_name ]
node_include_dirs = [
    node_api_headers / 'include',
    external_interop_dir / 'napi'
]
node_sources = [
    external_interop_dir / 'napi/convertors-napi.cc'
]
cj_cflags = ['-DKOALA_CJ', '-DINTEROP_LIBRARY_NAME=' + cj_library_name]
cj_include_dirs = [
    external_interop_dir / 'cangjie'
]
if os == 'windows'
    cflags += ['-DKOALA_WINDOWS']
    node_sources += [ external_interop_dir / 'napi' / 'win-dynamic-node.cc' ]
    panda_ldflags = []
endif
if os == 'linux'
    cflags += ['-DKOALA_LINUX']
    panda_ldflags = ['-ldl', '-lm']
endif
if os == 'macos'
    cflags += ['-DKOALA_MACOS', '-mmacosx-version-min=13.3']
    panda_ldflags = ['-ldl', '-lm']
endif

node_module_prefix = ''
node_module_suffix = 'node'

arkts_cflags = ['-DKOALA_USE_PANDA_VM', '-DKOALA_ETS_NAPI', '-DINTEROP_LIBRARY_NAME=' + arkts_library_name]
arkts_include_dirs = [
    external_interop_dir / 'ets',
]
arkts_sources = [
    external_interop_dir / 'ets/convertors-ets.cc',
    external_interop_dir / 'types/signatures.cc',
]

ani_cflags = ['-DKOALA_USE_PANDA_VM', '-DKOALA_ANI', '-DINTEROP_LIBRARY_NAME=' + ani_library_name]
ani_include_dirs = [
    external_interop_dir / 'ani',
    external_interop_dir / 'ani' / 'panda',
]
ani_sources = [
    external_interop_dir / 'ani/convertors-ani.cc',
    external_interop_dir / 'types/signatures.cc',
]

cj_include_dirs = [
    external_interop_dir / 'cangjie',
    external_incremental_cj_dir / 'runtime/src/'
]
cj_sources = [
    external_interop_dir / 'cangjie/convertors-cj.cc',
    external_interop_dir / 'cangjie/convertors-cj.h',
]

if is_jni
    jni_cflags = ['-DKOALA_USE_JAVA_VM', '-DKOALA_JNI', '-DINTEROP_LIBRARY_NAME=' + jni_library_name ]
    jni_include_dirs = [
        java_home / 'include',
        java_home / 'include' / jni_os,
        external_interop_dir / 'jni'
    ]
    jni_sources = [
        external_interop_dir / 'jni' / 'convertors-jni.cc',
        external_interop_dir / 'types' / 'signatures.cc',
    ]
endif

if is_node
node_ldflags = []
# TODO: support v8 on arm32 board.
if get_option('is_ohos_v8') and arch == 'arm64'
node_ldflags += [
    '-lnode'
]
endif
endif
if is_ohos
node_cflags += [
    '-DKOALA_OHOS',
]
endif

if is_cj
shared_library(cj_library_name,
    sources + cj_sources,
    override_options: [
        'b_lundef=false',
    ],
    install: true,
    include_directories: include_dirs + cj_include_dirs,
    install_dir: meson.current_source_dir(),
    cpp_args: cflags + cj_cflags,
    link_args: ldflags,
    dependencies: []
)
endif

shared_library(node_library_name,
    sources + node_sources,
    override_options: [
        'b_lundef=false',
    ],
    install: true,
    name_prefix: node_module_prefix,
    name_suffix: node_module_suffix,
    include_directories: include_dirs + node_include_dirs,
    install_dir: meson.current_source_dir(),
    cpp_args: cflags + node_cflags,
    link_args: ldflags + node_ldflags,
    dependencies: []
)
if use_libace
shared_library(libace_name,
    libace_sources,
    override_options: [
        'b_lundef=false',
    ],
    install: true,
    include_directories: include_dirs,
    install_dir: meson.current_source_dir(),
    cpp_args: cflags,
    link_args: ldflags,
    dependencies: []
)
endif

if is_arkts
shared_library(arkts_library_name,
    sources + arkts_sources,
    override_options: [
        'b_lundef=false',
    ],
    install: true,
    include_directories: include_dirs + arkts_include_dirs,
    install_dir: meson.current_source_dir(),
    cpp_args: cflags + arkts_cflags,
    link_args: ldflags,
    dependencies: []
)
endif

if is_ani
ani_ldflags = []

shared_library(ani_library_name,
    sources + ani_sources,
    override_options: [
        'b_lundef=false',
    ],
    install: true,
    include_directories: include_dirs + ani_include_dirs,
    install_dir: meson.current_source_dir(),
    cpp_args: cflags + ani_cflags,
    link_args: ldflags + ani_ldflags,
    dependencies: []
)
endif

if is_jni
shared_library(jni_library_name,
    sources + jni_sources,
    override_options: [
        'b_lundef=false',
    ],
    install: true,
    include_directories: include_dirs + jni_include_dirs,
    install_dir: meson.current_source_dir(),
    cpp_args: cflags + jni_cflags,
    link_args: ldflags,
    dependencies: []
)
endif

if is_ohos
ohos_library_name = ohos_library_name + '_' + arch
module_prefix = 'lib'
module_suffix = 'so'
ohos_cflags = [ '-DINTEROP_LIBRARY_NAME=' + ohos_library_name ]
ohos_cflags += [
    '-DKOALA_NAPI',
    '-DKOALA_USE_ARK_VM=1',
    '-DKOALA_USE_ARK_VM_WITH_JS=1',
    '-DKOALA_OHOS',
    '-D__MUSL__',
]

ohos_ldflags = [
    '-lhilog_ndk.z',
    '-lace_napi.z',
]

ohos_include_dirs = [
    external_interop_dir / 'node',
    external_interop_dir / 'arkts'
]

ohos_sources = [
    external_interop_dir + '/node/convertors-node.cc'
]

shared_library(ohos_library_name,
    sources + ohos_sources,
    override_options: [
        'b_lundef=false',
    ],
    install: true,
    name_prefix: module_prefix,
    name_suffix: module_suffix,
    include_directories: include_dirs + ohos_include_dirs,
    install_dir: meson.current_source_dir(),
    cpp_args: cflags + ohos_cflags,
    link_args: ldflags + ohos_ldflags
)
if use_libace
shared_library(libace_name,
    libace_sources,
    override_options: [
        'b_lundef=false',
    ],
    install: true,
    name_prefix: module_prefix,
    name_suffix: module_suffix,
    include_directories: include_dirs + ohos_include_dirs,
    install_dir: meson.current_source_dir(),
    cpp_args: cflags + ohos_cflags,
    link_args: ldflags + ohos_ldflags
)
endif

endif

# TODO: fix on Windows as well
if (os != 'windows') and (is_ohos_demo == false)
executable('test_arkoala_api',
    arkoala_dir / 'api_test.c',
    c_args: cflags,
    include_directories: include_dirs
)
executable('test_arkoala_compat',
    arkoala_dir / 'compat_test.cc',
    cpp_args: cflags,
    include_directories: include_dirs
)
executable('test_converter',
    arkoala_dir / 'converter_test.cc',
    cpp_args: cflags,
    include_directories: include_dirs + [libace_dir + '/utility/generated']
)
endif


if is_jni or is_arkts
loader_include_dirs = include_dirs
loader_cflags = cflags + [ '-DKOALA_DYNAMIC_LOADER' ]
loader_ldflags = []
if is_jni
loader_include_dirs += jni_include_dirs
loader_cflags += jni_cflags
endif
if is_arkts
loader_include_dirs += arkts_include_dirs
loader_cflags += arkts_cflags
endif
if is_ani
loader_include_dirs += ani_include_dirs
loader_cflags += ani_cflags
endif
if os != 'windows'
loader_ldflags += ['-ldl']
endif
shared_library('vmloader',
    external_interop_dir / 'vmloader.cc',
    install: true,
    include_directories: loader_include_dirs,
    install_dir: meson.current_source_dir(),
    cpp_args: loader_cflags,
    link_args: loader_ldflags
)
endif
