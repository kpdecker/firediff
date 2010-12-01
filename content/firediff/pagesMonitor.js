/* See license.txt for terms of usage */
var FireDiff  = FireDiff || {};

FBL.ns(function() { with (FBL) {

const Cc = Components.classes;
const Ci = Components.interfaces;
const PromptService = Cc["@mozilla.org/embedcomp/prompt-service;1"];
const prompt = PromptService.getService(Ci.nsIPromptService);
const dateFormat = CCSV("@mozilla.org/intl/scriptabledateformat;1", "nsIScriptableDateFormat");

var Events = FireDiff.events,
    DiffDomplate = FireDiff.domplate,
    Search = FireDiff.search,
    Fireformat = {};

try {
  Components.utils.import("resource://fireformat/formatters.jsm", Fireformat);
} catch (err) {
}

var i18n = document.getElementById("strings_firediff");

// Object used to define the monitor view
FireDiff.reps.Monitor = domplate({
    entry: DIV(
        {class: "diffMonitorElement", $firebugDiff: "$change|isFirebugDiff", $appDiff: "$change|isAppDiff", _repObject: "$change"},
        SPAN({class: "diffSummary"}, "$change|getSummary"),
        SPAN({class: "diffSep"}, ":"),
        SPAN({class: "diffSource"}, "$change|getDiffSource"),
        SPAN({class: "diffDate"}, "$change|getDate"),
        DIV({class: "diffXPath"}, "$change|getXPath"),
        DIV({class: "logEntry"}, TAG("$change|getChangeTag", {change: "$change", object: "$change|getAssocObject"}))
    ),

    getAssocObject: function(change) {
        return change.clone || change.style || change.target || change;
    },
    getChangeTag: function(change) {
        if (change.changeType == "CSS") {
            return DiffDomplate.CSSChanges.CSSStyleRule.tag;
        } else if (change.clone instanceof Text) {
            return DiffDomplate.TextChanged.tag;
        } else {
            return DiffDomplate.ElementChanged.tag;
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
        return change.displayXPath || change.xpath || "";
    },
    isFirebugDiff: function(change) {
        return change.changeSource == Events.ChangeSource.FIREBUG_CHANGE;
    },
    isAppDiff: function(change) {
        return change.changeSource == Events.ChangeSource.APP_CHANGE;
    },

    isDontPromptOnMultipleRevert: function() {
        return !!Firebug.getPref(Firebug.prefDomain, "firediff.revertMultiple.dontPrompt");
    },

    getChanges: function() {
        return Firebug.DiffModule.getChanges();
    },
    getTag: function(object) {
        return this.entry;
    },

    show: function(panel) {
        var changes = Firebug.DiffModule.getChanges();
        for (var i = 0; i < changes.length; i++) {
            this.onChange(changes[i], panel);
        }
    },
    onChange: function(change, panel) {
        try {
            this.entry.append({change: change}, panel.panelNode);
        } catch (err) {
            FBTrace.sysout("ERROR: onChange", err);
        }
    },
    search: function(text, reverse, panel) {
        this.searchHelper = this.searchHelper || new Search.PageSearch();
        return this.searchHelper.search(text, reverse, panel);
    },

    getContextMenuItems: function(panel, object, target) {
        // If we are passed an object that is not a change event then move to the next, if one is available
        if (object && !object.changeType) {
            var repNode = Firebug.getRepNode(target);
            object = repNode && Firebug.getRepObject(repNode.parentNode);
        }

        if (object) {
            var ret = [
               { label: i18n.getString("menu.ChangeSnapshot"), command: bindFixed(this.selectSnapshot, this, object, panel), nol10n: true },
               "-"
            ];

            if (Fireformat.Formatters) {
                ret.push({ label: i18n.getString("menu.SaveSnapshot"), command: bindFixed(this.saveSnapshot, this, object, panel.context), nol10n: true });
                ret.push({ label: i18n.getString("menu.SaveDiff"), command: bindFixed(this.saveDiff, this, object, panel.context), nol10n: true });
                ret.push("-");
            }

            ret.push({ label: i18n.getString("menu.RevertChange"), command: bindFixed(this.revertChange, this, object, panel), nol10n: true });
            ret.push({ label: i18n.getString("menu.RevertAllChanges"), command: bindFixed(this.revertAllChanges, this, object, panel), nol10n: true });
            return ret;
        }
    },

    selectSnapshot: function(change, panel) {
        try {
            // We run this here to defer change processing
            panel.select(change.getSnapshot(panel.context));
        } catch (err) {
            FBTrace.sysout(err,err);
        }
    },

    revertAllChanges: function(change, panel) {
        try {
            Firebug.DiffModule.revertAllChanges(change, panel.context);
            panel.refresh();
        } catch (err) {
            FBTrace.sysout(err,err);
        }
    },
    revertChange: function(change, panel) {
        try {
            var dontPrompt = this.isDontPromptOnMultipleRevert();
            var ret = Firebug.DiffModule.revertChange(change, panel.context, dontPrompt);
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
                Firebug.DiffModule.revertChange(change, panel.context, true);
            }

            panel.refresh();
        } catch (err) {
            FBTrace.sysout(err,err);
        }
    },
    saveSnapshot: function(change, context) {
        var file = FireDiff.FileIO.promptForFileName(i18n.getString("menu.SaveSnapshot"), change.changeType);
        if (file) {
            var snapshot = change.getSnapshot(context);
            FireDiff.FileIO.writeString(file, snapshot.getText());
        }
    },
    saveDiff: function(change, context) {
        try {
            var file = FireDiff.FileIO.promptForFileName(i18n.getString("menu.SaveDiff"), FireDiff.FileIO.DIFF_MODE);
            if (file) {
                var snapshot = change.getSnapshot(context),
                    base = change.getBaseSnapshot(context),
                    snapshotText = snapshot.getText(),
                    baseText = base.getText(),
                    diff = JsDiff.createPatch(
                            change.getDocumentName(context),
                            baseText, snapshotText,
                            i18n.getString("diff.baseFile"), i18n.getString("diff.snapshot"));

                FireDiff.FileIO.writeString(file, diff);
            }
        } catch (err) {
            FBTrace.sysout(err, err);
        }
    },
});
FireDiff.reps.MonitorRep = domplate(Firebug.Rep,{
    supportsObject: function(object, type) {
      return object == FireDiff.reps.Monitor;
    },
    getTitle: function(object) {
        return i18n.getString("page.ChangeLog");
    }
});

Firebug.registerRep(FireDiff.reps.MonitorRep);

}});
