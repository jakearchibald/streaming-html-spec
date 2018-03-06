import { iterateStream } from './iterateStream.js';

export function filterStream (callback) {
  return new TransformStream({
    transform (chunk, controller) {
      if (callback(chunk)) {
        controller.enqueue(chunk);
      }
    }
  });
}

export function mapStream (callback) {
  return new TransformStream({
    transform (chunk, controller) {
      controller.enqueue(callback(chunk));
    }
  });
}

export async function allStream(stream) {
  const all = [];

  for await (const chunk of iterateStream(stream)) {
    all.push(chunk);
  }

  return all;
}
