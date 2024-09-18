project('call_log', 'cpp',
        version: '0.1',
        default_options: ['cpp_std=c++17', ]
)
sources = [
    '../../generated/call_log/main.cpp'
]
CXX = meson.get_compiler('cpp')
deps = CXX.find_library(
    'NativeBridgeArk',
    dirs : [meson.current_source_dir() + '/../../native/']
)
# for subset:
inc_dir = include_directories('../../out/ts-subset/generated/libace/generated/interface')
# for peers:
# inc_dir = include_directories('../../out/ts-peers/generated/libace/generated/interface')
library(
    'run_call_log',
    sources,
    dependencies: deps,
    include_directories: inc_dir,
)