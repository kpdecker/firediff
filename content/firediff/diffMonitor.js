/* See license.txt for terms of usage */
var FireDiff = FireDiff || {};

FBL.ns(function() { with (FBL) {

const Cc = Components.classes;
const Ci = Components.interfaces;
const nsIPrefBranch2 = Ci.nsIPrefBranch2;
const PrefService = Cc["@mozilla.org/preferences-service;1"];
const prefs = PrefService.getService(nsIPrefBranch2);

var Reps = FireDiff.reps;

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

      this.applyDisplayPrefs();

      if (Firebug.DiffModule.supportsFirebugEdits) {
        prefs.addObserver(Firebug.prefDomain, this, false);
      }
    },
    destroyNode: function() {
        Firebug.ActivablePanel.destroyNode.apply(this, arguments);

        if (Firebug.DiffModule.removeListener) {
            Firebug.DiffModule.removeListener(this);
        }
    },
    
    show: function(state) {
      if (Firebug.version < "1.4") {
        this.panelNode.innerHTML = i18n.getString("warning.firebugVersion");
        return;
      }
      
      var enabled = Firebug.DiffModule.isAlwaysEnabled();
      if (enabled) {
           Firebug.DiffModule.disabledPanelPage && Firebug.DiffModule.disabledPanelPage.hide(this);

           // TODO: Remove after dropping support for Firebug 1.5
           Firebug.DiffModule.internationalizeUI(this.document);
           this.addStyleSheet(this.document, "chrome://firediff/skin/firediff.css", "fireDiffCss");

           this.showToolbarButtons("fbDiffMonitorButtons", true);
           $("cmd_copy").setAttribute("disabled", true);

           if (!this.selection) {
             this.select(this.getDefaultSelection());
           }
      } else {
          this.hide();
          Firebug.DiffModule.disabledPanelPage && Firebug.DiffModule.disabledPanelPage.show(this);
      }

      this.showToolbarButtons("fbStatusButtons", enabled);
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
        // This is already taken care of if we are running under 1.6
        if (Firebug.registerStylesheet) {
            return;
        }

        // Make sure the stylesheet isn't appended twice. 
        if ($(id, doc))   return;

        var styleSheet = createStyleSheet(doc, uri);
        styleSheet.setAttribute("id", id);
        addStyleSheet(doc, styleSheet);
    },
    getOptionsMenuItems: function(context) {
      var ret = [];
      if (Firebug.DiffModule.supportsFirebugEdits) {
        ret.push(
            this.optionsMenu("option.showAppChanges", "firediff.displayAppChanges"),
            this.optionsMenu("option.showFirebugChanges", "firediff.displayFirebugChanges"),
            "-"
        );
      }
      ret.push({
          label: i18n.getString("option.formatterOptions"),
          nol10n: true,
          command: bindFixed(this.showFormatterOptions, this)
      });
      
      return ret;
    },
    optionsMenu: function(label, option) {
      var value = Firebug.getPref(Firebug.prefDomain, option);
      return {
          label: i18n.getString(label),
          nol10n: true,
          type: "checkbox",
          checked: value,
          command: bindFixed(Firebug.setPref, Firebug, Firebug.prefDomain, option, !value)
      };
    },
    showFormatterOptions: function() {
      // See cmd_options in extensions.js
      var features= "chrome,titlebar,toolbar,centerscreen,";
      try {
        var instantApply = gPref.getBoolPref("browser.preferences.instantApply");
        features += (instantApply ? "dialog=no" : "modal");
      } catch (e) {
        features += "modal";
      }
      window.openDialog("chrome://fireformat/content/options.xul", "", features);
    },

    getContextMenuItems: function(object, target) {
        return this.selection.getContextMenuItems && this.selection.getContextMenuItems(this, object, target);
    },
    
    getDefaultSelection: function(object) {
      return Reps.Monitor;
    },
    refresh: function() {
        this.updateSelection(this.lastSel);
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

    onDiffChange: function(change, context) {
      if (this.context != context || !this.selection)    return;
      
      // this.selection could be null if an event occurs before we are displayed
      if (this.selection.onChange) {
        this.selection.onChange(change, this);
      }
    },
    onClearChanges: function(context) {
      if (this.context != context)    return;

      var panelStatus = Firebug.chrome.getPanelStatusElements();
      panelStatus.clear(); // clear stack on status bar

      this.select(undefined, true);
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
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // extends ActivablePanel

    /**
     * Support for panel activation.
     */
    onActivationChanged: function(enable)
    {
        if (FBTrace.DBG_FIREDIFF || FBTrace.DBG_ACTIVATION)
            FBTrace.sysout("console.ScriptPanel.onActivationChanged; " + enable);

        if (enable) {
            Firebug.DiffModule.addObserver(this);
        } else {
            Firebug.DiffModule.removeObserver(this);
        }
    },
});

Firebug.registerPanel(DiffMonitor);

}});