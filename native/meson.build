project('NativeBridge', 'c', 'cpp',
    version: '0.1',
    default_options: ['cpp_std=c++17', 'buildtype=release']
)

if get_option('source_set') != ''
source_set = get_option('source_set')
else
source_set = 'peers'
endif
use_dummy_libace = true
if get_option('arkts')
is_arkts = true
else
is_arkts = false
endif

java_home = run_command('node', '-e', 'console.log(process.env.JAVA_HOME)').stdout().strip()

is_node = true
is_arkts = true
is_jni = java_home != 'undefined'

gen_dir = '../generated/' + source_set

include_dirs = [
   gen_dir
]

sources = [
    gen_dir + '/common-interop.cc',
    gen_dir + '/custom.cc',
    gen_dir + '/bridge.cc',
    gen_dir + '/events.cc',
    gen_dir + '/all_events.cc',
    gen_dir + '/events_test.cc',
    gen_dir + '/load-library.cc',
]

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
endif

libace_sources = []
libace_name = 'ace_compatible_mock'

if use_dummy_libace
libace_sources += [
    gen_dir + '/dummy_impl.cc',
]
else
libace_sources += [
    gen_dir + '/all_modifiers.cc',
    gen_dir + '/delegates.cc',
]
endif

cxx = meson.get_compiler('cpp')

cflags = []
ldflags = []

node_library_name = 'NativeBridgeNapi'
arkts_library_name = 'NativeBridgeArk'
jni_library_name = 'NativeBridgeJni'
ohos_library_name = 'NativeBridge_ohos'

if is_clang
# TODO: remove all -Wno-* when generation is fixed.
cflags += ['-Wall', '-Werror', '-Wno-unused-variable', '-Wno-unused-but-set-variable', '-Wno-extern-c-compat', '-Wno-error=deprecated-declarations']
endif

node_cflags = ['-DKOALA_USE_NODE_VM', '-DKOALA_NAPI', '-DINTEROP_LIBRARY_NAME=' + node_library_name]
node_include_dirs = [
    '../node_modules/node-api-headers/include',
    '../node_modules/node-addon-api'
]
node_sources = [
    gen_dir + '/convertors-node.cc'
]
if os == 'windows'
    cflags += ['-DKOALA_WINDOWS']
    node_sources += [ gen_dir + '/win-dynamic-node.cc' ]
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
arkts_include_dirs = []
arkts_sources = [
    gen_dir / 'convertors-ark.cc',
    gen_dir / 'convertors-ets.cc',
]

if is_jni
jni_cflags = ['-DKOALA_USE_JAVA_VM', '-DKOALA_JNI']
jni_include_dirs = [ java_home / 'include', java_home / 'include' / jni_os ]
jni_sources = [
    gen_dir / 'convertors-jni.cc',
]
endif

if is_node
node_ldflags = []
# TODO: support v8 on arm32 board.
if get_option('is_ohos_v8') and arch == 'arm64'
node_ldflags += [
    '-lnode'
]
node_cflags += [
    '-DKOALA_OHOS',
]
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
executable('dummy-panda',
    gen_dir / 'dummy-panda.cc',
    cpp_args: cflags,
    link_args: panda_ldflags,
    install_dir: meson.current_source_dir()
)

endif

if is_jni and not is_ohos
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
    '../node_modules/node-addon-api'
]

ohos_sources = [
    gen_dir + '/convertors-node.cc',
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

# TODO: fix on Windows as well
if os != 'windows'
executable('test_arkoala_api',
    gen_dir / 'api_test.c',
    c_args: cflags
)
endif
