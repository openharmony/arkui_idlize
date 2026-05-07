# How to regenerate

## SETUP

```bash
# BASICS
git submodule update --init
npm i
cd external
npm i
cd ..

# PREPARE LIBARKTS (uses the panda SDK version required by the current koala_projects submodule)
cd external/libarkts
PANDA_SDK_VERSION=1.5.0-dev.58082 npm run panda:sdk:reinstall
npm run compile
cd ../../

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

