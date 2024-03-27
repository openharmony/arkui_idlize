project('NativeBridge', 'c', 'cpp',
    version: '0.1',
    default_options: ['cpp_std=c++17', 'buildtype=release']
)

sources = [
]
include_dirs = [
    '../utils/cpp'
]

use_subset = true

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

shared_library('NativeBridge-' + os + '-' + arch,
    sources,
    install: true,
    include_directories: include_dirs,
    install_dir: meson.current_source_dir(),
    cpp_args: cflags,
    link_args: ldflags,
    dependencies: []
)
