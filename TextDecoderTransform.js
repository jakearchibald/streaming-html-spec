export class TextDecoderTransform extends TransformStream {
  constructor () {
    const decoder = new TextDecoder();
    super({
      transform (chunk, controller) {
        controller.enqueue(decoder.decode(chunk, { stream: true }));
      }
    });
  }
}
