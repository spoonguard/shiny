/*
   Shiny: A Portable Javascript User-Interface Toolkit
    Copyright 2006-2008, David Brown <dave@spoonguard.org>
    $Id$
   
   This Program is free software; you can redistribute it and/or modify
   it under the terms of the GNU General Public License, version 2, as
   published by the Free Software Foundation.

   The Program is distributed in the hope that it will be useful, but
   WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
   General Public License for more details.

   You should have received a copy of the GNU General Public
   License along with this program; if not, write to the Free Software
   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301
   USA.
*/


/**
    Utility Methods:
**/

function $Array(x)
{
  return (x instanceof Array ? x : $A([x]));
}


function $Hash(x, default_key)
{
  var rv;

  if (!default_key)
    default_key = 'default';

  if (!(x instanceof Hash || (x instanceof Object && !x.initialize))) {
    rv = $H({});
    rv.set(default_key, x);
  } else {
    rv = $H(x);
  }

  return rv;
}



/**
    Shiny:
**/

var Shiny = {

  /* public: */
  version: '0.6.0',

  /* private: */
  _mirror_unique_id: 0,
  _mirror_cycle_guard: $H({ }),
  _image_asset_cache: $H({ }),
  _resizer_extent_cache: $H({ }),
  _resizer_instance_cache: $H({ })
};



/**
    Shiny.Browser:
**/

Shiny.Browser = { };



/**
    Shiny.Browser.Emulation:
**/

Shiny.Browser.Emulation = { };



/**
    Shiny.Browser.Emulation.Css:
      Provides script-based CSS emulation for browsers that don't
      support certain attributes and/or attribute combinations
      (e.g. 'top' and 'bottom', 'left' and 'right').
**/

Shiny.Browser.Emulation.Css = function(container, css_attribute, id_list)
{
  return;
};



/**
    Shiny.Browser.Features:
**/

Shiny.Browser.Features = {

  fast_reflow: !(Prototype.Browser.IE || Prototype.Browser.Opera),
  fast_opacity: !(Prototype.Browser.IE),
  fast_style_updates: !(Prototype.Browser.IE),
  fast_js_interpreter: !(Prototype.Browser.IE)

};



/**
    Shiny.Browser.Preferences:
**/

Shiny.Browser.Preferences = {

  use_animations: Shiny.Browser.Features.fast_reflow,
  use_transparency: Shiny.Browser.Features.fast_opacity

};



/**
    Shiny.Log:
**/

Shiny.Log = {

  message: function()
  {
    return false;
  },

  debug: function(domain, type, message)
  {
    /* Draft - Fix me */
    Shiny.Log.message(
      type + ': ' + message + ' (' +
        $A(arguments).slice(2).map(function(x) {
          return (x && x.inspect ? x.inspect() : x);
        }).join(', ') + ')'
    );

    return false;
  },

  warning: function(domain, type, message)
  {
    try {
      /* Capture backtrace */
      throw new Exception('backtrace');
    } catch (e) {
      /* Draft - Fix me */
      Shiny.Log.message([
        'warning', e.stack ? e.stack.split(/\n+/).map(function(s) {
          return s.split('@');
        }) : 'no-stack', message, $A(arguments).slice(1)
      ]);
    }
    
    return false;
  },

  error: function(domain, type, message)
  {
    return false;
  },

  fatal: function(domain, type, message)
  {
    return false;
  }

};



/**
    Shiny.Options.Processor:
**/

Shiny.Options = { };

Shiny.Options.Processor = {

  containment: function(options)
  {
    var rv = [ ];
    var ct = $Array(options.get('containment'));

    switch (ct[0]) {
      case 'next': case 'after': case 'right':
      case 'below': case 'successor':
        rv.push('successor'); break;
      case 'pre': case 'left': case 'above':
      case 'previous': case 'predecessor':
        rv.push('predecessor'); break;
      default: case 'parent':
        rv.push('parent'); break;
    }

    rv.push(ct[1]);
    return rv;
  },

  scroll: function(options, default_container)
  {
    var scroll = options.get('scroll');

    if (scroll === true)
      scroll = default_container;
    else if (!scroll)
      scroll = null;
    else
      scroll = $(scroll);

    options.set('scroll', scroll);
    return scroll;
  },

  starteffect: function(options)
  {
    return (
      options.get('opacity') && Shiny.Browser.Features.fast_opacity
        ? null : Prototype.emptyFunction
    );
  }

};



/**
    Shiny.Object:
**/

Shiny.Object = Class.create(
{
  /* public: */
  initialize: function()
  {
    this._setup_invoked = false;
    return this;
  },

  setup: function()
  {
    if (this._setup_invoked) {
      return Shiny.Log.warning(
        'Shiny.Object', 'setup', 'Invoked multiple times'
      );
    }

    this._setup_invoked = true;
    return this;
  },

  teardown: function()
  {
    if (!this._setup_invoked) {
      return Shiny.Log.warning(
        'Shiny.Object', 'teardown', 'Invoked multiple times'
      );
    }

    this._setup_invoked = false;
    return this;
  },

  /* public: */
  reset: function() /* ... */
  {
    this.teardown();
    this.setup.apply(this, arguments);

    return this;
  },

  is_setup: function()
  {
    return this._setup_invoked;
  },

  /* protected: */
  unobserve_all: function(elts, name, observers)
  {
    for (var i = 0, len = elts.length; i < len; ++i)
      Event.stopObserving(elts[i], name, observers[i]);

    return this;
  },

  teardown_one: function(container)
  {
    if (container)
      container.teardown();

    return this;
  },

  teardown_all: function(objects, clear)
  {
    if (!objects)
      return this;

    for (var i = 0, len = objects.length; i < len; ++i)
      this.teardown_one(objects[i]);
  
    if (clear)
      objects.clear();

    return this;
  },

  reset_all: function(objects, clear)
  {
    if (!objects)
      return this;

    for (var i = 0, len = objects.length; i < len; ++i)
      objects[i].reset();
  
    return this;
  }

});



/**
    Shiny.Recursion:
      Extensible recursion over the DOM tree, controlled
      by a specific CSS class.
**/

Shiny.Recursion = {

  extensible: function(child, fn, cl_ext)
  {
    var cl = 'xr' + (cl_ext ? cl_ext : '')

    /* Extensible recursive processing */
    if (Element.hasClassName(child, cl)) {
      var grandchildren = Element.childElements(child);

      for (var i = 0, len = grandchildren.length; i < len; ++i) {
        fn(grandchildren[i]);
      }
    }
  }
};



/**
    Shiny.Container:
      Base class (or mix-in) that is tightly coupled to a single
      DOM element; implements AJAX updates and setup/teardown
      operations for the coupled element.
**/

Shiny.Container = Class.create(Shiny.Object,
{
  /* public: */
  initialize: function($super, id, options, delay_setup)
  {
    this.$initialize_container(id, options);
    return $super();
  },

  $initialize_container: function(id, options, delay_setup)
  {
    /* private: */
    this._id = id;
    this._options = options;
    this._resetting = null;
    this._container = null;
    this._container_id = null;
    this._progress_images = null;
    /* */

    return this;
  },

  invoke_setup: function()
  {
    return this.setup(this._id, this._options);
  },

  setup: function($super, id, options)
  {
    if (!$super())
      return false;

    Shiny.Log.debug(
      'Shiny.Container', 'setup', id, options
    );

    return this.$setup_container(id, options);
  },

  $setup_container: function(elt, options, in_reset)
  {
    var id = null;
    var type = typeof elt;

    this._container = null;
    this._container_id = null;
    this._bound_forms = $H({});
    this._progress_container = null;
    this._options = $H(options || {});
    this._progress_images = Shiny.Assets.Images.get('spinner');

    if (!elt) {
      elt = document.body;
    } else if (elt.id) {
      id = elt.id;
    } else {
      id = elt;
      elt = $(elt);
    }

    this.set_container_id(id);
    this.set_container(elt);

    this._indicators = [ ];

    var progress_containers = $Hash(
      this._options.get('progress_containers'), this.get_container_id()
    );

    if (progress_containers) {
      this._progress_container =
        $(progress_containers.get(this.get_container_id()));
    }

    if (!this.is_resetting())
      this._setup_container_children();

    this.bind('form');

    Shiny.Container.track_container(this);
    return this;
  },

  teardown: function($super, in_reset)
  {
    if (!$super())
      return false;

    Shiny.Log.debug(
      'Shiny.Container', 'teardown', this.get_container_id()
    );

    if (!this.is_resetting())
      this._teardown_container_children();

    Shiny.Container.forget_container(this);
    return this;
  },

  bind: function(ids)
  {
    ids = $Array(ids);

    for (var i = 0, len = ids.length; i < len; ++i) {
      var form = $(ids[i]);

      if (form && (form.tagName || '').toLowerCase() == 'form')
        this._bound_forms.set(ids[i], form);
    }

    return this;
  },

  unbind: function(ids)
  {
    ids = $Array(ids);

    for (var i = 0, len = ids.length; i < len; ++i)
      this._bound_forms.unset(ids[i]);

    return this;
  },
  
  unbind_all: function()
  {
    this._bound_forms = $H({});
    return this;
  },

  update: function(id, base_url, options)
  {
    options = $H(options || {});

    var c_id = this.get_container_id();
    var container = this.get_container();

    if (id) {
      if (Element.descendantOf(id, container))
        container = $(id);
    }

    this.start_progress(options.get('message'));
    
    Shiny.Log.debug(
      'Shiny.Container', 'update', c_id, base_url
    );

    var qs = '?' + Object.toQueryString({ id: c_id }) + '&';
    var url = base_url + qs + this._serialize_bound_forms();

    (function() {
      this._updater = new Ajax.Updater(
        { success: container }, url, {
        evalScripts: true,
        onComplete: function() {
          this.set_resetting(true);
          this.teardown_self();
          this.setup_self();
          this._teardown_container_children();
          this._setup_container_children();
          this.trigger_callback('onComplete', options);
          this.finish_progress();
          this.set_resetting(false);
        }.bind(this)
      })
    }).bind(this).defer(options.get('delay') || 0 /* ms */);

    return this;
  },

  reset: function($super, options)
  {
    options = $H(options || {});

    Shiny.Log.debug(
      'Shiny.Container', 'reset', this.get_container_id()
    );

    this.set_resetting(true);
    this.teardown_self();
    this.setup_self();
    this._teardown_container_children();
    this._setup_container_children();
    this.set_resetting(false);

    return this;
  },

  setup_self: function()
  {
    return this.setup(this.get_container_id(), this.get_options());
  },

  teardown_self: function()
  {
    return this.teardown();
  },

  /* protected: */
  set_container: function(elt)
  {
    return (this._container = elt);
  },

  get_container: function()
  {
    return this._container;
  },
  
  set_container_id: function(id)
  {
    return (this._container_id = id);
  },

  get_container_id: function()
  {
    return this._container_id;
  },

  get_options: function()
  {
    return this._options;
  },

  start_progress: function(message)
  {
    var indicators = this._indicators;

    for (var i = 0, len = indicators.length; i < len; ++i) {
      indicators[i].enable(message);
    }

    return this;
  },

  finish_progress: function()
  {
    var indicators = this._indicators;

    for (var i = 0, len = indicators.length; i < len; ++i)
      indicators[i].disable();

    return this;
  },

  set_resetting: function(s)
  {
    this._resettting = s;
  },

  is_resetting: function()
  {
    return this._resetting;
  },

  is_affected_by_update: function(container)
  {
    var c_id = this.get_container_id();
    var pc_id = container.get_container_id();
    var c = $(c_id), pc = $(pc_id);

    return c && pc && (
      (c == pc) || Element.descendantOf(c, pc) || Element.descendantOf(pc, c)
    );
  },

  setup_all: function(containers)
  {
    var rv = $H({});

    for (var i = 0, len = containers.length; i < len; ++i) {
      var c = containers[i];

      /* Test for presence of container */
      var cid = c.get_container_id();

      if ($(cid)) {
        /* Container still present */
        c.setup(cid, c.get_options());
        rv.set(cid, c);
      }
    }

    return rv;
  },

  /* private: */
  _setup_container_children: function()
  {
    /* Process interesting child elements */
    var container = (this._progress_container || this.get_container());
    var children = Element.childElements(container);

    for (var i = 0, len = children.length; i < len; ++i)
      this._install_container_child(children[i]);

    return this;
  },
  
  _teardown_container_children: function()
  {
    this.teardown_all(this._indicators, true);
    return this;
  },

  _install_container_child: function(child)
  {
    if (child.hasClassName('progress')) {
      this._indicators.push(
        new Shiny.Indicator(child, this._progress_images)
      );
    }

    return Shiny.Recursion.extensible(
      child, this._install_container_child.bind(this)
    );
  },

  _serialize_bound_forms: function()
  {
    var rv = '';
    var forms = this._bound_forms.values();

    for (var i = 0, len = forms.length; i < len; ++i)
      rv += Form.serialize(forms[i]);

    return rv;
  }

});



