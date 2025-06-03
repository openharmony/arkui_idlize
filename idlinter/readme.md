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
cd idlinter
npm run compile
```

Then you can bind `node <idlinter-directory> $*` to `idlinter` shell script (or `node <idlinter-directory> %*` to `idlinter.cmd`) and run it:

```text
Usage: idlinter [options]

Options:
  -V, --version   output the version number
  --check <path>  Path to single .idl file or directory to recursively scan for
                  .idl for validation
  --load <path>   Path to single .idl file or directory to recursively scan for
                  .idl for loading and symbol search
                  (only those also mentioned in --check will be checked)
  -h, --help      display help for command
```
