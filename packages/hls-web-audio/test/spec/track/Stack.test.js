import { expect } from '@bundled-es-modules/chai';
import sinon from 'sinon';
import Stack from '../../../src/track/Stack.js';

let stack;

describe('stack', () => {
  beforeEach(() => {
    stack = new Stack();
    stack.push(
      { duration: 1.1, end: 1.1 },
      { duration: 2.2, end: 3.3 },
      { duration: 3.3, end: 6.6 },
    );
  });

  describe('#destroy', () => {
    beforeEach(() => {
      stack = new Stack();
    });

    it('destroys all elements', () => {
      const fakeElement = { destroy: sinon.spy() };
      stack.push(fakeElement);
      stack.destroy();

      expect(fakeElement.destroy.calledOnce);
    });
  });

  describe('#push', () => {
    it('adds elements to the stack', () => {
      expect(stack.length === 3);
    });

    it('sets the correct start time', () => {
      expect(stack.elements[0].start).equal(0);
      expect(stack.elements[1].start).equal(1.1);
      expect(Math.round(stack.elements[2].start * 10) / 10).equal(3.3);
    });
  });

  describe('#ack()', () => {
    beforeEach(() => {
      stack.currentTime = 0;
    });

    it('marks the element as not in transit so that it could be re-delivered on a next call to #consume', () => {
      const element = stack.elements[0];
      element.$inTransit = true;

      expect(element.$inTransit);

      stack.ack(element);

      expect(element.$inTransit).equal(false);
    });
  });

  describe('#duration', () => {
    it('returns the total duration of all elements combined', () => {
      expect(stack.duration).equal(6.6);
    });
  });

  // describe('#current and next', () => {
  //   beforeEach(() => {
  //     stack.currentTime = 2;
  //   });

  //   it('returns the current element given #currentTime', () => {
  //     const { current } = stack;
  //     expect(current.start).equal(1.1);
  //   });

  //   it('returns the next element given #currentTime', () => {
  //     const { next } = stack;
  //     expect(Math.round(next.start * 10) / 10).equal(3.3);
  //   });
  // });

  describe('#disconnectAll()', () => {
    beforeEach(() => {
      stack.elements[0].cancel = sinon.spy();
      stack.elements[1].cancel = sinon.spy();
      stack.elements[2].cancel = sinon.spy();
      stack.elements[0].disconnect = sinon.spy();
      stack.elements[1].disconnect = sinon.spy();
      stack.elements[2].disconnect = sinon.spy();
    });

    it('cancels any elements that are loading', () => {
      stack.disconnectAll();

      expect(stack.elements[0].cancel.calledOnce);
      expect(stack.elements[1].cancel.calledOnce);
      expect(stack.elements[2].cancel.calledOnce);
    });

    it('disconnects any elements that are ready', () => {
      stack.elements[0].isReady = true;
      stack.elements[1].isReady = false;
      stack.elements[2].isReady = true;

      stack.disconnectAll();

      expect(stack.elements[0].disconnect.calledOnce);
      expect(!stack.elements[1].disconnect.calledOnce);
      expect(stack.elements[2].disconnect.calledOnce);
    });

    it('acks any elements that are in transit', () => {
      stack.elements[0].$inTransit = true;

      stack.disconnectAll();

      expect(stack.elements[0].$inTransit === false);
    });

    it('preserves loading elements if they are close to the target timeframe', () => {
      stack.elements[0].start = 10;
      stack.elements[0].$inTransit = true;

      const timeframe = { currentTime: 12 }; // within 15 seconds
      stack.disconnectAll(timeframe);

      expect(stack.elements[0].cancel.called).to.be.false;
      expect(stack.elements[0].$inTransit).to.be.true; // did not ack
    });

    it('cancels loading elements if they are far from the target timeframe', () => {
      stack.elements[0].start = 10;
      stack.elements[0].$inTransit = true;

      const timeframe = { currentTime: 30 }; // further than 15 seconds
      stack.disconnectAll(timeframe);

      expect(stack.elements[0].cancel.calledOnce).to.be.true;
      expect(stack.elements[0].$inTransit).to.be.false; // acked
    });
  });

  describe('#length', () => {
    it('returns the number of elements on the stack', () => {
      expect(stack.length).equal(3);
    });
  });

  describe('#getAt()', () => {
    it('returns element at a time t', () => {
      expect(stack.getAt(1.0)).equal(stack.elements[0]);
      expect(stack.getAt(2.3)).equal(stack.elements[1]);
      expect(stack.getAt(4.5)).equal(stack.elements[2]);
      expect(stack.getAt(9.9));
    });
  });

  describe('#getIndexAt()', () => {
    it('returns the index of the element at a time t', () => {
      expect(stack.getIndexAt(1.0)).equal(0);
      expect(stack.getIndexAt(2.3)).equal(1);
      expect(stack.getIndexAt(4.5)).equal(2);
      expect(stack.getIndexAt(9.9)).equal(-1);
      expect(stack.getIndexAt(-100)).equal(-1);
    });
  });
});