/**
    Shiny.Container.Registry:
**/

Shiny.Container.Registry = {

  _container_registry: $H({ }),

  track_container: function(c)
  {
    var c_id = c.get_container_id();

    Shiny.Log.debug(
      'Shiny.Container.Registry', 'track_container', c_id
    );

    this._container_registry.set(c_id, c);
    return this;
  },

  forget_container: function(c)
  {
    var c_id = c.get_container_id();

    Shiny.Log.debug(
      'Shiny.Container.Registry', 'forget_container', c_id
    );

    this._container_registry.unset(c_id);
    return this;
  },

  find_container: function(id)
  {
    Shiny.Log.debug(
      'Shiny.Container.Registry', 'find_container', id
    );

    return this._container_registry.get(id);
  }
};

Shiny.Container = Object.extend(Shiny.Container, Shiny.Container.Registry);



/**
    Shiny.Events:
      A mix-in enables a publish/subscribe event handling model
      (i.e. observer pattern) for arbitrary Javascript objects.
**/

Shiny.Events = Class.create(
{
  /* protected: */
  initialize: function()
  {
    return this.$initialize_events();
  },

  $initialize_events: function()
  {
    /* private: */
    this._handlers = $H({ });
    /* */

    return this;
  },

  /* public: */
  observe: function(type, handler, here)
  {
    if (this._handlers.get(type) == null)
      this._handlers.set(type, [ ]);

    this._handlers.get(type).push(handler);
    return handler;
  },

  stopObserving: function(type, handler)
  {
    return this.unobserve(type, handler);
  },

  unobserve: function(type, handler)
  {
    var handlers_for_type = null;

    if (!type) {
      this._handlers = $H({ });
    } else if (!handler) {
        this._handlers.set(type, [ ]);
    } else if ((handlers_for_type = this._handlers.get(type)) != null) {
      this._handlers.set(
        type, handlers_for_type.reject(function(x) {
          return (x == handler);
        })
      );
    }

    return this;
  },

  /* protected: */
  install_sink: function(event_name, elt)
  {
    Event.observe(elt, event_name, this._handle_sink);
    return this;
  },

  remove_sink: function(event_name, elt)
  {
    Event.stopObserving(elt, event_name, this._handle_sink);
    return this;
  },

  trigger_event: function(type)
  {
    var rv = this;
    var fns = null;
    var args = $A(arguments).slice(1);

    if ((fns = this._handlers.get(type)) == null)
      return rv;

    this._handlers.unset(type);
    Shiny.Log.debug('Shiny.Events', 'event', type, this);

    for (var i = 0, len = fns.length; i < len; ++i) {
      if (!fns[i].apply(this, args))
        rv = false;
    }

    this._handlers.set(type, fns);
    return rv;
  },

  trigger_callback: function(type, options /* , ... */)
  {
    var fn = $H(options).get(type);

    if (fn)
      fn.apply(this, $A(arguments).slice(2));

    Shiny.Log.debug('Shiny.Events', 'callback', type, this);
    return this;
  },

  /* private: */
  _handle_sink: function(ev)
  {
    if (ev)
      ev.stopPropagation();

    return false;
  }

});


/**
    Shiny.Screen:
**/

Shiny.Screen = Class.create(Shiny.Container,
{
  /* public: */
  initialize: function($super, options)
  {
    /* private: */
    this._darken_elt = null;
    this._page_effect = null;
    /**/

    $super('shiny', options);
    return this.setup('shiny', options);
  },

  disable: function(options)
  {
    if (Prototype.Browser.Gecko)
      Element.addClassName(this.get_container(), 'no-scroll');

    return this._darken($H(options));
  },

  enable: function(options)
  {
    this._lighten(
      $H(options).merge({
        afterFinish: function() {
          if (Prototype.Browser.Gecko)
            Element.removeClassName(this.get_container(), 'no-scroll');
        }.bind(this)
      })
    );
    
    return this;
  },

  /* protected: */

  _lighten: function(options)
  {
    var e = this._darken_elt;

    if (!e)
      return this;

    if (this._page_effect)
      this._page_effect.cancel();
    
    var o = Element.getStyle(e, 'opacity');

    this._page_effect = new Effect.Opacity(e, {
      duration:
        (options.get('duration') || 0.8),
      from: o, to: 0, afterFinish: function(options) {
        this._darken_elt = null;
        this._page_effect = null;
        e.parentNode.removeChild(e);
        var f = options.get('afterFinish'); if (f) f();
      }.bind(this, options)
    });

    return this;
  },

  _darken: function(options)
  {
    var e;

    if (this._page_effect) {
      e = this._darken_elt;
      this._page_effect.cancel();
    }
    else {
      e = document.createElement('div');
      this._darken_elt = e;
      this.get_container().appendChild(e);
    }

    Element.setOpacity(e, 0.0);
    e.className = 'full-screen cursor-disabled';
    Element.setStyle(e, { backgroundColor: '#000000' });

    this._page_effect = new Effect.Opacity(e, {
      duration:
        (options.get('duration') || 0.8),
      from: 0.0, to: 0.7, afterFinish: function(options) {
        this._page_effect = null;
        var f = options.get('afterFinish'); if (f) f();
      }.bind(this, options)
    });

    return this;
  }

});


/**
    Shiny.Dialog:
**/

Shiny.Dialog = Class.create(Shiny.Container,
{
  /* public: */
  initialize: function($super, id, screen, options)
  {
    /* private: */
    this._rounds = null;
    this._screen = null;
    this._shiny_form = null;
    /* */

    $super(id, options);
    return this.setup(id, screen, options);
  },

  setup: function($super, id, screen, options)
  {
    if (!$super(id, options))
      return false;
    
    this._rounds = [ ];
    this._screen = screen;

    var c = this.get_container();
    this._shiny_form = new Shiny.Form(c);

    this._draggable = new Draggable(c, {
      zindex: c.getStyle('z-index'),
      endeffect: Prototype.emptyFunction,
      starteffect: Prototype.emptyFunction
    });

    var children = Element.childElements(c);

    for (var i = 0, len = children.length; i < len; ++i)
      this._rounds.push(new Shiny.Round(children[i]));

    return this;
  },

  teardown: function($super)
  {
    return $super();
  },

  show: function(options)
  {
    var c = this.get_container();

    options = $H(options || {});
    this._screen.disable();

    c.appear({
      from: 0.0, to: 0.75,
      duration: (options.get('duration') || 1.0)
    });

    return this;
  },

  hide: function(options)
  {
    var c = this.get_container();

    options = $H(options || {});
    this._screen.enable();

    c.fade({
      duration: (options.get('duration') || 1.0)
    });

    return this;
  }


});


/**
    Shiny.Indicator:
      A visual indicator. Accepts a reference to one Shiny.Asset.Images
      instance, and applies it to a single DOM node.
**/

Shiny.Indicator = Class.create(Shiny.Container,
{
  /* public: */
  initialize: function($super, id, image_asset, options)
  {
    /* private: */
    this._image_elt = null;
    this._image_asset = image_asset;
    /* */

    $super(id, options);
    return this.setup(id, options);
  },

  teardown: function($super)
  {
    if (!$super())
      return false;

    return this.disable();
  },

  clear: function()
  {
    var c = this.get_container();

    /* Remove all children */
    while (c.firstChild != null)
      c.removeChild(c.firstChild);

    return this;
  },

  enable: function(message)
  {
    var c = this.get_container();

    this.clear();
    this._image_elt = this._image_asset.to_element();

    if (message)
      c.appendChild(document.createTextNode(message));

    c.appendChild(this._image_elt);
    return this;
  },

  disable: function()
  {
    this.clear();
    this._image_elt = null;

    return this;
  }

});



/**
    Shiny.Asset:
      Namespace containing implementations of common image/style assets.
**/

Shiny.Asset = { };



/**
    Shiny.Asset.Images:
      An ordered set of pre-cached images.
**/

Shiny.Asset.Images = Class.create(Enumerable,
{
  /* public: */
  initialize: function(hrefs, infinite_end)
  {
    /* Must contain at least one href */
    if (!hrefs || hrefs.length <= 0)
      hrefs = [ '../images/default.png' ];

    for (var i = 0, len = hrefs.length; i < len; ++i) {

      /* Load the image and hold a reference:
          The user-agent will it cache automatically. */

      var image = new Image();
      image.src = hrefs[i];
      Shiny._image_asset_cache.set(hrefs[i], image);
    }

    /* private: */
    this._index = 0;
    this._hrefs = $Array(hrefs);
    this._infinite_end = infinite_end;
    /* */

    return this;
  },

  _each: function(iterator)
  {
    return this._hrefs._each(iterator);
  },

  length: function()
  {
    /* Invariant: Length is always > 0 */
    return this._hrefs.length;
  },

  first: function()
  {
    this._index = 0;
    return this._hrefs.first();
  },

  current: function()
  {
    return this._hrefs[this._index];
  },

  set_index: function(i)
  {
    this._index = (
      (i < 0 ? this._hrefs.length + i : i)
    );

    if (this._index >= this._hrefs.length) {
      if (this._infinite_end)
        this.last();
      else
        this.first();
    }

    return this;
  },

  index: function(i)
  {
    return this.set_index(i).current();
  },

  last: function()
  {
    /* Invariant: Length is always > 0 */
    this._index = this._hrefs.length - 1;
    return this._hrefs.last();
  },

  next: function()
  {
    if (++this._index >= this.length())
      return this.first();
    
    return this.current();
  },

  to_element: function()
  {
    var elt = document.createElement('img');
    elt.src = this.current();

    return elt;
  }

});



/**
    Shiny.Asset.Style:
      A CSS selector, plus an associative array of CSS attributes/values,
      all controllable dynamically at run-time.
**/

Shiny.Asset.Style = Class.create(Hash, Shiny.Container.prototype, {

  /* public: */
  initialize: function($super, selector, styles)
  {
    /* private: */
    this._selector = selector;
    this._head_tags = document.getElementsByTagName('head');
    this._head_tag = this._head_tags[0];
    /* */

    var elt = document.createElement('style');
    elt.setAttribute('type', 'text/css');

    this._head_tag.appendChild(elt);

    $super(styles);
    this.$setup_container(elt);

    return this.sync();
  },

  set: function($super, key, value, important)
  {
    if (important)
      value = value + ' !important';

    var rv = $super(key, value);
    this.sync();

    return rv;
  },

  /* protected: */
  sync: function() {
    var c = this.get_container();

    /* Generate CSS from associative array */
    var css = this.inject(this._selector + ' { ', function(a, kv) {
      return a + kv.join(': ') + '; ';
    }) + '}';

    /* Apply style */
    c.textContent = css;

    /* Workaround for MSIE 6 */
    if (c.styleSheet)
      c.styleSheet.cssText = css;

    return this;
  }
  
});


/**
    Shiny.Asset.Style.Reflected:
      Query computed styles at run-time, using a managed
      <div> element located directly underneath the document root.
**/

Shiny.Asset.Style.Reflected = Class.create(Hash, Shiny.Container.prototype, {

  /* public: */
  initialize: function($super, classname)
  {
    /* private: */
    var container = document.createElement('div');
    /* */
    
    container.className = classname;
    container.style.visibility = 'hidden';
    document.body.appendChild(container);

    return this.$setup_container(container);
  },

  set: function($super, key, value)
  {
    var kv = $H({}); kv[key] = value;
    return this.get_container().setStyle(kv);
  },

  get: function($super, key)
  {
    return this.get_container().getStyle(key);
  }

});


/**
    Shiny.Round:
      Encapsulate a single DOM element in a box with rounded edges.
**/

