import { LitElement, html, css } from 'lit';

/**
 * A tyled range slider
 *
 * @cssprop [--fc-range-border-color="#01a4b3"]
 * @cssprop [--fc-range-focus-background-color="rgb(1, 164, 179)"]
 */
export class FcRange extends LitElement {
  static get styles() {
    return [
      css`
        [type='range'] {
          -webkit-appearance: none;
          background: transparent;
          margin: 0.688rem 0;
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0.313rem;
          display: block;
          min-width: 0;
          padding: 0;
        }
        [type='range']::-moz-focus-outer {
          border: 0;
        }
        [type='range']:focus {
          outline: 0;
        }
        [type='range']:focus::-webkit-slider-runnable-track {
          background: #8d8d8d;
        }
        [type='range']:focus::-ms-fill-lower {
          background: grey;
        }
        [type='range']:focus::-ms-fill-upper {
          background: #8d8d8d;
        }
        [type='range']::-webkit-slider-runnable-track {
          cursor: default;
          height: 0.188rem;
          transition: all 0.2s ease;
          width: 100%;
          box-shadow:
            0rem 0rem 0rem rgba(0, 0, 0, 0.2),
            0 0 0rem rgba(13, 13, 13, 0.2);
          background: grey;
          border: 0rem solid #cfd8dc;
          border-radius: 5px;
        }
        [type='range']::-webkit-slider-thumb {
          box-shadow:
            0.188rem 0.188rem 0.188rem rgba(0, 0, 0, 0.2),
            0 0 0.188rem rgba(13, 13, 13, 0.2);
          background: #ddd;
          border: 0.125rem solid #aaa;
          border-radius: 18px;
          box-sizing: border-box;
          cursor: default;
          height: 1.375rem;
          width: 0.438rem;
          transition:
            background-color 0.2s,
            border-color 0.2s;
          -webkit-appearance: none;
          margin-top: -0.594rem;
        }
        [type='range']::-webkit-slider-thumb:hover {
          background-color: #fff;
          border-color: var(--fc-range-border-color, #01a4b3);
        }
        [type='range']::-moz-range-track {
          box-shadow:
            0rem 0rem 0rem rgba(0, 0, 0, 0.2),
            0 0 0rem rgba(13, 13, 13, 0.2);
          cursor: default;
          height: 0.188rem;
          transition: all 0.2s ease;
          width: 100%;
          background: grey;
          border: 0rem solid #cfd8dc;
          border-radius: 5px;
          height: 0.094rem;
        }
        [type='range']::-moz-range-thumb {
          box-shadow:
            0.188rem 0.188rem 0.188rem rgba(0, 0, 0, 0.2),
            0 0 0.188rem rgba(13, 13, 13, 0.2);
          background: #ddd;
          border: 0.125rem solid #aaa;
          border-radius: 18px;
          box-sizing: border-box;
          cursor: default;
          height: 1.375rem;
          width: 0.438rem;
          transition:
            background-color 0.2s,
            border-color 0.2s;
        }
        [type='range']::-moz-range-thumb:hover {
          background-color: #fff;
          border-color: var(--fc-range-border-color, #01a4b3);
        }
        [type='range']::-ms-track {
          cursor: default;
          height: 0.188rem;
          transition: all 0.2s ease;
          width: 100%;
          background: transparent;
          border-color: transparent;
          border-width: 0.688rem 0;
          color: transparent;
        }
        [type='range']::-ms-fill-lower {
          box-shadow:
            0rem 0rem 0rem rgba(0, 0, 0, 0.2),
            0 0 0rem rgba(13, 13, 13, 0.2);
          background: #737373;
          border: 0rem solid #cfd8dc;
          border-radius: 10rem;
        }
        [type='range']::-ms-fill-upper {
          box-shadow:
            0rem 0rem 0rem rgba(0, 0, 0, 0.2),
            0 0 0rem rgba(13, 13, 13, 0.2);
          background: grey;
          border: 0rem solid #cfd8dc;
          border-radius: 10rem;
        }
        [type='range']::-ms-thumb {
          box-shadow:
            0.188rem 0.188rem 0.188rem rgba(0, 0, 0, 0.2),
            0 0 0.188rem rgba(13, 13, 13, 0.2);
          background: #ddd;
          border: 0.125rem solid #aaa;
          border-radius: 18px;
          box-sizing: border-box;
          cursor: default;
          height: 1.375rem;
          width: 0.438rem;
          transition:
            background-color 0.2s,
            border-color 0.2s;
          margin-top: 0.047rem;
        }
        [type='range']::-ms-thumb:hover {
          background-color: #fff;
          border-color: var(--fc-range-border-color, #01a4b3);
        }

        .sr {
          position: absolute;
          left: -9999px;
        }
      `,
    ];
  }

  static get properties() {
    return {
      value: { type: Number },
      min: { type: Number },
      max: { type: Number },
      step: { type: Number },
      label: { type: String },
    };
  }

  constructor() {
    super();
    this.min = 0;
    this.max = 100;
    this.step = 1;
    this.label = 'unlabeled';
  }

  render() {
    return html`<input
      type="range"
      min=${this.min}
      max=${this.max}
      .value=${this.value || 0}
      step=${this.step}
      @change=${this.#handleChange}
      @input=${this.#handleInput}
      aria-label=${this.label}
    />`;
  }

  #handleChange(e) {
    e.stopPropagation();

    this.value = e.target.value;

    this.dispatchEvent(
      new CustomEvent('change', { bubbles: true, detail: this.value }),
    );
  }

  #handleInput(e) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('input', { bubbles: true }));
  }
}
