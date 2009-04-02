FBL.ns(function() { with (FBL) {

var Events = FireDiff.events;
  
var ListeningModule = extend(Firebug.Module, new Firebug.Listener());
Firebug.DiffModule = extend(ListeningModule,
{
    supportsFirebugEdits: Firebug.Editor.supportsStopEvent,
    
    initialize: function() {
        if (Firebug.CSSModule) {
            // Maintain support for older versions of firebug that do not
            // have the CSS change event implementation
            Firebug.CSSModule.addListener(this);
        }
        if (Firebug.Editor.supportsStopEvent) {
          Firebug.Editor.addListener(this);
        }
    },
    
    showContext: function(browser, context)
    {
        // after a showContext the user may edit, so we need to prepare for it.
        if (context)
            var panel = context.getPanel("diff_monitor");  //initialize panel for this context
    },
    loadedContext: function(context)
    {
        context.window.addEventListener("DOMNodeInserted", bind(this.domEventLogger, this, context), true);
        context.window.addEventListener("DOMNodeRemoved", bind(this.domEventLogger, this, context), true);
        // TODO : Do we want to use the from document events? Need to verify what the distinction is
        context.window.addEventListener("DOMNodeRemovedFromDocument", bind(this.domEventLogger, this, context), true);
        context.window.addEventListener("DOMNodeInsertedIntoDocument", bind(this.domEventLogger, this, context), true);
        context.window.addEventListener("DOMAttrModified", bind(this.attributeChangedEventLogger, this, context), true);
        context.window.addEventListener("DOMCharacterDataModified", bind(this.domEventLogger, this, context), true);
    },
    
    //////////////////////////////////////////////
    // Editor Listener
    onBeginEditing: function(panel, editor, target, value) {
        var diffContext = this.getDiffContext();
        
        diffContext.editTarget = Firebug.getRepObject(target);
        if (FBTrace.DBG_FIREDIFF)   FBTrace.sysout("DiffModule.onBeginEditing", diffContext.editTarget);
        
        diffContext.editEvents = [];
    },
    onStopEdit: function(panel, editor, target) {
        var diffContext = this.getDiffContext();
        if (FBTrace.DBG_FIREDIFF)   FBTrace.sysout("stopEdit: " + target, diffContext.editEvents);
        
        var editEvents = diffContext.editEvents;
        if (editEvents.length) {
          editEvents = Events.merge(editEvents);
          
          for (var i = 0; i < editEvents.length; i++) {
              editEvents[i].changeSource = Events.ChangeSource.FIREBUG_CHANGE;
              this.dispatchChange(editEvents[i]);
          }
        }
        
        diffContext.editTarget = undefined;
        diffContext.editEvents = [];
    },
    
    //////////////////////////////////////////////
    // CSSModule Listener
    onCSSSetProperty: function(style, propName, propValue, propPriority, prevValue, prevPriority) {
        this.recordChange(
            new Events.CSSSetPropertyEvent(style, propName, propValue, propPriority, prevValue, prevPriority));
    },
    
    onCSSRemoveProperty: function(style, propName, prevValue, prevPriority) {
        this.recordChange(
            new Events.CSSRemovePropertyEvent(style, propName, prevValue, prevPriority));
    },
    
    //////////////////////////////////////////////
    // Self
    domEventLogger: function(ev, context) {
        if ((ev.target.className || "").indexOf("firebug") == -1
                && (ev.target.id || "").indexOf("firebug") == -1) {
            this.recordChange(Events.createDOMChange(ev), context);
        }
    },
    attributeChangedEventLogger: function(ev, context) {
        // We only care about attributes that actually change or are created or deleted
        if (ev.attrChange != MutationEvent.MODIFICATION
                || ev.newValue != ev.prevValue) {
            this.domEventLogger(ev, context);
        }
    },
    
    clearChanges: function(context) {
      if (FBTrace.DBG_FIREDIFF)   FBTrace.sysout("DiffModule.clearChanges", context);
      dispatch(this.fbListeners, "onClearChanges", [context || FirebugContext]);
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
    
    recordChange: function(change, context) {
        if (FBTrace.DBG_FIREDIFF)   FBTrace.sysout("DiffModule.recordChange", change);
        var diffContext = this.getDiffContext(context);
        if (diffContext.ignore)   return;
        
        if (!change.appliesTo(diffContext.editTarget)) {
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
      return this.getDiffContext(context).changes;
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

Firebug.registerModule(Firebug.DiffModule);

}});