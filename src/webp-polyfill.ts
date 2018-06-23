declare const LibWebP: any;
declare const WebAssembly: any;

async function main() {
    let libwebpApi;

    function webpSupported() {
        return document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    function blobToTypedArray(blob: Blob): Promise<Uint8Array> {
        return new Promise<Uint8Array>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                resolve(new Uint8Array(reader.result));
            };
            reader.readAsArrayBuffer(blob);
        });
    };

    function uint8ArrayToBase64(bytes: Uint8Array): string {
        let binary = '';
        const len = bytes.byteLength;
        for (const byte of bytes) {
            binary += String.fromCharCode(byte);
        }
        return "data:image/webp;base64," + window.btoa(binary);
    }

    const decodeWebP = async (img: HTMLImageElement) => {
        const imgBlob = await (await fetch(img.src)).blob();
        const inputImg = await blobToTypedArray(imgBlob);
        const inputSize = inputImg.length * inputImg.BYTES_PER_ELEMENT;
        const inputPointer = libwebpApi.malloc(inputSize);
        libwebpApi.heapu8.set(inputImg, inputPointer);

        const dimensionsSize = 2 * Int32Array.BYTES_PER_ELEMENT;
        const dimensionsPointer = libwebpApi.malloc(dimensionsSize);
        if (libwebpApi.get_image_size(inputPointer, inputSize, dimensionsPointer) === 0) {
            throw new Error("Could not get image dimensions")
        }
        const dimensions = new Int32Array(libwebpApi.heap32.buffer, dimensionsPointer, dimensionsSize);
        const width = dimensions[0];
        const height = dimensions[1];
        libwebpApi.free(dimensionsPointer);

        const outputSize = 4 * width * height * Uint8ClampedArray.BYTES_PER_ELEMENT;
        const outputPointer = libwebpApi.malloc(outputSize);
        const outputHeap = new Uint8ClampedArray(libwebpApi.heapu8.buffer, outputPointer, outputSize);
        const outputStride = outputSize / height;

        libwebpApi.decode(inputPointer, inputSize, outputPointer, outputSize,
            outputStride);

        libwebpApi.free(inputPointer);
        const imageData = new ImageData(outputHeap, width, height);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.putImageData(imageData, 0, 0);
        libwebpApi.free(outputPointer);
        return canvas.toDataURL();
    };

    async function polyfillDecode(): Promise<void> {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                Array.prototype.slice.call(mutation.addedNodes, 0).filter(node => node.nodeType === 1 && node.tagName ===
                    'IMG').forEach(async (img) => {
                        img.src = await decodeWebP(img);
                    });
            }
        });
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    function webpLoaded() {
        LibWebP({
            ENVIRONMENT: "WEB"
        }).then((Module) => {
            libwebpApi = {
                create_buffer: Module.cwrap('create_buffer', 'number', ['number', 'number']),
                destroy_buffer: Module.cwrap('destroy_buffer', '', ['number']),
                free_result: Module.cwrap('free_result', '', ['number']),
                encode: Module.cwrap('encode', '', ['number', 'number', 'number', 'number']),
                get_result_pointer: Module.cwrap('get_result_pointer', 'number', []),
                get_result_size: Module.cwrap('get_result_size', 'number', []),
                decode: Module.cwrap('decode', '', ['number', 'number', 'number', 'number', 'number']),
                get_image_size: Module.cwrap('get_image_size', 'number', ['number', 'number', 'number']),
                malloc: Module._malloc,
                heapu8: Module.HEAPU8,
                heap32: Module.HEAP32,
                free: Module._free
            };
            const event = new Event('webpLoaded');
            const element = document.createElement('span');
            element.dispatchEvent(event);
        });
    }

    function fetchWebpPolyfill(): Promise<any> {
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.onload = resolve;
            script.onerror = reject;
            script.async = true;
            if (typeof WebAssembly === 'object') {
                script.src = "/static/libwebp-wasm.js";
            } else {
                script.src = "/static/libwebp-asm.js";
            }
            document.head.appendChild(script);
        });
    }

    function encodeWebp(image: ImageData, quality): string {
        const internalQuality = Math.round(quality * 100);
        const inputSize = 4 * image.width * image.height * Uint8ClampedArray.BYTES_PER_ELEMENT;
        const inputPointer = libwebpApi.malloc(inputSize);
        libwebpApi.heapu8.set(image.data, inputPointer);
        const resultPointer = libwebpApi.encode(inputPointer, image.width, image.height, internalQuality);
        const [
            outputPointer,
            outputSize
        ] = new Uint32Array(libwebpApi.heap32.buffer, resultPointer, 2);
        const resultView = new Uint8Array(libwebpApi.heapu8.buffer, outputPointer, outputSize);
        const result = new Uint8Array(resultView);
        libwebpApi.free_result(outputPointer);
        libwebpApi.free(resultPointer);
        return uint8ArrayToBase64(result);
    };

    function polyfillCanvasToDataURL() {
        const originalFunction = HTMLCanvasElement.prototype.toDataURL;
        () => {
            HTMLCanvasElement.prototype.toDataURL = (type?: string, ...args: any[]): string => {
                if (type === "image/webp") {
                    const ctx = this.getContext('2d');
                    let quality = Number(args[0]);
                    if (isNaN(quality) || quality < 0 || quality > 1) {
                        quality = 0.92;
                    }
                    const imageData = ctx.getImageData(0, 0, this.width, this.height);
                    return encodeWebp(imageData, quality);
                }
                originalFunction(type, ...args);
            }
        }

    }

    if (!webpSupported) {
        await fetchWebpPolyfill();
        LibWebP({
            ENVIRONMENT: "WEB"
        }).then((Module) => {
            libwebpApi = {
                create_buffer: Module.cwrap('create_buffer', 'number', ['number', 'number']),
                destroy_buffer: Module.cwrap('destroy_buffer', '', ['number']),
                free_result: Module.cwrap('free_result', '', ['number']),
                encode: Module.cwrap('encode', '', ['number', 'number', 'number', 'number']),
                get_result_pointer: Module.cwrap('get_result_pointer', 'number', []),
                get_result_size: Module.cwrap('get_result_size', 'number', []),
                decode: Module.cwrap('decode', '', ['number', 'number', 'number', 'number', 'number']),
                get_image_size: Module.cwrap('get_image_size', 'number', ['number', 'number', 'number']),
                malloc: Module._malloc,
                heapu8: Module.HEAPU8,
                heap32: Module.HEAP32,
                free: Module._free
            };
            polyfillDecode();
            polyfillCanvasToDataURL();
        });
    }
}