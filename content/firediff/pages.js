/* See license.txt for terms of usage */
var FireDiff  = FireDiff || {};

FireDiff.reps = FBL.ns(function() { with (FBL) {

const dateFormat = CCSV("@mozilla.org/intl/scriptabledateformat;1", "nsIScriptableDateFormat");

var Events = FireDiff.events,
    Path = FireDiff.Path,
    CSSModel = FireDiff.CSSModel,
    DiffDomplate = FireDiff.domplate;

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
Snapshot.prototype = {
  updateCloneToChange: function(clone, cloneXPath) {
    this.changeNodeList = [];
    for (var i = this.revertChanges.length; i > 0; i--) {
      this.revertChanges[i-1].revert(clone, cloneXPath);
    }
    for (var i = 0; i < this.displayChanges.length; i++) {
      this.changeNodeList.push(this.displayChanges[i].annotateTree(clone, cloneXPath));
    }
  }
}

this.DOMSnapshot = function(change, document){
  Snapshot.call(this, change);
  
  this.displayTree = document.documentElement.cloneNode(true);
  this.cloneXPath = Path.getElementPath(document.documentElement);
  this.updateCloneToChange(this.displayTree, this.cloneXPath);
  this.normalizeChangeNodes();
  
  this.onMouseDown = bind(this.onMouseDown, this);
};
this.DOMSnapshot.prototype = extend(Snapshot.prototype, {
  show: function(panel) {
    this.panel = panel;
    
    this.ioBox = new InsideOutBox(
        new DiffDomplate.HtmlSnapshotView(this.displayTree, this.cloneXPath, panel),
        panel.panelNode);
    this.ioBox.openObject(this.displayTree);
    
    for (var i = 0; i < this.changeNodeList.length; i++) {
      this.ioBox.openToObject(this.changeNodeList[i]);
    }
    this.curChange = -1;
    panel.panelNode.scrollTop = 0;

    panel.panelNode.addEventListener("mousedown", this.onMouseDown, false);
  },
  hide: function(panel) {
    if (this.ioBox) {
      this.ioBox.destroy();
      delete this.ioBox;
    }

    panel.panelNode.removeEventListener("mousedown", this.onMouseDown, false);
    
    delete this.panel;
  },
  
  hasChanges: function(changeNode, changeSource) {
    var change = changeNode[Events.AnnotateAttrs.CHANGES] || changeNode;
    if (change.changeSource == changeSource) {
      return true;
    }
    var changes = changeNode[Events.AnnotateAttrs.ATTR_CHANGES] || {};
    for (var i in changes) {
      if (changes[i].changeSource == changeSource) {
        return true;
      }
    }
  },
  iterateChanges: function(stepper) {
    var change = stepper(this.curChange);

    for (var i = 0; i < this.changeNodeList.length+1; i++) {
      if (change >= this.changeNodeList.length) {
        change = 0;
      } else if (change < 0) {
        change = this.changeNodeList.length - 1;
      }

      // Accept the change if
      //  - Is not whitespace only or we are displaying whitespace
      //  - Is an app change and we are displaying app changes
      //  - Is a firebug change and we are displaying firebug changes
      var changeNode = this.changeNodeList[change];
      var displayAppChange = this.panel.isDisplayAppChanges() && this.hasChanges(changeNode, Events.ChangeSource.APP_CHANGE);
      var displayFirebugChange = this.panel.isDisplayFirebugChanges() && this.hasChanges(changeNode, Events.ChangeSource.FIREBUG_CHANGE);
      var whitespaceTest = Firebug.showWhitespaceNodes || !DiffDomplate.DomUtil.isWhitespaceText(changeNode);
      if ((displayAppChange || displayFirebugChange) && whitespaceTest) {
        return change;
      }
      
      change = stepper(change);
    }
    return -1;
  },
  
  showNext: function() {
    this.curChange = this.iterateChanges(
        function(change) { return change + 1; });
    
    this.showCurNode();
  },
  showPrev: function() {
    this.curChange = this.iterateChanges(
        function(change) { return change - 1; });
    
    this.showCurNode();
  },
  showCurNode: function() {
    if (this.curChange < 0) {
      return;
    }

    var objectBox = this.ioBox.openToObject(this.changeNodeList[this.curChange]);

    if (objectBox) {
      scrollIntoCenterView(objectBox);
      var labelBox = getChildByClass(objectBox.firstChild, 'nodeLabelBox');
      if (labelBox) {
        setClassTimed(labelBox, "jumpHighlight", this.panel.context);
      }
    }
    return objectBox;
  },
  
  onMouseDown: function(event) {
    if (isLeftClick(event) && getAncestorByClass(event.target, "nodeContainerLabel")) {
      this.ioBox.expandObject(Firebug.getRepObject(event.target));
    }
  },
  
  normalizeChangeNodes: function() {
    // Reduce to one element per xpath
    var pathList = {};
    var ret = [];
    for (var i = 0; i < this.changeNodeList.length; i++) {
      var change = this.changeNodeList[i];
      var path = change.xpath || (this.cloneXPath + Path.getElementPath(change));
      
      if (!pathList[path]) {
        change.lookupXPath = path;
        ret.push(change);
        pathList[path] = change;
      }
    }
    
    ret.sort(function(a, b) { return a.lookupXPath.localeCompare(b.lookupXPath); });
    
    this.changeNodeList = ret;
  }
});
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
  
  this.sheet = change.styleSheet || change.style.parentStyleSheet;
  this.displayTree = CSSModel.cloneCSSObject(this.sheet);
  this.updateCloneToChange(
      this.displayTree,
      Path.getStylePath(this.sheet));
};
this.CSSSnapshot.prototype = extend(Snapshot.prototype, {
  show: function(panel) {
    DiffDomplate.CSSChanges.CSSList.tag.append({change: this.displayTree}, panel.panelNode);
  }
});
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