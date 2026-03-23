project('NativeBridge', 'c', 'cpp',
    version: '0.1',
    default_options: ['cpp_std=c++17', 'buildtype=release']
)

is_node = get_option('target') == 'node'
is_panda = get_option('target') == 'panda'
is_cj = get_option('target') == 'cangjie'
is_kotlin = get_option('target') == 'kotlin'

if is_kotlin
    external_interop_build_dir = meson.current_source_dir() / '../../../external/koala_projects/interop/build'
    external_interop_dir = '../../../external/koala_projects/interop/src/cpp'
else
    external_interop_build_dir = meson.current_source_dir() / '../../../node_modules/@koalaui/interop/build'
    external_interop_dir = '../../../node_modules/@koalaui/interop/src/cpp'
endif

cflags = ['-DKOALA_LIBACE_LINKED']
ldflags = []
deps = []

include_dirs = [
   'generated/native',
   'src/cpp',
   external_interop_dir,
   external_interop_dir / 'types',
]

sources = [
    'generated/native/unit_ost.cpp',
    'generated/native/unit_ostApiImpl_temp.cpp',
    'src/cpp/ostImpl.cpp',
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
        '-Wno-unknown-warning-option', '-Wno-unused-function', '-Wno-macro-redefined',
        '-Wno-enum-compare', '-Wno-tautological-constant-out-of-range-compare'
    ]
elif is_msvc
    # Avoid using COMDAT to not exceed COFF file limits, see https://learn.microsoft.com/en-us/cpp/error-messages/compiler-errors-1/fatal-error-c1128?view=msvc-170
    cflags += ['/Gy-']
endif

name_prefix = [] # default value
name_suffix = [] # default value

if is_node
    name_prefix = ''
    name_suffix = 'node'
    library_name = 'UNIT_OSTNativeModule'
    platform_build_dir = meson.current_source_dir() / 'build/node'

    node_api_headers = run_command('node', '-p', 'require.resolve("node-api-headers/package.json").slice(0, -12)', check: true).stdout().strip()

    cflags += ['-DKOALA_USE_NODE_VM', '-DKOALA_NAPI', '-DINTEROP_LIBRARY_NAME=' + library_name ]
    ldflags += external_interop_build_dir / 'InteropNativeModule.node'
    include_dirs += [
        node_api_headers / 'include',
        external_interop_dir / 'napi'
    ]
    sources += [
        external_interop_dir / 'napi/convertors-napi.cpp'
    ]
    if os == 'windows'
        sources += [ external_interop_dir / 'napi' / 'win-dynamic-node.cpp' ]
    endif
elif is_panda
    library_name = 'UNIT_OSTNativeModule'
    platform_build_dir = meson.current_source_dir() / 'build/panda'
    cflags += [
        '-DETS_MODULE_CLASSPATH_PREFIX=@unit_ost.generated.arkts.unit_ost.INTERNAL.',
        '-DKOALA_USE_PANDA_VM',
        '-DKOALA_ANI', '-DINTEROP_LIBRARY_NAME=' + library_name
    ]
    ldflags += external_interop_build_dir / 'libInteropNativeModule.so'
    include_dirs += [
        external_interop_dir / 'ani',
        external_interop_dir / 'ani' / 'panda',
    ]
    sources += [
        external_interop_dir / 'ani/convertors-ani.cpp',
        external_interop_dir / 'types/signatures.cpp',
    ]
elif is_cj
    library_name = 'UNIT_OSTNativeModule'
    platform_build_dir = 'build/cangjie'

    cflags += ['-DKOALA_CJ', '-DINTEROP_LIBRARY_NAME=' + library_name]
    cflags += [
        '-DETS_NATIVE_MODULE_CLASS_NAME=OSTNativeModule',
        '-DETS_NATIVE_MODULE_QUALIFIED_NAME=ostNative',
    ]
    include_dirs += [
        external_interop_dir / 'cangjie',
    ]
    sources += [
        external_interop_dir / 'cangjie/convertors-cj.cpp',
        external_interop_dir / 'types/signatures.cpp',
    ]
elif is_kotlin
    library_name = 'UNIT_OSTNativeModule'
    platform_build_dir = 'build/kotlin'

    cflags += ['-DKOALA_LANG_KT', '-DINTEROP_LIBRARY_NAME=' + library_name]
    include_dirs += [
        external_interop_dir / 'kotlin',
    ]
    sources += [
        external_interop_dir / 'kotlin/convertors-kotlin.cpp',
    ]
endif

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
    dependencies: deps,
)
