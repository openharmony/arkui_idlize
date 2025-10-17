# Idlize IDL validation utility (idlinter)

Supposed to be compiled and used as a part of Idlize distribution.

Please see [Idlize readme](../README.md) for the whole suite installation instructions.

Building `idlinter` itself in clear environment with `Node.js` and `npm` installed:

```sh
git clone https://gitee.com/nikolay-igotti/idlize.git
cd idlize
git submodule update --init
git submodule update --remote
npm i
npm run compile --prefix core
npm run compile --prefix idlinter
```

Then you can bind `node <idlinter-directory> $*` to `idlinter` shell script (or `node <idlinter-directory> %*` to `idlinter.cmd`) and run it:

```text
Usage: idlinter [options]

Options:
  -V, --version             output the version number
  -h, --help                display help for command

  check <paths...>          Paths to individual .idl files (or directories recursively containing them) for validation
  --load <paths...>         Paths to individual .idl files (or directories recursively containing them) for loading and symbol search
                            (these files will not be checked)
  --features <features...>  Enable additional validation features,
                            including:
                            ohos  OHOS-specific checks

  compat <dir0> <dir1>   Check if dir1 is API-wise compatible with dir0

Exit codes are (1) for invalid arguments and (2) in case of errors/fatals found in .idl files.
```

For architecture overview and extensions how-to see [architecture-and-extensions.md](architecture-and-extensions.md)
