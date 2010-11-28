/* See license.txt for terms of usage */
var FireDiff  = FireDiff || {};

FBL.ns(function() { with (FBL) {

const dateFormat = CCSV("@mozilla.org/intl/scriptabledateformat;1", "nsIScriptableDateFormat");

var Events = FireDiff.events,
    DiffDomplate = FireDiff.domplate,
    Search = FireDiff.search;

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
        DIV({class: "logEntry"}, TAG("$change|getChangeTag", {change: "$change", object: "$change.target"}))
    ),

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
    }
});
FireDiff.reps.MonitorRep = domplate(Firebug.Rep,{
    supportsObject: function(object, type) {
      return object == FireDiff.reps.Monitor;
    },
    getTitle: function(object) {
        return i18n.getString("page.ChangeLog");
    }
});

}});
