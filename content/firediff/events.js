/* See license.txt for terms of usage */

FBL.ns(function() { with (FBL) {

var i18n = document.getElementById("strings_firediff");
var Path = FireDiff.Path;

var ChangeSource = {
    APP_CHANGE: "APP_CHANGE",
    FIREBUG_CHANGE: "FIREBUG_CHANGE"
};

function ChangeEvent(changeSource) {
  this.date = new Date();
  this.changeSource = changeSource || ChangeSource.APP_CHANGE;
}
ChangeEvent.prototype = {
    getChangeType: function() {},
    getSummary: function() {},
    merge: function(candidate) {},
    mergeCancellation: function(candidate) {},
    cloneOnXPath: function(xpath) {},
    appliesTo: function(target) {},
    
    apply: function() {},
    revert: function() {},
    
    toString: function() {
      return "[object ChangeEvent-" + this.changeType + "-" + this.subType + " " + this.xpath + "]";
    }
};

function DOMChangeEvent(target, xpath, displayXPath, changeSource) {
    ChangeEvent.call(this, changeSource);
    this.changeType = "dom";
    this.xpath = xpath || Path.getElementPath(target);
    this.displayXPath = displayXPath || Path.getElementPath(target, true);
    
    // Store this just to create a mostly accurate repobject link. This shouldn't be used otherwise
    this.target = target;
}
DOMChangeEvent.prototype = extend(ChangeEvent.prototype, {
    appliesTo: function(target) {
        return this.xpath == Path.getElementPath(target);
    },
    
    isElementAdded: function() { return false; },
    isElementRemoved: function() { return false; },
    
    getActionNode: function(target, xpath) {
      try {
        xpath = xpath || Path.getElementPath(target);
        if (xpath == this.xpath) {
          // Empty string passed to evaluate is bad. 
          return target;
        }
        
        var components = Path.getRelativeComponents(this.xpath, xpath);
        var iterate = target.ownerDocument.evaluate(components.left, target, null, XPathResult.ANY_TYPE, null);
        return iterate.iterateNext();
      } catch (err) {
        if (FBTrace.DBG_ERRORS) {
          FBTrace.sysout("getActionNode Error: " + err, err);
          FBTrace.sysout(" - getActionNode: " + this.xpath + " " + xpath, components);
        }
        throw err;
      }
    },
    getInsertActionNode: function(target, xpath) {
      xpath = xpath || Path.getElementPath(target);
      
      var parentPath = Path.getParentPath(this.xpath);
      var selfId = Path.getIdentifier(this.xpath);
      
      var components = Path.getRelativeComponents(parentPath, xpath);
      var parentEl;
      if (components.left) {
        var iterate = target.ownerDocument.evaluate(components.left, target, null, XPathResult.ANY_TYPE, null);
        parentEl = iterate.iterateNext() ;
      } else {
        parentEl = target;
      }
      
      iterate = target.ownerDocument.evaluate(
          selfId.tag + "[" + selfId.index + "]", parentEl, null, XPathResult.ANY_TYPE, null);
      var siblingEl = iterate.iterateNext();
      
      return {
        parent: parentEl,
        sibling: siblingEl
      };
    },
    
    /* Merge Helper Routines */
    getMergedXPath: function(prior) {},
    overridesChange: function(prior) {}
});

function DOMInsertedEvent(target, clone, xpath, displayXPath, changeSource) {
    DOMChangeEvent.call(this, target, xpath, displayXPath, changeSource);
    this.clone = clone || target.cloneNode(true);

    if (target instanceof Text) {
        this.previousValue = "";
        this.value = target.wholeText;
    }
}
DOMInsertedEvent.prototype = extend(DOMChangeEvent.prototype, {
    subType: "dom_inserted",
    
    appliesTo: function(target) {
      return target && Path.isChildOrSelf(this.xpath, Path.getElementPath(target));
    },
    
    getSummary: function() {
        return i18n.getString("summary.DOMInserted");
    },
    isElementAdded: function() { return true; },
    
    apply: function(target, xpath) {
      Firebug.DiffModule.ignoreChanges(bindFixed(
          function() {
            var actionNode = this.getInsertActionNode(target, xpath);
            
            // TODO : Should we clone or just insert target?
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
        
        return [new DOMInsertedEvent(this.target, clone, this.xpath, this.displayXPath)];
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
    mergeCancellation: function(candidate) {
      var updatedPath = Path.updateForRemove(candidate.xpath, this.xpath);
      if (updatedPath != candidate.xpath) {
        return updatedPath;
      }
    },
    cloneOnXPath: function(xpath) {
      return new DOMInsertedEvent(this.target, this.clone, xpath, this.displayXPath);
    },

    getMergedXPath: function(prior) {
      var updatedPath = Path.updateForInsert(prior.xpath, this.xpath);
      if (updatedPath != prior.xpath) {
        return updatedPath;
      }
    }
});
function DOMRemovedEvent(target, clone, xpath, displayXPath, changeSource) {
    DOMChangeEvent.call(this, target, xpath, displayXPath, changeSource);
    this.clone = clone || target.cloneNode(true);

    if (target instanceof Text) {
        this.value = "";
        this.previousValue = target.wholeText;
    }
}
DOMRemovedEvent.prototype = extend(DOMChangeEvent.prototype, {
    subType: "dom_removed",
    
    appliesTo: function(target) {
      // TODO : Need to include some kind of test for this case in the module
      // Test logic
      // TODO : How to best handle this as it really only applies once
      return false;
    },
    
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
        // TODO : Can we do this without the constant?
        if (candidate.subType == "dom_inserted") {
          if (this.clone.isEqualNode(candidate.clone)) {
            // Cancellation
            return [];
          }
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
    mergeCancellation: function(candidate) {
      var updatedPath = Path.updateForInsert(candidate.xpath, this.xpath);
      if (updatedPath != candidate.xpath) {
        return updatedPath;
      }
    },
    cloneOnXPath: function(xpath) {
      return new DOMRemovedEvent(this.target, this.clone, xpath, this.displayXPath);
    },

    getMergedXPath: function(prior) {
      var updatedPath = Path.updateForRemove(prior.xpath, this.xpath);
      if (updatedPath != prior.xpath) {
        return updatedPath;
      }
    },
    overridesChange: function(prior) {
      return Path.isChildOrSelf(this.xpath, prior.xpath);
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
                    this.xpath, this.displayXPath, undefined, this.clone)
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
                      this.xpath, this.displayXPath, undefined, this.clone)
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
                      this.xpath, this.displayXPath, undefined, this.clone)
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
                    this.xpath, this.displayXPath, undefined, this.clone)
                ];
          }
        }
    },
    cloneOnXPath: function(xpath) {
      return new DOMAttrChangedEvent(
          this.target,
          this.attrChange, this.attrName,
          this.value, this.previousValue,
          xpath, this.displayXPath, undefined, this.clone)
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
        
        return [ new DOMCharDataModifiedEvent(this.target, candidate.value, this.previousValue, this.xpath, this.displayXPath, undefined, this.clone) ];
    },
    cloneOnXPath: function(xpath) {
      return new DOMCharDataModifiedEvent(
          this.target, this.value, this.previousValue, xpath, this.displayXPath, undefined, this.clone);
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

function CSSChangeEvent(style, propName, changeSource) {
    ChangeEvent.call(this, changeSource);
    
    this.style = style;
    this.propName = propName;
}
CSSChangeEvent.prototype = extend(ChangeEvent.prototype, {
    changeType: "css",
    
    appliesTo: function(target) {
        return this.style === target;
    },
    merge: function(candidate) {
        if (this.changeType != candidate.changeType
                || this.style != candidate.style
                || this.propName != candidate.propName) {
            return undefined;
        }
        
        return this.mergeSubtype(candidate);
    }
});

function CSSSetPropertyEvent(style, propName, propValue, propPriority, prevValue, prevPriority, changeSource) {
    CSSChangeEvent.call(this, style, propName, changeSource);
    
    this.propValue = propValue;
    this.propPriority = propPriority;
    this.prevValue = prevValue;
    this.prevPriority = prevPriority;
};
CSSSetPropertyEvent.prototype = extend(CSSChangeEvent.prototype, {
    subType: "setProp",
    
    getSummary: function() {
        return i18n.getString("summary.CSSSetProperty");
    },
    mergeSubtype: function(candidate) {
      if (this.subType == candidate.subType) {
        if (this.prevValue != candidate.propValue
            || this.prevPriority != candidate.propPriority) {
          return [
              new CSSSetPropertyEvent(
                      this.style, this.propName,
                      candidate.propValue, candidate.propPriority,
                      this.prevValue, this.prevPriority)
              ];
        } else {
          return [];
        }
      } else if (candidate.subType == "removeProp"){
        return [];
      }
    },
    apply: function(style) {
      Firebug.DiffModule.ignoreChanges(bindFixed(
          function() {
            Firebug.CSSModule.setProperty(style, this.propName, this.propValue, this.propPriority);
          }, this));
    },
    revert: function(style) {
      Firebug.DiffModule.ignoreChanges(bindFixed(
          function() {
            if (this.prevValue) {
              Firebug.CSSModule.setProperty(style, this.propName, this.prevValue, this.prevPriority);
            } else {
              Firebug.CSSModule.removeProperty(style, this.propName);
            }
          }, this));
    }
});

function CSSRemovePropertyEvent(style, propName, prevValue, prevPriority, changeSource) {
    CSSChangeEvent.call(this, style, propName, changeSource);

    // Seed empty values for the current state. This makes the domplate
    // display much easier
    this.propValue = "";
    this.propPriority = "";
    
    this.prevValue = prevValue;
    this.prevPriority = prevPriority;
};
CSSRemovePropertyEvent.prototype = extend(CSSChangeEvent.prototype, {
    subType: "removeProp",
    
    getSummary: function() {
        return i18n.getString("summary.CSSRemoveProperty");
    },
    mergeSubtype: function(candidate) {
      if (this.subType == candidate.subType) {
        return [this];
      } else if (candidate.subType == "setProp") {
        return [
                new CSSSetPropertyEvent(
                        this.style, this.propName,
                        candidate.propValue, candidate.propPriority,
                        this.prevValue, this.prevPriority)
                ];
      }
    },
    apply: function(style) {
      Firebug.DiffModule.ignoreChanges(bindFixed(
          function() {
            Firebug.CSSModule.removeProperty(style, this.propName);
          }, this));
    },
    revert: function(style) {
      Firebug.DiffModule.ignoreChanges(bindFixed(
          function() {
            Firebug.CSSModule.setProperty(style, this.propName, this.prevValue, this.prevPriority);
          }, this));
    }
});

// Global API
FireDiff.events = {
    ChangeSource: ChangeSource,
    
    ChangeEvent: ChangeEvent,
    
    DOMChangeEvent: DOMChangeEvent,
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
    },
    
    CSSChangeEvent: CSSChangeEvent,
    CSSSetPropertyEvent: CSSSetPropertyEvent,
    CSSRemovePropertyEvent: CSSRemovePropertyEvent,
    
    merge: function(changes) {
        if (!changes.length) {
          return changes;
        }
        
        var ret = [];
        
        FBTrace.sysout("Merge prior", changes);
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

        FBTrace.sysout("Merge result", ret);
        return ret;
    }
};

}});