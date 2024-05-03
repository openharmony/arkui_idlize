project('NativeBridge', 'c', 'cpp',
    version: '0.1',
    default_options: ['cpp_std=c++17', 'buildtype=debug']
)

if get_option('subset')
source_set = 'subset'
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
]
if use_dummy_libace
sources += [
   gen_dir + '/dummy_impl.cc'
]
else
sources += [
   gen_dir + '/all_modifiers.cc'
]
endif

is_msvc = meson.get_compiler('cpp').get_id() == 'msvc'
is_clang = not is_msvc

oses = { 'emscripten': 'wasm', 'darwin': 'macos' }  # rename meson default names to convienient ones
archs = { 'x86_64': 'x64', 'aarch64': 'arm64', 'wasm32': 'wasm' }
jni_oses = { 'windows': 'win32' }
os = target_machine.system()
os = oses.get(os, os)
arch = target_machine.cpu()
arch = archs.get(arch, arch)
jni_os = target_machine.system()
jni_os = jni_oses.get(jni_os, jni_os)

cxx = meson.get_compiler('cpp')

cflags = []
ldflags = []

node_library_name = 'NativeBridgeNapi'
arkts_library_name = 'NativeBridgeArk'
jni_library_name = 'NativeBridgeJni'

if is_clang
# TODO: remove all -Wno-* when generation is fixed.
cflags += ['-Wno-address-of-packed-member', '-Wall', '-Werror', '-Wno-unused-variable', '-Wno-extern-c-compat']
endif

node_cflags = ['-DKOALA_USE_NODE_VM', '-DKOALA_NAPI', '-DINTEROP_LIBRARY_NAME=' + node_library_name]
node_include_dirs = [
    '../node-api-headers/include',
    '../node-addon-api'
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
executable('dummy-panda',
    gen_dir / 'dummy-panda.cc',
    cpp_args: cflags,
    link_args: panda_ldflags,
    install_dir: meson.current_source_dir()
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

# TODO: fix on Windows as well
if os != 'windows'
executable('test_arkoala_api',
    gen_dir / 'api_test.c',
    c_args: cflags
)
endif
