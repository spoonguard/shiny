
// Copyright (c) 2005-2007 Thomas Fuchs (http://script.aculo.us, http://mir.aculo.us)
//           (c) 2005-2007 Sammi Williams (http://www.oriontransfer.co.nz, sammi@oriontransfer.co.nz)
// 
// script.aculo.us is freely distributable under the terms of an MIT-style license.
// For details, see the script.aculo.us web site: http://script.aculo.us/

if(Object.isUndefined(Effect))
  throw("dragdrop.js requires including script.aculo.us' effects.js library");

var Droppables = {
  drops: [],

  remove: function(element) {
    this.drops = this.drops.reject(function(d) { return d.element==$(element) });
  },

  add: function(element) {
    element = $(element);
    var options = Object.extend({
      greedy:     true,
      hoverclass: null,
      tree:       false
    }, arguments[1] || { });

    // cache containers
    if(options.containment) {
      options._containers = [];
      var containment = options.containment;
      if(Object.isArray(containment)) {
        containment.each( function(c) { options._containers.push($(c)) });
      } else {
        options._containers.push($(containment));
      }
    }
    
    if(options.accept) options.accept = [options.accept].flatten();

    Element.makePositioned(element); // fix IE
    options.element = element;

    this.drops.push(options);
  },
  
  findDeepestChild: function(drops) {
    deepest = drops[0];
      
    for (i = 1; i < drops.length; ++i)
      if (Element.isParent(drops[i].element, deepest.element))
        deepest = drops[i];
    
    return deepest;
  },

  isContained: function(element, drop) {
    var containmentNode;
    if(drop.tree) {
      containmentNode = element.treeNode; 
    } else {
      containmentNode = element.parentNode;
    }
    return drop._containers.detect(function(c) { return containmentNode == c });
  },
  
  isAffected: function(point, element, drop) {
    return (
      (drop.element!=element) &&
      ((!drop._containers) ||
        this.isContained(element, drop)) &&
      ((!drop.accept) ||
        (Element.classNames(element).detect( 
          function(v) { return drop.accept.include(v) } ) )) &&
      Position.within(drop.element, point[0], point[1]) );
  },

  deactivate: function(drop) {
    if(drop.hoverclass)
      Element.removeClassName(drop.element, drop.hoverclass);
    this.last_active = null;
  },

  activate: function(drop) {
    if(drop.hoverclass)
      Element.addClassName(drop.element, drop.hoverclass);
    this.last_active = drop;
  },

  show: function(point, element, insertElement) {
    if(!this.drops.length) return;
    var drop, affected = [];

    this.drops.each( function(drop) {
      if(Droppables.isAffected(point, element, drop))
        affected.push(drop);
    });
 
    if(affected.length>0)
      drop = Droppables.findDeepestChild(affected);

    if(this.last_active && this.last_active != drop) this.deactivate(this.last_active);
    if (drop) {
      Position.within(drop.element, point[0], point[1]);

      if(drop.onHover)
        drop.onHover(element, drop.element, Position.overlap(drop.overlap, drop.element), (insertElement || element));
      
      if (drop != this.last_active) Droppables.activate(drop);
    }
  },

  fire: function(event, element) {
    if(!this.last_active) return;
    Position.prepare();

    if (this.isAffected([Event.pointerX(event), Event.pointerY(event)], element, this.last_active))
      if (this.last_active.onDrop) {
        this.last_active.onDrop(element, this.last_active.element, event); 
        return true; 
      }
  },

  reset: function() {
    if(this.last_active)
      this.deactivate(this.last_active);
  }
}

var Draggables = {
  drags: [],
  observers: [],
  reparentCache: {},
  
  register: function(draggable) {
    if(this.drags.length == 0) {
      this.eventMouseUp   = this.endDrag.bindAsEventListener(this);
      this.eventMouseMove = this.updateDrag.bindAsEventListener(this);
      this.eventKeypress  = this.keyPress.bindAsEventListener(this);
      
      Event.observe(document, "mouseup", this.eventMouseUp);
      Event.observe(document, "mousemove", this.eventMouseMove);
      Event.observe(document, "keypress", this.eventKeypress);
    }
    this.drags.push(draggable);
  },
  
  unregister: function(draggable) {
    this.drags = this.drags.reject(function(d) { return d==draggable });
    if(this.drags.length == 0) {
      Event.stopObserving(document, "mouseup", this.eventMouseUp);
      Event.stopObserving(document, "mousemove", this.eventMouseMove);
      Event.stopObserving(document, "keypress", this.eventKeypress);
    }
  },
  
  activate: function(draggable) {
    if(draggable.options.delay) { 
      this._timeout = setTimeout(function() { 
        Draggables._timeout = null; 
        window.focus(); 
        Draggables.activeDraggable = draggable; 
      }.bind(this), draggable.options.delay); 
    } else {
      window.focus(); // allows keypress events if window isn't currently focused, fails for Safari
      this.activeDraggable = draggable;
    }
  },
  
  deactivate: function() {
    this.activeDraggable = null;
  },
  
  updateDrag: function(event) {
    if(!this.activeDraggable) return;
    var pointer = [Event.pointerX(event), Event.pointerY(event)];
    // Mozilla-based browsers fire successive mousemove events with
    // the same coordinates, prevent needless redrawing (moz bug?)
    if(this._lastPointer && (this._lastPointer.inspect() == pointer.inspect())) return;
    this._lastPointer = pointer;
    
    this.activeDraggable.updateDrag(event, pointer);
  },
  
  endDrag: function(event) {
    if(this._timeout) { 
      clearTimeout(this._timeout); 
      this._timeout = null; 
    }
    if(!this.activeDraggable) return;
    this._lastPointer = null;
    this.activeDraggable.endDrag(event);
    this.activeDraggable = null;
  },
  
  keyPress: function(event) {
    if(this.activeDraggable)
      this.activeDraggable.keyPress(event);
  },
  
  addObserver: function(observer) {
    this.observers.push(observer);
    this._cacheObserverCallbacks();
  },
  
  removeObserver: function(element) {  // element instead of observer fixes mem leaks
    this.observers = this.observers.reject( function(o) { return o.element==element });
    this._cacheObserverCallbacks();
  },
  
  notify: function(eventName, draggable, event) {  // 'onStart', 'onEnd', 'onDrag'
    if(this[eventName+'Count'] > 0)
      this.observers.each( function(o) {
        if(o[eventName]) o[eventName](eventName, draggable, event);
      });
    if(draggable.options[eventName]) draggable.options[eventName](draggable, event);
  },
  
  _cacheObserverCallbacks: function() {
    ['onStart','onEnd','onDrag'].each( function(eventName) {
      Draggables[eventName+'Count'] = Draggables.observers.select(
        function(o) { return o[eventName]; }
      ).length;
    });
  }
}

