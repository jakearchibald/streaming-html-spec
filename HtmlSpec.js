import { TextDecoderTransform } from './TextDecoderTransform.js';
import { ParseTransform } from './ParseTransform.js';
import { filterStream } from './streamUtils.js';

const SPEC_URL = 'https://html.spec.whatwg.org/';
const HEADING_RE = /H\d/;

export class HtmlSpec {
  constructor () {
    this._head = document.createElement('div');
    this._elements = [];
    const {readable, writable} = new TransformStream();
    this._stream = readable
      .pipeThrough(new TextDecoderTransform())
      .pipeThrough(new ParseTransform())
      .pipeThrough(this._filterElements());

    fetch(SPEC_URL).then(response => {
      response.body.pipeTo(writable);
    }).catch(err => {
      writable.getWriter().abort(err);
    });
  }
  /**
   * Non-content elements from the spec, such as meta & style.
   */
  get head () {
    return this._head;
  }
  // Tee the original stream, leaving one for next time
  // and returning the other.
  _freshStream () {
    const [one, two] = this._stream.tee();
    this._stream = one;
    return two;
  }
  _filterElements () {
    return filterStream(node => {
      // Skip non-element nodes. Don't care.
      if (node.nodeType !== 1) return false;

      // Add head-style stuff to special element
      if (node.matches('link, title, meta, style')) {
        this._head.append(node);
        return false;
      }

      this._elements.push(node);
      return true;
    });
  }
  /**
   * An iterator of top-level spec elements, start from a given element and moving backwards.
   *
   * @param {Element} from
   */
  * reverse (from) {
    if (!from) throw Error('Must define starting point');
    let index = this._elements.indexOf(from);
    if (index === -1) throw Error('Element not found');

    while (index--) {
      yield this._elements[index];
    }
  }
  /**
   * Give you a stream of top-level elements, optionally starting from a given element.
   *
   * @param {Element} from
   */
  advance (from = undefined) {
    let queueEls = !from;

    return this._freshStream().pipeThrough(filterStream(el => {
      if (queueEls) return true;
      queueEls = (el === from);
    }));
  }
  /**
   * This one's a bit magic.
   *
   * It searches the spec for an element with the given ID, then gives you
   * a stream of elements representing the section that element is in.
   *
   * A section is a heading that's the direct child of <body>, followed by
   * elements until a heading of equal or lower value is encountered.
   *
   * @param {string} id ID of an element in the HTML spec.
   */
  getSectionById (id) {
    let addUntilHeadingLevel = 0;
    const selector = '#' + id;

    return this._freshStream().pipeThrough(new TransformStream({
      transform: (el, controller) => {
        if (addUntilHeadingLevel) { // Output the rest of the section
          // Add elements until we find an item of heading level addUntilHeadingLevel or less
          if (HEADING_RE.test(el.tagName) && Number(el.tagName.slice(1)) <= addUntilHeadingLevel) {
            controller.terminate();
          } else {
            controller.enqueue(el);
          }
        } else if (el.id === id || el.querySelector(selector)) {
          const elsToAdd = [el];

          if (HEADING_RE.test(el.tagName)) { // Start of a section?
            addUntilHeadingLevel = Number(el.tagName.slice(1));
          } else { // Try to find the start of the section.
            for (const previousEl of this.reverse(el)) {
              elsToAdd.unshift(previousEl);
              if (HEADING_RE.test(previousEl.tagName)) {
                addUntilHeadingLevel = Number(previousEl.tagName.slice(1));
                break;
              }
            }
          }

          // Stream elements
          for (const elToAdd of elsToAdd) {
            controller.enqueue(elToAdd);
          }
        }
      }
    }));
  }
}
