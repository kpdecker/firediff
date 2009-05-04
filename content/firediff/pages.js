/* See license.txt for terms of usage */
var FireDiff  = FireDiff || {};

FireDiff.reps = FBL.ns(function() { with (FBL) {

const dateFormat = CCSV("@mozilla.org/intl/scriptabledateformat;1", "nsIScriptableDateFormat");

var Events = FireDiff.events,
    Path = FireDiff.Path;

var i18n = document.getElementById("strings_firediff");

// Object used to define the monitor view
this.Monitor = domplate({
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
    // TODO : Consider converting these into rep objects
    if (change.changeType == "CSS") {
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
  }
});
this.MonitorRep = domplate(Firebug.Rep,{
  supportsObject: function(object, type) {
    return object == FireDiff.reps.Monitor;
  },
  getTitle: function(object) {
    return i18n.getString("page.ChangeLog");
  }
});

function Snapshot(change) {
  var changes = Firebug.DiffModule.getChanges();
  var displayChanges = [], revertChanges = [];
  var foundChange = false;
  for (var i = 0; i < changes.length; i++) {
    if (changes[i] == change) {
      displayChanges.push(changes[i]);
      foundChange = true;
    } else if (change.sameFile(changes[i])) {
      (foundChange ? revertChanges : displayChanges).push(changes[i]);
    }
  }
  displayChanges = Events.merge(displayChanges);
  
  this.displayChanges = displayChanges;
  this.revertChanges = revertChanges;
}

this.DOMSnapshot = function(change, document){
  Snapshot.call(this, change);
  
  var displayTree = document.documentElement.cloneNode(true);
  var cloneXPath = Path.getElementPath(document.documentElement);
  for (var i = this.revertChanges.length; i > 0; i--) {
    this.revertChanges[i-1].revert(displayTree, cloneXPath);
  }
  for (var i = 0; i < this.displayChanges.length; i++) {
    this.displayChanges[i].annotateTree(displayTree, cloneXPath);
  }
  this.displayTree = displayTree;
};
this.DOMSnapshot.prototype = {
  show: function(panel) {
    FireDiff.domplate.allChanges.CompleteElement.tag.append({change: this.displayTree}, panel.panelNode);
  }
};
this.DOMSnapshotRep = domplate(Firebug.Rep, {
  supportsObject: function(object, type) {
    return object instanceof FireDiff.reps.DOMSnapshot;
  },
  getTitle: function(object) {
    return i18n.getString("page.DOMSnapshot");
  }
});

this.CSSSnapshot = function(change){
  Snapshot.call(this, change);
  
  FBTrace.sysout("StyleSheet", change.style.parentRule.parentStyleSheet);
  
  FBTrace.sysout("CSS Snapshot", this.displayChanges);
};
this.CSSSnapshot.prototype = {
  show: function(panel) {
    FireDiff.domplate.allChanges.CompleteElement.tag.append({change: this.displayTree}, panel.panelNode);
  }
};
this.CSSSnapshotRep = domplate(Firebug.Rep, {
  supportsObject: function(object, type) {
    return object instanceof FireDiff.reps.CSSSnapshot;
  },
  getTitle: function(object) {
    return i18n.getString("page.CSSSnapshot");
  }
});

Firebug.registerRep(
    this.MonitorRep,
    this.DOMSnapshotRep,
    this.CSSSnapshotRep);
}});