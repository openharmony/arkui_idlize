project('NativeBridge', 'c', 'cpp',
    version: '0.1',
    default_options: ['cpp_std=c++17', 'buildtype=release']
)

if get_option('source_set') != ''
source_set = get_option('source_set')
else
source_set = 'peers'
endif
use_libace = false
use_dummy_libace = true
if get_option('arkts')
is_arkts = true
else
is_arkts = false
endif

java_home = run_command('node', '-e', 'console.log(process.env.JAVA_HOME)').stdout().strip()

is_node = true
is_arkts = true
is_cj = false
is_jni = java_home != 'undefined'

compile_events_test = get_option('events_test')
compile_callbacks_test = get_option('callbacks_test')

gen_dir = '../generated/' + source_set
arkoala_dir = gen_dir + '/koalaui/arkoala/native/src/generated'
external_dir = '../external/interop/src/cpp'
libace_dir = gen_dir / 'libace'

cxx = meson.get_compiler('cpp')

cflags = []
ldflags = []

include_dirs = [
   arkoala_dir,
   arkoala_dir / 'legacy',
   external_dir
]

sources = [
    external_dir / 'common-interop.cc',
    arkoala_dir / 'arkoala.cc',
    arkoala_dir / 'custom.cc',
    arkoala_dir / 'bridge_generated.cc',
    arkoala_dir / 'bridge_custom.cc',
    arkoala_dir / 'events.cc',
    arkoala_dir / 'all_events.cc',
    arkoala_dir / 'load-library.cc',
    arkoala_dir / 'library.cc',
]
if compile_events_test
    sources += [
        arkoala_dir / 'events_test.cc',
    ]
endif
if compile_callbacks_test
    sources += [
        arkoala_dir + '/callbacks_test.cc',
    ]
endif
# if source_set == 'cangjie-subset'
# sources = []
# endif

is_msvc = meson.get_compiler('cpp').get_id() == 'msvc'
is_clang = not is_msvc

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
use_dummy_libace = false
is_arkts = false
use_libace = true
endif

if use_libace
libace_sources = []
libace_name = 'ace_compatible_mock'

if use_dummy_libace
libace_sources += [
    arkoala_dir + '/dummy_impl.cc',
]
else
libace_sources += [
    libace_dir + '/generated/interface/all_modifiers.cpp',
]
getModifierImplFiles = run_command('node', 'getModifierImplFiles.mjs', libace_dir + '/implementation')
modifier_impl_sources = getModifierImplFiles.stdout().strip().split(',')
libace_sources += modifier_impl_sources
endif
cflags += ['-DKOALA_USE_LIBACE=1']
else
sources += [
    arkoala_dir / 'dummy_impl.cc',
]
endif

node_library_name = 'NativeBridgeNapi'
arkts_library_name = 'NativeBridgeArk'
jni_library_name = 'NativeBridgeJni'
cj_library_name = 'NativeBridgeCJ'
ohos_library_name = 'NativeBridge_ohos'

if is_clang
# TODO: remove all -Wno-* when generation is fixed.
cflags += [
    '-Wall', '-Werror', '-Wno-unused-variable', '-Wno-unused-but-set-variable', 
    '-Wno-extern-c-compat', '-Wno-error=deprecated-declarations', 
    '-Wno-unknown-warning-option', '-Wno-parentheses-equality', '-Wno-unused-function'
]
endif

if is_msvc
# Avoid using COMDAT to not exceed COFF file limits, see https://learn.microsoft.com/en-us/cpp/error-messages/compiler-errors-1/fatal-error-c1128?view=msvc-170
cflags += ['/Gy-']
endif

node_cflags = ['-DKOALA_USE_NODE_VM', '-DKOALA_NAPI', '-DINTEROP_LIBRARY_NAME=' + node_library_name ]
node_include_dirs = [
    '../node_modules/node-api-headers/include',
    '../node_modules/node-addon-api',
    external_dir / 'node'
]
node_sources = [
    external_dir / 'node/convertors-node.cc'
]
if os == 'windows'
    cflags += ['-DKOALA_WINDOWS']
    node_sources += [ external_dir / 'node' / 'win-dynamic-node.cc' ]
    panda_ldflags = []
endif
if os == 'linux'
    cflags += ['-DKOALA_LINUX']
    panda_ldflags = ['-ldl', '-lm']
endif
if os == 'macos'
    cflags += ['-DKOALA_MACOS']
    panda_ldflags = ['-ldl', '-lm']
endif

node_module_prefix = ''
node_module_suffix = 'node'

arkts_cflags = ['-DKOALA_USE_ARK_VM', '-DKOALA_USE_ARK_VM_WITH_ETS', '-DKOALA_ETS_NAPI']
arkts_include_dirs = [
    external_dir / 'arkts',
    arkoala_dir / 'arkts'
]
arkts_sources = [
    external_dir / 'arkts/convertors-ark.cc',
    external_dir / 'arkts/convertors-ets.cc',
]

cj_include_dirs = [
    arkoala_dir / 'cj'
]
cj_sources = [
    arkoala_dir / 'cj/dummy.c',
    arkoala_dir / 'cj/dummy.h',
]

if is_jni
    jni_cflags = ['-DKOALA_USE_JAVA_VM', '-DKOALA_JNI']
    jni_include_dirs = [
        java_home / 'include',
        java_home / 'include' / jni_os,
        external_dir / 'jni'
    ]
    jni_sources = [
        external_dir / 'jni' / 'convertors-jni.cc',
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
if is_ohos
node_cflags += [
    '-DKOALA_OHOS',
]
endif


if is_cj
shared_library(cj_library_name,
    cj_sources,
    override_options: [
        'b_lundef=false',
    ],
    install: true,
    include_directories: cj_include_dirs,
    install_dir: meson.current_source_dir(),
    cpp_args: cflags,
    link_args: ldflags,
    dependencies: []
)
else
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
    name_prefix: node_module_prefix,
    name_suffix: 'dll',
    include_directories: include_dirs + node_include_dirs,
    install_dir: meson.current_source_dir(),
    cpp_args: cflags + node_cflags,
    link_args: ldflags + node_ldflags,
    dependencies: []
)
endif
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
    '../node_modules/node-addon-api',
    external_dir / 'node',
    external_dir / 'arkts'
]

ohos_sources = [
    external_dir + '/node/convertors-node.cc'
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
if os != 'windows'
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

endif
endif
