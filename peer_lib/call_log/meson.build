project('call_log', 'cpp',
        version: '0.1'
)
sources = [
    './main.cpp'
]
CXX = meson.get_compiler('cpp')
deps = CXX.find_library(
    'NativeBridgeArk',
    dirs : [meson.current_source_dir() + '/../../native/']
)
inc_dir = include_directories('../../generated/subset/libace/generated/interface')
executable(
    'run_call_log',
    sources,
    dependencies: deps,
    include_directories: inc_dir,
)