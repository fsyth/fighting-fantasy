chrome.app.runtime.onLaunched.addListener(function () {
  chrome.app.window.create('www/index.html', {
    'outerBounds': {
      'width': 800,
      'height': 600
    }
  });
});
