export function filterStream (callback) {
  return new TransformStream({
    transform (chunk, controller) {
      if (callback(chunk)) {
        controller.enqueue(chunk);
      }
    }
  });
}
