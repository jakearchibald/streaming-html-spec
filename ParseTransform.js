export class ParseTransform extends TransformStream {
  constructor () {
    let controller;
    // Create iframe for piping the response
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.append(iframe);

    // Give the iframe a body
    iframe.contentDocument.write('<!DOCTYPE html><body>');

    function queueChildNodes () {
      for (let node of [...iframe.contentDocument.body.childNodes]) {
        node.remove();
        controller.enqueue(node);
      }
    }

    const observer = new MutationObserver(() => queueChildNodes());

    observer.observe(iframe.contentDocument.body, {
      childList: true
    });

    super({
      start (c) {
        controller = c;
      },
      transform (chunk) {
        iframe.contentDocument.write(chunk);
      },
      flush () {
        queueChildNodes();
        iframe.contentDocument.close();
      }
    });
  }
}
