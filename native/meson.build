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
is_node = true

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
endif

is_msvc = meson.get_compiler('cpp').get_id() == 'msvc'

oses = { 'emscripten': 'wasm', 'darwin': 'macos' }  # rename meson default names to convienient ones
archs = { 'x86_64': 'x64', 'aarch64': 'arm64', 'wasm32': 'wasm' }

os = target_machine.system()
os = oses.get(os, os)
arch = target_machine.cpu()
arch = archs.get(arch, arch)

cxx = meson.get_compiler('cpp')

cflags = []
ldflags = []

# library_name = 'NativeBridge-' + os + '-' + arch
library_name = 'NativeBridge'

if is_node
cflags += ['-DKOALA_USE_NODE_VM', '-DKOALA_NAPI', '-DINTEROP_LIBRARY_NAME=' + library_name]
include_dirs += [
    '../node-api-headers/include',
    '../node-addon-api'
]
sources += [
    gen_dir + '/convertors-node.cc'
]
if os == 'windows'
    cflags += ['-DKOALA_WINDOWS']
    sources += [ gen_dir + '/win-dynamic-node.cc' ]
endif
module_prefix = ''
module_suffix = 'node'
endif

shared_library(library_name,
    sources,
    override_options: [
        'b_lundef=false',
    ],
    install: true,
    name_prefix: module_prefix,
    name_suffix: module_suffix,
    include_directories: include_dirs,
    install_dir: meson.current_source_dir(),
    cpp_args: cflags,
    link_args: ldflags,
    dependencies: []
)