Shiny.Round = Class.create(Shiny.Container,
{
  /* public: */
  initialize: function($super, id, options)
  {
    options = $H({ top: true, bottom: true }).merge(options);

    $super(id, options);
    return this.setup(id, options);
  },

  /* protected: */
  setup: function($super, id, options)
  {
    $super(id, options);
    var c = this.get_container();

    /* Create <div> elements for rounded corners */
    var dir = [ 'y', 'z' ];
    var alpha = [ 'abcd', 'dcba' ];
    var corners = [ ];

    for (var i = 0, len = dir.length; i < len; ++i) {
      corners[i] = document.createElement('div');
      corners[i].className = 'corner';

      for (var j = 0, len2 = alpha[i].length; j < len2; ++j) {
        var div = document.createElement('div');
        div.className = alpha[i].substring(j, j + 1) + ' ' + dir[i];
        corners[i].appendChild(div);
      }
    }

    /* Create new container */
    var container = document.createElement('div');
    container.className = 'border xr';

    var interior = document.createElement('div');
    interior.className = 'interior xr';
    container.appendChild(interior);

    /* Move subtree */
    while (c.hasChildNodes()) {
      interior.appendChild(c.removeChild(c.firstChild));
    }

    /* Create edges */
    var top = document.createElement('div');
    var bottom = document.createElement('div');
    top.className = 'top'; bottom.className = 'bottom';

    /* Merge */
    if (this._options.get('top')) {
      c.appendChild(top);
      c.appendChild(corners[0]);
    }

    c.appendChild(container);
    
    if (this._options.get('bottom')) {
      c.appendChild(corners[1]);
      c.appendChild(bottom);
    }

    c.addClassName('round');
    return this;
  }

});



/**
    Shiny.Mirror:
      An event mirror. Ensures that a whole group of elements receives
      exactly one event if any element receives one event.
**/

Shiny.Mirror = Class.create(Shiny.Object, Shiny.Events.prototype,
{
  /* public: */
  initialize: function($super, elts, event_map)
  {
    if (!event_map)
      event_map = { };

    event_map = $H({
      focus: 'focus', blur: 'blur',
      keyup: 'keyup', keydown: 'keydown',
      click: 'click', change: 'change', dblclick: 'dblclick'
    }).merge(event_map);

    /* private: */
    this._elts = null;
    this._observers = null;
    this._event_map = event_map;
    this._mirror_unique_id = Shiny._mirror_unique_id++;
    /* */

    this.$initialize_events();
    return this.setup(elts);
  },

  setup: function(elts)
  {
    this._observers = [ ];
    this._elts = $Array(elts);

    var keys = this._event_map.keys();

    for (var i = 0, len = keys.length; i < len; ++i) {
      var event_name = this._event_map.get(keys[i]);

      for (var j = 0, len2 = this._elts.length; j < len2; ++j) {
        var fn = this._mirror_event.bindAsEventListener(this, keys[i], j);
        this._observers.push({ index: j, event_name: event_name, fn: fn });
        this._elts[j].observe(event_name, fn, false);
      }
    }

    return this;
  },


  teardown: function()
  {
    for (var i = 0, len = this._observers.length; i < len; ++i) {
      var o = this._observers[i];
      Event.stopObserving(this._elts[o.index], o.event_name, o.fn);
    }

    this._observers = null;
    this._elts = null;

    return this;
  },

  /* private: */
  _mirror_event: function(ev, method, idx)
  {
    var k1 = this._mirror_unique_id + '.' + idx + '.' + method;

    if (Shiny._mirror_cycle_guard.get(k1)) {
      if (ev && ev.stopPropagation) {
        ev.stopPropagation(); return true;
      }
    }

    Shiny._mirror_cycle_guard.set(k1, true);

    for (var i = 0, len = this._elts.length; i < len; ++i) {
      if (!this._send_event(this._elts[i], ev, method, i))
        if (ev && ev.stopPropagation) ev.stopPropagation();
    }

    /* Escape current call stack:
        This will allow any outstanding events to be delivered,
        prior to resetting the "cycle guard" associative array. */

    this._clear_cycle_guard.bind(this).defer();
    return true;
  },

  _send_event: function(elt, ev, method, i)
  {
    var elt = this._elts[i];
    var tag_name = (elt.tagName || '').toLowerCase();
    var k2 = this._mirror_unique_id + '.' + i + '.' + method;

    if (Shiny._mirror_cycle_guard.get(k2)) {
      if (ev && ev.stopPropagation) {
        ev.stopPropagation(); return true;
      }
    }

    /* Fix for Internet Explorer 6.x infinite loop:
        Disallow focus/blur, except for non-input elements and descendants
        of Shiny.Control (which contain an appropriate tagName member). */

    if (['focus', 'blur'].include(method) && tag_name != 'input')
      return true;

    this.trigger_event(method, ev);
    var rv = this._trigger_native_method(elt, method, ev);

    Shiny._mirror_cycle_guard.set(k2, true);
    return rv;
  },

  _trigger_native_method: function(elt, method, ev)
  {
    if (elt[method])
      return elt[method](ev);

    return true;
  },

  _clear_cycle_guard: function()
  {
    Shiny._mirror_cycle_guard = $H({ });
    return true;
  }

});



/**
    Shiny.Facade:
      A DOM element that "subclasses" another DOM element by
      mirroring its events (using Shiny.Mirror) to a Shiny.Control.
**/

Shiny.Facade = Class.create(Shiny.Container,
{
  /* public: */
  initialize: function($super, id, options)
  {
    /* private: */
    this._mirror = null;
    this._element = null;
    this._control = null;
    /* */
   
    $super(id, options);
    return this.setup(id, options);
  },

  get_control: function()
  {
    return this._control;
  },

  setup: function($super, id, options)
  {
    $super(id, options);

    var input = this.get_container();
    var type = Shiny.Facade.compute_type(input);

    var images = this._options.get('images');
    var element = this._options.get('element');
    var control_factory = this._options.get('control_factory');
   
    if (element)
      this._element = $(element);
    else
      this._element = this._install_element(input, type);

    if (control_factory) {
      this._control = control_factory(
        type, this._element, input, images
      );
    } else{
      this._control = this._control_factory(
        type, this._element, input, images
      );
    }

    if (input.name)
      Element.addClassName(this._element, 'shiny-' + input.name);

    this._mirror = 
      new Shiny.Mirror([this._control, input, this._element]);

    return this;
  },

  teardown: function($super, unhide /* = false */)
  {
    this.teardown_one(this._mirror);
    this.teardown_one(this._control);

    var elt = this._element;

    if (elt && elt.parentNode && Element.hasClassName(elt, 'shiny-js'))
      elt.parentNode.removeChild(elt);

    if (unhide)
      Element.removeClassName(this.get_container(), 'hidden');

    Element.removeClassName(this.get_container(), 'shiny-js');
    this._element = null;

    return $super();
  },

  /* protected: */
  _install_element: function(input, type)
  {
    var elt = this._element_factory(input, type);

    Element.addClassName(elt, type);
    Element.addClassName(input, 'hidden');
    input.parentNode.insertBefore(elt, input);

    return elt;
  },

  _element_factory: function(input, type)
  {
    var rv = null;

    switch (type)
    {
      case 'button':
        rv = document.createElement('a');
        Element.addClassName(rv, 'button');
        var span = document.createElement('span');
        Element.addClassName(span, 'interior');
        var label = document.createElement('label');
        label.innerHTML = input.innerHTML;
        span.appendChild(label);
        rv.appendChild(span);
        break;

      case 'text': case 'radio':
      case 'checkbox': case 'select':
      default:
        rv = new Image();
        break;
    }

    rv.className = input.className + ' ' + rv.className;

    if (!Element.hasClassName(rv, 'shiny'))
      Element.removeClassName(rv, 'hidden');

    Element.addClassName(rv, 'shiny-js');

    return rv;
  },

  _image_factory: function(type, elt, input)
  {
    if (Element.hasClassName(input, 'arrow')) {
      return {
        normal: Shiny.Assets.Images.get('arrow'),
        active: Shiny.Assets.Images.get('arrow-active'),
        focused: Shiny.Assets.Images.get('arrow-focused')
      };
    }

    switch (type)
    {
      case 'select':
        return {
          normal: Shiny.Assets.Images.get('arrow-vertical'),
          active: Shiny.Assets.Images.get('arrow-vertical-active'),
          focused: Shiny.Assets.Images.get('arrow-vertical-focused')
        };
        break;
      case 'radio':
        return {
          normal: Shiny.Assets.Images.get('radio'),
          active: Shiny.Assets.Images.get('radio-active'),
          focused: Shiny.Assets.Images.get('radio-focused')
        };
        break;
      case 'checkbox':
        return {
          normal: Shiny.Assets.Images.get('checkbox'),
          active: Shiny.Assets.Images.get('checkbox-active'),
          focused: Shiny.Assets.Images.get('checkbox-focused')
        };
        break;
      default:
        break;
    }

    return null;
  },

  _control_factory: function(type, elt, input, images)
  {
    switch (type)
    {
      case 'button':
        return new Shiny.Button(elt, input);
        break;
      case 'select':
        return new Shiny.Select(
          elt, input, (images || this._image_factory(type, elt, input))
        );
        break;
      case 'radio':
        return new Shiny.Radio(
          elt, input, (images || this._image_factory(type, elt, input))
        );
        break;
      case 'checkbox':
        return new Shiny.Checkbox(
          elt, input, (images || this._image_factory(type, elt, input))
        );
        break;
      default:
        break;
    };

    return null;
  }

});


/* static: */
Shiny.Facade.get_valid_types = function()
{
  return {
    radio: true, checkbox: true,
    select: true, button: true, hidden: true
  };
};


Shiny.Facade.is_eligible = function(elt)
{
  var type = Shiny.Facade.compute_type(elt);
  var valid_types = Shiny.Facade.get_valid_types();

  return (
    Element.hasClassName(elt, 'shiny')
      && type != 'hidden' && valid_types[type] == true
  );
};


Shiny.Facade.compute_type = function(elt)
{
  var type = (elt.type || 'unknown');
  var tag = (elt.tagName || '').toLowerCase();

  switch (tag) {
    case 'select':
      type = 'select'; break;
    case 'button':
      type = 'button'; break;
    case 'textarea':
      type = 'text'; break;
  }
  
  switch (type) {
    case 'reset':
    case 'submit':
      type = 'button'; break;
  }

  return type;
}



/**
    Shiny.Form:
      Applies a Shiny.Facade to every DOM input element that reachable (via
      extensible recursion) from the container root (defined by
      Shiny.Container).
**/

Shiny.Form = Class.create(Shiny.Container,
{
  /* public: */
  initialize: function($super, id, options)
  {
    /* private: */
    this._facades = [ ];
    /* */

    $super(id, options);
    return this.setup(id, options);
  },

  setup: function($super, id, options)
  {
    $super(id, options);

    var children = this.get_container().childElements();

    for (var i = 0, len = children.length; i < len; ++i) {
      this._install_form_child(children[i]);
    }

    return this;
  },

  teardown: function()
  {
    this.teardown_all(this._facades);
    return this;
  },

  /* protected: */
  _install_form_child: function(child)
  {
    if (Shiny.Facade.is_eligible(child))
      this._facades.push(new Shiny.Facade(child));
   
    Shiny.Recursion.extensible(
      child, this._install_form_child.bind(this)
    );

    return this;
  }

});



/**
    Shiny.Control:
      The base class for form/input controls implemented by Shiny.
**/

