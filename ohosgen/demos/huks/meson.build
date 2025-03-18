project('NativeBridge', 'c', 'cpp',
    version: '0.1',
    default_options: ['cpp_std=c++17', 'buildtype=release']
)

is_node = get_option('target_vm') == 'node'
is_panda = get_option('target_vm') == 'panda'
is_cj = get_option('target_vm') == 'cangjie'

external_interop_dir = '../../../external/interop/src/cpp'

cflags = ['-DKOALA_INTEROP_MODULE=NativeModule']
ldflags = []

include_dirs = [
   'generated/native',
   'src/cpp',
   external_interop_dir,
   external_interop_dir / 'types',
]

sources = [
    'generated/native/huks.cc',
    'src/cpp/huksImpl.cc',
    external_interop_dir / 'common-interop.cc',
    external_interop_dir / 'callback-resource.cc',
    external_interop_dir / 'interop-logging.cc',
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
    # Avoid using COMDAT to not exceed COFF file limits, see https://learn.microsoft.com/en-us/cpp/error-messages/compiler-errors-1/fatal-error-c1128?view=msvc-170
    cflags += ['/Gy-']
endif

name_prefix = [] # default value
name_suffix = [] # default value

if is_node
    name_prefix = ''
    name_suffix = 'node'
    library_name = 'HUKS_NativeBridgeNapi'
    platform_build_dir = 'build/node'

    node_api_headers = run_command('node', '-p', 'require.resolve("node-api-headers/package.json").slice(0, -12)', check: true).stdout().strip()

    cflags += ['-DKOALA_USE_NODE_VM', '-DKOALA_NAPI', '-DINTEROP_LIBRARY_NAME=' + library_name ]
    include_dirs += [
        node_api_headers / 'include',
        external_interop_dir / 'napi'
    ]
    sources += [
        external_interop_dir / 'napi/convertors-napi.cc'
    ]
    if os == 'windows'
        sources += [ external_interop_dir / 'napi' / 'win-dynamic-node.cc' ]
    endif
elif is_panda
    library_name = 'HUKSNativeModule'
    platform_build_dir = 'build/panda'

    cflags += ['-DKOALA_USE_PANDA_VM', '-DKOALA_ANI', '-DINTEROP_LIBRARY_NAME=' + library_name]
    cflags += ['-DETS_MODULE_CLASSPATH_PREFIX=@huks/generated/arkts/HUKSNativeModule/']
    include_dirs += [
        external_interop_dir / 'ani',
    ]
    sources += [
        external_interop_dir / 'ani/convertors-ani.cc',
        external_interop_dir / 'types/signatures.cc',
    ]
elif is_cj
    library_name = 'HUKS_NativeBridgeCJ'
    platform_build_dir = 'build/cangjie'

    cflags += ['-DKOALA_CJ', '-DINTEROP_LIBRARY_NAME=' + library_name]
    include_dirs += [
        external_interop_dir / 'cangjie',
    ]
    sources += [
        external_interop_dir / 'cangjie/convertors-cj.cc',
        external_interop_dir / 'types/signatures.cc',
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
    dependencies: []
)
