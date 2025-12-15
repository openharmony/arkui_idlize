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

## API Compatibility Checker

### Usage
`node idlinter compat <dir> <dir0>`

Checks API described by IDL files inside `<dir>` against the API defined in `<dir0>`. Reports any incompatibilities found, e.g.
```
error[Compat]: Incompatible API change
--> /tmp/api-compat.ea3737e0.idl/@ohos.batteryInfo.idl
 = Return type mismatch: ohos.batteryInfo.batteryInfo.getBatteryConfig(String)
error[Compat]: Incompatible API change
--> /tmp/api-compat.124411ae.idl/@ohos.effectKit.idl
 = Missing function: ohos.effectKit.effectKit.Filter.setColorMatrix(sequence<f64>)
error[Compat]: Incompatible API change
--> /tmp/api-compat.124411ae.idl/@ohos.graphics.drawing.idl
 = Missing property: ohos.graphics.drawing.drawing.PathMeasureMatrixFlags.GET_POSITION_AND_TANGENT_MATRIX
error[Compat]: Incompatible API change
--> /tmp/api-compat.ea3737e0.idl/@ohos.multimedia.media.idl
 = Optional attribute changed: ohos.multimedia.media.media.AVMetadata.author: String
error[Compat]: Incompatible API change
--> /tmp/api-compat.124411ae.idl/@ohos.reminderAgentManager.idl
 = Missing function: ohos.reminderAgentManager.reminderAgentManager.updateReminder(i32, ReminderRequest)
fatal: 0, error: 5, warning: 0, information: 0, hint: 0
```

There is a helper script that produces IDL files from commits in the SDK repository, then runs the compatibility checker on those files:

`node idlinter/bin/check-api-compat.mjs [--idlize] <path to SDK repo> <commit> [<base>]`

If `<base>` is omitted, commit preceding `<commit>` (i.e. `<commit>~`) is used as the base.

### How It Works

The tool catches conditions that constitute API incompatibilities between versions, such as:
- Removal of interfaces or functions
- Modification of function signatures: number or types of parameters
- Changing return type of a function or method
- Changes to class hierarchy or inheritance
- Making things non-optional when they were optional, and vice versa
- Removal of enum constants

Some conditions are currently not checked, including:
- Changes to default values of parameters or fields
- Moving entities between files, renaming files
- Making abstract classes non-abstract and vice versa
- Adding new enum constants
