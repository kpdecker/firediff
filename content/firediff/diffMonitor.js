/* See license.txt for terms of usage */

FBL.ns(function() { with (FBL) {

const Cc = Components.classes;
const Ci = Components.interfaces;
const nsIPrefBranch2 = Ci.nsIPrefBranch2;
const PrefService = Cc["@mozilla.org/preferences-service;1"];
const prefs = PrefService.getService(nsIPrefBranch2);

const dateFormat = CCSV("@mozilla.org/intl/scriptabledateformat;1", "nsIScriptableDateFormat");

var Events = FireDiff.events;

var i18n = document.getElementById("strings_firediff");
var Panel = Firebug.ActivablePanel || Firebug.Panel;

function DiffMonitor() {}
DiffMonitor.prototype = extend(Panel, {
    template: domplate({
        tag: DIV(
            {class: "diffMonitorElement", $firebugDiff: "$change|isFirebugDiff", $appDiff: "$change|isAppDiff"},
            SPAN({class: "diffSummary"}, "$change|getSummary"),
            SPAN({class: "diffSep"}, ":"),
            SPAN({class: "diffSource"}, "$change|getDiffSource"),
            SPAN({class: "diffDate"}, "$change|getDate"),
            DIV({class: "diffXPath"}, "$change|getXPath"),
            DIV({class: "logEntry"}, TAG("$change|getChangeTag", {change: "$change", object: "$change.target"}))
            ),
        getChangeTag: function(change) {
            if (change.changeType == "css") {
                return FireDiff.domplate.CSSChanged.tag;
            } else if (change.clone instanceof Text) {
                return FireDiff.domplate.TextChanged.tag;
            } else {
                return FireDiff.domplate.ElementChanged.tag;
            }
        },
        getSummary: function(change) {
            return change.getSummary();
        },
        getDiffSource: function(change) {
          if (this.isFirebugDiff(change)) {
            return i18n.getString("source.firebug");
          } else {
            return i18n.getString("source.application");
          }
        },
        getDate: function(change) {
          var date = change.date;
          return dateFormat.FormatDateTime(
              "", dateFormat.dateFormatLong, dateFormat.timeFormatSeconds,
              date.getFullYear(), date.getMonth() + 1, date.getDate(),
              date.getHours(), date.getMinutes(), date.getSeconds()); 
        },
        getXPath: function(change) {
          return change.displayXPath || "";
        },
        isFirebugDiff: function(change) {
            return change.changeSource == Events.ChangeSource.FIREBUG_CHANGE;
        },
        isAppDiff: function(change) {
            return change.changeSource == Events.ChangeSource.APP_CHANGE;
        }
    }),
    name: "firediff",
    title: i18n.getString("title.diffMonitor"),
    
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
    },

    addStyleSheet: function(doc, uri, id)
    {
        // Make sure the stylesheet isn't appended twice. 
        if ($(id, doc))
            return;

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
    
    onDiffChange: function(change, context) {
      if (this.context != context)    return;
      
      this.template.tag.append({change: change}, this.panelNode);
    },
    onClearChanges: function(context) {
      if (this.context != context)    return;
      
      if (this.panelNode) {
        clearNode(this.panelNode);
      }
    }
});

Firebug.registerPanel(DiffMonitor);

}});