Shiny.Control = Class.create(Shiny.Container, Shiny.Events.prototype,
{
  /* public: */
  initialize: function($super, id, images, options)
  {
    $super(id, options);
    this.$initialize_control(id, images, options);

    return this.setup(id, images, options);
  },

  $initialize_control: function($super, id, images, options)
  {
    /* public: */
    this.tagName = 'input';
    /* */

    /* private: */
    this._images = $Hash(images, 'normal');
    this._in_progress = null;
    /* */

    return this.$initialize_events();
  },

  setup: function($super, id, options)
  {
    if (!$super(id, options))
      return false;

    this._selected = false;
    this._in_progress = false;

    this.get_container().addClassName('control');
    return this;
  },

  teardown: function($super)
  {
    if (!$super())
      return false;

    this._in_progress = false;
    return this;
  },

  get_images: function(key)
  {
    return this._images.get(key || 'normal');
  },

  set_images: function(images)
  {
    return (this._images = $Array(images));
  },

  get_value: function()
  {
    return null;
  },

  set_value: function(v)
  {
    return v;
  },

  is_selected: function()
  {
    return this._selected;
  },

  set_selected: function(value)
  {
    this._selected = (value ? true : false);
    return this;
  },

  is_focused: function()
  {
    return this._focused;
  },

  /* callbacks: */
  click: function(ev)
  {
    return true;
  },
  
  change: function(ev)
  {
    return true;
  },
  
  focus: function(ev)
  {
    this._focused = true;
    return this._focus_element(this.get_container());
  },
  
  blur: function(ev)
  {
    this._focused = false;
    return this._blur_element(this.get_container());
  },
  
  mousedown: function(ev)
  {
    return this._grab_element(this.get_container());
  },
  
  mouseup: function(ev)
  {
    return this._release_element(this.get_container());
  },

  /* protected: */
  _is_in_progress: function()
  {
    return this._in_progress;
  },

  _set_in_progress: function(value)
  {
    this._in_progress = (value ? true : false);
  },

  _handle_enable: function(elt, cl, evt, value)
  {
    if (!Element.hasClassName(elt, cl)) {
      Element.addClassName(elt, cl);
      this.trigger_event(evt);
    }

    if (value !== null)
      this.set_value(value);

    return true;
  },

  _handle_disable: function(elt, cl, evt, value)
  {
    if (Element.hasClassName(elt, cl)) {
      Element.removeClassName(elt, cl);
      this.trigger_event(evt);
    }

    if (value !== null)
      this.set_value(value);

    return true;
  },

  _select_element: function(elt, value)
  {
    this._selected = true;
    return this._handle_enable(elt, 'selected', 'select', value);
  },

  _unselect_element: function(elt, value)
  {
    this._selected = false;
    return this._handle_disable(elt, 'selected', 'unselect', value);
  },

  _focus_element: function(elt)
  {
    return this._handle_enable(elt, 'focused', 'focus');
  },

  _blur_element: function(elt)
  {
    return this._handle_disable(elt, 'focused', 'blur');
  },

  _grab_element: function(elt)
  {
    return this._handle_enable(elt, 'grabbed', 'grab');
  },

  _release_element: function(elt)
  {
    return this._handle_disable(elt, 'grabbed', 'release');
  }

});


/**
    Shiny.Control.Guard:
      Use a checkbox control to "guard" (i.e. enable or disable)
      a set of controls that support the 'disabled' property.
**/

Shiny.Control.Guard = Class.create(Shiny.Container, {

   /* public: */
  initialize: function($super, id, elements, options)
  {
    $super(id, options);
    this._elements = null;
    return this.setup(id, elements);
  },

  setup: function($super, id, elements, options)
  {
    if (!$super(id, options))
      return false;

    this._elements = $Array(elements).map(function(e) {
      return $(e);
    });

    this._input_observer = this.sync.bind(this);
    Event.observe(this.get_container(), 'change', this._input_observer);

    return this.sync();
  },

  teardown: function($super)
  {
    if (!$super())
      return false;

    this._elements = null;
    Event.unobserve(this.get_container(), 'change', this._input_observer);

    return this;
  },

  /* protected: */
  sync: function()
  {
    var c = this.get_container();

    for (var i = 0, len = this._elements.length; i < len; ++i)
      this._elements[i].disabled = !c.checked;

    return this;
  }

});



/**
    Shiny.Resizer:
      A reflow-based resize control, operating on one
      or more DOM elements.
**/

Shiny.Resizer = Class.create(Shiny.Control,
{
  /* public: */
  initialize: function($super, id, options)
  {
    /* private: */
    this._element = null;
    this._draggable = null;
    this._extent_key = null;
    this._offset_key = null;
    this._min_extent = null;
    this._style_assets = null;
    this._element_offset = null;
    this._element_extent = null;
    this._container_extent = null;
    this._reflect_elts = null;
    this._reflect_index = null;
    this._reflect_extents = null;
    this._reflect_finished = null;
    this._reflect_style_assets = null;
    this._position = null;
    this._direction = null;
    this._containment = null;
    this._containment_classname = null;
    this._use_percentages = null;
    this._scroll_adjust = null;
    this._mirror_inputs = null;
    /* */

    this.$initialize_control(id, null, options);
    return this.setup(id, options);
  },


  /* protected: */
  setup: function($super, id, options)
  {
    $super(id, options);

    var c = this.get_container();

    if (Prototype.Browser.IE)
      c.setOpacity(0);

    Shiny.Options.Processor.scroll(this._options);

    if (c.hasClassName('horizontal')) {
      this._options.set('direction', 'horizontal');
    } else if (c.hasClassName('vertical')) {
      this._options.set('direction', 'vertical');
    }

    this._min_extent = 64;
    this._mirror_inputs = $H({ });
    this._reflect_finished = false;
    this._reflect_style_assets = new Array();
    this._position = this._options.get('position');
    this._direction = this._options.get('direction');
    this._use_percentages = this._options.get('use_percentages');

    this._scroll_adjust =
      (parseInt(this._options.get('scroll_adjust')) || 0);

    var ct = Shiny.Options.Processor.containment(this._options);
    this._containment = ct[0]; this._containment_classname = ct[1];

    switch (this._containment) {
      case 'parent':
        this._element = c.parentNode; break;
      case 'successor':
        this._element = this._select_containment_element(
          c.nextSiblings()
        ); break;
      case 'predecessor':
        this._element = this._select_containment_element(
          c.previousSiblings()
        ); break;
    }

    if (!this._element) {
      Shiny.Log.warning(
        'Shiny.Resizer', 'setup', 'Unable to locate element'
      );
      return this;
    }

    if (this._direction == 'horizontal')
      { this._offset_key = 0; this._extent_key = 'width'; }
    else
      { this._offset_key = 1; this._extent_key = 'height'; }

    var reflect = this._options.get('reflect');

    if (reflect)
      this._reflect_elts = $Array(reflect).map(function(e) { return $(e); });

    var css_selector = this._options.get('css_selector');

    if (css_selector)
      this._style_asset = Shiny.Assets.Style.get(css_selector);

    var reflect_selector = this._options.get('reflect_css_selector');

    if (reflect_selector) {
      this._reflect_style_assets = $Array(reflect_selector).map(function(s) {
        return Shiny.Assets.Style.get(s);
      });
    }

    var draggable_options = {
      constraint: this._direction,
      overlap: this._direction,
      snap: this._options.get('snap'),
      scroll: this._options.get('scroll'),
      onStart: this._recalculate.bind(this),
      onDrag: this._resize.bind(this),
      revert: this._revert.bind(this),
      starteffect: Prototype.emptyFunction,
      endeffect: Prototype.emptyFunction
    };

    Element.makePositioned(this._element);
    Shiny._resizer_instance_cache.set(this._element.id, this);

    this._install_mirror_inputs(this._element);
    this._draggable = new Draggable(c, draggable_options);

    if (this._reflect_elts) {
      for (var i = 0, len = this._reflect_elts.length; i < len; ++i)
        this._install_mirror_inputs(this._reflect_elts[i]);
    }

    return this.sync();
  },

  teardown: function($super)
  {
    this._draggable.destroy();
    this.teardown_all(this._style_assets);
    Shiny._resizer_instance_cache.unset(this._element.id);

    return $super();
  },

  sync: function()
  {
    var element_id = this._element.id;

    /* Give priority to hidden <input> elements:
        We do this by overwriting the locally-cached value. */

    var mirror_inputs = this._mirror_inputs.get(element_id);

    if (mirror_inputs) {
      for (var i = 0, len = mirror_inputs.length; i < len; ++i) {
        var extent = (mirror_inputs[i].value || '');

        if (extent != '')
          Shiny._resizer_extent_cache.set(element_id, extent);
      }
    }

    /* Apply extent from the local cache */
    var last_extent = Shiny._resizer_extent_cache.get(element_id);

    if (last_extent) {
      this._apply_extent_raw(this._element, last_extent, this._style_asset);
    }

    /* Synchronize reflected elements:
        Don't cache these, as we aren't their owner. */

    if (this._reflect_elts) {
      for (var i = 0, len = this._reflect_elts.length; i < len; ++i) {
        var reflect_elt = this._reflect_elts[i];
        var mirror_inputs = this._mirror_inputs.get(reflect_elt.id);

        for (var j = 0, len2 = mirror_inputs.length; j < len2; ++j) {
          var extent = (mirror_inputs[j].value || '');

          if (extent != '') {
            this._apply_extent_raw(
              this._reflect_elts[i], extent, this._reflect_style_assets[i]
            );
          }
        }
      }
    }

    return this._recalculate();
  },


  /* protected: */
  _get_mirror_inputs: function(element_id)
  {
    return this._mirror_inputs.get(element_id);
  },

  _select_containment_element: function(elts)
  {
    var rv = elts[0];

    if (!this._containment_classname)
      return rv;

    for (var i = 0, len = elts.length; i < len; ++i) {
      if (Element.hasClassName(elts[i], this._containment_classname))
        rv = elts[i];
    }

    return rv;
  },

  _compute_container_offset: function()
  {
    var container_offset =
      this.get_container().positionedOffset()[this._offset_key];

    if (this._containment == 'parent' && this._position == 'minimal') {
      container_offset = this._element_extent
        - (container_offset + this._container_extent);
    }

    return container_offset;
  },

  _recalculate: function()
  {
    var c = this.get_container();

    this._container_extent =
      c.getDimensions()[this._extent_key];

    this._element_offset =
      Element.positionedOffset(this._element)[this._offset_key];

    this._element_extent =
      Element.getDimensions(this._element)[this._extent_key];
    
    var container_offset = this._compute_container_offset();

    this._container_adjust = (
      (this._containment == 'parent' ?
        (this._position == 'minimal' ? 0 : this._scroll_adjust)
        : (this._element_offset + this._element_extent - container_offset))
    );

    if (this._reflect_elts) {
      this._reflect_index = 0;
      var extent_accumulator = 0;
      
      this._reflect_extent_sums = this._reflect_elts.inject([0],
        function(a, e) {
          extent_accumulator += Element.getDimensions(e)[this._extent_key];
          a.push(extent_accumulator); return a;
        }.bind(this)
      );
    }

    return this;
  },

  /* private: */
  _install_mirror_inputs: function(elt)
  {
    var children = Element.childElements(elt);

    for (var i = 0, len = children.length; i < len; ++i) {
      this._install_mirror_input(elt.id, children[i]);
    }

    return this;
  },

  _install_mirror_input: function(key, elt)
  {
    var tag = (elt.tagName || '').toLowerCase();

    if (!this._mirror_inputs.get(key))
      this._mirror_inputs.set(key, []);

    if (Element.hasClassName(elt, 'resize')
        && Element.hasClassName(elt, 'persist') && tag == 'input') {

        this._mirror_inputs.get(key).push(elt);
    }

    Shiny.Recursion.extensible(
      elt, this._install_mirror_input.bind(this, key)
    );

    return this;
  },

  _apply_extent: function(element, extent, style_asset)
  {
    /* Convert units for extent, if requested */
    extent = this._convert_extent_units(element, extent);

    /* Apply converted extent */
    this._apply_extent_raw(element, extent, style_asset);

    if (element.id)
      Shiny._resizer_extent_cache.set(element.id, extent);

    return this;
  },

  _apply_extent_raw: function(element, extent, style_asset)
  {
    /* Update CSS with new extent, if requested */
    if (style_asset)
      style_asset.set(this._extent_key, extent, true);

    /* Update element extent */
    element.style[this._extent_key] = extent;
    
    /* Persist value */
    var mirror_inputs = this._get_mirror_inputs(element.id);

    if (mirror_inputs) {
      for (var i = 0, len = mirror_inputs.length; i < len; ++i)
        mirror_inputs[i].value = extent;
    }

    return this;
  },

  _convert_extent_units: function(element, extent)
  {
    var ep = element.parentNode;

    /* Use pixels by default, percentage-of-parent if requested */
    if (ep && this._use_percentages) {
      extent = (
        100.0 * (extent / Element.getDimensions(ep)[this._extent_key]) + 0.01
      ) + '%';
    } else {
      extent = extent + 'px';
    }

    return extent;
  },

  _next_reflect_element: function()
  {
    if (this._reflect_index == null)
      return null;

    if (this._reflect_index < this._reflect_elts.length - 1)
      this._reflect_index++;

    return this;
  },

  _resize: function()
  {
    var extent = 0;
    var reflect_index = this._reflect_index;
    var container_offset = this._compute_container_offset();

    if (container_offset < this._min_extent)
      return this;

    /* Save extent */
    this._last_container_offset = container_offset;

    /* Compute new pixel extent for element */
    if (this._containment == 'parent') {
      extent = (
        container_offset + this._container_extent + this._container_adjust
      );
    } else {
      extent = (
        container_offset - this._element_offset + this._container_adjust
      );
    }

    /* Multiple-element resizing */
    if (reflect_index != null) {
      var reflect_index = this._reflect_index;
      var reflect_elt = this._reflect_elts[this._reflect_index];

      if (!reflect_elt)
        return this;

      /* Apply lower bound */
      if (extent < this._min_extent)
        extent = this._min_extent;

      var available_extent =
        this._reflect_extent_sums[reflect_index + 1]
          + this._element_extent - (this._min_extent * reflect_index);

      extent = [ extent, available_extent - this._min_extent ].min();
      var reflect_extent = available_extent - extent;

      if (reflect_extent <= this._min_extent)
        { reflect_extent = this._min_extent; this._next_reflect_element(); }

      this._apply_extent(
        reflect_elt, reflect_extent,
          this._reflect_style_assets[reflect_index]
      );
    }

    /* Single-element resizing */
    this._apply_extent(this._element, extent, this._style_asset);

    /* Support resizer positioned at parent's minimum extent:
        This method of resizing depends upon a correct element_extent. */

    if (this._position == 'minimal')
      this._recalculate();

    return this;
  },

  _revert: function()
  {
    var c = this.get_container();
    c.setStyle({ top: '', left: '' });

    return false;
  }

});




