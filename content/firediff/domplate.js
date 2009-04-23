/* See license.txt for terms of usage */

var FireDiff = {};
FireDiff.domplate = {};

FBL.ns(function() {
(function () { with(FBL) {

// Common Domplates
/**
 * Pretty print attribute list.
 * 
 * Represents a list of attributes as well as any changes that have been applies
 * to these attributes.
 * 
 * Parameter:
 *   change: Change object that we are displaying
 *
 * TODO : Update this to display a single change or a collection of changes on
 *    an element. Need to determine the data model that will be the best for this.
 */
var attributeList = domplate({
  tag: FOR("attr", "$change|attrIterator", TAG("$attr|getAttrTag", {attr: "$attr"})),
  attributeDiff:
      SPAN({class: "nodeAttr", $removedClass: "$attr|isAttrRemoved", $addedClass: "$attr|isAttrAdded"},
          "&nbsp;",
          SPAN({class: "nodeName"}, "$attr.localName"), "=&quot;",
          SPAN({class: "nodeValue"}, 
              FOR("block", "$attr|diffAttr",
                      SPAN({$removedClass: "$block.removed", $addedClass: "$block.added"}, "$block.value"))
          ),
          "&quot;"
     ),
  
  getAttrTag: function(attr) {
      return this.attributeDiff;
  },

  attrIterator: function(change) {
      var attrs = [];
      var idAttr, classAttr, changeAttr;
      var el = change.clone || change;
      
      var changes = el[FireDiff.events.AnnotateAttrs.ATTR_CHANGES] || {};
      if (change.clone) {
        changes = {};
        changes[change.attrName] = change;
      }
      
      if (el.attributes) {
          for (var i = 0; i < el.attributes.length; ++i) {
              var attr = el.attributes[i];
              
              if (attr.localName.indexOf("firebug-") != -1)
                 continue;

              // We need to include the change object as domplate does not have an easy way
              // to pass multiple arguments to a processing method
              var curChange = changes[attr.localName];
              if (curChange) {
                  changeAttr = {
                      localName: attr.localName,
                      nodeValue: attr.nodeValue,
                      change: curChange
                  };
                  attr = changeAttr;
              }
              
              if (attr.localName == "id")
                  idAttr = attr;
              else if (attr.localName == "class")
                 classAttr = attr;
              else
                  attrs.push(attr);
              
          }
      }
      if (classAttr)
          attrs.splice(0, 0, classAttr);
      if (idAttr)
          attrs.splice(0, 0, idAttr);
      if (!changeAttr && change.attrName) {
          attrs.push({
                  localName: change.attrName,
                  nodeValue: "",
                  change: change
              });
      }
      return attrs;
  },

  isAttrAdded: function(attr) {
      return attr.change && attr.change.isAddition();
  },
  isAttrRemoved: function(attr) {
      return attr.change && attr.change.isRemoval();
  },
  diffAttr: function(attr) {
      if (attr.change) {
          return diffStringObj(attr.change.previousValue, attr.change.value);
      } else {
          return [ { value: attr.nodeValue } ];
      }
  }
});

// Diff Monitor Domplates
// TODO : Allow replink in the monitor case
var textChanged = domplate(FirebugReps.TextNode, {
  tag: SPAN(
      {$removedClass: "$change|isElementRemoved", $addedClass: "$change|isElementAdded"},
      PRE(
        FOR("block", "$change|diffText",
            SPAN({$removedClass: "$block.removed", $addedClass: "$block.added"}, "$block.value"))
        )),
  getText: function(value) {
    return Firebug.showWhitespaceNodes ? value : value.replace(/(?:^\s+)|(?:\s+$)/g, "");
  },
  diffText: function(change) {
    var diffChanges = change[FireDiff.events.AnnotateAttrs.CHANGES] || change;
    if (diffChanges.changeType) {
      return diffStringObj(diffChanges.previousValue, diffChanges.value);
    } else {
      return [{ value: change.nodeValue }];
    }
  },
  isElementAdded: function(change) {
    change = change || change[FireDiff.events.AnnotateAttrs.CHANGES];
    return change && change.isElementAdded && change.isElementAdded();
  },
  isElementRemoved: function(change) {
    change = change || change[FireDiff.events.AnnotateAttrs.CHANGES];
    return change && change.isElementRemoved && change.isElementRemoved();
  }
});

this.TextChanged = textChanged;

// Displays a rep link to an element that has changed.
// 
// These changes are primarily attribute and insertion changes
this.ElementChanged = domplate(FirebugReps.Element, {
    tag: FirebugReps.OBJECTLINK(
        {$removedClass: "$change|isElementRemoved", $addedClass: "$change|isElementAdded"},
        "&lt;",
        SPAN({class: "nodeTag"}, "$change.clone.localName|toLowerCase"),
        TAG(attributeList.tag, {change: "$change"}),
        "&gt;"
    ),
    isElementAdded: function(change) {
        return change.isElementAdded();
    },
    isElementRemoved: function(change) {
        return change.isElementRemoved();
    }
});

this.CSSChanged = domplate({
    tag: DIV({class: "cssRuleDiff"},
            DIV({class: "cssHead"},
                    SPAN({class: "cssSelector"}, "$change.style.parentRule.selectorText"), " {"
                ),
                DIV({class: "cssPropDiff"},
                  SPAN({$removedClass: "$change|isPropRemoved", $addedClass: "$change|isPropAdded"},
                    SPAN({class: "cssPropName"}, "$change.propName"),
                    SPAN({class: "cssColon"}, ":"),
                    SPAN({class: "cssPropValue"},
                        FOR("block", "$change|diffProp",
                                SPAN({$removedClass: "$block.removed", $addedClass: "$block.added"}, "$block.value")),
                        SPAN({$removedClass: "$change|isPriorityRemoved", $addedClass: "$change|isPriorityAdded"},
                                "$change|getPriorityText")
                    ),
                    SPAN({class: "cssSemi"}, ";")
                )),
                DIV("}")
            ),
    diffProp: function(change) {
        return diffStringObj(change.prevValue, change.propValue);
    },
    isPropAdded: function(change) {
        return !change.prevValue;
    },
    isPropRemoved: function(change) {
        return !change.propValue;
    },
    getPriorityText: function(change) {
      var important = change.propPriority || change.prevPriority;
      return important ? (" !" + important) : "";
    },
    isPriorityAdded: function(change) {
        return !change.prevPriority;
    },
    isPriorityRemoved: function(change) {
        return !change.propPriority;
    }
});

// All Changes Domplates
var ChangeElement = extend(FirebugReps.Element, {
  removedChanges: function(node) {
    return node[FireDiff.events.AnnotateAttrs.REMOVE_CHANGES] || [];
  },
  
  getElementName: function(change) {
    change = change.clone || change;
    return (change.localName || "").toLowerCase();
  },
  isElementAdded: function(change) {
    change = change[FireDiff.events.AnnotateAttrs.CHANGES] || change;
    return change && change.isElementAdded && change.isElementAdded();
  },
  isElementRemoved: function(change) {
    change = change[FireDiff.events.AnnotateAttrs.CHANGES] || change;
    return change && change.isElementRemoved && change.isElementRemoved();
  }
});

this.allChanges = {
    CompleteElement: domplate(ChangeElement, {
      tag:
        DIV({class: "nodeBox open repIgnore", _repObject: "$change",
            $removedClass: "$change|isElementRemoved", $addedClass: "$change|isElementAdded"},
          DIV({class: "nodeLabel"},
          SPAN({class: "nodeLabelBox repTarget"},
            "&lt;",
            SPAN({class: "nodeTag"}, "$change|getElementName"),
            TAG(attributeList.tag, {change: "$change"}),
            SPAN({class: "nodeBracket"}, "&gt;")
          )
        ),
        DIV({class: "nodeChildBox"},
          FOR("child", "$change|childIterator",
            TAG("$child|getNodeTag", {change: "$child"})
          )
        ),
        DIV({class: "nodeCloseLabel"},
          "&lt;/", SPAN({class: "nodeTag"}, "$change|getElementName"), "&gt;"
        )
      ),
      getNodeTag: function(node) {
        return getNodeTag(node.clone || node, true);
      },
      
      childIterator: function(node) {
        if (node.contentDocument)
          return [node.contentDocument.documentElement];
        
        var removed = this.removedChanges(node).slice();
        removed.sort(function(a, b) { return a.xpath.localeCompare(b.xpath); });
        
        var nodes = [], nodeIndex = 1, removedIndex = 0;
        for (var child = node.firstChild; child; child = child.nextSibling) {
          while (removedIndex < removed.length) {
            var curChange = removed[removedIndex];
            var identifier = FireDiff.Path.getIdentifier(curChange.xpath);
            if (identifier.index == nodeIndex) {
              if (Firebug.showWhitespaceNodes || !isWhitespaceText(child)) {
                nodes.push(curChange);
              }
            } else {
              break;
            }
            removedIndex++;
          }
          if (child.nodeType != Node.TEXT_NODE || Firebug.showWhitespaceNodes || !isWhitespaceText(child)) {
            nodes.push(child);
          }
          nodeIndex++;
        }
        for (; removedIndex < removed.length; removedIndex++) {
          nodes.push(removed[removedIndex]);
        }
        return nodes;
      }
    }),

    Element: domplate(ChangeElement, {
      tag:
        DIV({class: "nodeBox containerNodeBox repIgnore", _repObject: "$change",
          $removedClass: "$change|isElementRemoved", $addedClass: "$change|isElementAdded"},
          DIV({class: "nodeLabel"},
            IMG({class: "twisty"}),
            SPAN({class: "nodeLabelBox repTarget"},
              "&lt;",
              SPAN({class: "nodeTag"}, "$change|getElementName"),
              TAG(attributeList.tag, {change: "$change"}),
              SPAN({class: "nodeBracket"}, "&gt;")
            )
          ),
          DIV({class: "nodeChildBox"}),
          DIV({class: "nodeCloseLabel"},
            SPAN({class: "nodeCloseLabelBox repTarget"},
              "&lt;/", SPAN({class: "nodeTag"}, "$change|getElementName"), "&gt;"
            )
          )
        )
    }),

    EmptyElement: domplate(ChangeElement, {
      tag: DIV({class: "nodeBox emptyNodeBox repIgnore", _repObject: "$change",
          $removedClass: "$change|isElementRemoved", $addedClass: "$change|isElementAdded"},
        DIV({class: "nodeLabel"},
          SPAN({class: "nodeLabelBox repTarget"},
            "&lt;",
            SPAN({class: "nodeTag"}, "$change|getElementName"),
            TAG(attributeList.tag, {change: "$change"}),
            SPAN({class: "nodeBracket"}, "/&gt;")
            )
          )
        )
    }),

    // TODO : Single TextNode domplate
    TextNode: domplate(ChangeElement, {
      tag:
        DIV({class: "nodeBox", _repObject: "$change",
            $removedClass: "$change|isElementRemoved", $addedClass: "$change|isElementAdded"},
          SPAN({class: "nodeText"}, TAG(textChanged.tag, {change: "$change"}))
        )
    }),
    
    // TODO : Determine how CDATA can be changed, if it can
    CDATANode: domplate(ChangeElement, {
      tag: DIV({class: "nodeBox", _repObject: "$change",
          $removedClass: "$change|isElementRemoved", $addedClass: "$change|isElementAdded"},
        "&lt;![CDATA[",
        SPAN({class: "nodeText"}, TAG(textChanged, {change: "$change"})),
        "]]&gt;"
        )
    }),
    
    // TODO : Determine how comments can be changed, if they can
    CommentNode: domplate(ChangeElement, {
      tag: DIV({class: "nodeBox", _repObject: "$change",
          $removedClass: "$change|isElementRemoved", $addedClass: "$change|isElementAdded"},
        DIV({class: "nodeComment"},
          "&lt;!--", TAG(textChanged, {change: "$change"}), "--&gt;"
          )
        )
    })
};


function getNodeTag(node, expandAll) {
  var allChanges = FireDiff.domplate.allChanges;
  
  if (node instanceof Element) {
    if (node instanceof HTMLAppletElement)
      return allChanges.EmptyElement.tag;
    else if (node.firebugIgnore)
      return null;
    else if (isContainerElement(node))
      return expandAll ? allChanges.CompleteElement.tag : allChanges.Element.tag;
    else if (isEmptyElement(node))
      return allChanges.EmptyElement.tag;
    else
      return expandAll ? allChanges.CompleteElement.tag : allChanges.Element.tag;
  }
  else if (node instanceof Text)
    return allChanges.TextNode.tag;
  else if (node instanceof CDATASection)
    return allChanges.CDATANode.tag;
  else if (node instanceof Comment && (Firebug.showCommentNodes || expandAll))
    return allChanges.CommentNode.tag;
  else if (node instanceof SourceText)
    return FirebugReps.SourceText.tag;
  else
    return FirebugReps.Nada.tag;
}

// TODO : Is this necessary?
function getNodeBoxTag(nodeBox) {
    var re = /([^\s]+)NodeBox/;
    var m = re.exec(nodeBox.className);
    if (!m)
        return null;

    var nodeBoxType = m[1];
    if (nodeBoxType == "container")
        return Firebug.HTMLPanel.Element.tag;
    else if (nodeBoxType == "text")
        return Firebug.HTMLPanel.TextElement.tag;
    else if (nodeBoxType == "empty")
        return Firebug.HTMLPanel.EmptyElement.tag;
}

function isContainerElement(element) {
    var tag = element.localName.toLowerCase();
    switch (tag) {
        case "script":
        case "style":
        case "iframe":
        case "frame":
        case "tabbrowser":
        case "browser":
            return true;
        case "link":
            return element.getAttribute("rel") == "stylesheet";
    }
    return false;
}

// Duplicate of HTMLPanel.prototype isWhitespaceText
function isWhitespaceText(node) {
    node = node.clone || node;
    if (node instanceof HTMLAppletElement)
        return false;
    return node.nodeType == Node.TEXT_NODE && isWhitespace(node.nodeValue);
}

// Duplicate of HTMLPanel.prototype TODO: create a namespace for all of these functions so
// they can be called outside of this file.
function isSourceElement(element) {
    var tag = element.localName.toLowerCase();
    return tag == "script" || tag == "link" || tag == "style"
        || (tag == "link" && element.getAttribute("rel") == "stylesheet");
}

function isEmptyElement(element) {
  return !element.firstChild && !element[FireDiff.events.AnnotateAttrs.REMOVE_CHANGES];
}

}}).apply(FireDiff.domplate);
});