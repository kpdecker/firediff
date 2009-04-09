var FireDiff = {};
FireDiff.domplate = {};

FBL.ns(function() {
(function () { with(FBL) {

this.TextChanged = domplate(FirebugReps.TextNode, {
    tag: FirebugReps.OBJECTLINK(
        {$removedClass: "$change|isElementRemoved", $addedClass: "$change|isElementAdded"},
        PRE(
            FOR("block", "$change|diffText",
                SPAN({$removedClass: "$block.removed", $addedClass: "$block.added"}, "$block.value"))
        )),
    diffText: function(change) {
        return diffStringObj(change.previousValue, change.value);
    },
    isElementAdded: function(change) {
        return change.isElementAdded();
    },
    isElementRemoved: function(change) {
        return change.isElementRemoved();
    }
});

// Displays a rep link to an element that has changed.
// 
// These changes are primarily attribute and insertion changes
this.ElementChanged = domplate(FirebugReps.Element, {
    tag: FirebugReps.OBJECTLINK(
        {$removedClass: "$change|isElementRemoved", $addedClass: "$change|isElementAdded"},
        "&lt;",
        SPAN({class: "nodeTag"}, "$change.clone.localName|toLowerCase"),
        FOR("attr", "$change|attrIterator", TAG("$attr|getAttrTag", {attr: "$attr"})),
        "&gt;"
    ),
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
        var el = change.clone;
        if (el.attributes) {
            for (var i = 0; i < el.attributes.length; ++i) {
                var attr = el.attributes[i];
                
                if (attr.localName.indexOf("firebug-") != -1)
                   continue;

                // We need to include the change object as domplate does not have an easy way
                // to pass multiple arguments to a processing method
                if (change.attrName === attr.localName) {
                    changeAttr = {
                        localName: attr.localName,
                        nodeValue: attr.nodeValue,
                        change: change
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
    },
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

}}).apply(FireDiff.domplate);
});