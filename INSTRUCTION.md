# How to regenerate

## SETUP

```bash
# BASICS
git submodule update --init
npm i
cd external
npm i
cd ..

# PREPARE LIBARKTS
cd external/ui2abc/libarkts
npm run reinstall:regenerate
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
cd runner
node . m3 ../sdk-patched-arkts <directory-to-install-generated-files>
```

