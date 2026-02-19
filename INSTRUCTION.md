# How to regenerate

## SETUP

```bash
# BASICS
git submodule update --init
npm i
cd external
npm i
cd ..

# PREPARE LIBARKTS (using panda actual for current koala_projects submodule)
cd external/libarkts
PANDA_SDK_VERSION=1.5.0-dev.58082 npm run panda:sdk:reinstall
npm run compile
cd ../../..

# COMPILE THE PROJECT
cd runner
npm run compile
cd ..

# DOWNLOAD SDK
npm run download:sdk
```

## GENERATION

```bash
node runner m3 sdk-patched-arkts ./interfaces/interfaces/arkui-extra/ \
    --sdk-stage prepared \
    --arkgen-options-file ./arkgen/generation-config/config.json \
    --etsgen-options-file ./etsgen/generator-config.json \
    --arkgen-interop-types ./runner/interop-types/src/cpp/interop-types.h \
    --scraper-options-file ./runner/configs/scraper-config.json \
    --arkgen "node arkgen" --etsgen "node etsgen" \
    --output <directory-to-install-generated-files>
```

## CREATING IDLIZER BUNDLES

```bash
npm run bundle
```
The idlizer bundles will be in the `./bundled` directory


## USING BUNDLES FOR GENERATION

You'll need complete OHOS SDK repository downloaded and built.

You'll also need idlizer bundles, either created as explained above, or downloaded from somewhere *(TBD)*.

```bash
cd $OHOS/developtools/ace_ets2bundle/ets1.2
node <path-to-bundles-dir>/install.js .
export PANDA_SDK_PATH=$PWD/libarkts/sdk
npx @idlizer/runner m3 <path-to-arkts12-sdk> node_modules/@idlizer/interfaces/interfaces/arkui-extra/*.idl \
    --arkgen-options-file node_modules/@idlizer/arkgen/generation-config/config.json \
    --output <directory-to-install-generated-files> --sdk-stage prepared
```