/**
    Shiny.Panel:
      A collapsable, sortable, and resizable information panel.
**/

Shiny.Panel = Class.create(Shiny.Control,
{
  /* public: */
  initialize: function($super, id, options, delay_setup)
  {
    /* private: */
    this._input = null;
    this._rounds = null;
    this._shiny_form = null;
    this._elts = null;
    this._resizers = null;
    this._parent_panels = null;
    this._input_observer = null;
    this._recursive_panels = null;
    this._skip_resizer_ids = null;
    this._recursion_trigger = null;
    /* */
    
    $super(id, options);
    this.$initialize_control(id, null, options);

    if (!delay_setup)
      return this.invoke_setup();

    return this;
  },
 
  open: function()
  {
    this._lazy_install_recursive();
    return this._toggle('open', this._open_effect.bind(this));
  },

  close: function()
  {
    return this._toggle('close', this._close_effect.bind(this));
  },

  is_open: function()
  {
    return (this._elts.length > 0 && Element.visible(this._elts[0]));
  },

  change: function($super, ev)
  {
    this.sync();
    return $super(ev);
  },

  setup: function($super, elt, options)
  {
    if (!$super(elt, options))
      return false;

    if (this._options.get('duration') == null)
      this._options.set('duration', 0.5);

    if (this._options.get('round') == null)
      this._options.set('round', true);

    if (this._options.get('recursive') == null)
      this._options.set('recursive', false);

    this._elts = [ ];
    this._rounds = [ ];
    this._recursive_panels = [ ];
    this._parent_panels = this._options.get('panels');
    this._recursion_trigger = this._options.get('recursive');

    this._input_observer = this.sync.bind(this);
    this._setup_observer = this.trigger_event.bind(this, 'setup');
    this._teardown_observer = this.trigger_event.bind(this, 'teardown');

    if (this._resizers) {
      this._resizer_skip_hash = this.setup_all(this._resizers);
      this._resizers = this._resizer_skip_hash.values();
    } else {
      this._resizers = [ ];
      this._resizer_skip_hash = $H({});
    }

    var c = this.get_container();
    var children = c.childElements();

    /* Process interesting child elements */
    for (var i = 0, len = children.length; i < len; ++i) {
      this._install_panel_child(children[i]);
    }

    if (this._options.get('round')) {
      for (var i = 0, len = children.length; i < len; ++i) {
        this._install_round_child(children[i]);
      }
    }

    /* Apply theme */
    this._shiny_form = new Shiny.Form(c);
    this._sync_fast();

    this.trigger_event('setup', this);
    Shiny.Panel.track_container(this);

    return this;
  },

  teardown: function($super)
  {
    if (!$super())
      return false;

    this.teardown_one(this._shiny_form);
    this.teardown_all(this._rounds);
    this.teardown_all(this._resizers);
    this.teardown_all(this._recursive_panels);

    if (this._input) {
      Event.stopObserving(this._input, 'click', this._input_observer);
      Event.stopObserving(this._input, 'change', this._input_observer);
    }

    this._elts.clear();
    this._input = null;

    this.trigger_event('teardown', this);
    Shiny.Panel.forget_container(this);

    return this;
  },

  sync: function()
  {
    /* Events might occur between teardown and setup:
        We're not able to handle these; we'll resync during setup. */

    if (!this._input)
      return this;

    if (this.is_open()) {
      if (this._input && !this._input.checked)
        this.close();
    } else {
      if (this._input && this._input.checked)
        this.open();
    }

    return this;
  },

  update: function($super, id, base_url, options, internal_options)
  {
    options = $H(options || {});
    internal_options = $H(internal_options || {});

    var onComplete = (options.get('onComplete') || Prototype.emptyFunction);

    options.set(
      'onComplete', onComplete.wrap(function(next) {
        next(); this._parent_panels.reset_sortable();
      }.bind(this))
    );
 
    if (this._parent_panels && !internal_options.get('updating'))
      this._parent_panels.update_others(this, options, internal_options);

    return $super(id, base_url, options);
  },

  /* protected: */
  _install_round_child: function(child)
  {
    /* Round corners:
        This includes logic to prevent multiple invocations. */

    if (child.hasClassName('round')) {
      if (!child.hasClassName('shiny-round')) {
        child.addClassName('shiny-round');
        this._rounds.push(new Shiny.Round(child));
      }
    }

    Shiny.Recursion.extensible(
      child, this._install_round_child.bind(this)
    );

    return this;
  },

  _install_panel_child: function(child)
  {
    var id = child.id;
    var tag = (child.tagName || '').toLowerCase();

    if (child.hasClassName('body')) {

      /* Panel content */
      this._elts.push(child);
    }
    else if (tag != 'input' && child.hasClassName('resize')) {
      
      /* Resize Handle */
      if (!this._resizer_skip_hash.get(id)) {
        this._resizers.push(new Shiny.Resizer(child, {
          scroll: this._options.get('scroll'),
          containment: [ 'predecessor', 'region' ]
        }));
      }
    }
    else if (!this._input && child.hasClassName('title') && tag == 'input'
              && ['checkbox', 'radio'].include(child.type)) {

      /* Panel title */
      this._input = child;
      Event.observe(child, 'click', this._input_observer);
      Event.observe(child, 'change', this._input_observer);
    }

    Shiny.Recursion.extensible(
      child, this._install_panel_child.bind(this)
    );

    return this;
  },

  _lazy_install_recursive: function()
  {
    if (this._recursion_trigger) {

      var children = this.get_container().childElements();
      this._recursion_trigger = null;

      for (var i = 0, len = children.length; i < len; ++i) {
        this._install_recursive(children[i]);
      }
    }

    return this;
  },

  _install_recursive: function(child)
  {
    if (child.hasClassName('panels')) {

      var options = this._options;

      var panels = new Shiny.Panels(child, options, true /* Delay setup */);

      panels.observe('setup', this._setup_observer);
      panels.observe('teardown', this._teardown_observer);
      panels.invoke_setup();

      this._recursive_panels.push(panels);
    }

    Shiny.Recursion.extensible(
      child, this._install_recursive.bind(this)
    );

    return this;
  },

  _sync_fast: function()
  {
    if (this._input && this._input.checked) {
      this._lazy_install_recursive();

      for (var i = 0, len = this._elts.length; i < len; ++i)
        Element.show(this._elts[i]);
    } else {
      for (var i = 0, len = this._elts.length; i < len; ++i)
        Element.hide(this._elts[i]);
    }

    return this;
  },

  _open_effect: function(elt, event)
  {
    if (Shiny.Browser.Preferences.use_animations) {

      var duration = this._options.get('duration');

      Effect.BlindDown(elt, {
        duration: duration,
        afterFinish: this._finish_toggle.bind(this, event)
      });

      if (Shiny.Browser.Preferences.use_transparency) {
        Effect.Appear(elt, { duration: duration });
      }

    } else {

      Element.show(elt);
      this._finish_toggle(event);
    } 

    return this;
  },

  _close_effect: function(elt, event)
  {
    if (Shiny.Browser.Preferences.use_animations) {
    
      var duration = this._options.get('duration');

      if (Shiny.Browser.Preferences.use_transparency) {
        Effect.Fade(elt, { duration: duration });
      }

      Effect.BlindUp(elt, {
        duration: duration,
        afterFinish: this._finish_toggle.bind(this, event)
      });

    } else {
      Element.hide(elt);
      this._finish_toggle(event);
    }

    return this;
  },

  _toggle: function(event_name, effect_fn)
  {
    /* Block concurrent execution */
    if (this._is_in_progress())
      return false;

    this._set_in_progress(true);

    for (var i = 0, len = this._elts.length; i < len; ++i)
      effect_fn(this._elts[i], event_name);

    this.trigger_event('before-' + event_name);
    return this;
  },

  _finish_toggle: function(event_name)
  {
    this._set_in_progress(false);
    this.trigger_event(event_name);
    this.sync();

    return this;
  }

});

Shiny.Panel = Object.extend(Shiny.Panel, Shiny.Container.Registry);



/**
    Shiny.Collection:
      Base class (or mix-in) for that allows an appropriately-labelled
      DOM subtree to act as an unordered set of tuples. A (not necessarily
      proper) subset of these tuples can be selected at any given time.
**/

Shiny.Collection = Class.create(Shiny.Container, Shiny.Events.prototype,
{
  /* protected: */
  initialize: function($super, id, options)
  {
    if (!$super(id, options))
      return false;

    this.$initialize_events();
    return this.$initialize_collection(id, options);
  },

  $initialize_collection: function(id, options)
  {
    this._facades = null;
    this._recursive_collections = null;

    this.setup(id, options);
    this._panels = this._options.get('panels');

    this._setup_observer = this._handle_setup.bind(this);
    this._teardown_observer = this._handle_teardown.bind(this);

    if (this._panels) {
      this._panels.observe('setup', this._setup_observer);
      this._panels.observe('teardown', this._teardown_observer);
    }

    Shiny.Collection.track_container(this);
    return this;
  },

  setup: function($super, id, options)
  {
    if (!$super(id, options))
      return false;

    return this.$setup_collection();
  },

  $setup_collection: function()
  {
    this._facades = [ ];
    this._recursive_collections = [ ];

    var children = this.get_container().childElements();

    for (var i = 0, len = children.length; i < len; ++i)
      this._install_child(children[i]);

    this.trigger_event('setup', this);
    return this;
  },

  teardown: function($super)
  {
    if (!$super())
      return this;

    this.teardown_all(this._facades);
    this.teardown_all(this._recursive_collections);

    this.trigger_event('teardown', this);

    Shiny.Collection.forget_container(this);
    return this;
  },

  /* private: */
  _handle_teardown: function(panels)
  {
    if (this.is_affected_by_update(panels))
      return this.teardown_self();
  },

  /* protected: */
  _handle_setup: function(panels)
  {
    if (this.is_affected_by_update(panels))
      return this.setup_self();
  },

  _install_child: function(child)
  {
    if (Element.hasClassName(child, 'tuple')) {
      Shiny.Recursion.extensible(
        child, this._install_child_input.bind(this, child)
      );
    } else {
      Shiny.Recursion.extensible(
        child, this._install_child.bind(this)
      );
    }

    return this;
  },

  _install_child_input: function(child, input)
  {
    if (Element.hasClassName(input, 'selector')) {
      this._facades.push(
        new Shiny.Facade(input, {
          element: child, control_factory: function(t, e, i) {
            return new Shiny.Collection.Tuple(e, i, {
              onChange: function(input) {
                this.trigger_event('change');
                this.trigger_callback('onChange', this._options);
              }.bind(this)
            });
          }.bind(this)
        })
      );
    } else {
      Shiny.Recursion.extensible(
        input, this._install_child_input.bind(this, child)
      );
    }

    return this;
  }

});

Shiny.Collection = Object.extend(Shiny.Collection, Shiny.Container.Registry);



