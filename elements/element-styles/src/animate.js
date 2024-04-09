import { css } from 'lit';

export default css`
  @keyframes pulse {
    0% {
      transform: scale(0.9);
      opacity: 0.8;
    }
    50% {
      transform: scale(1.1);
      opacity: 1;
    }
    100% {
      transform: scale(0.9);
      opacity: 0.8;
    }
  }

  .animate.pulse {
    -webkit-animation: pulse 1.5s infinite ease-in-out;
    -o-animation: pulse 1.5s infinite ease-in-out;
    -ms-animation: pulse 1.5s infinite ease-in-out;
    -moz-animation: pulse 1.5s infinite ease-in-out;
    animation: pulse 1.5s infinite ease-in-out;
  }
`;
