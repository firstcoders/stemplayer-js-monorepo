import { css } from 'lit';

export default css`
  .bgBrand {
    background-color: var(--fc-brand-color, rgb(1, 164, 179));
  }

  .focusBgBrand:focus {
    background-color: var(--fc-brand-color, rgb(1, 164, 179));
  }
`;