/**
    Shiny.Collection.Tuple:
**/

Shiny.Collection.Tuple = Class.create(Shiny.Control,
{
  /* public: */
  initialize: function($super, id, input, options)
  {
    this.$initialize_control(id, null, options);

    /* private: */
    this._elts = null;
    this._input = null;
    this._selection_color = null;
    this._background_color = null;
    /* */

    /* private: */
    this._selection_style =
      new Shiny.Asset.Style.Reflected('selection');
    /* */

    return this.setup(id, input, options);
  },

  setup: function($super, id, input, options)
  {
    if (!$super(id, options))
      return false;

    var c = this.get_container();

    this._elts = [ ];
    this._input = input;
    this._background_color = c.getStyle('background-color').parseColor();

    this._selection_color =
      this._selection_style.get('background-color').parseColor();

    this._mouse_observer = this._handle_mouseover.bind(this);
    Event.observe(c, 'mouseover', this._mouse_observer);

    Shiny.Recursion.extensible(
      c, this._install_recursive_elt.bind(this)
    );

    Element.addClassName(c, this._input.type);
    Shiny.Collection.Tuple.track_container(this);

    return this.sync(true);
  },

  teardown: function($super)
  {
    if (!$super())
      return false;

    var c = this.get_container();

    for (var i = 0, len = this._elts.length; i < len; ++i)
      this.remove_sink('click', this._elts[i]);
    
    Event.stopObserving(c, 'mouseover', this._mouse_observer);

    this._elts = null;
    this._mouse_observer = null;
    this._unselect_element(c, true);

    Shiny.Collection.Tuple.forget_container(this);
    return this;
  },

  /* callbacks: */
  keyup: function(ev)
  {
    if (Prototype.Browser.WebKit) {
      if (this._input.type == 'radio')
        return this.change(ev);
    }

    return true;
  },

  keydown: function(ev)
  {
    if (Prototype.Browser.WebKit) {
      if (this._input.type == 'radio')
        return this.change(ev);
    }

    return true;
  },

  change: function($super, ev)
  {
    this.sync();
    this._input.focus();

    if (ev && ['change', 'keydown'].include(ev.type)) {
      this.trigger_event('change', this._input);
      this.trigger_callback('onChange', this._options, this._input);
    }

    return $super(ev);
  },

  click: function($super, ev)
  {
    this._input.focus();
    return $super(ev);
  },

  /* public: */
  sync: function(skip_animation)
  {
    var c = this.get_container();

    if (this._input.type == 'radio')
      Shiny.Radio.unselect_all_except(this, c, this._input, true);

    if (this._input.checked)
      this._select_element(c, skip_animation);
    else
      this._unselect_element(c, skip_animation);

    return this;
  },

  /* protected: */
  _select_element: function($super, elt, skip_animation)
  {
    if (this._input.type == 'radio')
      skip_animation = true;

    if (Shiny.Browser.Preferences.use_animations && !skip_animation) {

      new Effect.Highlight(elt, {
        restorecolor: this._selection_color, duration: 0.25,
        startcolor: this._background_color, endcolor: this._selection_color
      });

    } else {
      elt.style.backgroundColor = this._selection_color;
    }

    Element.addClassName(elt, 'selected');
    return $super();
  },

  _unselect_element: function($super, elt, skip_animation)
  {
    if (this._input.type == 'radio')
      skip_animation = true;

    if (Shiny.Browser.Preferences.use_animations && !skip_animation) {

      new Effect.Highlight(elt, {
        restorecolor: this._background_color, duration: 0.25,
        endcolor: this._background_color, startcolor: this._selection_color
      });

    } else {
      elt.style.backgroundColor = '';
    }

    Element.removeClassName(elt, 'selected');
    return $super();
  },

  /* private: */
  _install_recursive_elt: function(elt)
  {
    if (Element.hasClassName(elt, 'i0')) {
      this.install_sink('click', elt);
      this._elts.push(elt);
    }

    Shiny.Recursion.extensible(
      elt, this._install_recursive_elt.bind(this)
    );
  },

  _handle_mouseover: function(ev)
  {
    /** **/
    return true;
  }

});

Shiny.Collection.Tuple = Object.extend(Shiny.Collection.Tuple, Shiny.Container.Registry);



/**
    Shiny.Collection.Header:
**/

Shiny.Collection.Header = Class.create(Shiny.Container, Shiny.Events.prototype,
{
  /* public: */
  initialize: function($super, id, collection, options)
  {
    /* private: */
    this._inputs = null;
    this._facades = null;
    this._resizers = null;
    this._resizer_skip_hash = null;
    this._input_blur_observers = null;
    this._input_focus_observers = null;
    this._input_change_observers = null;
    this._sort_input_offset = null;
    /* */

    /* private: */
    this._collection = collection;
    this._style_assets = [];
    
    this._selection_style =
      new Shiny.Asset.Style.Reflected('selection-light');
    /* */

    this._setup_observer = this.setup_self.bind(this);
    this._teardown_observer = this.teardown_self.bind(this);

    if (this._collection) {
      this._collection.observe('setup', this._setup_observer);
      this._collection.observe('teardown', this._teardown_observer);
    }

    $super(id, options);
    return this.setup(id, options);
  },

  setup: function($super, id, options)
  {
    if (!$super(id, options))
      return false;

    this._inputs = [];
    this._facades = [];
    this._input_blur_observers = [];
    this._input_focus_observers = [];
    this._input_change_observers = [];
    this._sort_images = Shiny.Assets.Images.get('sort');

    if (this._options.get('duration') == null)
      this._options.set('duration', 0.5);

    var elts = this._find_child_elements();

    Sortable.create(this.get_container_id(), {
      overlap: 'horizontal', constraint: 'horizontal', animate: false,
      elements: elts.slice(1), format: /^(.*)$/,
      starteffect:
        Shiny.Options.Processor.starteffect(this._options),
      onReorder:
        this._handle_header_reorder.bind(this)
    });

    this._install_resizers(elts);
    this._install_sort_inputs(elts);
    return this;
  },

  teardown: function($super)
  {
    if (!$super())
      return false;

    this.unobserve_all(
      this._inputs, 'blur', this._input_blur_observers
    );

    this.unobserve_all(
      this._inputs, 'focus', this._input_focus_observers
    );

    this.unobserve_all(
      this._inputs, 'shiny:change', this._input_change_observers
    );

    this._teardown_resizers();
    this.teardown_all(this._facades);

    Sortable.destroy(this.get_container_id());

    /* Omitted intentionally:
        this.teardown_all(this._style_assets) */

    return this;
  },

  /* protected: */
  _reinstall_resizers: function()
  {
    var elts = this._find_child_elements();

    this._teardown_resizers();
    return this._install_resizers(elts);
  },

  _teardown_resizers: function()
  {
    this.teardown_all(this._resizers);
    this._resizers = null;

    return this;
  },

  _handle_input_change: function(ev)
  {
    console.log('here');
    this.trigger_callback('onChange', this._options);
    return true;
  },

  _handle_input_focus: function(ev, style_asset)
  {
    style_asset.set(
      'background-color',
        this._selection_style.get('background-color').parseColor()
    );

    return true;
  },

  _handle_input_blur: function(ev, style_asset)
  {
    style_asset.set('background-color', 'transparent');
    return true;
  },

  _handle_header_reorder: function(elt, id_sequence)
  {
    this.trigger_callback('onReorder', this._options, elt, id_sequence);
    return this._reinstall_resizers();
  },

  _find_child_elements: function()
  {
    return this.get_container().childElements().select(
      function(e) {
        return (
          e.style.visibility != 'hidden' || e.style.position == 'absolute'
        );
      }
    );
  },

  /* private: */
  _install_resizers: function(elts)
  {
    if (this._resizers) {
      this._resizer_skip_hash = this.setup_all(this._resizers);
      this._resizers = this._resizer_skip_hash.values();
    } else {
      this._resizers = [ ];
      this._resizer_skip_hash = $H({});
    }

    if (!elts)
      elts = this._find_child_elements();

    for (var i = 0, len = elts.length; i < len; ++i) {
      Shiny.Recursion.extensible(
        elts[i], this._install_resizer_child.bind(this, elts[i], elts, i)
      );
    }

    return this;
  },

  _install_resizer_child: function(elt, elts, offset, resize_elt)
  {
    if (Element.hasClassName(resize_elt, 'resize')) {

      var id = this._collection.get_container_id();
      var reflect_elts = elts.slice(offset + 1).reverse();
      var reflect_length = reflect_elts.length;

      if (!this._resizer_skip_hash.get(id)) {
        var r = new Shiny.Resizer(resize_elt, {
          reflect: reflect_elts, use_percentages: true,
          containment: 'parent', direction: 'horizontal',
          css_selector: this._format_css_selector(id, offset),
          reflect_css_selector: reflect_elts.map(function(x, i) {
            return this._format_css_selector(id, offset + reflect_length - i);
          }.bind(this))
        });

        this._resizers.push(r);
      }
    }

    return this;
  },

  _install_sort_inputs: function(elts)
  {
    if (!elts)
      elts = this._find_child_elements();

    this._sort_input_offset = 0;

    for (var i = 0, len = elts.length; i < len; ++i) 
      this._install_sort_input(elts[i]);

    return this;
  },

  _install_sort_input: function(elt)
  {
    if ((elt.tagName || '').toLowerCase() == 'select') {

      var style_asset = Shiny.Assets.Style.get(
        this._format_css_selector(
          this._collection.get_container_id(),
          this._sort_input_offset, 'label'
        )
      );

      this._sort_input_offset++;
      this._style_assets.push(style_asset);

      var change_observer =
        this._handle_input_change.bindAsEventListener(this);

      var blur_observer =
        this._handle_input_blur.bindAsEventListener(this, style_asset);

      var focus_observer =
        this._handle_input_focus.bindAsEventListener(this, style_asset);

      Event.observe(elt, 'blur', blur_observer);
      Event.observe(elt, 'focus', focus_observer);
      Event.observe(elt, 'shiny:change', change_observer);

      this._input_change_observers.push(change_observer);
      this._input_blur_observers.push(blur_observer);
      this._input_focus_observers.push(focus_observer);

      this._facades.push(
        new Shiny.Facade(elt, { images: Shiny.Assets.Images.get('sort') })
      );
      
      this._inputs.push(elt);
    }

    Shiny.Recursion.extensible(
      elt, this._install_sort_input.bind(this)
    );

    return this;
  },

  _format_css_selector: function(id, offset, extra)
  {
    return ('#' + id + ' .i' + offset + ' ' + (extra || ''));
  }

});



/**
    Shiny.Transform:
      Provides for efficient matrix-based transforms over
      multidimensional ordered sets of DOM elements.
**/

Shiny.Transform = Class.create(Shiny.Container,
{
  /* public: */
  initialize: function($super, id, matrix, dimensions, mask, options)
  {
    $super(id, options);
    return this.setup(id, matrix, dimensions, mask, options);
  },

  setup: function(id, matrix, dimensions, mask, options)
  {
    this.$setup_container(id, options);

    this._mask = mask;
    this._matrix = $A(matrix);
    this._dimensions = parseInt(dimensions);
    this._width = this._dimensions + 1;
    this._height = Math.floor(this._matrix.length / this._width);

    return this;
  },

  /* protected: */
  _apply: function(point)
  {
    point.push(1); /* Homogeneous coordinates */
    return this._multiply(point, 1);
  },

  _multiply: function(matrix, width)
  {
    matrix = $A(matrix);

    var rv = [];
    var sum = 0, base = 0;

    /* General matrix multiplication - from definition */
    for (var row = 0, len = this._height; row < len; row++) {
      for (var col = 0; col < width; col++) {
        for (var i = 0, sum = 0; i < this._width; ++i) {
          sum += this._matrix[base + i] * matrix[i * width + col];
        }
        rv.push(sum);
      }
      base += this._height;
    }

    return $A(rv);
  }

});



/**
    Shiny.Panels:
      A set of one or more collapsable, sortable, and resizable
      information panels.
**/