/*--------------------------------------------------------------------------*/

var Draggable = Class.create({

  initialize: function(element) {
    var defaults = {
      handle: false,
      reverteffect: function(element, top_offset, left_offset) {
        var dur = Math.sqrt(Math.abs(top_offset^2)+Math.abs(left_offset^2))*0.02;
        new Effect.Move(element, { x: -left_offset, y: -top_offset, duration: dur,
          queue: {scope:'_draggable', position:'end'}
        });
      },
      endeffect: function(element) {
        var toOpacity = Object.isNumber(element._opacity) ? element._opacity : 1.0;
        new Effect.Opacity(element, {duration:0.2, from:0.7, to:toOpacity, 
          queue: {scope:'_draggable', position:'end'},
          afterFinish: function(){ 
            Draggable._dragging[element] = false 
          }
        }); 
      },
      zindex: 1000,
      revert: false,
      quiet: false,
      scroll: false,
      scrollSensitivity: 20,
      scrollSpeed: 15,
      reparent: false,
      snap: false,  // false, or xy or [x,y] or function(x,y){ return [x,y] }
      delay: 0
    };
    
    if(!arguments[1] || Object.isUndefined(arguments[1].endeffect))
      Object.extend(defaults, {
        starteffect: function(element) {
          element._opacity = Element.getOpacity(element);
          Draggable._dragging[element] = true;
          new Effect.Opacity(element, {duration:0.2, from:element._opacity, to:0.7}); 
        }
      });
    
    var options = Object.extend(defaults, arguments[1] || { });

    this.element = $(element);
    this.lastPointer = [0, 0];

    if(options.handle && Object.isString(options.handle))
      this.handle = this.element.down('.'+options.handle, 0);
    
    if(!this.handle) this.handle = $(options.handle);
    if(!this.handle) this.handle = this.element;

    if (options.scroll && !options.reparent) {
      options.scroll = $(options.scroll);
      this._isScrollChild = Element.childOf(this.element, options.scroll);
    }

    Element.makePositioned(this.element); // fix IE    

    this.options  = options;
    this.dragging = false;   

    this.eventMouseDown = this.initDrag.bindAsEventListener(this);
    Event.observe(this.handle, "mousedown", this.eventMouseDown);
    
    Draggables.register(this);
  },
  
  destroy: function() {
    Event.stopObserving(this.handle, "mousedown", this.eventMouseDown);
    Draggables.unregister(this);
  },
  
  currentDelta: function() {
    return([
      parseInt(Element.getStyle(this.element,'left') || '0'),
      parseInt(Element.getStyle(this.element,'top') || '0')]);
  },
  
  initDrag: function(event) {
    if(!Object.isUndefined(Draggable._dragging[this.element]) &&
      Draggable._dragging[this.element]) return;

    if(Event.isLeftClick(event)) {    
      // abort on form elements, fixes a Firefox issue
      var src = Event.element(event);
      if((tag_name = src.tagName.toUpperCase()) && (
        tag_name=='INPUT' ||
        tag_name=='SELECT' ||
        tag_name=='OPTION' ||
        tag_name=='BUTTON' ||
        tag_name=='TEXTAREA')) return;
        
      var pointer = [Event.pointerX(event), Event.pointerY(event)];
      var pos     = Position.cumulativeOffset(this.element);
      this.offset = [0,1].map( function(i) { return (pointer[i] - pos[i]) });

      Draggables.activate(this);
      Event.stop(event);
    }
  },
  
  startDrag: function(event) {
    this.dragging = true;

    if(!this.delta)
      this.delta = this.currentDelta();

    if(this.options.zindex) {
      this.originalZ = parseInt(Element.getStyle(this.element,'z-index')) || '';
      this.element.style.zIndex = this.options.zindex;
    }

    if(this.options.ghosting) {
      this._clone = this.element.cloneNode(true);
      this.element._originallyAbsolute = (this.element.getStyle('position') == 'absolute');
      if (!this.element._originallyAbsolute)
        Position.absolutize(this.element);
      this.element.parentNode.insertBefore(this._clone, this.element);
    }

    if(this.options.scroll) {
      if (this.options.scroll == window) {
        var where = this._getWindowScroll(this.options.scroll);
        this.originalScrollLeft = where.left;
        this.originalScrollTop = where.top;
      } else {
        this.originalScrollLeft = this.options.scroll.scrollLeft;
        this.originalScrollTop = this.options.scroll.scrollTop;
      }
    }

    if (this.options.scroll) {
      this.scrollLimits =
        [this.options.scroll.scrollWidth, this.options.scroll.scrollHeight];
    }

    Element.shiftComputedIndex(this.element);
    Draggables.notify('onStart', this, event);

    if (this.options.reparent) {
      var extents = this.element.getDimensions();
      var newParent = $(this.options.reparent);

      if (!Draggables.reparentCache[this.element.id])
        Draggables.reparentCache[this.element.id] = this.element.parentNode;

      this._reparentClone = this.element.cloneNode(false);

      this._reparentClone.setStyle({
        visibility: 'hidden', backgroundColor: 'transparent',
        height: extents.height + 'px', width: extents.width + 'px'
      });

      this.element.parentNode.insertBefore(
        this._reparentClone, this.element
      );

      newParent.appendChild(this.element);
      this.redraw();
    }

    if(this.options.starteffect) this.options.starteffect(this.element);
  },
  
  getLastPointer: function()
  {
    return this.lastPointer;
  },

  updateDrag: function(event, pointer) {
    if(!this.dragging) this.startDrag(event);

    if(!this.options.quiet){
      Position.prepare();
      var elt = ($(this.options.reparent) || this.element);

      var l = pointer[0];
      var t = pointer[1];
      var o = Element.cumulativeScrollOffset(elt);

      Droppables.show([l + o.left, t + o.top], elt, this._reparentClone);
    }
    
    Draggables.notify('onDrag', this, event);
    this.draw(pointer);
    if(this.options.change) this.options.change(this);

    if (this.options.reparent) {
      Droppables.show(
        Draggables._lastPointer, this.element, this._reparentClone
      );
    } else if (this.options.scroll) {
      this.stopScrolling();
      
      var p;
      if (this.options.scroll == window) {
        with(this._getWindowScroll(this.options.scroll)) { p = [ left, top, left+width, top+height ]; }
      } else {
        p = Position.page(this.options.scroll);
        p[0] += this.options.scroll.scrollLeft + Position.deltaX;
        p[1] += this.options.scroll.scrollTop + Position.deltaY;
        p.push(p[0]+this.options.scroll.offsetWidth);
        p.push(p[1]+this.options.scroll.offsetHeight);
      }
      var speed = [0,0];
      if(pointer[0] < (p[0]+this.options.scrollSensitivity)) speed[0] = pointer[0]-(p[0]+this.options.scrollSensitivity);
      if(pointer[1] < (p[1]+this.options.scrollSensitivity)) speed[1] = pointer[1]-(p[1]+this.options.scrollSensitivity);
      if(pointer[0] > (p[2]-this.options.scrollSensitivity)) speed[0] = pointer[0]-(p[2]-this.options.scrollSensitivity);
      if(pointer[1] > (p[3]-this.options.scrollSensitivity)) speed[1] = pointer[1]-(p[3]-this.options.scrollSensitivity);
      this.startScrolling(speed);
    }
    
    // fix AppleWebKit rendering
    if(Prototype.Browser.WebKit) window.scrollBy(0,0);
    
    Event.stop(event);
  },

  finishDrag: function(event, success) {
    this.dragging = false;

    if (this.options.reparent) {
      this._reparentClone.parentNode.insertBefore(
        this.element, this._reparentClone
      );

      Element.remove(this._reparentClone);
      this._reparentClone = null;
      
      this.element.style.visibility = '';
      this.redraw();
    }

    if(this.options.quiet){
      Position.prepare();
      var pointer = [Event.pointerX(event), Event.pointerY(event)];
      Droppables.show(pointer, this.element, this._reparentClone);
    }

    if(this.options.ghosting) {
      if (!this.element._originallyAbsolute)
        Position.relativize(this.element);
      delete this.element._originallyAbsolute;
      Element.remove(this._clone);
      this._clone = null;
    }

    var dropped = false; 
    if(success) { 
      dropped = Droppables.fire(event, this.element); 
      if (!dropped) dropped = false; 
    }
    if(dropped && this.options.onDropped) this.options.onDropped(this.element);
    Draggables.notify('onEnd', this, event);

    var revert = this.options.revert;

    if(revert && Object.isFunction(revert))
      revert = revert(this.element);
    
    var d = this.currentDelta();
    if(revert && this.options.reverteffect) {
      if (dropped == 0 || revert != 'failure') {
        this.redraw();
        this.options.reverteffect(this.element,
          d[1]-this.delta[1], d[0]-this.delta[0]);
      }
    } else {
      this.delta = d;
    }

    if(this.options.zindex)
      this.element.style.zIndex = this.originalZ;

    if(this.options.endeffect) 
      this.options.endeffect(this.element);
      
    Draggables.deactivate(this);
    Droppables.reset();
  },
  
  keyPress: function(event) {
    if(event.keyCode!=Event.KEY_ESC) return;
    this.finishDrag(event, false);
    Event.stop(event);
  },
  
  endDrag: function(event) {
    if(!this.dragging) return;
    this.stopScrolling();
    this.finishDrag(event, true);
    Event.stop(event);
  },

  redraw: function() {
    this.draw(this.lastPointer);
  },

  draw: function(point) {
    this.lastPointer = point;
    var pos = Position.cumulativeOffset(this.element);

    if(this.options.ghosting) {
      var r   = Position.realOffset(this.element);
      pos[0] += r[0] - Position.deltaX; pos[1] += r[1] - Position.deltaY;
    }
    
    var d = this.currentDelta();
    pos[0] -= d[0]; pos[1] -= d[1];

    if(this.options.scroll && (this.options.scroll != window && this._isScrollChild)) {
      pos[0] -= this.options.scroll.scrollLeft-this.originalScrollLeft;
      pos[1] -= this.options.scroll.scrollTop-this.originalScrollTop;
    }

    var p = [0,1].map(function(i){ 
      return (point[i]-pos[i]-this.offset[i]) 
    }.bind(this));

    if(this.options.snap) {
      if(Object.isFunction(this.options.snap)) {
        p = this.options.snap(p[0],p[1],this);
      } else {
      if(Object.isArray(this.options.snap)) {
        p = p.map( function(v, i) {
          return (v/this.options.snap[i]).round()*this.options.snap[i] }.bind(this))
      } else {
        p = p.map( function(v) {
          return (v/this.options.snap).round()*this.options.snap }.bind(this))
      }
    }}

    var style = this.element.style;
    if((!this.options.constraint) || (this.options.constraint=='horizontal'))
      style.left = p[0] + "px";
    if((!this.options.constraint) || (this.options.constraint=='vertical'))
      style.top  = p[1] + "px";
    
    if(style.visibility=="hidden") style.visibility = ""; // fix gecko rendering
  },
  
  stopScrolling: function() {
    if(this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
      Draggables._lastScrollPointer = null;
    }
  },
  
  startScrolling: function(speed) {
    if(!(speed[0] || speed[1])) return;
    this.scrollSpeed = [speed[0]*this.options.scrollSpeed,speed[1]*this.options.scrollSpeed];
    this.lastScrolled = new Date();
    this.scrollInterval = setInterval(this.scroll.bind(this), 10);
  },
  
  scroll: function() {
    var current = new Date();
    var delta = current - this.lastScrolled;
    this.lastScrolled = current;
    if(this.options.scroll == window) {
      with (this._getWindowScroll(this.options.scroll)) {
        if (this.scrollSpeed[0] || this.scrollSpeed[1]) {
          var d = delta / 1000;
          this.options.scroll.scrollTo( left + d*this.scrollSpeed[0], top + d*this.scrollSpeed[1] );
        }
      }
    } else {
      this.options.scroll.scrollLeft += this.scrollSpeed[0] * delta / 1000;
      this.options.scroll.scrollTop  += this.scrollSpeed[1] * delta / 1000;
    }

    Position.prepare();

    Droppables.show(Draggables._lastPointer, this.element, this._reparentClone);
    Draggables.notify('onDrag', this);

    if (this._isScrollChild) {
      Draggables._lastScrollPointer = Draggables._lastScrollPointer || $A(Draggables._lastPointer);

      if (this.options.scroll.scrollLeft > 0) {
        Draggables._lastScrollPointer[0] += this.scrollSpeed[0] * delta / 1000;
      }
      if (this.options.scroll.scrollTop > 0) {
        Draggables._lastScrollPointer[1] += this.scrollSpeed[1] * delta / 1000;
      }
      
      this.draw(Draggables._lastScrollPointer);
    } 
    
    if(this.options.change) this.options.change(this);
  },
  
  _getWindowScroll: function(w) {
    var T, L, W, H;
    with (w.document) {
      if (w.document.documentElement && documentElement.scrollTop) {
        T = documentElement.scrollTop;
        L = documentElement.scrollLeft;
      } else if (w.document.body) {
        T = body.scrollTop;
        L = body.scrollLeft;
      }
      if (w.innerWidth) {
        W = w.innerWidth;
        H = w.innerHeight;
      } else if (w.document.documentElement && documentElement.clientWidth) {
        W = documentElement.clientWidth;
        H = documentElement.clientHeight;
      } else {
        W = body.offsetWidth;
        H = body.offsetHeight
      }
    }
    return { top: T, left: L, width: W, height: H };
  }
});

