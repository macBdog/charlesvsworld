// terminal.js — Character-by-character text rendering engine
const Terminal = (() => {
  const el = document.getElementById('terminal');
  const cursorEl = document.getElementById('cursor');
  let abortController = null;

  // Box-drawing + block-element range: U+2500–U+259F
  const _BOX_RE = /[\u2500-\u259F]/;

  // Append a single segment to `parent`, wrapping box-drawing chars in .bc spans
  // so VT323's wider glyphs are constrained to exactly 1ch.
  function appendSeg(seg, parent) {
    const text = seg.text;
    const cls  = seg.color ? 'fg-' + seg.color : null;
    if (!_BOX_RE.test(text)) {
      if (cls) {
        const sp = document.createElement('span');
        sp.className = cls;
        sp.textContent = text;
        parent.appendChild(sp);
      } else {
        parent.appendChild(document.createTextNode(text));
      }
      return;
    }
    // Mixed string: split into runs of box vs normal chars
    let run = '', runIsBox = null;
    function flush() {
      if (!run) return;
      if (runIsBox) {
        for (const ch of run) {
          const sp = document.createElement('span');
          sp.className = cls ? cls + ' bc' : 'bc';
          sp.textContent = ch;
          parent.appendChild(sp);
        }
      } else {
        if (cls) {
          const sp = document.createElement('span');
          sp.className = cls;
          sp.textContent = run;
          parent.appendChild(sp);
        } else {
          parent.appendChild(document.createTextNode(run));
        }
      }
      run = '';
    }
    for (const ch of text) {
      const isBox = _BOX_RE.test(ch);
      if (runIsBox !== null && isBox !== runIsBox) flush();
      run += ch;
      runIsBox = isBox;
    }
    flush();
  }

  function clear() {
    cancelAnyTyping();
    hideCursor();
    el.innerHTML = '';
    updateCursorPosition();
  }

  function cancelAnyTyping() {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  }

  // Write colored text instantly (no animation)
  // segments: array of { text, color } or just a plain string
  function writeLine(segments, addNewline = true) {
    if (typeof segments === 'string') {
      segments = [{ text: segments }];
    }
    for (const seg of segments) {
      appendSeg(seg, el);
    }
    if (addNewline) {
      el.appendChild(document.createTextNode('\n'));
    }
    scrollToBottom();
    updateCursorPosition();
  }

  function write(text) {
    el.appendChild(document.createTextNode(text));
    scrollToBottom();
    updateCursorPosition();
  }

  // Render an image inline in the terminal, constrained to box width
  function writeImage(src, alt, maxWidthCh) {
    const wrapper = document.createElement('div');
    wrapper.className = 'term-img-wrapper';

    const img = document.createElement('img');
    img.src = src;
    img.alt = alt || '';
    img.className = 'term-img';
    // Constrain to roughly maxWidthCh character widths (1ch ≈ 9.6px at our font size)
    const maxPx = (maxWidthCh || 76) * 19.2;
    img.style.maxWidth = maxPx + 'px';
    img.style.maxHeight = '800px';
    img.onload = () => { scrollToBottom(); updateCursorPosition(); };

    wrapper.appendChild(img);
    el.appendChild(wrapper);
    el.appendChild(document.createTextNode('\n'));
    scrollToBottom();
    updateCursorPosition();
  }

  // Type text character by character, returns a promise
  // segments: string or array of { text, color }
  function typeText(segments, speed = 30) {
    if (typeof segments === 'string') {
      segments = [{ text: segments }];
    }
    cancelAnyTyping();
    abortController = new AbortController();
    const signal = abortController.signal;

    return new Promise((resolve) => {
      let segIdx = 0;
      let charIdx = 0;
      let currentSpan = null;

      function createSpanForSegment(seg) {
        if (seg.color) {
          const span = document.createElement('span');
          span.className = 'fg-' + seg.color;
          el.appendChild(span);
          return span;
        }
        return null;
      }

      function tick() {
        if (signal.aborted) { resolve(); return; }
        if (segIdx >= segments.length) {
          abortController = null;
          resolve();
          return;
        }
        const seg = segments[segIdx];
        if (charIdx === 0) {
          currentSpan = createSpanForSegment(seg);
        }
        const ch = seg.text[charIdx];
        if (currentSpan) {
          currentSpan.textContent += ch;
        } else {
          el.appendChild(document.createTextNode(ch));
        }
        charIdx++;
        if (charIdx >= seg.text.length) {
          segIdx++;
          charIdx = 0;
          currentSpan = null;
        }
        scrollToBottom();
        updateCursorPosition();
        setTimeout(tick, speed);
      }
      tick();
    });
  }

  // Type a full line then add newline
  function typeLine(segments, speed = 30) {
    return typeText(segments, speed).then(() => {
      el.appendChild(document.createTextNode('\n'));
      scrollToBottom();
      updateCursorPosition();
    });
  }

  function scrollToBottom() {
    const screen = document.getElementById('screen');
    screen.scrollTop = screen.scrollHeight;
  }

  function updateCursorPosition() {
    // Position cursor right after the last text content
    const rect = el.getBoundingClientRect();
    const screenRect = document.getElementById('screen').getBoundingClientRect();

    // Get the range at end of content
    const range = document.createRange();
    if (el.childNodes.length > 0) {
      const lastNode = el.childNodes[el.childNodes.length - 1];
      if (lastNode.nodeType === Node.TEXT_NODE) {
        range.setStart(lastNode, lastNode.textContent.length);
      } else if (lastNode.childNodes.length > 0) {
        const inner = lastNode.childNodes[lastNode.childNodes.length - 1];
        range.setStart(inner, inner.textContent.length);
      } else {
        range.setStartAfter(lastNode);
      }
      range.collapse(true);
      const rangeRect = range.getBoundingClientRect();
      cursorEl.style.left = (rangeRect.left - screenRect.left) + 'px';
      cursorEl.style.top = (rangeRect.top - screenRect.top) + 'px';
    } else {
      cursorEl.style.left = '1ch';
      cursorEl.style.top = '1em';
    }
  }

  function showCursor() { cursorEl.classList.remove('hidden'); cursorEl.classList.add('blink'); }
  function hideCursor() { cursorEl.classList.add('hidden'); cursorEl.classList.remove('blink'); }

  function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // Wait for any key press, returns a promise
  function waitForKey() {
    showCursor();
    return new Promise((resolve) => {
      function handler(e) {
        document.removeEventListener('keydown', handler);
        document.removeEventListener('click', clickHandler);
        resolve(e.key);
      }
      function clickHandler() {
        document.removeEventListener('keydown', handler);
        document.removeEventListener('click', clickHandler);
        resolve('click');
      }
      document.addEventListener('keydown', handler);
      document.addEventListener('click', clickHandler);
    });
  }

  // Render a clickable row: wraps segments in a <span class="menu-item"> with an onClick handler.
  // Pass the centering PAD as the first segment to keep it inside the clickable area.
  function writeClickLine(segments, onClick) {
    if (typeof segments === 'string') {
      segments = [{ text: segments }];
    }
    const wrapper = document.createElement('span');
    wrapper.className = 'menu-item';
    wrapper.addEventListener('click', function(e) { e.stopPropagation(); onClick(); });
    for (const seg of segments) {
      appendSeg(seg, wrapper);
    }
    el.appendChild(wrapper);
    el.appendChild(document.createTextNode('\n'));
    scrollToBottom();
    updateCursorPosition();
  }

  return {
    clear,
    write,
    writeLine,
    writeClickLine,
    writeImage,
    typeText,
    typeLine,
    delay,
    showCursor,
    hideCursor,
    waitForKey,
    cancelAnyTyping,
    get element() { return el; }
  };
})();
