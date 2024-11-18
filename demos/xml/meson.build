project('NativeBridge', 'c', 'cpp',
    version: '0.1',
    default_options: ['cpp_std=c++17', 'buildtype=release']
)

is_node = true

external_interop_dir = '../../external/interop/src/cpp'

cxx = meson.get_compiler('cpp')

cflags = ['-g', '-O0']
ldflags = []

include_dirs = [
   'generated',
   'src/cpp',
   external_interop_dir,
   external_interop_dir / 'types',
]

sources = [
    'generated/xml.cc',
    'src/cpp/xmlImpl.cc',
    external_interop_dir / 'common-interop.cc',
    external_interop_dir / 'interop-logging.cc',
]

is_msvc = meson.get_compiler('cpp').get_id() == 'msvc'
is_clang = meson.get_compiler('cpp').get_id() == 'clang'
is_gcc = meson.get_compiler('cpp').get_id() == 'gcc'

oses = { 'emscripten': 'wasm', 'darwin': 'macos' }  # rename meson default names to convienient ones
archs = { 'x86_64': 'x64', 'aarch64': 'arm64', 'wasm32': 'wasm', 'armv7a': 'arm' }
os = target_machine.system()
os = oses.get(os, os)
arch = target_machine.cpu()
arch = archs.get(arch, arch)


node_library_name = 'Xml_NativeBridgeNapi'

if is_clang
# TODO: remove all -Wno-* when generation is fixed.
cflags += [
    '-Wall', '-Werror', '-Wno-unused-variable', '-Wno-unused-but-set-variable',
    '-Wno-extern-c-compat', '-Wno-error=deprecated-declarations',
    '-Wno-unknown-warning-option', '-Wno-parentheses-equality', '-Wno-unused-function', '-Wno-macro-redefined',
    '-Wno-enum-compare', '-Wno-tautological-constant-out-of-range-compare'
]
endif

if is_msvc
# Avoid using COMDAT to not exceed COFF file limits, see https://learn.microsoft.com/en-us/cpp/error-messages/compiler-errors-1/fatal-error-c1128?view=msvc-170
cflags += ['/Gy-']
endif

node_addon_api = run_command('node', '-p', 'require.resolve("node-addon-api/package.json").slice(0, -12)', check: true).stdout().strip()
node_api_headers = run_command('node', '-p', 'require.resolve("node-api-headers/package.json").slice(0, -12)', check: true).stdout().strip()

node_cflags = ['-DKOALA_USE_NODE_VM', '-DKOALA_NAPI', '-DINTEROP_LIBRARY_NAME=' + node_library_name ]
node_include_dirs = [
    node_api_headers / 'include',
    node_addon_api,
    external_interop_dir / 'napi'
]
node_sources = [
    external_interop_dir / 'napi/convertors-napi.cc'
]
cj_cflags = ['-DKOALA_CJ']
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
    cflags += ['-DKOALA_MACOS']
    panda_ldflags = ['-ldl', '-lm']
endif

node_module_prefix = ''
node_module_suffix = 'node'

if is_node
    node_ldflags = []
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
    install_dir: meson.current_source_dir() / 'build/node',
    cpp_args: cflags + node_cflags,
    link_args: ldflags + node_ldflags,
    dependencies: [
        dependency('expat')
    ]
)
