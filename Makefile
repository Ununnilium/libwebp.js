SHELL := /bin/bash

all: libwebp.js

libwebp.js: emsdk libwebp
	source emsdk/emsdk_env.sh && emcc -Oz --closure 1 --llvm-lto 1 -o libwebp.js --memory-init-file 0 \
		-s WASM=0 -s EXTRA_EXPORTED_RUNTIME_METHODS='["cwrap"]' -s MODULARIZE=1 -s 'EXPORT_NAME="LibWebP"' \
		-s ALLOW_MEMORY_GROWTH=1 -s ENVIRONMENT=web -s NO_FILESYSTEM=1 \
		-I libwebp \
		webp.c \
		libwebp/src/{dec,dsp,demux,enc,mux,utils}/*.c
wasm: emsdk libwebp
	source emsdk/emsdk_env.sh && emcc -Oz --closure 1 --llvm-lto 1 -o libwebp-wasm.js \
		-s WASM=1 -s EXTRA_EXPORTED_RUNTIME_METHODS='["cwrap"]' -s MODULARIZE=1 -s 'EXPORT_NAME="LibWebP"' \
		-s ALLOW_MEMORY_GROWTH=1 -s ENVIRONMENT=web -s NO_FILESYSTEM=1 \
		-I libwebp \
		webp.c \
		libwebp/src/{dec,dsp,demux,enc,mux,utils}/*.c
emsdk:
	git clone --depth 1 https://github.com/juj/emsdk.git
	cd emsdk && ./emsdk install latest && ./emsdk activate latest
libwebp:
	git clone --depth 1 https://github.com/webmproject/libwebp
clean:
	rm -rf emsdk libwebp || true