Draggable._dragging = { };

/*--------------------------------------------------------------------------*/

var SortableObserver = Class.create({
  initialize: function(element, observer) {
    this.element   = $(element);
    this.observer  = observer;
    this.lastValue = Sortable.serialize(this.element);
  },

  onStart: function() {
    this.lastValue = Sortable.serialize(this.element);
  },

  onEnd: function() {
    Sortable.unmark();
    if(this.lastValue != Sortable.serialize(this.element))
      this.observer(this.element)
  }
});

var Sortable = {
  SERIALIZE_RULE: /^[^_\-](?:[A-Za-z0-9\-\_]*)[_](.*)$/,
  
  sortables: { },
  
  _findRootElement: function(element) {
    while (element && element.tagName.toUpperCase() != "BODY") {  
      if(element.id && Sortable.sortables[element.id]) return element;
      element = element.parentNode;
    }
  },

  options: function(element) {
    element = Sortable._findRootElement($(element));
    if(!element) return;
    return Sortable.sortables[element.id];
  },
  
  destroy: function(element){
    var s = Sortable.options(element);
    
    if(s) {
      Draggables.removeObserver(s.element);
      s.droppables.each(function(d){ Droppables.remove(d) });
      s.draggables.invoke('destroy');
      
      delete Sortable.sortables[s.element.id];
    }
  },

  create: function(element) {
    element = $(element);
    var options = Object.extend({ 
      element:     element,
      tag:         'li',       // assumes li children, override with tag: 'tagname'
      dropOnEmpty: false,
      tree:        false,
      treeTag:     'ul',
      overlap:     'vertical', // one of 'vertical', 'horizontal'
      constraint:  'vertical', // one of 'vertical', 'horizontal', false
      containment: element,    // also takes array of elements (or id's); or false
      handle:      false,      // or a CSS class
      only:        false,
      delay:       0,
      hoverclass:  null,
      ghosting:    false,
      quiet:       false, 
      scroll:      false,
      scrollSensitivity: 20,
      scrollSpeed: 15,
      format:      this.SERIALIZE_RULE,
      animate:     false,
      duration:    0.50,
      reparent:    false,
      
      // these take arrays of elements or ids and can be 
      // used for better initialization performance
      elements:    false,
      handles:     false,

      onChange:    Prototype.emptyFunction,
      onUpdate:    Prototype.emptyFunction,
      onReorder:   Prototype.emptyFunction,
      canInsert:   function() { return true; }
    }, arguments[1] || { });

    // clear any old sortable with same element
    //this.destroy(element);

    // build options for the draggables
    var options_for_draggable = {
      revert:      this._cancelAnimations.bind(this),
      quiet:       options.quiet,
      scroll:      options.scroll,
      scrollSpeed: options.scrollSpeed,
      scrollSensitivity: options.scrollSensitivity,
      delay:       options.delay,
      ghosting:    options.ghosting,
      constraint:  options.constraint,
      reparent:    options.reparent,
      handle:      options.handle,
      onEnd:       Sortable.onEnd
    };

    if(options.starteffect)
      options_for_draggable.starteffect = options.starteffect;

    if(options.reverteffect)
      options_for_draggable.reverteffect = options.reverteffect;
    else
      if(options.ghosting) options_for_draggable.reverteffect = function(element) {
        element.style.top  = 0;
        element.style.left = 0;
      };

    if(options.endeffect)
      options_for_draggable.endeffect = options.endeffect;

    if(options.zindex)
      options_for_draggable.zindex = options.zindex;

    // build options for the droppables  
    var options_for_droppable = {
      overlap:     options.overlap,
      containment: options.containment,
      tree:        options.tree,
      hoverclass:  options.hoverclass,
      onHover:     Sortable.onHover
    }
    
    var options_for_tree = {
      onHover:      Sortable.onEmptyHover,
      overlap:      options.overlap,
      containment:  options.containment,
      hoverclass:   options.hoverclass
    }

    // fix for gecko engine
    Element.cleanWhitespace(element); 

    options.draggables = [];
    options.droppables = [];

    // drop on empty handling
    if(options.dropOnEmpty || options.tree) {
      Droppables.add(element, options_for_tree);
      options.droppables.push(element);
    }

    var index = 0;

    (options.elements || this.findElements(element, options) || []).each( function(e,i) {
      var handle = options.handles ? $(options.handles[i]) :
        (options.handle ? $(e).select('.' + options.handle)[0] : e); 
      options.draggables.push(
        new Draggable(e, Object.extend(options_for_draggable, { handle: handle })));
      Droppables.add(e, options_for_droppable);
      if(options.tree) e.treeNode = element;
      Element.setComputedIndex(e, index++);
      options.droppables.push(e);
    });

    if(options.tree) {
      (Sortable.findTreeElements(element, options) || []).each( function(e) {
        Droppables.add(e, options_for_tree);
        e.treeNode = element;
        options.droppables.push(e);
      });
    }

    // keep reference
    this.sortables[element.id] = options;

    // for animation
    this._activeAnimations = $H({});
    this._animationSavedStyle = null;
    
    // for onupdate
    Draggables.addObserver(new SortableObserver(element, options.onUpdate));
  },

  // return all suitable-for-sortable elements in a guaranteed order
  findElements: function(element, options) {
    return Element.findChildren(
      element, options.only, options.tree ? true : false, options.tag
    );
  },
  
  findTreeElements: function(element, options) {
    return Element.findChildren(
      element, options.only, options.tree ? true : false, options.treeTag
    );
  },

  onEnd: function(draggable) {
    var elt = draggable.element;
    var root = Sortable._findRootElement(elt);
    var options = Sortable.options(root);
    
    var eltsOrder = (
      options.elements || Sortable.findElements(root, options) || []
    ).reject(function(e) {
      return (e.getStyle('visibility') == 'hidden');
    });

    var indexOrder = eltsOrder.map(function(e) {
      return Element.getOriginalIndex(e);
    });

    var idOrder = eltsOrder.map(function(e) { return e.id; });

    if (options)
      options.onReorder(draggable.element, eltsOrder, idOrder, indexOrder);

    return;
  },

  onHover: function(element, dropon, overlap, insertElement) {
    if(Element.isParent(dropon, element)) return;

    var objects;
    var direction = (overlap > 0.5);

    if (!Sortable._shouldHover(element, dropon))
      return;

    var parentNode = element.parentNode;
    var options = Sortable.options(parentNode);
    var droponOptions = Sortable.options(dropon.parentNode);

    if (droponOptions && droponOptions.animate) {
      if (!(objects = Sortable._shouldHoverForAnimation(element, dropon, direction)))
        return;
    }

    if(overlap > .33 && overlap < .66 && Sortable.options(dropon).tree) {
      return;
    } else if (direction) {
      Sortable.mark(dropon, 'before');

      if (dropon.previousSibling != insertElement) {
        element.style.visibility = 'hidden';
        Element.swapComputedIndices(element, dropon);

        if (droponOptions && droponOptions.animate)
          Sortable._animate(element, dropon, objects, true, insertElement);
        else
          dropon.parentNode.insertBefore(insertElement, dropon);
      }
    } else {
      Sortable.mark(dropon, 'after');

      if (dropon.nextSibling != insertElement) {
        element.style.visibility = 'hidden';
        Element.swapComputedIndices(element, dropon);

        if (droponOptions && droponOptions.animate)
          Sortable._animate(element, dropon, objects, false, insertElement);
        else
          dropon.parentNode.insertBefore(insertElement, dropon.nextSibling);
      }
    }

    if (options && dropon.parentNode != parentNode)
      options.onChange(element, dropon);

    if (droponOptions)
      droponOptions.onChange(element, dropon);

    return;
  },

  _findObjectsForAnimation: function(element, dropon)
  {
    /* Asymptotic complexity is O(n):
        Scales with the number of active draggables and droppables;
        if performance becomes problematic, this is a likely culprit. */

    var draggable = null;
    var ei = null, ej = null, di = null, dj = null;
    var options = Sortable.options(dropon || element); /* Fix Me */

    if (options) {
      var droppables = options.droppables;
      var draggables = options.draggables;

      /* Find (offset of) draggable for $element, $dropon */
      for (var i = 0, len = draggables.length; i < len; i++) {
        var d = draggables[i];
        if (d.element == element) { draggable = d; ei = i; }
        else if (d.element == dropon) { di = i; }
      };

      /* Find offset of droppable for $element, $dropon */
      for (var j = 0, len = droppables.length; j < len; j++) {
        if (droppables[j] == element) { ej = j; }
        else if (droppables[j] == dropon) { dj = j; }
      };
    }

    return {
      draggable: draggable,
      element: { draggable_index: ei, droppable_index: ej },
      dropon: { draggable_index: di, droppable_index: dj }
    };
  },

  _cancelAnimations: function(element /* = null */, dropon /* = null */,
                              objects /* = null */, animate /* = null */,
                              style /* = null */)
  {
    if (element && !objects)
      objects = this._findObjectsForAnimation(element, dropon);

    if (element) {
      if (!style) {
        style = $H(this._animationSavedStyle);
        this._animationSavedStyle = null;
      }

      style.each(function(kv) {
        element.style[kv.key] = kv.value;
      });

      if (objects.draggable)
        objects.draggable.redraw();

      element.style.position = 'relative';
    }

    Sortable._activeAnimations.each(function(kv) {
      kv.value.effect.cancel();
      var e = kv.value.effect.element;

      if (e.parentNode) {
        if (animate) {
          Effect.BlindUp(e, {
            scaleX: true, scaleY: true,
            duration:
              Sortable.options(e.parentNode).duration,
            afterFinish: function() {
              if (e.parentNode)
                e.parentNode.removeChild(e);
            }
          });
        } else {
          e.parentNode.removeChild(e);
        }
      }
      
      if (objects.draggable)
        objects.draggable.redraw();

      Sortable._activeAnimations.unset(kv.key);
    });

    return this;
  },

  _animate: function(element, dropon, objects, direction, insertElement)
  {
    var elementParent = Draggables.reparentCache[element.id];

    /* Save appropriate styles from $element:
        These are restored in _cancelAnimations. */

    var savedStyle = $H({
      width: element.style.width, height: element.style.height
    });

    /* Save style for $element on first call:
        This is used to guarantee that $element's original CSS style
        is restored on release, rather than a style modified by this code. */

    if (!this._animationSavedStyle)
      this._animationSavedStyle = savedStyle;

    /* Clone $element:
        This produces the two invisible blind-up / blind-down elements,
        which together push $element to produce a "sliding" effect. */

    var eltUp = element.cloneNode(false);
    var extents = element.getDimensions();

    eltUp.style.width = extents.width + 'px';
    eltUp.style.height = extents.height + 'px';

    eltUp.setStyle({
      position: 'relative',
      top: 0, left: 0, visibility: 'hidden'
    });

    var eltDown = eltUp.cloneNode(false);
    Element.hide(eltDown);

    /* Animate:
        Lift $element out of the element set, reverse any incomplete
        animations, then start "sliding" in the appropriate direction. */

    var p, e1, e2;

    if (direction)
      { p = insertElement; e1 = insertElement.nextSibling; e2 = dropon; }
    else
      { p = e1 = insertElement; e2 = dropon.nextSibling; }

    if (Sortable._activeAnimations.size() <= 0)
      p.parentNode.insertBefore(eltUp, e1);
    
    insertElement.absolutize();
    dropon.parentNode.insertBefore(insertElement, e2);
    dropon.parentNode.insertBefore(eltDown, e2);
    Sortable._cancelAnimations(null, dropon, objects, true, savedStyle);

    var droponOptions = Sortable.options(dropon.parentNode);

    var effect = Effect.BlindDown(eltDown, {
      scaleX: true, scaleY: true,
      duration:
        droponOptions.duration
    });

    Sortable._activeAnimations.set(objects.dropon.droppable_index, {
      direction: direction, effect: effect
    });

    Effect.BlindUp(eltUp, {
      scaleX: true, scaleY: true,
      duration:
        droponOptions.duration,
      afterFinish: function() {
        if (eltUp.parentNode)
          Element.remove(eltUp);
      }
    });

    return this;
  },

  _shouldHover: function(element, dropon, direction)
  {
    if (!dropon)
      return false;

    var options = Sortable.options(dropon);
    var savedParent = Draggables.reparentCache[element.id];
    var root = Sortable._findRootElement(savedParent || element);

    if (!options)
      return false;

    if (!options.canInsert(root, element, dropon, direction))
      return false;

    return true;
  },

  _shouldHoverForAnimation: function(element, dropon, direction)
  {
    var elementParent = Draggables.reparentCache[element.id];
    var objects = Sortable._findObjectsForAnimation(element, dropon);

    if (dropon.getStyle('visibility') == 'hidden')
      return false;

    var animation = Sortable._activeAnimations.get(
      objects.dropon.droppable_index
    );

    if (animation && (direction == null || animation.direction == direction))
      return false;

    return objects;
  },

  _animateEmpty: function(element, child, offset, options, children, insertElement)
  {
    var os = null;
    var isLastChild = !child;

    if (!child)
      child = children[[0, children.length - 1].max()];
    
    if (child == insertElement || child.getStyle('visibility') == 'hidden')
      return false;

    var overlap = (offset / Element.offsetSize(child, options.overlap));
    var direction = (overlap < 0.5);

    if (!Sortable._shouldHover(element, child, direction))
      return false;

    if (!(os = Sortable._shouldHoverForAnimation(element, child, direction)))
      return false;

    if (isLastChild)
      direction = false;

    if (direction) {
      if (child.nextSibling != insertElement)
        Sortable._animate(element, child, os, direction, insertElement);
    } else {
      if (child.previousSibling != insertElement || isLastChild)
        Sortable._animate(element, child, os, direction, insertElement);
    }

    return true;
  },

  onEmptyHover: function(element, dropon, overlap, insertElement) {
    var computedOffset = null;
    var oldOptions = Sortable.options(element);
    var droponOptions = Sortable.options(dropon);

    if(!Element.isParent(dropon, element)) {
      var index;

      var children = Sortable.findElements(dropon, {tag: droponOptions.tag, only: droponOptions.only});
      var child = null;

      if(children) {
        var offset = Element.offsetSize(dropon, droponOptions.overlap) * (1.0 - overlap);
        for (index = 0; index < children.length; index += 1) {
          if (offset - Element.offsetSize (children[index], droponOptions.overlap) >= 0) {
            offset -= Element.offsetSize (children[index], droponOptions.overlap);
          } else if (offset - (Element.offsetSize (children[index], droponOptions.overlap) / 2) >= 0) {
            child = index + 1 < children.length ? children[index + 1] : null;
            break;
          } else {
            child = children[index];
            break;
          }
        }
      }

      if (droponOptions && droponOptions.animate && children) {
        if (!Sortable._animateEmpty(element, child, offset, droponOptions, children, insertElement))
          return;
      } else {
        dropon.insertBefore(insertElement, child);
      }

      if (oldOptions)
        oldOptions.onChange(element);

      droponOptions.onChange(element);
    }
  },

  unmark: function() {
    if(Sortable._marker) Sortable._marker.hide();
  },

  mark: function(dropon, position) {
    // mark on ghosting only
    var sortable = Sortable.options(dropon.parentNode);
    if(sortable && !sortable.ghosting) return; 

    if(!Sortable._marker) {
      Sortable._marker = 
        ($('dropmarker') || Element.extend(document.createElement('DIV'))).
          hide().addClassName('dropmarker').setStyle({position:'absolute'});
      document.getElementsByTagName("body").item(0).appendChild(Sortable._marker);
    }    
    var offsets = Position.cumulativeOffset(dropon);
    Sortable._marker.setStyle({left: offsets[0]+'px', top: offsets[1] + 'px'});
    
    if(position=='after')
      if(sortable.overlap == 'horizontal') 
        Sortable._marker.setStyle({left: (offsets[0]+dropon.clientWidth) + 'px'});
      else
        Sortable._marker.setStyle({top: (offsets[1]+dropon.clientHeight) + 'px'});
    
    Sortable._marker.show();
  },
  
  _tree: function(element, options, parent) {
    var children = Sortable.findElements(element, options) || [];
  
    for (var i = 0; i < children.length; ++i) {
      var match = children[i].id.match(options.format);

      if (!match) continue;
      
      var child = {
        id: encodeURIComponent(match ? match[1] : null),
        element: element,
        parent: parent,
        children: [],
        position: parent.children.length,
        container: $(children[i]).down(options.treeTag)
      }
      
      /* Get the element containing the children and recurse over it */
      if (child.container)
        this._tree(child.container, options, child)
      
      parent.children.push (child);
    }

    return parent; 
  },

  tree: function(element) {
    element = $(element);
    var sortableOptions = this.options(element);
    var options = Object.extend({
      tag: sortableOptions.tag,
      treeTag: sortableOptions.treeTag,
      only: sortableOptions.only,
      name: element.id,
      format: sortableOptions.format
    }, arguments[1] || { });
    
    var root = {
      id: null,
      parent: null,
      children: [],
      container: element,
      position: 0
    }
    
    return Sortable._tree(element, options, root);
  },

  /* Construct a [i] index for a particular node */
  _constructIndex: function(node) {
    var index = '';
    do {
      if (node.id) index = '[' + node.position + ']' + index;
    } while ((node = node.parent) != null);
    return index;
  },

  sequence: function(element) {
    element = $(element);
    var options = Object.extend(this.options(element), arguments[1] || { });
    
    return $(this.findElements(element, options) || []).map( function(item) {
      return item.id.match(options.format) ? item.id.match(options.format)[1] : '';
    });
  },

  setSequence: function(element, new_sequence) {
    element = $(element);
    var options = Object.extend(this.options(element), arguments[2] || { });
    
    var nodeMap = { };
    this.findElements(element, options).each( function(n) {
        if (n.id.match(options.format))
            nodeMap[n.id.match(options.format)[1]] = [n, n.parentNode];
        n.parentNode.removeChild(n);
    });
   
    new_sequence.each(function(ident) {
      var n = nodeMap[ident];
      if (n) {
        n[1].appendChild(n[0]);
        delete nodeMap[ident];
      }
    });
  },
  
  serialize: function(element) {
    element = $(element);
    var options = Object.extend(Sortable.options(element), arguments[1] || { });
    var name = encodeURIComponent(
      (arguments[1] && arguments[1].name) ? arguments[1].name : element.id);
    
    if (options.tree) {
      return Sortable.tree(element, arguments[1]).children.map( function (item) {
        return [name + Sortable._constructIndex(item) + "[id]=" + 
                encodeURIComponent(item.id)].concat(item.children.map(arguments.callee));
      }).flatten().join('&');
    } else {
      return Sortable.sequence(element, arguments[1]).map( function(item) {
        return name + "[]=" + encodeURIComponent(item);
      }).join('&');
    }
  }
}

