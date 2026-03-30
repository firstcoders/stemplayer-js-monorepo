// Create an audio context that unmutes on IOS
// @see https://github.com/swevans/unmute
export default (ac) => {
  const audio = document.createElement('audio');
  audio.controls = false;
  audio.preload = 'auto';
  audio.disableRemotePlayback = true;
  audio.loop = true;
  audio.src =
    'data:audio/mp3;base64,//MkxAAHiAICWABElBeKPL/RANb2w+yiT1g/gTok//lP/W/l3h8QO/OCdCqCW2Cw//MkxAQHkAIWUAhEmAQXWUOFW2dxPu//9mr60ElY5sseQ+xxesmHKtZr7bsqqX2L//MkxAgFwAYiQAhEAC2hq22d3///9FTV6tA36JdgBJoOGgc+7qvqej5Zu7/7uI9l//MkxBQHAAYi8AhEAO193vt9KGOq+6qcT7hhfN5FTInmwk8RkqKImTM55pRQHQSq//MkxBsGkgoIAABHhTACIJLf99nVI///yuW1uBqWfEu7CgNPWGpUadBmZ////4sL//MkxCMHMAH9iABEmAsKioqKigsLCwtVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVV//MkxCkECAUYCAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';

  if (document.body) {
    document.body.appendChild(audio);
  }

  const unlock = () => {
    // Attempt to play the audio and resume the context on user gesture
    audio
      .play()
      .then(() => {
        ac.resume();
        // Once confirmed running, we can remove the listener
        if (ac.state === 'running') {
          window.removeEventListener('touchend', unlock);
        }
      })
      .catch(() => {
        // Catch DOMException: play() failed because the user didn't interact
        // Wait for next interaction
      });
  };

  window.addEventListener('touchend', unlock);

  // wrap close so we can cleanup the silence audio node
  const { close } = ac;
  ac.close = async () => {
    window.removeEventListener('touchend', unlock);
    audio.remove();
    return close.call(ac);
  };
};
