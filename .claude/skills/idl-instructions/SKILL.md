# How to regenerate

## SETUP

```bash
# BASICS
npm i --no-save /path/to/ace_ets2bundle/libarkts.tgz

# COMPILE THE PROJECT
# This compiles all related modules, so it does not matter which workspace you edited — just run this command to recompile.
cd runner
npm run compile
cd ..

# DOWNLOAD SDK
npm run download:sdk
```

## GENERATION

```bash
bash generate.sh
```

The generated code will be in `./out`.

## CREATING IDLIZER BUNDLES

```bash
npm run bundle
```
The idlizer bundles will be in the `./bundled` directory.

For an OpenHarmony build, use
`//foundation/arkui/idlize:idlize_bundle`. The GN target creates an isolated
copy under `target_gen_dir`, replaces the registry libarkts package with the
archive provided by `ace_ets2bundle`, and uses the Panda SDK from the same
component. The resulting packages are written to `$root_out_dir/arkui_idlize`.
