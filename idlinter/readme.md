# Idlize IDL validation utility (idlinter)

Supposed to be used as part of [Idlize](https://gitee.com/nikolay-igotti/idlize) distribution.

Please see [Idlize readme](https://gitee.com/nikolay-igotti/idlize/blob/master/README.md) for the whole suite installation instructions.

Building `idlinter` itself in clear environment with `Node.js` and `npm` installed:

```sh
git clone https://gitee.com/nikolay-igotti/idlize.git
cd idlize
git submodule update --init
git submodule update --remote
npm i
cd core
npm run compile
cd ..
cd idlinter
npm run compile
```

Then you can bind `node <idlinter-directory> $*` to `idlinter` shell script (or `node <idlinter-directory> %*` to `idlinter.cmd`) and run it:

```text
Usage: idlinter [options]

Options:
  -V, --version             output the version number
  --check <paths...>        Paths to individual .idl files (or directories recursively containing them) for validation
  --load <paths...>         Paths to individual .idl files (or directories recursively containing them) for loading and symbol search
                            (only those also mentioned in --check will be checked)
  --features <features...>  Enable additional validation features,
                            including:
                            ohos  OHOS-specific checks
  -h, --help                display help for command

Exit codes are (1) for invalid arguments and (2) in case of errors/fatals found in .idl files.
```

For architecture overview and extensions how-to see [architecture-and-extensions.md](architecture-and-extensions.md)
