SHELL := /bin/bash

all: install

libwebp-asm.js: emsdk libwebp
	cd src && source ../emsdk/emsdk_env.sh && emcc -Oz --closure 1 --llvm-lto 1 -o ../libwebp-asm.js --memory-init-file 0 \
		-s WASM=0 -s EXTRA_EXPORTED_RUNTIME_METHODS='["cwrap"]' -s MODULARIZE=1 -s 'EXPORT_NAME="LibWebP"' \
		-s ALLOW_MEMORY_GROWTH=1 -s ENVIRONMENT=web -s NO_FILESYSTEM=1 \
		-I ../libwebp \
		webp.c \
		../libwebp/src/{dec,dsp,demux,enc,mux,utils}/*.c
libwebp-wasm.js: emsdk libwebp
	cd src && source ../emsdk/emsdk_env.sh && emcc -Oz --closure 1 --llvm-lto 1 -o ../libwebp-wasm.js \
		-s WASM=1 -s EXTRA_EXPORTED_RUNTIME_METHODS='["cwrap"]' -s MODULARIZE=1 -s 'EXPORT_NAME="LibWebP"' \
		-s ALLOW_MEMORY_GROWTH=1 -s ENVIRONMENT=web -s NO_FILESYSTEM=1 \
		-I ../libwebp \
		webp.c \
		../libwebp/src/{dec,dsp,demux,enc,mux,utils}/*.c
emsdk:
	git clone --depth 1 https://github.com/juj/emsdk.git
	cd emsdk && ./emsdk install latest && ./emsdk activate latest
libwebp:
	git clone --depth 1 https://github.com/webmproject/libwebp
clean:
	rm -rf lib emsdk libwebp libwep-wasm.js libwep-wasm.wasm libwebp-asm.js node-modules webp-polyfill.js || true
node_modules:
	yarn install
webp-polyfill.js: src/webp-polyfill.ts node_modules
	node_modules/.bin/tsc src/webp-polyfill.ts --target es5 --lib es6,dom --downlevelIteration --outFile webp-polyfill.js
webp-polyfill.min.js: webp-polyfill.js node_modules
	node_modules/.bin/uglifyjs --compress --mangle -o webp-polyfill.min.js -- webp-polyfill.js
install: libwebp-asm.js libwebp-wasm.js libwebp-wasm.wasm webp-polyfill.js webp-polyfill.min.js
	mkdir lib
	mv libwebp-wasm.js libwebp-wasm.wasm libwebp-asm.js webp-polyfill.js webp-polyfill.min.js lib

