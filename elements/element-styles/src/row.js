import { css } from 'lit';

export default css`
  .row {
    position: relative;
    line-height: var(--soundws-row-height, 4.5rem);
    height: var(--soundws-row-height, 4.5rem);
    overflow: hidden;
    user-select: none;
  }
`;
