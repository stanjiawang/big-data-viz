import '@testing-library/jest-dom';

type ResizeObserverConstructor = new () => {
  observe: () => void;
  unobserve: () => void;
  disconnect: () => void;
};

const ResizeObserverMock: ResizeObserverConstructor = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

if (!('ResizeObserver' in globalThis)) {
  Object.defineProperty(globalThis, 'ResizeObserver', {
    value: ResizeObserverMock,
    writable: true,
  });
}

if (!('TextEncoder' in globalThis)) {
  class TextEncoderMock {
    encode(text = '') {
      return new Uint8Array(Array.from(text).map((char) => char.charCodeAt(0)));
    }
  }

  Object.defineProperty(globalThis, 'TextEncoder', {
    value: TextEncoderMock,
    writable: true,
  });
}

if (!('TextDecoder' in globalThis)) {
  class TextDecoderMock {
    decode(input?: Uint8Array) {
      if (!input) return '';
      return Array.from(input)
        .map((value) => String.fromCharCode(value))
        .join('');
    }
  }

  Object.defineProperty(globalThis, 'TextDecoder', {
    value: TextDecoderMock,
    writable: true,
  });
}

if (!('Response' in globalThis)) {
  Object.defineProperty(globalThis, 'Response', {
    value: class Response {},
    writable: true,
  });
}

if (!('Request' in globalThis)) {
  Object.defineProperty(globalThis, 'Request', {
    value: class Request {},
    writable: true,
  });
}

if (!('Headers' in globalThis)) {
  Object.defineProperty(globalThis, 'Headers', {
    value: class Headers {},
    writable: true,
  });
}

if (!('fetch' in globalThis)) {
  Object.defineProperty(globalThis, 'fetch', {
    value: jest.fn(),
    writable: true,
  });
}

if (!('BroadcastChannel' in globalThis)) {
  Object.defineProperty(globalThis, 'BroadcastChannel', {
    value: class BroadcastChannel {
      name: string;

      constructor(name: string) {
        this.name = name;
      }

      postMessage() {}
      close() {}
      addEventListener() {}
      removeEventListener() {}
      dispatchEvent() {
        return false;
      }
    },
    writable: true,
  });
}

if (!('ReadableStream' in globalThis)) {
  Object.defineProperty(globalThis, 'ReadableStream', {
    value: class ReadableStream {},
    writable: true,
  });
}

if (!('WritableStream' in globalThis)) {
  Object.defineProperty(globalThis, 'WritableStream', {
    value: class WritableStream {},
    writable: true,
  });
}

if (!('TransformStream' in globalThis)) {
  Object.defineProperty(globalThis, 'TransformStream', {
    value: class TransformStream {},
    writable: true,
  });
}

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn(() => ({
    canvas: document.createElement('canvas'),
  })) as unknown as HTMLCanvasElement['getContext'],
});
