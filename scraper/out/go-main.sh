node ../../arkgen \
  --idl2peer \
  --arkts-extension .ets \
  --use-memo-m3 \
  --language arkts \
  --no-type-checker \
  --reference-names ../../arkgen/generation-config/references/ets-sdk.refs.json \
  --options-file main-config.json \
  --output-dir /home/huawei/Desktop/idlize/scraper/out/generated \
  --input-files $(find /home/huawei/Desktop/idlize/scraper/out/idl -type f | tr '\n' ' ')
