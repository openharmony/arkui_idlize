project('ArkUI', 'c', 'cpp',
    version: '0.1',
    default_options: ['cpp_std=c++17', 'buildtype=release']
)

external_interop_build_dir = '../../node_modules/@koalaui/interop/build'
external_interop_dir = '../../node_modules/@koalaui/interop/src/cpp'

cflags = ['-DKOALA_LIBACE_LINKED']
ldflags = []

include_dirs = [
    './out/generated/native',
    external_interop_dir,
    external_interop_dir / 'types',
    external_interop_dir / 'ani',
    external_interop_dir / 'ani' / 'panda',
]

sources = [
    './out/generated/native/arkui.cpp',
    './out/generated/native/arkuiApiImpl_temp.cpp',
    './out/generated/native/arkuiImpl_temp.cpp',
    external_interop_dir / 'common-interop.cpp',
    external_interop_dir / 'callback-resource.cpp',
    external_interop_dir / 'interop-logging.cpp',
    external_interop_dir / 'ani/convertors-ani.cpp',
    external_interop_dir / 'types/signatures.cpp',
]

oses = { 'emscripten': 'wasm', 'darwin': 'macos' }  # rename meson default names to convienient ones
archs = { 'x86_64': 'x64', 'aarch64': 'arm64', 'wasm32': 'wasm', 'armv7a': 'arm' }
os = target_machine.system()
os = oses.get(os, os)
arch = target_machine.cpu()
arch = archs.get(arch, arch)

if os == 'windows'
    cflags += ['-DKOALA_WINDOWS']
elif os == 'linux'
    cflags += ['-DKOALA_LINUX']
elif os == 'macos'
    cflags += ['-DKOALA_MACOS']
endif

is_msvc = meson.get_compiler('cpp').get_id() == 'msvc'
is_clang = meson.get_compiler('cpp').get_id() == 'clang'
is_gcc = meson.get_compiler('cpp').get_id() == 'gcc'

if is_clang
    # TODO: remove all -Wno-* when generation is fixed.
    cflags += [
        '-Wall', '-Werror', '-Wno-unused-variable', '-Wno-unused-but-set-variable',
        '-Wno-extern-c-compat', '-Wno-error=deprecated-declarations',
        '-Wno-unknown-warning-option', '-Wno-parentheses-equality', '-Wno-unused-function', '-Wno-macro-redefined',
        '-Wno-enum-compare', '-Wno-tautological-constant-out-of-range-compare'
    ]
elif is_msvc
    # Avoid using COMDAT to not exceed COFF file limits
    # See https://learn.microsoft.com/en-us/cpp/error-messages/compiler-errors-1/fatal-error-c1128?view=msvc-170
    cflags += ['/Gy-']
endif

name_prefix = [] # default value
name_suffix = [] # default value

library_name = 'ArkUINativeModule'
platform_build_dir = 'build/panda'

cflags += ['-DKOALA_USE_PANDA_VM', '-DKOALA_ANI', '-DINTEROP_LIBRARY_NAME=' + library_name]
cflags += ['-DETS_MODULE_CLASSPATH_PREFIX=arkui.generated.arkts.arkui.INTERNAL.']
ldflags += external_interop_build_dir / 'libInteropNativeModule.so'

shared_library(library_name, sources,
    override_options: [
        'b_lundef=false',
    ],
    install: true,
    name_prefix: name_prefix,
    name_suffix: name_suffix,
    include_directories: include_dirs,
    install_dir: meson.current_source_dir() / platform_build_dir,
    cpp_args: cflags,
    link_args: ldflags,
    dependencies: []
)
