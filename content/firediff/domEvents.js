/* See license.txt for terms of usage */
FireDiff  = FireDiff || {};

FBL.ns(function() { with (FBL) {

var i18n = document.getElementById("strings_firediff");

var Path = FireDiff.Path,
  Reps = FireDiff.reps,
  ChangeEvent = FireDiff.events.ChangeEvent,
  
  CHANGES = FireDiff.events.AnnotateAttrs.CHANGES,
  ATTR_CHANGES = FireDiff.events.AnnotateAttrs.ATTR_CHANGES,
  REMOVE_CHANGES = FireDiff.events.AnnotateAttrs.REMOVE_CHANGES;

function DOMChangeEvent(target, xpath, displayXPath, changeSource) {
  ChangeEvent.call(this, changeSource);
  this.changeType = "DOM";
  this.xpath = xpath || Path.getElementPath(target);
  this.displayXPath = displayXPath || Path.getElementPath(target, true);
  
  // Store this just to create a mostly accurate repobject link. This shouldn't be used otherwise
  this.target = target;
}
DOMChangeEvent.prototype = extend(ChangeEvent.prototype, {
    sameFile: function(otherChange) {
      return this.getChangeType() == otherChange.getChangeType()
          && this.target.ownerDocument == otherChange.target.ownerDocument;
    },
    getSnapshotRep: function(context) {
      return new Reps.DOMSnapshot(this, context.window.document);
    },
    
    getXpath: function(target) { return Path.getElementPath(target); },
    xpathLookup: function(xpath, root) {
      var iterate = root.ownerDocument.evaluate(xpath, root, null, XPathResult.ANY_TYPE, null);
      return iterate.iterateNext();
    },
    
    /* Merge Helper Routines */
    overridesChange: function(prior) {},
    
    annotateTree: function(tree, root) {
      var actionNode = this.getActionNode(tree, root);
      if (!actionNode) {
        if (FBTrace.DBG_ERRORS)   FBTrace.sysout("ERROR: annotateTree: actionNode is undefined tree: " + root, tree);
      }
      actionNode[CHANGES] = this;

      if (actionNode.nodeType == Node.TEXT_NODE) {
        return this;
      } else {
        return actionNode;
      }
    }
});

function DOMInsertedEvent(target, clone, xpath, displayXPath, changeSource) {
  DOMChangeEvent.call(this, target, xpath, displayXPath, changeSource);
  this.clone = clone || target.cloneNode(true);

  if (target instanceof Text) {
    this.previousValue = "";
    this.value = target.data;
  }
}
DOMInsertedEvent.prototype = extend(DOMChangeEvent.prototype, {
    subType: "dom_inserted",
    
    getSummary: function() {
      return i18n.getString("summary.DOMInserted");
    },
    isElementAdded: function() { return true; },
    
    apply: function(target, xpath) {
      Firebug.DiffModule.ignoreChanges(bindFixed(
          function() {
            var actionNode = this.getInsertActionNode(target, xpath);
            
            actionNode.parent.insertBefore(this.clone.cloneNode(true), actionNode.sibling);
          }, this));
    },
    revert: function(target, xpath) {
      Firebug.DiffModule.ignoreChanges(bindFixed(
          function() {
            var actionNode = this.getActionNode(target, xpath);
            if (actionNode) {
              actionNode.parentNode.removeChild(actionNode);
            }
          }, this));
    },

    merge: function(candidate) {
      if (candidate.changeType != this.changeType) {
        // We don't touch if it's not dom
        return undefined;
      }
      
      // Only changes that affect us are:
      // - Remove on same xpath (Overrides)
      // - Modification of self (by attr or char data change)
      // - Any modification of children
      // - XPath updates
      
      // Check overrides cases
      if (candidate.overridesChange(this)) {
        // Special case here. The only thing that can override us
        // is our inverse or an action on our parent.
        if (candidate.xpath == this.xpath) {
          return [];
        } else {
          return [candidate];
        }
      }
      
      var updateXPath = candidate.getMergedXPath(this);
      
      // Self and Child modification
      if (Path.isChild(this.xpath, candidate.xpath)
          || (!updateXPath && this.xpath == candidate.xpath)) {
        // Something changed without our own tree, apply those changes and call
        // it a day
        var clone = this.clone.cloneNode(true);   // Yeah..... <Clone, Clone, Clone, ...>
        candidate.apply(clone, this.xpath);
        
        return [new DOMInsertedEvent(this.target, clone, this.xpath, this.displayXPath, this.changeSource)];
      }
      
      // XPath modification
      if (updateXPath) {
        return [
                this.cloneOnXPath(updateXPath),
                candidate
            ];
      }
      
      // No mods to be made
      return undefined;
    },
    mergeRevert: function(candidate) {
      // On revert we want to
      //  - Revert any changes made on this object or a child
      if (Path.isChildOrSelf(this.xpath, candidate.xpath)) {
        return this.merge(candidate);
      }
    },
    isCancellation: function(candidate) {
      return candidate.overridesChange(this) && this.xpath == candidate.xpath;
    },
    affectsCancellation: function(candidate) {
      return Path.isChildOrSelf(this.xpath, candidate.xpath);
    },
    cloneOnXPath: function(xpath) {
      return new DOMInsertedEvent(this.target, this.clone, xpath, this.displayXPath, this.changeSource);
    }
});
function DOMRemovedEvent(target, clone, xpath, displayXPath, changeSource) {
  DOMChangeEvent.call(this, target, xpath, displayXPath, changeSource);
  this.clone = clone || target.cloneNode(true);

  if (target instanceof Text) {
    this.value = "";
    this.previousValue = target.data;
  }
}
DOMRemovedEvent.prototype = extend(DOMChangeEvent.prototype, {
    subType: "dom_removed",
    
    getSummary: function() {
      return i18n.getString("summary.DOMRemoved");
    },
    isElementRemoved: function() { return true; },
    
    apply: function(target, xpath) {
      Firebug.DiffModule.ignoreChanges(bindFixed(
          function() {
            var actionNode = this.getActionNode(target, xpath);
            actionNode.parentNode.removeChild(actionNode);
          }, this));
    },
    revert: function(target, xpath) {
      Firebug.DiffModule.ignoreChanges(bindFixed(
          function() {
            var actionNode = this.getInsertActionNode(target, xpath);
            
            actionNode.parent.insertBefore(this.clone.cloneNode(true), actionNode.sibling);
          }, this));
    },
    
    merge: function(candidate) {
      if (candidate.changeType != this.changeType) {
        // We don't touch if it's not dom
        return undefined;
      }
      
      if (Path.isChild(this.xpath, candidate.xpath)) {
        // If this is a child WRT to xpath, we don't touch it.
        return undefined;
      }
      
      if (this.xpath === candidate.xpath) {
        if (candidate.isElementAdded()
            && this.clone.isEqualNode(candidate.clone)) {
          // Cancellation
          return [];
        }
      } else {
        // Check overrides cases
        if (candidate.overridesChange(this)) {
          return [candidate];
        }
        
        // Check for xpath modifications
        var updateXpath = candidate.getMergedXPath(this);
        if (updateXpath) {
          return [
              this.cloneOnXPath(updateXpath),
              candidate
          ];
        }
      }
    },
    mergeRevert: function(candidate) {
      // The only thing that a delete might revert is an insert operation
      // of its identity
      if (this.isCancellation(candidate)) {
        return [];
      }
    },
    isCancellation: function(candidate) {
      return this.xpath == candidate.xpath
          && candidate.isElementAdded()
          && this.clone.isEqualNode(candidate.clone);
    },
    affectsCancellation: function(candidate) {
      return this.isCancellation(candidate);
    },
    cloneOnXPath: function(xpath) {
      return new DOMRemovedEvent(this.target, this.clone, xpath, this.displayXPath, this.changeSource);
    },

    overridesChange: function(prior) {
      return Path.isChildOrSelf(this.xpath, prior.xpath);
    },
    
    annotateTree: function(tree, root) {
      var actionNode = this.getInsertActionNode(tree, root).parent;
      var list = actionNode[REMOVE_CHANGES] || [],
          i = list.length;
      while (i > 0 && Path.compareXPaths(this.xpath, list[i-1].xpath) > 0) {
        i--;
      }
      list.splice(i ? 1-1 : 0, 0, this);
      actionNode[REMOVE_CHANGES] = list;
      
      this.clone.change = this;
      
      return this;
    }
});


function DOMAttrChangedEvent(target, attrChange, attrName, newValue, prevValue, xpath, displayXPath, changeSource, clone) {
  DOMChangeEvent.call(this, target, xpath, displayXPath, changeSource);
  
  this.attrChange = attrChange;
  this.attrName = attrName;
  this.previousValue = prevValue;
  this.value = newValue;
  
  this.clone = clone || target.cloneNode(false);
}
DOMAttrChangedEvent.prototype = extend(DOMChangeEvent.prototype, {
    subType: "attr_changed",
    getSummary: function() {
      if (this.attrChange == MutationEvent.MODIFICATION) {
        return i18n.getString("summary.DOMAttrChanged");
      } else if (this.attrChange == MutationEvent.ADDITION) {
        return i18n.getString("summary.DOMAttrAddition");
      } else if (this.attrChange == MutationEvent.REMOVAL) {
        return i18n.getString("summary.DOMAttrRemoval");
      }
    },
    isAddition: function() { return this.attrChange == MutationEvent.ADDITION; },
    isRemoval: function() { return this.attrChange == MutationEvent.REMOVAL; },
    
    merge: function(candidate) {
      if (candidate.changeType != this.changeType) {
        // We don't touch if it's not dom
        return undefined;
      }
      
      if (this.subType != candidate.subType
              || this.xpath != candidate.xpath
              || this.attrName != candidate.attrName) {
        // Check overrides cases
        if (candidate.overridesChange(this)) {
          return [candidate];
        }
        
        // Check for xpath modifications
        var updateXpath = candidate.getMergedXPath(this);
        if (updateXpath) {
          return [
              this.cloneOnXPath(updateXpath),
              candidate
          ];
        }
        return undefined;
      }
      
      if (candidate.attrChange == MutationEvent.REMOVAL) {
        if (this.attrChange == MutationEvent.ADDITION) {
          // These events cancel, remove.
          return [];
        } else {
          // Anything followed by removal: Removal, merging previous value
          return [
              new DOMAttrChangedEvent(
                  this.target,
                  MutationEvent.REMOVAL, this.attrName,
                  candidate.value, this.previousValue,
                  this.xpath, this.displayXPath, this.changeSource, this.clone)
              ];
        }
      } else if (this.attrChange == MutationEvent.REMOVAL) {
        if (candidate.attrChange == MutationEvent.ADDITION) {
          // Removal followed by addition: one of two cases. Modification or cancellation
          if (this.previousValue == candidate.value) {
            return [];
          } else {
            return [
                new DOMAttrChangedEvent(
                    this.target,
                    MutationEvent.MODIFICATION, this.attrName,
                    candidate.value, this.previousValue,
                    this.xpath, this.displayXPath, this.changeSource, this.clone)
                ];
          }
        } else {
          if (this.previousValue == candidate.value) {
            return [];
          } else {
            // Removal following by anything else is that other thing w/ prev set to our value
            return [
                new DOMAttrChangedEvent(
                    this.target,
                    candidate.attrChange, this.attrName,
                    candidate.value, this.previousValue,
                    this.xpath, this.displayXPath, this.changeSource, this.clone)
                ];
          }
        }
      } else {
        // Any other events (even those that don't make sense) just result in a merge
        if (this.previousValue == candidate.value) {
          return [];
        } else {
          return [
              new DOMAttrChangedEvent(
                  this.target,
                  this.attrChange, this.attrName,
                  candidate.value, this.previousValue,
                  this.xpath, this.displayXPath, this.changeSource, this.clone)
              ];
        }
      }
    },
    cloneOnXPath: function(xpath) {
      return new DOMAttrChangedEvent(
          this.target,
          this.attrChange, this.attrName,
          this.value, this.previousValue,
          xpath, this.displayXPath, this.changeSource, this.clone);
    },
    mergeRevert: function(candidate) {
      // On revert we want to
      //  - Revert any changes made on this exact attr
      if (this.xpath == candidate.xpath && this.attrName == candidate.attrName) {
        return this.merge(candidate);
      }
    },
    isCancellation: function(candidate) {
      return this.xpath == candidate.xpath
          && this.attrName == candidate.attrName
          && (this.previousValue == candidate.value
              || (this.attrChange == MutationEvent.ADDITION
                  && candidate.attrChange == MutationEvent.REMOVAL));
    },
    affectsCancellation: function(candidate) {
      return this.xpath == candidate.xpath
          && this.attrName == candidate.attrName;
    },
    
    apply: function(target, xpath) {
      Firebug.DiffModule.ignoreChanges(bindFixed(
          function() {
            var actionNode = this.getActionNode(target, xpath);
            if (this.attrChange == MutationEvent.REMOVAL) {
              actionNode.removeAttribute(this.attrName);
            } else if (this.attrChange == MutationEvent.ADDITION
                || this.attrChange == MutationEvent.MODIFICATION) {
              actionNode.setAttribute(this.attrName, this.value);
            }
          }, this));
    },
    revert: function(target, xpath) {
      Firebug.DiffModule.ignoreChanges(bindFixed(
          function() {
            var actionNode = this.getActionNode(target, xpath);
            if (this.attrChange == MutationEvent.ADDITION) {
              actionNode.removeAttribute(this.attrName);
            } else if (this.attrChange == MutationEvent.REMOVAL
                || this.attrChange == MutationEvent.MODIFICATION) {
              actionNode.setAttribute(this.attrName, this.previousValue);
            }
          }, this));
    },
    
    annotateTree: function(tree, root) {
      var actionNode = this.getActionNode(tree, root);
      var list = actionNode[ATTR_CHANGES] || {};
      list[this.attrName] = this;
      actionNode[ATTR_CHANGES] = list;
      
      return actionNode;
    }
});

function DOMCharDataModifiedEvent(target, newValue, prevValue, xpath, displayXPath, changeSource, clone) {
    DOMChangeEvent.call(this, target, xpath, displayXPath, changeSource);
    
    this.previousValue = prevValue;
    this.value = newValue;
    
    this.clone = clone || target.cloneNode(false);
}
DOMCharDataModifiedEvent.prototype = extend(DOMChangeEvent.prototype, {
    subType: "char_data_modified",
    getSummary: function() {
      return i18n.getString("summary.DOMCharDataModified");
    },
    merge: function(candidate) {
      if (candidate.changeType != this.changeType) {
        // We don't touch if it's not dom
        return undefined;
      }
      
      if (this.subType != candidate.subType
              || this.xpath != candidate.xpath) {
        // Check overrides cases
        if (candidate.overridesChange(this)) {
          return [candidate];
        }
        
        // Check for xpath modifications
        var updateXpath = candidate.getMergedXPath(this);
        if (updateXpath) {
          return [
              this.cloneOnXPath(updateXpath),
              candidate
          ];
        }
        return undefined;
      }
      
      return [ new DOMCharDataModifiedEvent(this.target, candidate.value, this.previousValue, this.xpath, this.displayXPath, this.changeSource, this.clone) ];
    },
    mergeRevert: function(candidate) {
      if (this.xpath == candidate.xpath) {
        return this.merge(candidate);
      }
    },
    isCancellation: function(candidate) {
      return this.xpath == candidate.xpath
          && this.subType == candidate.subType
          && this.previousValue == candidate.value;
    },
    affectsCancellation: function(candidate) {
      return this.xpath == candidate.xpath
          && this.subType == candidate.subType;
    },

    cloneOnXPath: function(xpath) {
      return new DOMCharDataModifiedEvent(
          this.target, this.value, this.previousValue, xpath, this.displayXPath, this.changeSource, this.clone);
    },
    
    apply: function(target, xpath) {
      Firebug.DiffModule.ignoreChanges(bindFixed(
          function() {
            var actionNode = this.getActionNode(target, xpath);
            actionNode.replaceData(0, actionNode.length, this.value);
          }, this));
    },
    revert: function(target, xpath) {
      Firebug.DiffModule.ignoreChanges(bindFixed(
          function() {
            var actionNode = this.getActionNode(target, xpath);
            actionNode.replaceData(0, actionNode.length, this.previousValue);
          }, this));
    }
});

FireDiff.events.dom = {
    DOMInsertedEvent: DOMInsertedEvent,
    DOMRemovedEvent: DOMRemovedEvent,
    DOMAttrChangedEvent: DOMAttrChangedEvent,
    DOMCharDataModifiedEvent: DOMCharDataModifiedEvent,
    
    createDOMChange: function(ev, changeSource) {
      switch (ev.type) {
      case "DOMNodeInserted":
      case "DOMNodeInsertedInfoDocument":
        return new DOMInsertedEvent(ev.target, undefined, undefined, undefined, changeSource);
      case "DOMNodeRemoved":
      case "DOMNodeRemovedFromDocument":
        return new DOMRemovedEvent(ev.target, undefined, undefined, undefined, changeSource);
      case "DOMAttrModified":
        return new DOMAttrChangedEvent(ev.target, ev.attrChange, ev.attrName, ev.newValue, ev.prevValue, undefined, undefined, changeSource);
      case "DOMCharacterDataModified":
        return new DOMCharDataModifiedEvent(ev.target, ev.newValue, ev.prevValue, undefined, undefined, changeSource);
      }
    }
};

}});