// Returns true if child is contained within element
Element.isParent = function(child, element) {
  if (!child.parentNode || child == element) return false;
  if (child.parentNode == element) return true;
  return Element.isParent(child.parentNode, element);
}

Element.findChildren = function(element, only, recursive, tagName) {
  if(!element.hasChildNodes()) return null;
  if(element.getStyle('visibility') == 'hidden') return null;
  tagName = tagName.toUpperCase();
  if(only) only = [only].flatten();
  var elements = [];
  $A(element.childNodes).each( function(e) {
    if(e.tagName && e.tagName.toUpperCase()==tagName &&
      (!only || (Element.classNames(e).detect(function(v) { return only.include(v) }))))
        elements.push(e);
    if(recursive) {
      var grandchildren = Element.findChildren(e, only, recursive, tagName, computeIndicies);
      if(grandchildren) elements.push(grandchildren);
    }
  });

  return (elements.length>0 ? elements.flatten() : []);
}

Element.getOriginalIndex = function (element) {
  return element['_originalIndex'];
}

Element.getComputedIndex = function (element, previous) {
  return element[(previous ? '_previousIndex' : '_computedIndex')];
}

Element.shiftComputedIndex = function (element) {
  element['_previousIndex'] = Element.getComputedIndex(element);
  return element;
}

Element.setComputedIndex = function (element, i) {
  if (element['_originalIndex'] == null)
    element['_originalIndex'] = i;

  element['_computedIndex'] = i;
  return element;
}

Element.swapComputedIndices = function (e1, e2) {
  if (!e1 || !e2) return;

  var i = Element.getComputedIndex(e1);
  var j = Element.getComputedIndex(e2);

  var min = [i, j].min();
  var max = [i, j].max();

  var left = (i == min ? e1 : e2);
  var right = (j == max ? e2 : e1);

  /* Non-adjacent case:
      This is worst-case linear in the number of Sortable
      elements, but the worst-case (first-to-last) is unlikely. */

  for (var e = left.nextSibling, n = min; e && e != right; e = e.nextSibling)
    Element.setComputedIndex(e, n++);

  Element.setComputedIndex(left, max);
  Element.setComputedIndex(right, min);

  return;
}

Element.offsetSize = function (element, type) {
  return element['offset' + ((type=='vertical' || type=='height') ? 'Height' : 'Width')];
}

