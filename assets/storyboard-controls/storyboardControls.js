window.onload = function() {
  var storyboard = document.querySelector('#storyboard');
  var storyboardFrames = [];
  var currStoryboardFrameIndex = null;
  var camera = document.querySelector('#camera');
  var ui = document.querySelector('#ui');
  var uiTrigger = document.querySelector('#ui-trigger');
  var navigation = document.querySelector('#navigation');
  var paginationHighlight = document.querySelector('#pagination-highlight');
  var paginationBG = document.querySelector('#pagination-background');
  var paginationDots = document.querySelector('#pagination-dots');
  var leftArrow = document.querySelector('#arrow-left');
  var rightArrow = document.querySelector('#arrow-right');
  var dotSize = 0.08;
  var dotMargin = 0.25;
  var arrowSize = 0.5;
  var dotsContainerWidth;

  var buildStoryboardNavigation = function () {
    storyboardFrames = document.querySelectorAll('[storyboard-frame-id]');
    // initialize the frames
    for (var i = 0; i<storyboardFrames.length; i++) {
      var frame = storyboardFrames[i];
      storyboard.removeChild(frame);
      var dot = document.createElement('a-circle');
      dot.setAttribute('color','#FFFFFF');
      dot.setAttribute('scale',dotSize+' '+dotSize+' '+dotSize);
      paginationDots.appendChild(dot);
    }
    dotsContainerWidth = dotMargin*(storyboardFrames.length-1);
    paginationDots.setAttribute('position', -.5*dotsContainerWidth+' 0 0');
    paginationDots.setAttribute('layout','type: line; margin: '+dotMargin);
    paginationBG.setAttribute('width',dotsContainerWidth+dotSize*4);
    paginationBG.setAttribute('position','0 0 -.1');
    leftArrow.setAttribute('position',(-dotsContainerWidth/2-arrowSize)+' 0 0');
    rightArrow.setAttribute('position',(dotsContainerWidth/2+arrowSize)+' 0 0');
    // count them and build a pagination control
    navigateToIndex(0);
    // size & position the navigation
  }

  var armStoryboardButtons = function () {
    var storyboardButtons = document.querySelectorAll('[storyboard-target-id]');
    for (var i=0; i<storyboardButtons.length; i++) {
      var button = storyboardButtons[i];
      button.addEventListener('click', function () {
        navigateToId(button.getAttribute('storyboard-target-id'));
      });
    }
  }

  var navigateToIndex = function (targetIndex) {
    if (currStoryboardFrameIndex != null) {
        storyboard.removeChild(storyboardFrames[currStoryboardFrameIndex]);
    }
    storyboard.appendChild(storyboardFrames[targetIndex]);
    armStoryboardButtons();
    currStoryboardFrameIndex = targetIndex;
    // move the pagination highlight
    var highlightX = -dotsContainerWidth/2 + currStoryboardFrameIndex*dotMargin;
    paginationHighlight.setAttribute('position', highlightX +' 0 0')
  }

  var navigateToId = function (id) {
    var index;
    for (var i=0; i<storyboardFrames.length; i++ ) {
      if (id == storyboardFrames[i].getAttribute('storyboard-frame-id')) {
        console.log('match!',id);
        index = i;
      }
    }
    navigateToIndex(index);
  }

  //left arrow
  leftArrow.addEventListener('click', function() {
    if (currStoryboardFrameIndex>0) {
      navigateToIndex(currStoryboardFrameIndex-1);
    } else {
      navigateToIndex(storyboardFrames.length-1);
    }
  });

  //right arrow
  rightArrow.addEventListener('click', function() {
    if (currStoryboardFrameIndex<(storyboardFrames.length-1)) {
      navigateToIndex(currStoryboardFrameIndex+1);
    } else {
      navigateToIndex(0);
    }
  });

  var hideUITimeout;
  var uiVisible = false;
  // show navigation
  uiTrigger.addEventListener('mouseenter', function () {
      uiVisible = true;
      clearTimeout(hideUITimeout);
      navigation.setAttribute('scale','1 1 1');
  });

  // hide navigation
  uiTrigger.addEventListener('mouseleave', function () {
      hideUITimeout = setTimeout(function() {
          navigation.setAttribute('scale','0 0 0');
          uiVisible = false;
      }, 3000);
  });

  setInterval(function() {
      if (uiVisible) return;
      var cameraY = camera.getAttribute('rotation').y;
      ui.setAttribute('rotation','0 '+cameraY+' 0');
  }, 20)

  buildStoryboardNavigation();
}
