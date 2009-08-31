/* See license.txt for terms of usage */
FireDiff  = FireDiff || {};

FBL.ns(function() { with (FBL) {

var i18n = document.getElementById("strings_firediff");

var Events = FireDiff.events,
    Path = FireDiff.Path,
    Reps = FireDiff.reps,
    CSSModel = FireDiff.CSSModel;

const CHANGES = "firebug-firediff-changes";
const ATTR_CHANGES = "firebug-firediff-attrChanges";
const REMOVE_CHANGES = "firebug-firediff-removeChanges";

var ChangeSource = {
    APP_CHANGE: "APP_CHANGE",
    FIREBUG_CHANGE: "FIREBUG_CHANGE"
};

function ChangeEvent(changeSource) {
  this.date = new Date();
  this.changeSource = changeSource || ChangeSource.APP_CHANGE;
}
ChangeEvent.prototype = {
    getChangeType: function() { return this.changeType; },
    getSummary: function() {},
    merge: function(candidate) {},
    mergeCancellation: function(candidate) {},
    cloneOnXPath: function(xpath) {},
    appliesTo: function(target) {
      // Any change that is made to the target or a child
      return target && Path.isChildOrSelf(this.getXpath(target), this.xpath);
    },
    sameFile: function(otherChange) {},
    getSnapshotRep: function(context) {},
    
    apply: function() {},
    revert: function() {},
    
    getMergedXPath: function(prior) {},
    
    getXpath: function(target) {},
    xpathLookup: function(xpath, root) {},
    getActionNode: function(target, xpath) {
      try {
        xpath = xpath || this.getXpath(target);
        if (xpath == this.xpath) {
          // Empty string passed to evaluate is bad. 
          return target;
        }
        
        var components = Path.getRelativeComponents(this.xpath, xpath);
        if (!components.right) {
          return this.xpathLookup(components.left, target);
        }
      } catch (err) {
        if (FBTrace.DBG_ERRORS) {
          FBTrace.sysout("getActionNode Error: " + err, err);
          FBTrace.sysout(" - getActionNode: " + this.xpath + " " + xpath, components);
        }
        throw err;
      }
    },
    getInsertActionNode: function(target, xpath) {
      xpath = xpath || this.getXpath(target);
      
      var parentPath = Path.getParentPath(this.xpath);
      var selfId = Path.getIdentifier(this.xpath);
      
      var components = Path.getRelativeComponents(parentPath, xpath);
      var parentEl;
      if (components.left) {
        parentEl = this.xpathLookup(components.left, target);
      } else {
        parentEl = target;
      }
      
      var siblingEl = this.xpathLookup(selfId.tag + "[" + selfId.index + "]", parentEl);
      return {
        parent: parentEl,
        sibling: siblingEl
      };
    },
    
    toString: function() {
      return "[object ChangeEvent-" + this.changeType + "-" + this.subType + " " + this.xpath + "]";
    }
};

// Global API
FireDiff.events = {
    ChangeEvent: ChangeEvent,
    
    ChangeSource: ChangeSource,
    AnnotateAttrs: {
      CHANGES: CHANGES,
      ATTR_CHANGES: ATTR_CHANGES,
      REMOVE_CHANGES: REMOVE_CHANGES
    },
    
    merge: function(changes) {
        if (!changes.length) {
          return changes;
        }
        
        var ret = [];
        
        if (FBTrace.DBG_FIREDIFF)   FBTrace.sysout("Merge prior", changes);
        changes = changes.slice();
        
        for (var innerIter = 0; innerIter < changes.length; innerIter++) {
            var curTest = changes[innerIter];
            
            if (!curTest) {
                continue;
            }
            
            for (var outerIter = innerIter + 1; curTest && outerIter < changes.length; outerIter++) {
                if (changes[outerIter]) {
                    var mergeValue = curTest.merge(changes[outerIter]);
                    if (mergeValue) {
                        if (FBTrace.DBG_FIREDIFF)   FBTrace.sysout("Merge change " + innerIter + " " + outerIter, mergeValue);
                        
                        if (!mergeValue[0]) {
                            // Cancellation special case
                            for (var cancelIter = innerIter + 1; cancelIter < outerIter; cancelIter++) {
                              if (changes[cancelIter]) {
                                var updatedXPath = curTest.mergeCancellation(changes[cancelIter]);
                                if (updatedXPath) {
                                  changes[cancelIter] = changes[cancelIter].cloneOnXPath(updatedXPath);
                                }
                              }
                            }
                        }
                        
                        curTest = mergeValue[0];
                        changes[outerIter] = mergeValue[1];
                    }
                }
            }
            
            if (curTest) {
              ret.push(curTest);
            }
        }

        if (FBTrace.DBG_FIREDIFF)   FBTrace.sysout("Merge result", ret);
        return ret;
    }
};

}});