Shiny.Panels = Class.create(Shiny.Container, Shiny.Events.prototype,
{
  /* public: */
  initialize: function($super, id, options, delay_setup)
  {
    /* private: */
    this._panels = null;
    this._accept = null;
    this._reparent = null;
    this._ajax_uri = null;
    this._accept_elts = null;
    this._drag_elts = null;
    this._drag_mirror_inputs = null;
    this._order_mirror_inputs = null;
    this._sortable_elt = null;
    this._sortable_options = null;
    /* */

    $super(id, options);
    this.$initialize_events();

    if (!delay_setup)
      return this.invoke_setup();
    
    return this;
  },

  get: function(i)
  {
    return this._panels[i];
  },

  get_all: function()
  {
    return this._panels.slice(0); /* Shallow Copy */
  },

  /* protected: */
  setup: function($super, id, options)
  {
    if (!$super(id, options))
      return false;

    var c = this.get_container();
    var c_id = this.get_container_id();

    this._panels = [ ];
    this._drag_elts = [ ];
    this._drag_mirror_inputs = [ ];
    this._order_mirror_inputs = [ ];

    this._before_open_observer = this.sync.bind(this);
    this._setup_observer = this.trigger_event.bind(this, 'setup');
    this._teardown_observer = this.trigger_event.bind(this, 'teardown');

    Shiny.Options.Processor.scroll(this._options, c);

    if (this._options.get('duration') == null)
      this._options.set('duration', 0.5);

    var children = c.childElements();

    /* Find each panel's enclosing <div> */
    for (var i = 0, len = children.length; i < len; ++i)
      this._install_panels_child(children[i]);

    /* Find initial order */
    this.set_id_sequence(this._panels.invoke('get_container_id'));

    if (this._options.get('sortable')) {

      /* Reparenting rules - indexed by container id */
      this._reparent = $Hash(this._options.get('reparent'), c_id);

      /* Skip rules for Sortable - indexed by container id */
      this._no_reorder = $Hash(this._options.get('no_reorder'), c_id);

      if (!this._no_reorder.get(c_id)) {

        /* Compute containment restrictions:
            These influence where a particular element can be dropped. */

        this._accept_elts = [ 'shiny', c ];
        var containment = this._accept_elts;
        var accept = this._options.get('accept');

        if (accept && (accept = $H(accept).get(c_id)) != null) {
          this._accept_elts = this._accept_elts.concat(accept).map(
            function(id) { return $(id); }
          );
        }

        /* Automatic AJAX support:
            Automatically update in response to reorder/drag/drop. */

        var ajax = this._options.get('ajax');

        if (ajax && (ajax = $H(ajax).get(c_id)) != null) {
          ajax = $Array(ajax);
          this._ajax_uri = ajax[0];
          this._ajax_scope = ajax[1];
        }

        /* Options for Sortable's constructor:
            See below for Sortable instansiation. */

        this._sortable_options = {
          reparent: this._reparent.get(c_id),
          scroll: this._options.get('scroll'), format: /^(.*)$/,
          animate: Shiny.Browser.Preferences.use_animations, tag: 'div',
          constraint: false, handle: 'handle', containment: containment,
          duration: this._options.get('duration'), dropOnEmpty: true,

          elements: this._panels.map(function(p) {
            return p.get_container();
          }),

          starteffect:
            Shiny.Options.Processor.starteffect(this._options),

          onEnd: function(elt) {
            this._drag_elts = [ ];
            return this.sync_inputs();
          }.bind(this),

          onStart: function(elt) {
            this._drag_elts = [ elt ];
            return this.sync_inputs();
          }.bind(this),

          onReorder: function(elt, id_sequence) {
            Shiny.Log.debug('Shiny.Panels', 'before-reorder', elt);
            this._handle_update(elt, id_sequence);
            Shiny.Log.debug('Shiny.Panels', 'after-reorder', elt);
          }.bind(this),

          canInsert: function(root, elt, drop) {
            return (
              this._accept_elts.include(root)
                && Element.hasClassName(elt, 'panel')
                && !Element.hasClassName(drop, 'no-drop')
            );
          }.bind(this)
        };

        /* Panels may be in any descendant node:
            We use the container of the first panel, or our
            own container if the first panel is unavailable. */

        var p = { };

        if (this._panels.length > 0)
          p = this._panels[0].get_container();

        this._sortable_elt = (p.parentNode || c);


        /* Create sortable:
            Use an appropriate parent node, or our container otherwise.  */

        Sortable.create(this._sortable_elt, this._sortable_options);
      }
    }

    this.trigger_event('setup', this);
    Shiny.Panels.track_container(this);

    return this.sync();
  },

  teardown: function($super)
  {
    if (!$super())
      return false;

    this._sortable_elt = null;
    this._sortable_options = null;

    this.teardown_all(this._panels);
    Sortable.destroy(this.get_container());

    this.trigger_event('teardown', this);
    Shiny.Panels.forget_container(this);

    return this;
  },

  sync: function()
  {
    for (var i = 0, len = this._panels.length; i < len; ++i)
      this._panels[i].sync();

    return this.sync_inputs();
  },

  sync_inputs: function()
  {
    var order_value = this.serialize();

    for (var i = 0, len = this._order_mirror_inputs.length; i < len; ++i) {
      if (this._order_mirror_inputs[i])
        this._order_mirror_inputs[i].value = order_value;
    }

    var drag_value = this._drag_elts.pluck('id').join(',');

    for (var i = 0, len = this._drag_mirror_inputs.length; i < len; ++i) {
      if (this._drag_mirror_inputs[i])
        this._drag_mirror_inputs[i].value = drag_value;
    }
    return this;
  },

  serialize: function()
  {
    return this.get_id_sequence().join(',');
  },

  get_id_sequence: function(previous)
  {
    return (previous ? this._prev_id_sequence : this._id_sequence);
  },

  set_id_sequence: function(id_sequence)
  {
    /* Ignore empty element identifiers */
    id_sequence = $A(id_sequence).reject(function(i) {
      return (!i);
    });

    if (this._id_sequence)
      this._prev_id_sequence = this._id_sequence;
    else
      this._prev_id_sequence = id_sequence;

    this._id_sequence = id_sequence;
    return this;
  },

  /* private: */
  _install_panels_child: function(child)
  {
    var tag = (child.tagName || '').toLowerCase();

    if (Element.hasClassName(child, 'panel')) {

      if (!child.id)
        Shiny.Log.warning('Shiny.Panels', 'Element is missing id', child);

      var options = this._options;

      var panel = new Shiny.Panel(
        child, options.merge({ panels: this }), true /* Delay setup */
      );

      panel.observe('before-open', this._before_open_observer);
      panel.observe('setup', this._setup_observer);
      panel.observe('teardown', this._teardown_observer);
      panel.invoke_setup();

      this._panels.push(panel);

    } else if (Element.hasClassName(child, 'persist')
                && tag == 'input' && Element.hasClassName(child, 'drag')) {

      this._drag_mirror_inputs.push(child);

    } else if (Element.hasClassName(child, 'persist')
                && tag == 'input' && Element.hasClassName(child, 'order')) {

      this._order_mirror_inputs.push(child);
    }

    Shiny.Recursion.extensible(
      child, this._install_panels_child.bind(this)
    );

    return this;
  },

  reset_sortable: function()
  {
    if (this._sortable_elt) {

      this._sortable_options.elements =
        this._panels.map(function(p) { return p.get_container(); }),

      Sortable.destroy(this._sortable_elt);
      Sortable.create(this._sortable_elt, this._sortable_options);
    }

    return this;
  },

  update_others: function(panel, options, internal_options)
  {
    return this._update_others(
      panel.get_container(), options, internal_options
    );
  },

  /* protected: */
  _update_others: function(elt, options, internal_options)
  {
    options = $H(options || {});
    internal_options = $H(internal_options || {});

    /* Was the panel order updated externally?
        If not, assume that the panels haven't moved. */

    if (!internal_options.get('order_updated'))
      this.set_id_sequence(this.get_id_sequence());

    var panels = this.get_all();
    var id_sequence = this.get_id_sequence();
    var prev_id_sequence = this.get_id_sequence(true);

    if (/cessors?$/.test(this._ajax_scope)) {

      var reverse = /^prede/.test(this._ajax_scope);
      var start = (reverse ? 0 : prev_id_sequence.indexOf(elt.id) + 1);

      /* All panels originally preceding dropped panel */
      for (var i = start, len = prev_id_sequence.length; i < len; ++i) {

        if (reverse && prev_id_sequence[i] == elt.id)
          break;

        var panel = Shiny.Panel.find_container(prev_id_sequence[i]);
        panel.update(null, this._ajax_uri, options, { updating: true });
      }

    } else if (/^stack/.test(this._ajax_scope)) {

      var updated = $H({});
      var reverse = /reverse$/.test(this._ajax_scope);

      /* All panels following dropped panel, before or after drag */
      [ id_sequence, prev_id_sequence ].each(function(sequence) {

        var start = (reverse ? 0 : sequence.indexOf(elt.id) + 1);

        for (var i = start, len = sequence.length; i < len; ++i) {

          if (updated.get(sequence[i]))
            continue;

          if (reverse && sequence[i] == elt.id)
            break;

          var panel = Shiny.Panel.find_container(sequence[i]);
          
          if (panel)
            panel.update(null, this._ajax_uri, options, { updating: true });

          updated.set(sequence[i], true);
        }
      }.bind(this));

    } else if (this._ajax_scope == 'each') {

      /* All other panels (but not Shiny.Panels itself) */
      for (var i = 0, len = panels.length; i < len; ++i) {

        if (panels[i].get_container_id() == elt.id)
          panels[i].update(null, this._ajax_uri, options, { updating: true });

      }
    }

    return this;
  },

  _handle_update: function(elt, id_sequence)
  {
    /* Order matters:
        The sync method uses the id sequence to determine order. */

    this.set_id_sequence(id_sequence);
    var prev_id_sequence = this.get_id_sequence(true);
    
    this.sync();

    if (!this._ajax_uri)
      return this;

    var options = {
      message: '', delay: 50 /* ms */,
      onComplete: function() {
        this.trigger_event('update', this, elt, id_sequence);
        this.trigger_callback('onUpdate', this._options, this, elt, id_sequence);
        this.reset_sortable();
      }.bind(this),
    };

    if (!this._ajax_scope || this._ajax_scope == 'whole') {

      /* Whole Shiny.Panels object */
      this.update(null, this._ajax_uri, options);

    } else {

      /* This Shiny.Panel:
          The panel instance handles update scoping using update_others. */

      var panel = Shiny.Panel.find_container(elt.id);
      panel.update(null, this._ajax_uri, options, { order_updated: true });
    }

    return this;
  }

});

Shiny.Panels = Object.extend(Shiny.Panels, Shiny.Container.Registry);



/**
    Shiny.Button:
**/

Shiny.Button = Class.create(Shiny.Control,
{
  /* public: */
  initialize: function($super, id, button, images, options)
  {
    this.$initialize_control(id, images, options);
  
    /* private: */
    this._button = null;
    /* */

    return this.setup(id, button, images, options);
  },

  setup: function($super, id, button, images, options)
  {
    $super(id, images, options);

    this._button = button;

    return this.sync();
  },

  sync: function()
  {
    return this;
  },

  /* callbacks: */
  click: function($super, ev)
  {
    this.sync();
    return $super(ev);
  },
  
  change: function($super, ev)
  {
    this.sync();
    return $super(ev);
  },

  mouseup: function($super, ev)
  {
    this.sync();
    return $super(ev);
  },

  mousedown: function($super, ev)
  {
    this.sync();
    return $super(ev);
  }

});


/**
    Shiny.Select:
**/

Shiny.Select = Class.create(Shiny.Control,
{
  /* public: */
  initialize: function($super, id, select, images, options)
  {
    this.$initialize_control(id, images, options);
  
    /* private: */
    this._select = null;
    /* */

    return this.setup(id, select, images, options);
  },

  setup: function($super, id, select, images, options)
  {
    $super(id, images, options);

    var c = this.get_container();
    c.src = this.get_images().first();

    this._select = select;

    /* Improve keyboard accessibility:
        Size <= 1 is typically rendered as a drop-down; this
        has implications for keyboard navigation on some platforms. */

    if (Element.hasClassName(select, 'hidden'))
      this._select.size = 16;

    return this.sync();
  },

  get_value: function()
  {
    return this._select.selectedIndex;
  },

  is_selected: function()
  {
    return (this._select.selectedIndex != -1);
  },

  sync: function()
  {
    this.get_container().src = this.get_images().index(
      this._select.selectedIndex
    );

    return this;
  },

  /* callbacks: */
  click: function($super, ev)
  {
    var t = ev.target;
    var tag = (t ? t.tagName.toLowerCase() : '');

    if (!['select', 'option', 'optgroup'].include(tag)) {
      this._select.selectedIndex = 
        (this._select.selectedIndex + 1) % this._select.options.length;
    }

    this.change(ev);
    this._select.focus(ev);

    return $super(ev);
  },

  change: function($super, ev)
  {
    this.sync();
    this._select.fire('shiny:change', (ev ? ev.memo : null));

    return $super(ev);
  },

  _select_element: function($super, elt)
  {
    elt.src = this.get_images().last();
    return $super(elt);
  },

  _unselect_element: function($super, elt)
  {
    elt.src = this.get_images().first();
    return $super(elt);
  }

});


