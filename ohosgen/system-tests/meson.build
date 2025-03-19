project('NativeBridge', 'c', 'cpp',
    version: '0.1',
    default_options: ['cpp_std=c++17', 'buildtype=release']
)

cur_test_case = get_option('test_case')
cur_test_case_package = '@' + cur_test_case.replace('_', '-')
CUR_TEST_CASE = cur_test_case.to_upper()

cur_target_vm = get_option('target_vm')
is_node = get_option('target_vm') == 'node'
is_panda = get_option('target_vm') == 'panda'
is_cj = get_option('target_vm') == 'cangjie'

message(f'Builds test case "@cur_test_case@" with virtual machine "@cur_target_vm@".')

external_interop_dir = '../../external/interop/src/cpp'

cflags = ['-DKOALA_INTEROP_MODULE=NativeModule']
ldflags = []

include_dirs = [
   f'./@cur_test_case@/generated/native',
   f'./@cur_test_case@/src/cpp',
   external_interop_dir,
   external_interop_dir / 'types',
]

sources = [
    f'./@cur_test_case@/generated/native/@cur_test_case@.cc',
    f'./@cur_test_case@/src/cpp/@cur_test_case@Impl.cc',
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
    # Avoid using COMDAT to not exceed COFF file limits
    # See https://learn.microsoft.com/en-us/cpp/error-messages/compiler-errors-1/fatal-error-c1128?view=msvc-170
    cflags += ['/Gy-']
endif

name_prefix = [] # default value
name_suffix = [] # default value

if is_node
    # Not supported yet
elif is_panda
    library_name = f'@CUR_TEST_CASE@NativeModule'
    platform_build_dir = f'./@cur_test_case@/build/panda'

    cflags += ['-DKOALA_USE_PANDA_VM', '-DKOALA_ANI', '-DINTEROP_LIBRARY_NAME=' + library_name]
    cflags += [f'-DETS_MODULE_CLASSPATH_PREFIX=@cur_test_case_package@/generated/arkts/@CUR_TEST_CASE@NativeModule/']
    include_dirs += [
        external_interop_dir / 'ani',
    ]
    sources += [
        external_interop_dir / 'ani/convertors-ani.cc',
        external_interop_dir / 'types/signatures.cc',
    ]
elif is_cj
    # Not supported yet
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
