#include <stdlib.h>
#include "emscripten.h"
#include "src/webp/encode.h"
#include "src/webp/decode.h"

int result[2];
EMSCRIPTEN_KEEPALIVE
void encode(uint8_t* img_in, int width, int height, float quality) {
  uint8_t* img_out;
  size_t size;

  size = WebPEncodeRGBA(img_in, width, height, width * 4, quality, &img_out);

  result[0] = (int)img_out;
  result[1] = size;
}
EMSCRIPTEN_KEEPALIVE
void decode(uint8_t* input_data, size_t input_size, uint8_t* output_buffer, size_t output_buffer_size, size_t output_stride) {
  WebPDecodeRGBAInto(input_data, input_size, output_buffer, output_buffer_size, output_stride);
}

EMSCRIPTEN_KEEPALIVE
void free_result(uint8_t* result) {
  WebPFree(result);
}

EMSCRIPTEN_KEEPALIVE
int get_result_pointer() {
  return result[0];
}

EMSCRIPTEN_KEEPALIVE
int get_result_size() {
  return result[1];
}

EMSCRIPTEN_KEEPALIVE
uint8_t* create_buffer(int width, int height) {
  return malloc(width * height * 4 * sizeof(uint8_t));
}

EMSCRIPTEN_KEEPALIVE
void destroy_buffer(uint8_t* p) {
  free(p);
}
