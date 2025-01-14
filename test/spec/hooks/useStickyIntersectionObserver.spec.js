import { useStickyIntersectionObserver } from 'src/hooks';

import { renderHook } from '@testing-library/preact-hooks';


describe('hooks/userStickyIntersectionObserver', function() {

  const OriginalIntersectionObserver = global.IntersectionObserver;

  afterEach(function() {
    global.IntersectionObserver = OriginalIntersectionObserver;
  });


  it('should observe', async function() {

    // given
    const observeSpy = sinon.spy();

    mockIntersectionObserver({ observe: observeSpy });

    const domObject = <div></div>;

    // when
    const ref = { current: domObject };

    await renderHook(() => {
      useStickyIntersectionObserver(ref, 'div', () => {});

      return domObject;
    });

    // then
    expect(observeSpy).to.have.been.calledOnce;
  });


  it('should call for each entry', async function() {

    // given
    const callbackSpy = sinon.spy();

    const triggerCallback = mockIntersectionObserver({});

    const domObject = <div></div>;

    // when
    const ref = { current: domObject };

    await renderHook(() => {
      useStickyIntersectionObserver(ref, 'div', callbackSpy);

      return domObject;
    });

    triggerCallback([
      { intersectionRatio: 0 },
      { intersectionRatio: 1 }
    ]);

    // then
    expect(callbackSpy).to.have.been.calledTwice;
    expect(callbackSpy.firstCall).to.have.been.calledWith(true);
    expect(callbackSpy.secondCall).to.have.been.calledWith(false);
  });


  it('should not observe if DOM not ready', async function() {

    // given
    const observeSpy = sinon.spy();

    mockIntersectionObserver({ observe: observeSpy });

    // when
    const ref = { current: undefined };

    await renderHook(() => {
      useStickyIntersectionObserver(ref, 'div', () => {});

      return undefined;
    });

    // then
    expect(observeSpy).to.not.have.been.called;
  });


  it('should unobserve after unmount', async function() {

    // given
    const unobserveSpy = sinon.spy();

    mockIntersectionObserver({ unobserve: unobserveSpy });

    const domObject = <div></div>;

    const ref = { current: domObject };

    const { unmount } = await renderHook(() => {
      useStickyIntersectionObserver(ref, 'div', () => {});

      return domObject;
    });

    // when
    unmount();

    // then
    expect(unobserveSpy).to.have.been.calledOnce;
  });


  it('should NOT crash when IntersectionObserver is not available', async function() {

    // given
    global.IntersectionObserver = null;

    const domObject = <div></div>;

    const ref = { current: domObject };

    // when
    try {
      await renderHook(() => {
        useStickyIntersectionObserver(ref, 'div', () => {});

        return domObject;
      });
    } catch (error) {

      // then
      expect(error).not.to.exist;
    }
  });
});


// helpers ////////////////////

function noop() {}

/**
 * Overrides the IntersectionObserver global with a mock.
 *
 * @param {Object} props
 * @param {Object} [props.observe]
 * @param {Object} [props.unobserve]
 * @returns {Function} triggers the callback on all created observers
 */
function mockIntersectionObserver(props) {
  const {
    observe = noop,
    unobserve = noop
  } = props;

  const callbacks = [];

  function triggerCallbacks(args) {
    callbacks.forEach(callback => callback(args));
  }

  class MockObserver {
    constructor(callback) {
      callbacks.push(callback);
    }

    observe() {
      return observe();
    }

    unobserve() {
      return unobserve();
    }

  }

  global.IntersectionObserver = MockObserver;

  return triggerCallbacks;
}