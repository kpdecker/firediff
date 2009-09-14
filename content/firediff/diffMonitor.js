/* See license.txt for terms of usage */
var FireDiff = FireDiff || {};

FBL.ns(function() { with (FBL) {

const Cc = Components.classes;
const Ci = Components.interfaces;
const nsIPrefBranch2 = Ci.nsIPrefBranch2;
const PrefService = Cc["@mozilla.org/preferences-service;1"];
const prefs = PrefService.getService(nsIPrefBranch2);
const PromptService = Cc["@mozilla.org/embedcomp/prompt-service;1"];
const prompt = PromptService.getService(Ci.nsIPromptService);


var Events = FireDiff.events,
    Path = FireDiff.Path,
    Reps = FireDiff.reps;

var i18n = document.getElementById("strings_firediff");
var Panel = Firebug.ActivablePanel || Firebug.Panel;

function DiffMonitor() {}
DiffMonitor.prototype = extend(Panel, {
    name: "firediff",
    title: i18n.getString("title.diffMonitor"),
    statusSeparator: ">",
    searchable: true,
    
    initializeNode: function(panelNode) {
      if (Firebug.DiffModule.addListener) {
        Firebug.DiffModule.addListener(this);
      }
      
      this.addStyleSheet(this.document, "chrome://firediff/skin/firediff.css", "fireDiffCss");
      this.applyDisplayPrefs();
      
      if (Firebug.DiffModule.supportsFirebugEdits) {
        prefs.addObserver(Firebug.prefDomain, this, false);
      }
    },
    
    show: function(state) {
      if (Firebug.version < "1.4") {
        this.panelNode.innerHTML = i18n.getString("warning.firebugVersion");
        return;
      }
      
      var enabled = Firebug.DiffModule.isAlwaysEnabled();
      if (enabled) {
           Firebug.DiffModule.disabledPanelPage.hide(this);

           this.showToolbarButtons("fbDiffMonitorButtons", true);
           $("cmd_copy").setAttribute("disabled", true);

           if (!this.selection) {
             this.select(this.getDefaultSelection());
           }
      } else {
          this.hide();
          Firebug.DiffModule.disabledPanelPage.show(this);
      }
    },
    enablePanel: function(module) {
      Panel.enablePanel.apply(this, arguments);
      this.show();
    },
    disablePanel: function(module) {
      Panel.disablePanel.apply(this, arguments);
      this.hide();
    },
    hide: function(state) {
      this.showToolbarButtons("fbDiffMonitorButtons", false);
      $("cmd_copy").removeAttribute("disabled");

      var panelStatus = Firebug.chrome.getPanelStatusElements();
      panelStatus.clear(); // clear stack on status bar
      this.selection = undefined;
    },

    addStyleSheet: function(doc, uri, id) {
        // Make sure the stylesheet isn't appended twice. 
        if ($(id, doc))   return;

        var styleSheet = createStyleSheet(doc, uri);
        styleSheet.setAttribute("id", id);
        addStyleSheet(doc, styleSheet);
    },
    getOptionsMenuItems: function(context) {
      if (Firebug.DiffModule.supportsFirebugEdits) {
        return [
            this.optionsMenu("option.showAppChanges", "firediff.displayAppChanges"),
            this.optionsMenu("option.showFirebugChanges", "firediff.displayFirebugChanges")
          ];
      }
    },
    optionsMenu: function(label, option) {
      var value = Firebug.getPref(Firebug.prefDomain, option);
      return {
          label: i18n.getString(label),
          nol10n: true,
          type: "checkbox",
          checked: value,
          command: bindFixed(Firebug.setPref, this, Firebug.prefDomain, option, !value)
      };
    },
    
    selectSnapshot: function(change) {
      try {
        // We run this here to defer change processing
        this.select(change.getSnapshotRep(this.context));
      } catch (err) {
        FBTrace.sysout(err,err);
      }
    },
    revertAllChanges: function(change) {
      try {
        Firebug.DiffModule.revertAllChanges(change, this.context);
        this.updateSelection(this.lastSel);
      } catch (err) {
        FBTrace.sysout(err,err);
      }
    },
    revertChange: function(change) {
      try {
        var dontPrompt = this.isDontPromptOnMultipleRevert();
        var ret = Firebug.DiffModule.revertChange(change, this.context, dontPrompt);
        if (!ret) {
          var checked = { value: false };
          var button = prompt.confirmCheck(
              null,
              i18n.getString("prompt.title.MultipleRevert"),
              i18n.getString("prompt.text.MultipleRevert"),
              i18n.getString("prompt.dontAskAgain"),
              checked);
          if (!button) {
            return;
          }

          // Save the pref value
          Firebug.setPref(Firebug.prefDomain, "firediff.revertMultiple.dontPrompt", checked.value);

          // Perform a forced revert
          Firebug.DiffModule.revertChange(change, this.context, true);
        }

        this.updateSelection(this.lastSel);
      } catch (err) {
        FBTrace.sysout(err,err);
      }
    },
    
    getContextMenuItems: function(object, target) {
      if (this.selection == Reps.Monitor) {
        return [
                { label: i18n.getString("menu.ChangeSnapshot"), command: bindFixed(this.selectSnapshot, this, object), nol10n: true },
                "-",
                { label: i18n.getString("menu.RevertChange"), command: bindFixed(this.revertChange, this, object), nol10n: true },
                { label: i18n.getString("menu.RevertAllChanges"), command: bindFixed(this.revertAllChanges, this, object), nol10n: true }
        ];
      }
    },
    
    getDefaultSelection: function(object) {
      return Reps.Monitor;
    },
    updateSelection: function(object) {
      clearNode(this.panelNode);
      
      if (this.lastSel && this.lastSel.hide) {
        this.lastSel.hide(this);
      }
      
      object.show(this);
      this.showToolbarButtons("fbDiffSnapshotNav", !!object.showNext);
      this.lastSel = object;
    },
    
    getObjectPath: function(object) {
      var ret = [ Reps.Monitor ];
      if (Reps.DOMSnapshotRep.supportsObject(object)
          || Reps.CSSSnapshotRep.supportsObject(object)) {
        ret.push(object);
      }
      return ret;
    },
    supportsObject: function(object) {
      if (Reps.MonitorRep.supportsObject(object)
          || Reps.DOMSnapshotRep.supportsObject(object)
          || Reps.CSSSnapshotRep.supportsObject(object))
        return 1000;
      return 0;
    },

    search: function(text, reverse) {
      if (this.selection.search) {
        return this.selection.search(text, reverse, this);
      }
    },

    // nsIPrefObserver
    observe: function(subject, topic, data)
    {
      // We're observing preferences only.
      if (topic != "nsPref:changed")
        return;

      var prefName = data.substr(Firebug.prefDomain.length + 1);
      if (prefName == "firediff.displayAppChanges"
          || prefName == "firediff.displayFirebugChanges") {
        this.applyDisplayPrefs();
      }
    },
    
    applyDisplayPrefs: function() {
      this.applyDisplayPref("firediff.displayAppChanges", "showAppChanges", !Firebug.DiffModule.supportsFirebugEdits);
      this.applyDisplayPref("firediff.displayFirebugChanges", "showFirebugChanges");
    },
    applyDisplayPref: function(prefName, cssName, force) {
      if (force || Firebug.getPref(Firebug.prefDomain, prefName)) {
        setClass(this.panelNode, cssName);
      } else {
        removeClass(this.panelNode, cssName);
      }
    },
    isDisplayAppChanges: function() {
      return Firebug.getPref(Firebug.prefDomain, "firediff.displayAppChanges");
    },
    isDisplayFirebugChanges: function() {
      return Firebug.getPref(Firebug.prefDomain, "firediff.displayFirebugChanges");
    },
    isDontPromptOnMultipleRevert: function() {
      return !!Firebug.getPref(Firebug.prefDomain, "firediff.revertMultiple.dontPrompt");
    },
    
    onDiffChange: function(change, context) {
      if (this.context != context || !this.selection)    return;
      
      // this.selection could be null if an event occurs before we are displayed
      if (this.selection.onChange) {
        this.selection.onChange(change, this);
      }
    },
    onClearChanges: function(context) {
      if (this.context != context)    return;
      
      if (this.panelNode) {
        clearNode(this.panelNode);
      }
    },
    onNavNextChange: function(context) {
      if (this.selection.showNext) {
        this.selection.showNext();
      }
    },
    onNavPrevChange: function(context) {
      if (this.selection.showPrev) {
        this.selection.showPrev();
      }
    }
});

Firebug.registerPanel(DiffMonitor);

}});