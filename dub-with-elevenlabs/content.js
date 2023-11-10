function injectDubButton() {
  const player = document.querySelector('.html5-video-player');
  if (!player) {
    console.error('No video player found');
    return;
  }

  const button = document.createElement('button');
  button.innerText = 'Dub';
  button.style.position = 'absolute';
  button.style.top = '0';
  button.style.right = '0';
  button.style.zIndex = '1000';
  button.style.padding = '10px';
  button.style.fontSize = '1rem';
  button.style.color = '#fff';
  button.style.background = '#1a73e8';
  button.style.border = 'none';
  button.style.borderRadius = '2px';
  button.style.cursor = 'pointer';
  button.onclick = function() {
    chrome.runtime.sendMessage({
      action: "openDubbingPage",
        url: window.location.href,
        videoName: document.querySelector('.title.style-scope.ytd-video-primary-info-renderer').innerText
    });
  };

  player.appendChild(button);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectDubButton);
} else {
  injectDubButton();
}
