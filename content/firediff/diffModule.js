/* See license.txt for terms of usage */

FBL.ns(function() { with (FBL) {

var Events = FireDiff.events,
    Path = FireDiff.Path;

Firebug.DiffModule = extend(Firebug.ActivableModule, {
    panelName: "firediff",
    
    supportsFirebugEdits: Firebug.Editor.supportsStopEvent,
    
    initialize: function() {
        Firebug.ActivableModule.initialize.apply(this, arguments);
        
        if (Firebug.CSSModule) {
            // Maintain support for older versions of firebug that do not
            // have the CSS change event implementation
            Firebug.CSSModule.addListener(this);
        }
        if (Firebug.HTMLModule) {
          Firebug.HTMLModule.addListener(this);
        }
        if (Firebug.Editor.supportsStopEvent) {
          Firebug.Editor.addListener(this);
        }
    },

    initContext: function(context, persistedState) {
      if (this.isAlwaysEnabled()) {
        this.monitorContext(context);
      }
    },
    onPanelEnable: function(context, panelName) {
      if (panelName != this.panelName)    return;
      
      this.monitorContext(context);
    },
    onPanelDisable: function(context, panelName) {
        if (panelName != this.panelName)      return;
        
        this.unmonitorContext(context);
    },
    
    //////////////////////////////////////////////
    // Editor Listener
    onBeginEditing: function(panel, editor, target, value) {
      this.onBeginFirebugChange(target);
      this.onSaveEdit(panel, editor, target, value);
    },
    onSaveEdit: function(panel, editor, target, value, previousValue) {
      // Update the data store used for the HTML editor monitoring
      var diffContext = this.getDiffContext();
      diffContext.htmlEditPath = this.getHtmlEditorPaths(editor);
    },
    onStopEdit: function(panel, editor, target) {
      this.onEndFirebugChange(target);
    },
    
    //////////////////////////////////////////////
    // CSSModule Listener
    onCSSInsertRule: function(styleSheet, cssText, ruleIndex) {
      styleSheet.source = "dispatch";
      this.recordChange(
          new Events.css.CSSInsertRuleEvent(
              styleSheet.cssRules[ruleIndex],
              Events.ChangeSource.FIREBUG_CHANGE));
    },
    onCSSDeleteRule: function(styleSheet, ruleIndex) {
      styleSheet.source = "dispatch";
      this.recordChange(
          new Events.css.CSSRemoveRuleEvent(
              styleSheet.cssRules[ruleIndex],
              Events.ChangeSource.FIREBUG_CHANGE));
    },
    onCSSSetProperty: function(style, propName, propValue, propPriority, prevValue, prevPriority) {
        this.recordChange(
            new Events.css.CSSSetPropertyEvent(
                style.parentRule, propName, propValue, propPriority, prevValue, prevPriority, Events.ChangeSource.FIREBUG_CHANGE));
    },
    
    onCSSRemoveProperty: function(style, propName, prevValue, prevPriority) {
        this.recordChange(
            new Events.css.CSSRemovePropertyEvent(
                style.parentRule, propName, prevValue, prevPriority, Events.ChangeSource.FIREBUG_CHANGE));
    },
    
    //////////////////////////////////////////////
    // HTMLModule Listener
    onBeginFirebugChange: function(node, context) {
      var diffContext = this.getDiffContext(context);
      
      diffContext.editTarget = node;
      if (FBTrace.DBG_FIREDIFF)   FBTrace.sysout("DiffModule.onBeginFirebugChange", diffContext.editTarget);
      
      diffContext.editEvents = [];
    },
    
    onEndFirebugChange: function(node, context) {
      var diffContext = this.getDiffContext(context);
      if (FBTrace.DBG_FIREDIFF)   FBTrace.sysout("DiffModile.onEndFirebugChange: " + node, diffContext.editEvents);
      
      var editEvents = diffContext.editEvents;
      if (editEvents.length) {
        editEvents = Events.merge(editEvents);
        
        for (var i = 0; i < editEvents.length; i++) {
            editEvents[i].changeSource = Events.ChangeSource.FIREBUG_CHANGE;
            this.dispatchChange(editEvents[i]);
        }
      }
      
      delete diffContext.editTarget;
      delete diffContext.editEvents;
      delete diffContext.htmlEditPath;
    },
    
    //////////////////////////////////////////////
    // Self
    domEventLogger: function(ev, context) {
      if (!this.ignoreNode(ev.target)) {
        var diffContext = this.getDiffContext(context);
        this.recordChange(
            Events.dom.createDOMChange(ev, diffContext.changeSource),
            context);
      }
    },
    charDataChangedEventLogger: function(ev, context) {
      // Filter out char data events whose parents are a firebug object
      var filterNode = ev.target.parentNode;
      if (!this.ignoreNode(ev.target.parentNode)) {
        this.domEventLogger(ev, context);
      }
    },
    attributeChangedEventLogger: function(ev, context) {
        // We only care about attributes that actually change or are created or deleted
        if (ev.attrChange != MutationEvent.MODIFICATION
                || ev.newValue != ev.prevValue) {
            this.domEventLogger(ev, context);
        }
    },
    
    monitorContext: function(context) {
      var diffContext = this.getDiffContext(context);
      if (diffContext.eventLogger)    return;

      diffContext.eventLogger = bind(this.domEventLogger, this, context);
      diffContext.attrEventLogger = bind(this.attributeChangedEventLogger, this, context);
      diffContext.charDataEventLogger = bind(this.charDataChangedEventLogger, this, context);
      
      context.window.addEventListener("DOMNodeInserted", diffContext.eventLogger, true);
      context.window.addEventListener("DOMNodeRemoved", diffContext.eventLogger, true);
      // TODO : Do we want to use the from document events? Need to verify what the distinction is
      context.window.addEventListener("DOMNodeRemovedFromDocument", diffContext.eventLogger, true);
      context.window.addEventListener("DOMNodeInsertedIntoDocument", diffContext.eventLogger, true);
      context.window.addEventListener("DOMAttrModified", diffContext.attrEventLogger, true);
      context.window.addEventListener("DOMCharacterDataModified", diffContext.charDataEventLogger, true);
    },
    unmonitorContext: function(context) {
        var diffContext = this.getDiffContext(context);
        if (!diffContext.eventLogger)    return;
        
        context.window.removeEventListener("DOMNodeInserted", diffContext.eventLogger, true);
        context.window.removeEventListener("DOMNodeRemoved", diffContext.eventLogger, true);
        // TODO : Do we want to use the from document events? Need to verify what the distinction is
        context.window.removeEventListener("DOMNodeRemovedFromDocument", diffContext.eventLogger, true);
        context.window.removeEventListener("DOMNodeInsertedIntoDocument", diffContext.eventLogger, true);
        context.window.removeEventListener("DOMAttrModified", diffContext.attrEventLogger, true);
        context.window.removeEventListener("DOMCharacterDataModified", diffContext.charDataEventLogger, true);
        
        delete diffContext.eventLogger;
        delete diffContext.attrEventLogger;
        delete diffContext.charDataEventLogger;
    },
    
    ignoreNode: function(node) {
      // Ignore firebug elements and any top level elements that are not the doc element
      return node.firebugIgnore
          || (node.className || "").indexOf("firebug") > -1
          ||        (node.id || "").indexOf("firebug") > -1
          || (node.parentNode == node.ownerDocument
              && node != node.ownerDocument.documentElement);
    },
    
    getHtmlEditorPaths: function(editor) {
      // Select the xpath update range. This is from the first to after the
      // last element in the range (or '}' if there is no sibling after that
      // to simplify the match test)
      //
      // This is not 100%, erroring on the side marking app changes as Firebug changes
      // To fully resolve this, deeper integration with Firebug will be required,
      // most likely in the form of changes to the editors to use diff ignore
      // blocks and generate custom events.
      var elements = editor.editingElements;
      if (elements) {
        var nextEl = getNextElement((elements[1] || elements[0]).nextSibling);
        return [
                Path.getElementPath(elements[0]),
                Path.getElementPath(nextEl) || '}'
            ];
      }
    },
    
    clearChanges: function(context) {
      if (FBTrace.DBG_FIREDIFF)   FBTrace.sysout("DiffModule.clearChanges", context);
      
      var diffContext = this.getDiffContext(context);
      diffContext.changes = [];
      
      dispatch(this.fbListeners, "onClearChanges", [context || FirebugContext]);
    },
    
    navNextChange: function(context) {
      dispatch(this.fbListeners, "onNavNextChange", [context || FirebugContext]);
    },
    navPrevChange: function(context) {
      dispatch(this.fbListeners, "onNavPrevChange", [context || FirebugContext]);
    },
    
    ignoreChanges: function(worker, context) {
      // If no context is available failover. This failover is mostly for testing merges.
      var diffContext = this.getDiffContext(context) || {};
      try {
        if (FBTrace.DBG_FIREDIFF)   FBTrace.sysout("DiffModule: Set ignore changes", context);
        diffContext.ignore = true;
        
        worker();
      } finally {
        if (FBTrace.DBG_FIREDIFF)   FBTrace.sysout("DiffModule: Reset ignore changes", context);
        diffContext.ignore = false;
      }
    },
    firebugChanges: function(worker, context) {
      // If no context is available failover. This failover is mostly for testing merges.
      var diffContext = this.getDiffContext(context) || {};
      try {
        if (FBTrace.DBG_FIREDIFF)   FBTrace.sysout("DiffModule: Set firebug changes", context);
        diffContext.changeSource = Events.ChangeSource.FIREBUG_CHANGE;
        
        worker();
      } finally {
        if (FBTrace.DBG_FIREDIFF)   FBTrace.sysout("DiffModule: Reset firebug changes", context);
        delete diffContext.changeSource;
      }
    },
    
    recordChange: function(change, context) {
        if (FBTrace.DBG_FIREDIFF)   FBTrace.sysout("DiffModule.recordChange", change);
        var diffContext = this.getDiffContext(context);
        if (!diffContext || diffContext.ignore)   return;
        
        if (diffContext.htmlEditPath) {
          // Special case for HTML free edit. It's not pretty but it gets the
          // job done. In the future we may want to consider executing changes
          // in the Firebug editors within ignore blocks, and generating events
          // for the final states, but for now we want to keep the coupling
          // low
          if (diffContext.htmlEditPath[0] <= change.xpath
              && change.xpath <= diffContext.htmlEditPath[1]) {
            diffContext.editEvents.push(change);
            return;
          }
        }
        if (!change.appliesTo(Firebug.getRepObject(diffContext.editTarget) || diffContext.editTarget)) {
            this.dispatchChange(change, context);
        } else {
            diffContext.editEvents.push(change);
        }
    },
    dispatchChange: function(change, context) {
      if (FBTrace.DBG_FIREDIFF)   FBTrace.sysout("DiffModule.dispatchChange", change);
      
      var diffContext = this.getDiffContext(context);
      diffContext.changes.push(change);
      
      dispatch(this.fbListeners, "onDiffChange", [change, context || FirebugContext]);
    },
    
    getChanges: function(context) {
      var diffContext = this.getDiffContext(context);
      return (diffContext && diffContext.changes) || [];
    },
    
    getDiffContext: function(context) {
      context = context || FirebugContext;
      if (!context) {
        return null;
      }
      
      context.diffContext = context.diffContext || { changes: [] };
      return context.diffContext;
    }
});

Firebug.registerActivableModule(Firebug.DiffModule);

}});