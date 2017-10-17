chrome.app.runtime.onLaunched.addListener(function () {
  chrome.app.window.create('www/index.html', {
    'outerBounds': {
      'width': 860,
      'height': 935
    }
  });
});
