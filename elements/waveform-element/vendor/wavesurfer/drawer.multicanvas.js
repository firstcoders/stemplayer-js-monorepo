/**
 * Custom ESM build of multicanvas. Credits to katspaugh.
 *
 * Copyright (c) 2012-2023, katspaugh and contributors
 * All rights reserved.
 */
/* eslint-disable */
var P = class {
  constructor() {
    (this._disabledEventEmissions = []), (this.handlers = null);
  }
  on(t, e) {
    this.handlers || (this.handlers = {});
    let s = this.handlers[t];
    return (
      s || (s = this.handlers[t] = []),
      s.push(e),
      { name: t, callback: e, un: (i, a) => this.un(i, a) }
    );
  }
  un(t, e) {
    if (!this.handlers) return;
    let s = this.handlers[t],
      i;
    if (s)
      if (e) for (i = s.length - 1; i >= 0; i--) s[i] == e && s.splice(i, 1);
      else s.length = 0;
  }
  unAll() {
    this.handlers = null;
  }
  once(t, e) {
    let s = (...i) => {
      e.apply(this, i),
        setTimeout(() => {
          this.un(t, s);
        }, 0);
    };
    return this.on(t, s);
  }
  setDisabledEventEmissions(t) {
    this._disabledEventEmissions = t;
  }
  _isDisabledEventEmission(t) {
    return (
      this._disabledEventEmissions && this._disabledEventEmissions.includes(t)
    );
  }
  fireEvent(t, ...e) {
    if (!this.handlers || this._isDisabledEventEmission(t)) return;
    let s = this.handlers[t];
    s &&
      s.forEach(i => {
        i(...e);
      });
  }
};
var z = {
  width: 'height',
  height: 'width',
  overflowX: 'overflowY',
  overflowY: 'overflowX',
  clientWidth: 'clientHeight',
  clientHeight: 'clientWidth',
  clientX: 'clientY',
  clientY: 'clientX',
  scrollWidth: 'scrollHeight',
  scrollLeft: 'scrollTop',
  offsetLeft: 'offsetTop',
  offsetTop: 'offsetLeft',
  offsetHeight: 'offsetWidth',
  offsetWidth: 'offsetHeight',
  left: 'top',
  right: 'bottom',
  top: 'left',
  bottom: 'right',
  borderRightStyle: 'borderBottomStyle',
  borderRightWidth: 'borderBottomWidth',
  borderRightColor: 'borderBottomColor',
};
function B(r, t) {
  return Object.prototype.hasOwnProperty.call(z, r) && t ? z[r] : r;
}
var q = Symbol('isProxy');
function v(r, t) {
  return r[q]
    ? r
    : new Proxy(r, {
        get: function (e, s, i) {
          if (s === q) return !0;
          if (s === 'domElement') return e;
          if (s === 'style') return v(e.style, t);
          if (s === 'canvas') return v(e.canvas, t);
          if (s === 'getBoundingClientRect')
            return function (...a) {
              return v(e.getBoundingClientRect(...a), t);
            };
          if (s === 'getContext')
            return function (...a) {
              return v(e.getContext(...a), t);
            };
          {
            let a = e[B(s, t)];
            return typeof a == 'function' ? a.bind(e) : a;
          }
        },
        set: function (e, s, i) {
          return (e[B(s, t)] = i), !0;
        },
      });
}
function W(r, t) {
  return (
    Object.keys(t).forEach(e => {
      r.style[e] !== t[e] && (r.style[e] = t[e]);
    }),
    r
  );
}
function A(r, t, e) {
  return Math.min(Math.max(t, r), e);
}
var E = class extends P {
  constructor(t, e) {
    super(),
      (this.container = v(t, e.vertical)),
      (this.params = e),
      (this.width = 0),
      (this.height = e.height * this.params.pixelRatio),
      (this.lastPos = 0),
      (this.wrapper = null);
  }
  style(t, e) {
    return W(t, e);
  }
  createWrapper() {
    (this.wrapper = v(
      this.container.appendChild(document.createElement('wave')),
      this.params.vertical,
    )),
      this.style(this.wrapper, {
        display: 'block',
        position: 'relative',
        userSelect: 'none',
        webkitUserSelect: 'none',
        height: this.params.height + 'px',
      }),
      (this.params.fillParent || this.params.scrollParent) &&
        this.style(this.wrapper, {
          width: '100%',
          cursor: this.params.hideCursor ? 'none' : 'auto',
          overflowX: this.params.hideScrollbar ? 'hidden' : 'auto',
          overflowY: 'hidden',
        }),
      this.setupWrapperEvents();
  }
  handleEvent(t, e) {
    !e && t.preventDefault();
    let s = v(
        t.targetTouches ? t.targetTouches[0] : t,
        this.params.vertical,
      ).clientX,
      i = this.wrapper.getBoundingClientRect(),
      a = this.width,
      n = this.getWidth(),
      c = this.getProgressPixels(i, s),
      l;
    return (
      !this.params.fillParent && a < n
        ? (l = c * (this.params.pixelRatio / a) || 0)
        : (l = (c + this.wrapper.scrollLeft) / this.wrapper.scrollWidth || 0),
      A(l, 0, 1)
    );
  }
  getProgressPixels(t, e) {
    return this.params.rtl ? t.right - e : e - t.left;
  }
  setupWrapperEvents() {
    this.wrapper.addEventListener('click', t => {
      let e = v(t, this.params.vertical),
        s = this.wrapper.offsetHeight - this.wrapper.clientHeight;
      if (s !== 0) {
        let i = this.wrapper.getBoundingClientRect();
        if (e.clientY >= i.bottom - s) return;
      }
      this.params.interact && this.fireEvent('click', t, this.handleEvent(t));
    }),
      this.wrapper.addEventListener('dblclick', t => {
        this.params.interact &&
          this.fireEvent('dblclick', t, this.handleEvent(t));
      }),
      this.wrapper.addEventListener('scroll', t => this.fireEvent('scroll', t));
  }
  drawPeaks(t, e, s, i) {
    this.setWidth(e) || this.clearWave(),
      this.params.barWidth
        ? this.drawBars(t, 0, s, i)
        : this.drawWave(t, 0, s, i);
  }
  resetScroll() {
    this.wrapper !== null && (this.wrapper.scrollLeft = 0);
  }
  recenter(t) {
    let e = this.wrapper.scrollWidth * t;
    this.recenterOnPosition(e, !0);
  }
  recenterOnPosition(t, e) {
    let s = this.wrapper.scrollLeft,
      i = ~~(this.wrapper.clientWidth / 2),
      a = this.wrapper.scrollWidth - this.wrapper.clientWidth,
      n = t - i,
      c = n - s;
    if (a != 0) {
      if (!e && -i <= c && c < i) {
        let l = this.params.autoCenterRate;
        (l /= i), (l *= a), (c = Math.max(-l, Math.min(l, c))), (n = s + c);
      }
      (n = Math.max(0, Math.min(a, n))),
        n != s && (this.wrapper.scrollLeft = n);
    }
  }
  getScrollX() {
    let t = 0;
    if (this.wrapper) {
      let e = this.params.pixelRatio;
      if (
        ((t = Math.round(this.wrapper.scrollLeft * e)),
        this.params.scrollParent)
      ) {
        let s = ~~(this.wrapper.scrollWidth * e - this.getWidth());
        t = Math.min(s, Math.max(0, t));
      }
    }
    return t;
  }
  getWidth() {
    return Math.round(this.container.clientWidth * this.params.pixelRatio);
  }
  setWidth(t) {
    if (this.width == t) return !1;
    if (((this.width = t), this.params.fillParent || this.params.scrollParent))
      this.style(this.wrapper, { width: '' });
    else {
      let e = ~~(this.width / this.params.pixelRatio) + 'px';
      this.style(this.wrapper, { width: e });
    }
    return this.updateSize(), !0;
  }
  setHeight(t) {
    return t == this.height
      ? !1
      : ((this.height = t),
        this.style(this.wrapper, {
          height: ~~(this.height / this.params.pixelRatio) + 'px',
        }),
        this.updateSize(),
        !0);
  }
  progress(t) {
    let e = 1 / this.params.pixelRatio,
      s = Math.round(t * this.width) * e;
    if (s < this.lastPos || s - this.lastPos >= e) {
      if (
        ((this.lastPos = s), this.params.scrollParent && this.params.autoCenter)
      ) {
        let i = ~~(this.wrapper.scrollWidth * t);
        this.recenterOnPosition(i, this.params.autoCenterImmediately);
      }
      this.updateProgress(s);
    }
  }
  destroy() {
    this.unAll(),
      this.wrapper &&
        (this.wrapper.parentNode == this.container.domElement &&
          this.container.removeChild(this.wrapper.domElement),
        (this.wrapper = null));
  }
  updateCursor() {}
  updateSize() {}
  drawBars(t, e, s, i) {}
  drawWave(t, e, s, i) {}
  clearWave() {}
  updateProgress(t) {}
};
var _ = (
  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  ((r, t) => setTimeout(r, 1e3 / 60))
).bind(window);
function T(r) {
  return (...t) => _(() => r(...t));
}
function R(r) {
  let t = -1 / 0;
  return (
    Object.keys(r).forEach(e => {
      r[e] > t && (t = r[e]);
    }),
    t
  );
}
function I(r) {
  let t = 1 / 0;
  return (
    Object.keys(r).forEach(e => {
      r[e] < t && (t = r[e]);
    }),
    t
  );
}
function S(r) {
  let t = R(r),
    e = I(r);
  return -e > t ? -e : t;
}
function D(r) {
  return (
    r === void 0 && (r = 'wavesurfer_'),
    r + Math.random().toString(32).substring(2)
  );
}
var y = class {
  constructor() {
    (this.wave = null),
      (this.waveCtx = null),
      (this.progress = null),
      (this.progressCtx = null),
      (this.start = 0),
      (this.end = 1),
      (this.id = D(
        typeof this.constructor.name < 'u'
          ? this.constructor.name.toLowerCase() + '_'
          : 'canvasentry_',
      )),
      (this.canvasContextAttributes = {});
  }
  initWave(t) {
    (this.wave = t),
      (this.waveCtx = this.wave.getContext('2d', this.canvasContextAttributes));
  }
  initProgress(t) {
    (this.progress = t),
      (this.progressCtx = this.progress.getContext(
        '2d',
        this.canvasContextAttributes,
      ));
  }
  updateDimensions(t, e, s, i) {
    (this.start = this.wave.offsetLeft / e || 0),
      (this.end = this.start + t / e),
      (this.wave.width = s),
      (this.wave.height = i);
    let a = { width: t + 'px' };
    W(this.wave, a),
      this.hasProgressCanvas &&
        ((this.progress.width = s),
        (this.progress.height = i),
        W(this.progress, a));
  }
  clearWave() {
    this.waveCtx.clearRect(
      0,
      0,
      this.waveCtx.canvas.width,
      this.waveCtx.canvas.height,
    ),
      this.hasProgressCanvas &&
        this.progressCtx.clearRect(
          0,
          0,
          this.progressCtx.canvas.width,
          this.progressCtx.canvas.height,
        );
  }
  setFillStyles(t, e) {
    (this.waveCtx.fillStyle = this.getFillStyle(this.waveCtx, t)),
      this.hasProgressCanvas &&
        (this.progressCtx.fillStyle = this.getFillStyle(this.progressCtx, e));
  }
  getFillStyle(t, e) {
    if (typeof e == 'string' || e instanceof CanvasGradient) return e;
    let s = t.createLinearGradient(0, 0, 0, t.canvas.height);
    return e.forEach((i, a) => s.addColorStop(a / e.length, i)), s;
  }
  applyCanvasTransforms(t) {
    t &&
      (this.waveCtx.setTransform(0, 1, 1, 0, 0, 0),
      this.hasProgressCanvas &&
        this.progressCtx.setTransform(0, 1, 1, 0, 0, 0));
  }
  fillRects(t, e, s, i, a) {
    this.fillRectToContext(this.waveCtx, t, e, s, i, a),
      this.hasProgressCanvas &&
        this.fillRectToContext(this.progressCtx, t, e, s, i, a);
  }
  fillRectToContext(t, e, s, i, a, n) {
    t && (n ? this.drawRoundedRect(t, e, s, i, a, n) : t.fillRect(e, s, i, a));
  }
  drawRoundedRect(t, e, s, i, a, n) {
    a !== 0 &&
      (a < 0 && ((a *= -1), (s -= a)),
      t.beginPath(),
      t.moveTo(e + n, s),
      t.lineTo(e + i - n, s),
      t.quadraticCurveTo(e + i, s, e + i, s + n),
      t.lineTo(e + i, s + a - n),
      t.quadraticCurveTo(e + i, s + a, e + i - n, s + a),
      t.lineTo(e + n, s + a),
      t.quadraticCurveTo(e, s + a, e, s + a - n),
      t.lineTo(e, s + n),
      t.quadraticCurveTo(e, s, e + n, s),
      t.closePath(),
      t.fill());
  }
  drawLines(t, e, s, i, a, n) {
    this.drawLineToContext(this.waveCtx, t, e, s, i, a, n),
      this.hasProgressCanvas &&
        this.drawLineToContext(this.progressCtx, t, e, s, i, a, n);
  }
  drawLineToContext(t, e, s, i, a, n, c) {
    if (!t) return;
    let l = e.length / 2,
      h = Math.round(l * this.start),
      p = Math.round(l * this.end) + 1,
      f = h,
      o = p,
      m = this.wave.width / (o - f - 1),
      d = i + a,
      w = s / i;
    t.beginPath(),
      t.moveTo((f - h) * m, d),
      t.lineTo((f - h) * m, d - Math.round((e[2 * f] || 0) / w));
    let u, g, x;
    for (u = f; u < o; u++)
      (g = e[2 * u] || 0),
        (x = Math.round(g / w)),
        t.lineTo((u - h) * m + this.halfPixel, d - x);
    let C = o - 1;
    for (C; C >= f; C--)
      (g = e[2 * C + 1] || 0),
        (x = Math.round(g / w)),
        t.lineTo((C - h) * m + this.halfPixel, d - x);
    t.lineTo((f - h) * m, d - Math.round((e[2 * f + 1] || 0) / w)),
      t.closePath(),
      t.fill();
  }
  destroy() {
    (this.waveCtx = null),
      (this.wave = null),
      (this.progressCtx = null),
      (this.progress = null);
  }
  getImage(t, e, s) {
    if (s === 'blob')
      return new Promise(i => {
        this.wave.toBlob(i, t, e);
      });
    if (s === 'dataURL') return this.wave.toDataURL(t, e);
  }
};
var F = class extends E {
  constructor(t, e) {
    super(t, e),
      (this.maxCanvasWidth = e.maxCanvasWidth),
      (this.maxCanvasElementWidth = Math.round(
        e.maxCanvasWidth / e.pixelRatio,
      )),
      (this.hasProgressCanvas = e.waveColor != e.progressColor),
      (this.halfPixel = 0.5 / e.pixelRatio),
      (this.canvases = []),
      (this.progressWave = null),
      (this.EntryClass = y),
      (this.canvasContextAttributes = e.drawingContextAttributes),
      (this.overlap = 2 * Math.ceil(e.pixelRatio / 2)),
      (this.barRadius = e.barRadius || 0),
      (this.vertical = e.vertical);
  }
  init() {
    this.createWrapper(), this.createElements();
  }
  createElements() {
    (this.progressWave = v(
      this.wrapper.appendChild(document.createElement('wave')),
      this.params.vertical,
    )),
      this.style(this.progressWave, {
        position: 'absolute',
        zIndex: 3,
        left: 0,
        top: 0,
        bottom: 0,
        overflow: 'hidden',
        width: '0',
        display: 'none',
        boxSizing: 'border-box',
        borderRightStyle: 'solid',
        pointerEvents: 'none',
      }),
      this.addCanvas(),
      this.updateCursor();
  }
  updateCursor() {
    this.style(this.progressWave, {
      borderRightWidth: this.params.cursorWidth + 'px',
      borderRightColor: this.params.cursorColor,
    });
  }
  updateSize() {
    let t = Math.round(this.width / this.params.pixelRatio),
      e = Math.ceil(t / (this.maxCanvasElementWidth + this.overlap));
    for (; this.canvases.length < e; ) this.addCanvas();
    for (; this.canvases.length > e; ) this.removeCanvas();
    let s = this.maxCanvasWidth + this.overlap,
      i = this.canvases.length - 1;
    this.canvases.forEach((a, n) => {
      n == i && (s = this.width - this.maxCanvasWidth * i),
        this.updateDimensions(a, s, this.height),
        a.clearWave();
    });
  }
  addCanvas() {
    let t = new this.EntryClass();
    (t.canvasContextAttributes = this.canvasContextAttributes),
      (t.hasProgressCanvas = this.hasProgressCanvas),
      (t.halfPixel = this.halfPixel);
    let e = this.maxCanvasElementWidth * this.canvases.length,
      s = v(
        this.wrapper.appendChild(document.createElement('canvas')),
        this.params.vertical,
      );
    if (
      (this.style(s, {
        position: 'absolute',
        zIndex: 2,
        left: e + 'px',
        top: 0,
        bottom: 0,
        height: '100%',
        pointerEvents: 'none',
      }),
      t.initWave(s),
      this.hasProgressCanvas)
    ) {
      let i = v(
        this.progressWave.appendChild(document.createElement('canvas')),
        this.params.vertical,
      );
      this.style(i, {
        position: 'absolute',
        left: e + 'px',
        top: 0,
        bottom: 0,
        height: '100%',
      }),
        t.initProgress(i);
    }
    this.canvases.push(t);
  }
  removeCanvas() {
    let t = this.canvases[this.canvases.length - 1];
    t.wave.parentElement.removeChild(t.wave.domElement),
      this.hasProgressCanvas &&
        t.progress.parentElement.removeChild(t.progress.domElement),
      t && (t.destroy(), (t = null)),
      this.canvases.pop();
  }
  updateDimensions(t, e, s) {
    let i = Math.round(e / this.params.pixelRatio),
      a = Math.round(this.width / this.params.pixelRatio);
    t.updateDimensions(i, a, e, s),
      this.style(this.progressWave, { display: 'block' });
  }
  clearWave() {
    T(() => {
      this.canvases.forEach(t => t.clearWave());
    })();
  }
  drawBars(t, e, s, i) {
    return this.prepareDraw(
      t,
      e,
      s,
      i,
      ({
        absmax: a,
        hasMinVals: n,
        height: c,
        offsetY: l,
        halfH: h,
        peaks: p,
        channelIndex: f,
      }) => {
        if (s === void 0) return;
        let o = n ? 2 : 1,
          m = p.length / o,
          d = this.params.barWidth * this.params.pixelRatio,
          w =
            this.params.barGap === null
              ? Math.max(this.params.pixelRatio, ~~(d / 2))
              : Math.max(
                  this.params.pixelRatio,
                  this.params.barGap * this.params.pixelRatio,
                ),
          u = d + w,
          g = m / this.width,
          x = s,
          C = i,
          b = x;
        for (b; b < C; b += u) {
          let L = 0,
            O = Math.floor(b * g) * o,
            k = Math.floor((b + u) * g) * o;
          do {
            let H = Math.abs(p[O]);
            H > L && (L = H), (O += o);
          } while (O < k);
          let M = Math.round((L / a) * h);
          this.params.barMinHeight &&
            (M = Math.max(M, this.params.barMinHeight)),
            this.fillRect(
              b + this.halfPixel,
              h - M + l,
              d + this.halfPixel,
              M * 2,
              this.barRadius,
              f,
            );
        }
      },
    );
  }
  drawWave(t, e, s, i) {
    return this.prepareDraw(
      t,
      e,
      s,
      i,
      ({
        absmax: a,
        hasMinVals: n,
        height: c,
        offsetY: l,
        halfH: h,
        peaks: p,
        channelIndex: f,
      }) => {
        if (!n) {
          let o = [],
            m = p.length,
            d = 0;
          for (d; d < m; d++) (o[2 * d] = p[d]), (o[2 * d + 1] = -p[d]);
          p = o;
        }
        s !== void 0 && this.drawLine(p, a, h, l, s, i, f),
          this.fillRect(
            0,
            h + l - this.halfPixel,
            this.width,
            this.halfPixel,
            this.barRadius,
            f,
          );
      },
    );
  }
  drawLine(t, e, s, i, a, n, c) {
    let { waveColor: l, progressColor: h } =
      this.params.splitChannelsOptions.channelColors[c] || {};
    this.canvases.forEach((p, f) => {
      this.setFillStyles(p, l, h),
        this.applyCanvasTransforms(p, this.params.vertical),
        p.drawLines(t, e, s, i, a, n);
    });
  }
  fillRect(t, e, s, i, a, n) {
    let c = Math.floor(t / this.maxCanvasWidth),
      l = Math.min(
        Math.ceil((t + s) / this.maxCanvasWidth) + 1,
        this.canvases.length,
      ),
      h = c;
    for (h; h < l; h++) {
      let p = this.canvases[h],
        f = h * this.maxCanvasWidth,
        o = {
          x1: Math.max(t, h * this.maxCanvasWidth),
          y1: e,
          x2: Math.min(t + s, h * this.maxCanvasWidth + p.wave.width),
          y2: e + i,
        };
      if (o.x1 < o.x2) {
        let { waveColor: m, progressColor: d } =
          this.params.splitChannelsOptions.channelColors[n] || {};
        this.setFillStyles(p, m, d),
          this.applyCanvasTransforms(p, this.params.vertical),
          p.fillRects(o.x1 - f, o.y1, o.x2 - o.x1, o.y2 - o.y1, a);
      }
    }
  }
  hideChannel(t) {
    return (
      this.params.splitChannels &&
      this.params.splitChannelsOptions.filterChannels.includes(t)
    );
  }
  prepareDraw(t, e, s, i, a, n, c) {
    return T(() => {
      if (t[0] instanceof Array) {
        let m = t;
        if (this.params.splitChannels) {
          let d = m.filter((u, g) => !this.hideChannel(g));
          this.params.splitChannelsOptions.overlay ||
            this.setHeight(
              Math.max(d.length, 1) *
                this.params.height *
                this.params.pixelRatio,
            );
          let w;
          return (
            this.params.splitChannelsOptions &&
              this.params.splitChannelsOptions.relativeNormalization &&
              (w = R(m.map(u => S(u)))),
            m.forEach((u, g) =>
              this.prepareDraw(u, g, s, i, a, d.indexOf(u), w),
            )
          );
        }
        t = m[0];
      }
      if (this.hideChannel(e)) return;
      let l = 1 / this.params.barHeight;
      this.params.normalize && (l = c === void 0 ? S(t) : c);
      let h = [].some.call(t, m => m < 0),
        p = this.params.height * this.params.pixelRatio,
        f = p / 2,
        o = p * n || 0;
      return (
        this.params.splitChannelsOptions &&
          this.params.splitChannelsOptions.overlay &&
          (o = 0),
        a({
          absmax: l,
          hasMinVals: h,
          height: p,
          offsetY: o,
          halfH: f,
          peaks: t,
          channelIndex: e,
        })
      );
    })();
  }
  setFillStyles(t, e = this.params.waveColor, s = this.params.progressColor) {
    t.setFillStyles(e, s);
  }
  applyCanvasTransforms(t, e = !1) {
    t.applyCanvasTransforms(e);
  }
  getImage(t, e, s) {
    if (s === 'blob')
      return Promise.all(this.canvases.map(i => i.getImage(t, e, s)));
    if (s === 'dataURL') {
      let i = this.canvases.map(a => a.getImage(t, e, s));
      return i.length > 1 ? i : i[0];
    }
  }
  updateProgress(t) {
    this.style(this.progressWave, { width: t + 'px' });
  }
};
export { F as default };
