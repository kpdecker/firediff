/* See license.txt for terms of usage */
var FireDiff  = FireDiff || {};

FireDiff.reps = FBL.ns(function() { with (FBL) {

var Fireformat = {};

try {
  Components.utils.import("resource://fireformat/formatters.jsm", Fireformat);
} catch (err) {
}

var Events = FireDiff.events,
    Path = FireDiff.Path,
    CSSModel = FireDiff.CSSModel,
    DiffDomplate = FireDiff.domplate,
    Search = FireDiff.search;

var i18n = document.getElementById("strings_firediff");

/**
 * Initializes the base snapshot datastructures. The passed parameter may be a
 * change event to generate a snapshot for a single document at a given point in
 * time or it may be a document to generate the base snapshot for that document.
 * 
 * @constructor
 * @class Base class for snapshots of a document state at a given point of time.
 * @param {Object} change The change event of document to create a snapshot for.
 */
function Snapshot(change) {
  var changes = Firebug.DiffModule.getChanges();
  var displayChanges = [], revertChanges = [];
  var foundChange = false;
  for (var i = 0; i < changes.length; i++) {
    if (changes[i] == change) {
      displayChanges.push(changes[i]);
      foundChange = true;
    } else if (changes[i].sameFile(change)) {
      (foundChange ? revertChanges : displayChanges).push(changes[i]);
    }
  }
  if (!foundChange) {
    // If the change was not in the list then we assume that this is the revert
    // to base case
    revertChanges = displayChanges;
    displayChanges = [];
  }
  displayChanges = Events.merge(displayChanges);
  
  this.displayChanges = displayChanges;
  this.revertChanges = revertChanges;
}
Snapshot.prototype = {
  updateCloneToChange: function(clone, cloneXPath) {
    this.changeNodeList = [];
    if (FBTrace.DBG_FIREDIFF)   FBTrace.sysout("Revert changes", this.revertChanges);
    
    var i = this.revertChanges.length;
    while (i--) {
      try {
        this.revertChanges[i].revert(clone, cloneXPath);
      } catch (err) {
        FBTrace.sysout("Snapshot.updateCloneToChane: revert " + i + " " + err, this.revertChanges[i]);
        throw err;
      }
    }
    for (var i = 0; i < this.displayChanges.length; i++) {
      try {
        this.changeNodeList.push(this.displayChanges[i].annotateTree(clone, cloneXPath));
      } catch (err) {
        FBTrace.sysout("ERROR: Failed to annotate tree: " + i, this.displayChanges[i]);
        throw err;
      }
    }
    this.normalizeChangeNodes();
  },
  
  navigableChange: function(changeNode) {},
  iterateChanges: function(stepper) {
    var change = stepper(this.curChange);

    for (var i = 0; i < this.changeNodeList.length+1; i++) {
      if (change >= this.changeNodeList.length) {
        change = 0;
      } else if (change < 0) {
        change = this.changeNodeList.length - 1;
      }

      if (this.navigableChange(this.changeNodeList[change])) {
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
  getCurNode: function() {},
  showCurNode: function() {
    if (this.curChange < 0) {
      return;
    }

    var objectBox = this.getCurNode();
    if (objectBox) {
      scrollIntoCenterView(objectBox);
      setClassTimed(objectBox, "jumpHighlight", this.panel.context);
    }
    return objectBox;
  },
  getChangeNodePath: function(changeNode) {},
  normalizeChangeNodes: function() {
    // Reduce to one element per xpath
    var pathList = {};
    var ret = [];
    if (FBTrace.DBG_FIREDIFF)   FBTrace.sysout("Snapshot.normalizeChangeNodes prior", this.changeNodeList);
    
    for (var i = 0; i < this.changeNodeList.length; i++) {
      var change = this.changeNodeList[i];
      var path = change.xpath || Path.getElementPath(change, false, this.cloneXPath);
      
      if (!change.normalized) {
        change.lookupXPath = path;
        change.normalized = true;
        ret.push(change);
      }
    }
    
    ret.sort(function(a, b) { return Path.compareXPaths(a.lookupXPath, b.lookupXPath); });

    // Since we are operating on a shared object we need to revert our tracking
    // var for future operations.
    for (var i = 0; i < this.changeNodeList.length; i++) {
      var change = this.changeNodeList[i];
      change.normalized = undefined;
    }

    this.changeNodeList = ret;
    if (FBTrace.DBG_FIREDIFF)   FBTrace.sysout("Snapshot.normalizeChangeNodes post", this.changeNodeList);
  }
};

this.DOMSnapshot = function(change, document){
  Snapshot.call(this, change || document.documentElement);
  
  // This requires Firefox 3.5
  this.displayTree = document.cloneNode(true);
  this.cloneXPath = Path.getElementPath(document);
  this.updateCloneToChange(this.displayTree, this.cloneXPath);
  
  this.onMouseDown = bind(this.onMouseDown, this);
};
this.DOMSnapshot.prototype = extend(Snapshot.prototype, {
  show: function(panel) {
    this.panel = panel;
    
    this.ioBox = new FireDiff.VersionCompat.InsideOutBox(
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
  search: function(text, reverse, panel) {
    if (!text)  { return; }

    var search;
    if (text == this.searchText && this.lastSearch) {
      search = this.lastSearch;
    } else {
      search = this.lastSearch = new Search.DOMDiffNodeSearch(text, this.displayTree, panel.panelNode, this.ioBox);
      this.searchText = text;
    }

    var loopAround = search.find(reverse, Firebug.searchCaseSensitive);
    if (loopAround) {
      delete this.lastSearch;
      return this.search(text, reverse, panel);
    }

    return !search.noMatch;
  },

  getContextMenuItems: function(panel, object, target) {
      if (object instanceof FireDiff.events.dom.DOMRemovedEvent) {
          return [
             {label: "CopyHTML", command: function() { copyToClipboard(getElementHTML(object.clone || object)); }},
             {label: "CopyInnerHTML", command: function() { copyToClipboard((object.clone || object).innerHTML); } },
             {label: "CopyXPath", command: function() { copyToClipboard(object.displayXPath); } }
         ]
      }
  },

  getText: function() {
    return Fireformat.Formatters.getHTMLFormatter().format(this.displayTree);
  },

  navigableChange: function(changeNode) {
    var displayedTypes = {};
    displayedTypes[Events.ChangeSource.APP_CHANGE] = this.panel.isDisplayAppChanges();
    displayedTypes[Events.ChangeSource.FIREBUG_CHANGE] = this.panel.isDisplayFirebugChanges();

    // Accept the change if
    //  - Is not whitespace only or we are displaying whitespace
    //  - Is an app change and we are displaying app changes
    //  - Is a firebug change and we are displaying firebug changes
    if (!Firebug.showWhitespaceNodes && DiffDomplate.DomUtil.isWhitespaceText(changeNode)) {
      return false;
    }

    var change = changeNode[Events.AnnotateAttrs.CHANGES] || changeNode;
    if (displayedTypes[change.changeSource]) {
      return true;
    }
    var changes = changeNode[Events.AnnotateAttrs.ATTR_CHANGES] || {};
    for (var i in changes) {
      if (displayedTypes[changes[i].changeSource]) {
        return true;
      }
    }
  },
  getCurNode: function() {
    var change = this.changeNodeList[this.curChange];
    var objectBox = this.ioBox.openToObject(change);

    if (objectBox) {
      // For dom removed and events that register themselves as the elements
      // sole change, highlight the entire element, otherwise
      // highlight the label only (this should only be the attr case)
      if (change.subType == "dom_removed" || change[FireDiff.events.AnnotateAttrs.CHANGES]) {
        return objectBox;
      } else {
        return getChildByClass(objectBox.firstChild, 'nodeLabelBox') || objectBox;
      }
    }
  },
  
  onMouseDown: function(event) {
    if (isLeftClick(event) && getAncestorByClass(event.target, "nodeContainerLabel")) {
      this.ioBox.expandObject(Firebug.getRepObject(event.target));
    }
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

this.CSSSnapshot = function(change, context){
  Snapshot.call(this, change);

  var rootPath = Path.getTopPath(change.xpath || Path.getStylePath(change));
  this.sheet = Path.evaluateStylePath(rootPath, context.window.document);
  this.displayTree = CSSModel.cloneCSSObject(this.sheet);
  this.updateCloneToChange(this.displayTree, rootPath);
};
this.CSSSnapshot.prototype = extend(Snapshot.prototype, {
  show: function(panel) {
    this.panel = panel;
    DiffDomplate.CSSChanges.CSSList.tag.append({change: this.displayTree}, panel.panelNode);

    this.curChange = -1;
    panel.panelNode.scrollTop = 0;
  },
  hide: function() {
    delete this.panel;
  },
  search: function(text, reverse, panel) {
    this.searchHelper = this.searchHelper || new Search.PageSearch();
    return this.searchHelper.search(text, reverse, panel);
  },

  getContextMenuItems: function(panel, object, target) {
      if (object instanceof FireDiff.events.css.CSSRemoveRuleEvent) {
          // For remove objects delegate to the clone (but only within this snapshot view)
          var rep = Firebug.getRep(object.clone, panel.context);
          return rep && rep.getContextMenuItems(object.clone, target, panel.context);
      }
  },

  getText: function() {
    return Fireformat.Formatters.getCSSFormatter().format(this.displayTree);
  },
  
  navigableChange: function(change) {
    return this.panel.isDisplayFirebugChanges();
  },
  getCurNode: function() {
    var change = this.changeNodeList[this.curChange];
    return Firebug.getElementByRepObject(this.panel.panelNode, change);
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
    this.DOMSnapshotRep,
    this.CSSSnapshotRep);
}});