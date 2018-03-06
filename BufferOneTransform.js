export class BufferOneTransform extends TransformStream {
  constructor () {
    let receivedItem = false;
    let lastItem;

    super({
      transform (item, controller) {
        if (receivedItem) {
          controller.enqueue(lastItem);
        }
        lastItem = item;
        receivedItem = true;
      },
      flush (controller) {
        controller.enqueue(lastItem);
      }
    });
  }
}
