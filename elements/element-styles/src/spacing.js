import { css } from 'lit';

export default css`
  .px1 {
    padding-left: calc(var(--soundws-gutter-base, 0.15rem) * 2);
    padding-right: calc(var(--soundws-gutter-base, 0.15rem) * 2);
  }

  .px4 {
    padding-left: calc(var(--soundws-gutter-base, 0.15rem) * 4);
    padding-right: calc(var(--soundws-gutter-base, 0.15rem) * 4);
  }

  .pr1 {
    padding-right: calc(var(--soundws-gutter-base, 0.15rem) * 1);
  }

  .pr2 {
    padding-right: calc(var(--soundws-gutter-base, 0.15rem) * 2);
  }

  .pr3 {
    padding-right: calc(var(--soundws-gutter-base, 0.15rem) * 3);
  }
`;
