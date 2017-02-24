/* global AFRAME, THREE */
if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

AFRAME.registerComponent('button', {
  dependencies: ['position'],
  schema: {
    clickOffset: {
      default: 0.05
    },
    ringColor: {
      default: '#00B9FF'
    }
  },
  init: function () {
    this.el.getAttribute('position') ? '' : this.el.setAttribute('position', {x: 0, y:0, z:0})
    this.el.addEventListener('click', this.onClick.bind(this));
    this.el.addEventListener('mouseenter', this.onMouseEnter.bind(this))
    this.el.addEventListener('mouseleave', this.onMouseLeave.bind(this))
    this.enabled = true;
    this.el.addEventListener('stateadded',this.onStateAdded.bind(this))
    this.el.addState('button:enabled');
  },
  // Create or update the line geometry.
  update: function () { },
  // Remove the line geometry.
  remove: function () {
    this.el.removeEventListener('click', this.onClick);
    this.el.removeEventListener('mouseenter', this.onMouseEnter);
    this.el.removeEventListener('mouseleave', this.onMouseLeave);
  },
  produceClickRing: function (evt) {
    var camera = document.querySelector('a-camera');
    var rayDirection = evt.detail.cursorEl.components.raycaster.direction;
    var clickDistance = evt.detail.intersection.distance;
    var intersectionPoint = evt.detail.intersection.point;
    var clickPosition = intersectionPoint.sub(rayDirection);
    var clickRotation = camera.components.rotation.data;
    var scene = document.querySelector('a-scene');
    var clickRing = document.createElement('a-entity');
    clickRing.id = 'clickring-'+new Date().getTime();
    clickRing.setAttribute('material','color:'+this.data.ringColor);
    clickRing.setAttribute('geometry','primitive: ring; radius-inner: 0.2; radius-outer:0.22');
    clickRing.setAttribute('position',clickPosition);
    clickRing.setAttribute('rotation',clickRotation);
    new AFRAME.TWEEN.Tween({ scale: 0.8 })
      .to({ scale: 1.3 },500)
      .easing(AFRAME.TWEEN.Easing.Quadratic.Out)
      .onUpdate(function () {
        clickRing.setAttribute('scale',this.scale+' '+this.scale+' '+this.scale);
      })
      .start()
    new AFRAME.TWEEN.Tween({ opacity: 1 })
      .to({ opacity: 0.0 },500)
      .easing(AFRAME.TWEEN.Easing.Quadratic.Out)
      .onUpdate(function () {
        clickRing.setAttribute('material','opacity',this.opacity);
      })
      .onComplete(function () {
        scene.removeChild(scene.querySelector('#'+clickRing.id))
      }.bind(this)).start()
    scene.appendChild(clickRing);
  },
  animateButton: function (evt) {
    if (this.animating) { return };
    var rayDirection = evt.detail.cursorEl.components.raycaster.direction;
    var from = Object.assign({},this.el.components.position.data);
    var to = rayDirection.normalize()
                        .multiplyScalar(this.data.clickOffset)
                        .add(from);
    var self = this;
    new AFRAME.TWEEN.Tween(this.el.getAttribute('position'))
      .to({ z: to.z, x: to.x, y: to.y },150)
      .easing(AFRAME.TWEEN.Easing.Quadratic.Out)
      .onUpdate(function () {
        evt.target.setAttribute('position',this);
      })
      .onStart(function () {
        self.animating = true;
      })
      .onComplete(function () {
        new AFRAME.TWEEN.Tween(this.el.getAttribute('position'))
          .to({ z: from.z, x: from.x, y: from.y },150)
          .easing(AFRAME.TWEEN.Easing.Back.Out)
          .onUpdate(function () {
            evt.target.setAttribute('position',this);
          })
          .onComplete(function () {
            self.animating = false;
          }).start()
      }.bind(this)).start()

  },
  onStateAdded: function (evt) {
    if (evt.detail.state === 'button:enabled') {
      this.enabled = true;
    } else if (evt.detail.state === 'button:disabled') {
      this.enabled = false;
    }
  },
  onClick: function (evt) {
    if (!this.enabled) return;
    this.produceClickRing(evt);
    this.animateButton(evt);
  },
  onMouseEnter: function (evt) {
    if (!this.enabled) return;
    this.el.emit('focus');
  },
  onMouseLeave: function (evt) {
    this.el.emit('blur');
  }
});
