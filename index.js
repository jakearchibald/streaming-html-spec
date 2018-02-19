import { HtmlSpec } from './HtmlSpec.js';
import { iterateStream } from './iterateStream.js';

const htmlSpec = new HtmlSpec();
const specView = document.createElement('div');
specView.classList.add('spec-view');
let queue = Promise.resolve();

// Styles etc
document.body.append(htmlSpec.head);
// View of the spec
document.body.append(specView);

function handleHashChange () {
  const id = window.location.hash.slice(1);
  const selector = '#' + id;

  queue = queue.then(async () => {
    specView.innerHTML = '';
    const stream = htmlSpec.getSectionById(id);

    for await (const el of iterateStream(stream)) {
      specView.append(el);
      if (el.id === id) {
        el.scrollIntoView({block: 'start'});
      } else {
        const targetEl = el.querySelector(selector);
        if (targetEl) {
          targetEl.scrollIntoView({block: 'start'});
        }
      }
    }
  });
}

function addNext10 () {
  queue = queue.then(async () => {
    const stream = htmlSpec.advance(specView.lastElementChild);
    let i = 0;

    for await (const el of iterateStream(stream)) {
      specView.append(el);
      i++;
      if (i === 10) return;
    }
  });
}

function addPrevious10 () {
  queue = queue.then(async () => {
    let i = 0;

    for (const el of htmlSpec.reverse(specView.firstElementChild)) {
      specView.prepend(el);
      i++;
      if (i === 10) return;
    }
  });
}

if (window.location.hash) {
  handleHashChange();
} else {
  addNext10();
}

window.addEventListener('hashchange', () => handleHashChange());

document.querySelector('.next').addEventListener('click', () => addNext10());
document.querySelector('.previous').addEventListener('click', () => addPrevious10());