/**
    Shiny.Radio:
**/

Shiny.Radio = Class.create(Shiny.Control,
{
  /* public: */
  initialize: function($super, id, radio, images, options)
  {
    this.$initialize_control(id, images, options);

    /* private: */
    this._radio = null;
    /* */

    return this.setup(id, radio, images, options);
  },

  setup: function($super, id, radio, images, options)
  {
    $super(id, images, options);

    this._radio = radio;
    this.get_container().src = this.get_images().first();

    if (this._radio.checked)
      this.change();

    return this;
  },

  get_value: function()
  {
    return (this.is_selected() ? this._radio.value : null);
  },

  is_selected: function()
  {
    return (this._radio.checked ? true : false);
  },

  set_selected: function($super, v)
  {
    this._radio.checked = (value ? true : false);
    this.change();

    return $super(v);
  },

  /* callbacks: */
  keyup: function(ev)
  {
    if (Prototype.Browser.WebKit)
      return this.change();

    return true;
  },

  focus: function($super, ev)
  {
    $super(ev);
    return this.change(ev);
  },

  blur: function($super, ev)
  {
    $super(ev);
    return this.change(ev);
  },

  click: function(ev)
  {
    this._radio.focus();
    
    /* Manually Trigger Redraw:
        Some browsers (KHTML, Webkit) don't generate a change event when
        the 'click' method is called. Rather than depend upon the unreliable
        (reflected) change event or a browser-specific test, we just call
        change directly. Double invocations of change are harmless. */

    this.change.bind(this).defer();
  },
  
  change: function($super, ev)
  {
    var c = this.get_container();

    Shiny.Radio.unselect_all_except(this, c, this._radio, true);
    this._select_element(c);

    return $super(ev);
  },

  _select_element: function($super, elt)
  {
    var key = (this.is_focused() ? 'focused' : 'normal');
    elt.src = this.get_images(key).last();

    return $super(elt);
  },

  _unselect_element: function($super, elt)
  {
    elt.src = this.get_images().first();
    return $super(elt);
  }

});


/* static: */
Shiny.Radio.unselect_all_except = function(control, elt, input, restrict)
{
  var name = input.name;
  var type = input.type;

  if (name) {

    /* Locate all members of radio group:
        Shiny.Facade maintains a CSS class name for this purpose. */

    var elts = document.getElementsByClassName('shiny-' + name);

    /* Unselect every radio button except ours */
    for (var i = 0, len = elts.length; i < len; ++i) {
      if (restrict && !Element.hasClassName(elts[i], type))
        continue;
      if (elts[i] != elt)
        control._unselect_element(elts[i], true);
    }
  }

  return true;
}



/**
    Shiny.Checkbox:
**/

Shiny.Checkbox = Class.create(Shiny.Control,
{
  /* public: */
  initialize: function($super, id, checkbox, images, options)
  {
    this.$initialize_control(id, images, options);
  
    /* private: */
    this._checkbox = null;
    /* */

    return this.setup(id, checkbox, images, options);
  },

  setup: function($super, id, checkbox, images, options)
  {
    $super(id, images, options);

    this._checkbox = checkbox;
    this.get_container().src = this.get_images().first();

    if (this._checkbox.checked)
      this.change();

    return this;
  },

  get_value: function()
  {
    return (this.is_selected() ? this._checkbox.value : null);
  },

  is_selected: function()
  {
    return (this._checkbox.checked ? true : false);
  },

  set_selected: function($super, v)
  {
    this._checkbox.checked = (value ? true : false);
    this.change();

    return $super(v);
  },

  /* callbacks: */
  focus: function($super, ev)
  {
    $super(ev);
    return this.change(ev);
  },

  blur: function($super, ev)
  {
    $super(ev);
    return this.change(ev);
  },

  click: function(ev)
  {
    this._checkbox.focus();
 
    /* Manually Trigger Redraw:
        See comment in Shiny.Radio.click() for explanation. */

    this.change.bind(this).defer();
    return true;
  },

  change: function($super, ev)
  {
    if (this._checkbox.checked) {
      return this._select_element(this.get_container());
    } else {
      return this._unselect_element(this.get_container());
    }

    return $super(ev);
  },

  _select_element: function($super, elt)
  {
    var key = (this.is_focused() ? 'focused' : 'normal');
    elt.src = this.get_images(key).last();

    return $super(elt);
  },

  _unselect_element: function($super, elt)
  {
    var key = (this.is_focused() ? 'focused' : 'normal');
    elt.src = this.get_images(key).first();

    return $super(elt);
  }

});



/**
    Shiny.Asset.Images.Focused:
**/

Shiny.Asset.Images.Focused = { };


/**
    Shiny.Asset.Images.Active:
**/

Shiny.Asset.Images.Active = { };


/**
    Shiny.Asset.Images.Vertical:
**/

Shiny.Asset.Images.Vertical = { };


/**
    Shiny.Asset.Images.Vertical.Focused:
**/

Shiny.Asset.Images.Vertical.Focused = { };


/**
    Shiny.Asset.Images.Transition:
**/

Shiny.Asset.Images.Transition = Class.create(Shiny.Asset.Images,
{
  /* public: */
  initialize: function($super)
  {
    return $super([
      '../images/blank.png', '../images/arrow-to-large.png'
    ], true);
  }
});


/**
    Shiny.Asset.Images.Arrow:
**/

Shiny.Asset.Images.Arrow = Class.create(Shiny.Asset.Images,
{
  /* public: */
  initialize: function($super)
  {
    return $super([
      '../images/arrow-closed.png', '../images/arrow-open.png'
    ]);
  }
});


/**
    Shiny.Asset.Images.Active.Arrow:
**/

Shiny.Asset.Images.Active.Arrow = Class.create(Shiny.Asset.Images,
{
  /* public: */
  initialize: function($super)
  {
    return $super([
      '../images/arrow-closed-red.png', '../images/arrow-open-red.png'
    ]);
  }
});



/**
    Shiny.Asset.Images.Focused.Arrow:
**/

Shiny.Asset.Images.Focused.Arrow = Class.create(Shiny.Asset.Images,
{
  /* public: */
  initialize: function($super)
  {
    return $super([
      '../images/arrow-closed-blue.png', '../images/arrow-open-blue.png'
    ]);
  }
});


/**
    Shiny.Asset.Images.Vertical.Arrow:
**/

Shiny.Asset.Images.Vertical.Arrow = Class.create(Shiny.Asset.Images,
{
  /* public: */
  initialize: function($super)
  {
    return $super([
      '../images/arrow-up.png', '../images/dot-gray.png',
      '../images/arrow-down.png', '../images/dot-gray.png'
    ]);
  }
});


/**
    Shiny.Asset.Images.Vertical.Focused.Arrow:
**/

Shiny.Asset.Images.Vertical.Focused.Arrow = Class.create(Shiny.Asset.Images,
{
  /* public: */
  initialize: function($super)
  {
    return $super([
      '../images/arrow-up-blue.png', '../images/dot-blue.png',
      '../images/arrow-down-blue.png', '../images/dot-blue.png'
    ]);
  }
});


/**
    Shiny.Asset.Images.Radio:
**/

Shiny.Asset.Images.Radio = Class.create(Shiny.Asset.Images,
{
  /* public: */
  initialize: function($super)
  {
    return $super([
      '../images/radio.png', '../images/radio-on.png'
    ]);
  }
});


/**
    Shiny.Asset.Images.Focused.Radio:
**/

Shiny.Asset.Images.Active.Radio = Class.create(Shiny.Asset.Images,
{
  /* public: */
  initialize: function($super)
  {
    return $super([
      '../images/radio-active.png', '../images/radio-on-active.png'
    ]);
  }
});


/**
    Shiny.Asset.Images.Focused.Radio:
**/

Shiny.Asset.Images.Focused.Radio = Class.create(Shiny.Asset.Images,
{
  /* public: */
  initialize: function($super)
  {
    return $super([
      '../images/radio-active.png', '../images/radio-on-active.png'
    ]);
  }
});


/**
    Shiny.Asset.Images.Checkbox:
**/

Shiny.Asset.Images.Checkbox = Class.create(Shiny.Asset.Images,
{
  /* public: */
  initialize: function($super)
  {
    return $super([
      '../images/checkbox.png', '../images/checkbox-on.png'
    ]);
  }
});


/**
    Shiny.Asset.Images.Focused.Checkbox:
**/

Shiny.Asset.Images.Focused.Checkbox = Class.create(Shiny.Asset.Images,
{
  /* public: */
  initialize: function($super)
  {
    return $super([
      '../images/checkbox-active.png', '../images/checkbox-on-active.png'
    ]);
  }
});


/**
    Shiny.Asset.Images.Active.Checkbox:
**/

Shiny.Asset.Images.Active.Checkbox = Class.create(Shiny.Asset.Images,
{
  /* public: */
  initialize: function($super)
  {
    return $super([
      '../images/checkbox-active.png', '../images/checkbox-on-active.png'
    ]);
  }
});


/**
    Shiny.Asset.Images.Spinner:
**/

Shiny.Asset.Images.Spinner = Class.create(Shiny.Asset.Images,
{
  /* public: */
  initialize: function($super)
  {
    return $super([ '../images/spinner.gif' ]);
  }
});


/**
    Shiny.Asset.Images.Spinner:
**/

Shiny.Asset.Images.Spinner.Small = Class.create(Shiny.Asset.Images,
{
  /* public: */
  initialize: function($super)
  {
    return $super([ '../images/spinner-small.gif' ]);
  }
});



/**
    Shiny.Assets:
**/

Shiny.Assets = { };



/**
    Shiny.Assets.Images:
**/

Shiny.Assets.Images = $H({ });
Shiny.Assets.Images.set('arrow', new Shiny.Asset.Images.Arrow());
Shiny.Assets.Images.set('arrow-active', new Shiny.Asset.Images.Active.Arrow());
Shiny.Assets.Images.set('arrow-focused', new Shiny.Asset.Images.Focused.Arrow());
Shiny.Assets.Images.set('transition', new Shiny.Asset.Images.Transition());
Shiny.Assets.Images.set('arrow-vertical', new Shiny.Asset.Images.Vertical.Arrow());
Shiny.Assets.Images.set('arrow-vertical-focused', new Shiny.Asset.Images.Vertical.Focused.Arrow());
Shiny.Assets.Images.set('sort', new Shiny.Asset.Images.Vertical.Arrow());
Shiny.Assets.Images.set('radio', new Shiny.Asset.Images.Radio());
Shiny.Assets.Images.set('radio-active', new Shiny.Asset.Images.Active.Radio());
Shiny.Assets.Images.set('radio-focused', new Shiny.Asset.Images.Focused.Radio());
Shiny.Assets.Images.set('checkbox', new Shiny.Asset.Images.Checkbox());
Shiny.Assets.Images.set('checkbox-active', new Shiny.Asset.Images.Active.Checkbox());
Shiny.Assets.Images.set('checkbox-focused', new Shiny.Asset.Images.Focused.Checkbox());
Shiny.Assets.Images.set('spinner', new Shiny.Asset.Images.Spinner());
Shiny.Assets.Images.set('spinner-small', new Shiny.Asset.Images.Spinner.Small());



/**
    Shiny.Assets.Registry:
**/

Shiny.Assets.Registry = { };



/**
    Shiny.Assets.Registry.Style:
**/

Shiny.Assets.Registry.Style = Class.create(Hash, {
  
  get: function($super, k)
  {
    var rv = $super(k);

    if (!rv)
      rv = this.set(k, new Shiny.Asset.Style(k));
      
    return rv; 
  }

});



/**
    Shiny.Assets.Style:
**/

Shiny.Assets.Style = new Shiny.Assets.Registry.Style();


