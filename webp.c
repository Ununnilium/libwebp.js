#include <stdlib.h>
#include "emscripten.h"
#include "src/webp/encode.h"
#include "src/webp/decode.h"

EMSCRIPTEN_KEEPALIVE
uint32_t *encode(uint8_t *img_in, int width, int height, float quality)
{
  uint32_t *result = malloc(sizeof(uint32_t) * 2);
  uint8_t *img_out;

  result[1] = WebPEncodeRGBA(img_in, width, height, width * 4, quality, &img_out);
  result[0] = (uint32_t)img_out;
  return result;
}

EMSCRIPTEN_KEEPALIVE
int get_image_size(const uint8_t *img_in, size_t buffer_size, int *dimensions)
{
  return WebPGetInfo(img_in, buffer_size, dimensions, dimensions + 1);
}

EMSCRIPTEN_KEEPALIVE
void decode(uint8_t *input_data, size_t input_size, uint8_t *output_buffer, size_t output_buffer_size, size_t output_stride)
{
  WebPDecodeRGBAInto(input_data, input_size, output_buffer, output_buffer_size, output_stride);
}

EMSCRIPTEN_KEEPALIVE
void free_result(uint8_t *result)
{
  WebPFree(result);
}

int main()
{
  EM_ASM(webpLoaded());
}
