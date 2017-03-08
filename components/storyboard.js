/* global AFRAME, THREE */
if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

AFRAME.registerComponent('storyboard', {
  // dependencies: ['button'],
  schema: {
    clickOffset: {
      default: 0.05
    },
    ringColor: {
      default: '#00B9FF'
    }
  },
  init: function () {
    console.log('storyboard-controls: init');
    // init flags
    this.uiVisible=false;
    this.hideUITimeout=null;
    this.storyboardFrames = [];
    this.currStoryboardFrameIndex = null;
    this.dotSize = 0.08;
    this.dotMargin = 0.25;
    this.arrowSize = 0.5;
    this.dotsContainerWidth;
    // construct UI
    this.buildUI();
    this.buildCamera();
  },
  tick: function () {
    if (this.$camera && !this.uiVisible) {
      var cameraY = this.$camera.getAttribute('rotation').y;
      this.$uiContainer.setAttribute('rotation','0 '+cameraY+' 0');
    }
  },
  buildUI: function () {
    console.log('buildUI');
    this.$uiContainer = document.createElement('a-entity');
    this.el.appendChild(this.$uiContainer);
    // create ui trigger
    this.$uiTrigger = document.createElement('a-plane');
    this.$uiTrigger.setAttribute('rotation','-36 0 0');
    this.$uiTrigger.setAttribute('position','0 -0.5 -1.9');
    this.$uiTrigger.setAttribute('width','4');
    this.$uiTrigger.setAttribute('height','1.5');
    this.$uiTrigger.setAttribute('material','color: yellow; visible: false');
    this.$uiTrigger.setAttribute('class','highlightable');
    this.$uiContainer.appendChild(this.$uiTrigger);
    this.$uiTrigger.addEventListener('mouseenter', this.showUI.bind(this));
    this.$uiTrigger.addEventListener('mouseleave', this.hideUI.bind(this));
    // create nav container
    this.$navigation = document.createElement('a-entity');
    this.$navigation.setAttribute('rotation','-36 0 0');
    this.$navigation.setAttribute('position','0 -0.5 -2');
    this.$uiContainer.appendChild(this.$navigation);
    // create right arrow
    this.$rightArrow = document.createElement('a-circle');
    this.$rightArrow.setAttribute('color','#00B9FF');
    this.$rightArrow.setAttribute('rotation','0 -25 0');
    this.$rightArrow.setAttribute('radius','0.25');
    this.$rightArrow.setAttribute('class','clickable');
    this.$rightArrow.setAttribute('button','');
    this.$rightArrow.setAttribute('transparent','true');
    this.$rightArrow.innerHTML='<a-text scale="0.8 0.8 0.8" value="next" align="center"></a-text>';
    this.$navigation.appendChild(this.$rightArrow);
    this.$rightArrow.addEventListener('click', this.handleRightArrowClick.bind(this));
    // create left arrow
    this.$leftArrow = document.createElement('a-circle');
    this.$leftArrow.setAttribute('color','#00B9FF');
    this.$leftArrow.setAttribute('rotation','0 25 0');
    this.$leftArrow.setAttribute('radius','0.25');
    this.$leftArrow.setAttribute('class','clickable');
    this.$leftArrow.setAttribute('button','');
    this.$leftArrow.setAttribute('transparent','true');
    this.$leftArrow.innerHTML='<a-text scale="0.8 0.8 0.8" value="prev" align="center"></a-text>';
    this.$navigation.appendChild(this.$leftArrow);
    this.$leftArrow.addEventListener('click', this.handleLeftArrowClick.bind(this));
    // create pagination container
    this.$paginationContainer = document.createElement('a-entity');
    this.$navigation.appendChild(this.$paginationContainer);
    // create pagination bg
    this.$paginationBG = document.createElement('a-plane');
    this.$paginationBG.setAttribute('color','#333');
    this.$paginationBG.setAttribute('width','2.5');
    this.$paginationBG.setAttribute('height','0.5');
    this.$paginationContainer.appendChild(this.$paginationBG);
    // create pagination highlight
    this.$paginationHighlight = document.createElement('a-ring');
    this.$paginationHighlight.setAttribute('color','#00B9FF');
    this.$paginationHighlight.setAttribute('radius-inner','0.08');
    this.$paginationHighlight.setAttribute('radius-outer','0.12');
    this.$paginationContainer.appendChild(this.$paginationHighlight);
    // create pagination dots
    this.$paginationDots = document.createElement('a-entity');
    this.$paginationContainer.appendChild(this.$paginationDots);
    // resize the navigation and initialize it to the first frame
    this.armStoryboardButtons();
    this.updateNavigation();
    this.navigateToIndex(0);
  },
  buildCamera: function () {
    console.log('build camera');
    // create camera
    this.$camera=document.createElement('a-camera');
    this.el.appendChild(this.$camera);
    // create clickable cursor
    this.$cursor=document.createElement('a-entity');
    this.$cursor.setAttribute('cursor','fuse: false');
    this.$cursor.setAttribute('geometry','primitive: ring');
    this.$cursor.setAttribute('material','color: #FF00E6; shader: flat; opacity: 0.5');
    this.$cursor.setAttribute('raycaster','objects: [link-to-frame], .clickable');
    this.$cursor.setAttribute('position','0 0 -2');
    this.$cursor.setAttribute('scale','0.025 0.025 0.025');
    this.$cursor.innerHTML='<a-animation begin="mouseenter" attribute="material.opacity" dur="150" from="0.5" to="1.0"></a-animation>'+
                        '<a-animation begin="mouseenter" easing="ease-in-out" attribute="scale" from="0.025 0.025 0.025" to="0.05 0.05 0.05" dur="150"></a-animation>'+
                        '<a-animation begin="mouseleave" easing="ease-out" attribute="material.opacity" from="1.0" to="0.1" dur="75"></a-animation>'+
                        '<a-animation begin="mouseleave" easing="ease-in-out" attribute="scale" from="0.05 0.05 0.05" to="0.025 0.025 0.025" dur="150"></a-animation>';
    this.$camera.appendChild(this.$cursor);
    this.$cursorHighlightable=document.createElement('a-entity');
    this.$cursorHighlightable.setAttribute('cursor','fuse: false');
    this.$cursorHighlightable.setAttribute('material','visible: false;');
    this.$cursorHighlightable.setAttribute('raycaster','objects: .highlightable');
    this.$camera.appendChild(this.$cursorHighlightable);
  },
  showUI: function() {
    console.log('show UI');
    this.uiVisible = true;
    clearTimeout(this.hideUITimeout);
    this.$navigation.setAttribute('scale','1 1 1');
  },
  hideUI: function () {
    console.log('hide UI');
    var that = this;
    this.hideUITimeout = setTimeout(function() {
      that.$navigation.setAttribute('scale','0 0 0');
      that.uiVisible = false;
    }, 3000);
  },
  handleRightArrowClick: function () {
    if (this.currStoryboardFrameIndex<(this.storyboardFrames.length-1)) {
      this.navigateToIndex(this.currStoryboardFrameIndex+1);
    } else {
      this.navigateToIndex(0);
    }
  },
  handleLeftArrowClick: function () {
    if (this.currStoryboardFrameIndex>0) {
      this.navigateToIndex(this.currStoryboardFrameIndex-1);
    } else {
      this.navigateToIndex(this.storyboardFrames.length-1);
    }
  },
  armStoryboardButtons: function () {
    var storyboardButtons = document.querySelectorAll('[link-to-frame]');
    for (var i=0; i<storyboardButtons.length; i++) {
      var button = storyboardButtons[i];
      // button.removeEventListener('click');
      button.addEventListener('click', function () {
        this.navigateToId(button.getAttribute('link-to-frame'));
      }.bind(this));
    }
  },
  navigateToIndex: function (targetIndex) {
    if (this.currStoryboardFrameIndex != null) {
        this.el.removeChild(this.storyboardFrames[this.currStoryboardFrameIndex]);
    }
    this.el.appendChild(this.storyboardFrames[targetIndex]);
    // this.armStoryboardButtons();
    this.currStoryboardFrameIndex = targetIndex;
    // move the pagination highlight
    var highlightX = -this.dotsContainerWidth/2 + this.currStoryboardFrameIndex*this.dotMargin;
    this.$paginationHighlight.setAttribute('position', highlightX +' 0 0')
  },
  navigateToId: function (id) {
    var index;
    for (var i=0; i<this.storyboardFrames.length; i++ ) {
      if (id == this.storyboardFrames[i].getAttribute('storyboard-frame')) {
        index = i;
      }
    }
    this.navigateToIndex(index);
  },
  updateNavigation: function () {
    this.storyboardFrames = document.querySelectorAll('[storyboard-frame]');
    // initialize the frames
    for (var i = 0; i<this.storyboardFrames.length; i++) {
      var frame = this.storyboardFrames[i];
      this.el.removeChild(frame);
      var dot = document.createElement('a-circle');
      dot.setAttribute('color','#FFFFFF');
      dot.setAttribute('scale',this.dotSize+' '+this.dotSize+' '+this.dotSize);
      dot.setAttribute('link-to-frame',frame.getAttribute('storyboard-frame'));
      var that = this;
      dot.addEventListener('click', function (evt) {
        that.navigateToId(evt.target.getAttribute('link-to-frame'));
      });
      this.$paginationDots.appendChild(dot);
    }
    this.dotsContainerWidth = this.dotMargin*(this.storyboardFrames.length-1);
    this.$paginationDots.setAttribute('position', -.5*this.dotsContainerWidth+' 0 0');
    this.$paginationDots.setAttribute('layout','type: line; margin: '+this.dotMargin);
    this.$paginationBG.id="blahaaa";
    this.$paginationBG.setAttribute('width',this.dotsContainerWidth+this.dotSize*4);
    this.$paginationBG.setAttribute('position','0 0 -.1');
    this.$leftArrow.setAttribute('position',(-this.dotsContainerWidth/2-this.arrowSize)+' 0 0');
    this.$rightArrow.setAttribute('position',(this.dotsContainerWidth/2+this.arrowSize)+' 0 0');
  }
});

// AFRAME.registerComponent('storyboard-frame', {
//   multiple:true,
//   schema: {type: 'string'},
//   init: function () {
//     console.log('storyboard-frame: init');
//   }
// });
//
// AFRAME.registerComponent('link-to-frame', {
//   multiple:true,
//   schema: {type: 'string'},
//   init: function () {
//     console.log('link-to-frame: init');
//   }
// });
