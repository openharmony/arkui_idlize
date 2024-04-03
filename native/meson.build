project('NativeBridge', 'c', 'cpp',
    version: '0.1',
    default_options: ['cpp_std=c++17', 'buildtype=release']
)

use_subset = true
is_node = true

sources = [
    '../utils/cpp/common-interop.cc'
]
include_dirs = [
    '../utils/cpp'
]

if use_subset
sources += [
   '../generated/subset/bridge.cc'
]
include_dirs += [
    '../generated/subset'
]
else
sources += [
    '../generated/peers/bridge.cc'
]
include_dirs += [
    '../generated/peers'
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

library_name = 'NativeBridge-' + os + '-' + arch

if is_node
cflags += ['-DKOALA_USE_NODE_VM', '-DKOALA_NAPI', '-DINTEROP_LIBRARY_NAME=' + library_name]
include_dirs += [
    '../utils/cpp/node',
    '../node-api-headers/include',
    '../node-addon-api'
]
sources += [
    '../utils/cpp/node/convertors-node.cc'
]
endif

shared_library(library_name,
    sources,
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
