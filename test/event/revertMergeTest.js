function runTest() {
  var Events = FBTest.FirebugWindow.FireDiff.events,
      Dom = Events.dom,
      Css = Events.css,
      Path = FBTest.FirebugWindow.FireDiff.Path,
      FBTrace = FBTest.FirebugWindow.FBTrace;

  function testRevert(changes, msg, revertCount, changeCount) {
    var originalLen = changes.length;
    var reverts = Events.mergeRevert(changes[0], changes);
    FBTest.compare(revertCount, reverts.length, msg + " Revert Count");
    if (revertCount != reverts.length) {
      FBTrace.sysout(msg + " Reverts", reverts);
    }
    FBTest.compare(changeCount, changes.length, msg + " Change count");
    if (changeCount != changes.length) {
      FBTrace.sysout(msg + " Changes", changes);
    }
    
    var curXPath = (reverts[0] || {}).xpath;
    for (var i = 0; i < reverts.length; i++) {
      FBTest.compare(true, Path.isChildOrSelf(reverts[i].xpath, curXPath), msg + " " + i + " Revert Hierarchy");
      curXPath = reverts[i].xpath;
    }
    return reverts;
  }
  function testRevertSingle(changes, pathOffset, revertOffset, msg) {
    var originalXpath = changes[1].xpath,
        revertXpath = changes[0].xpath;
    
    var reverts = Events.mergeRevert(changes[0], changes);
    FBTest.compare(1, reverts.length, msg + " Single change reverted");
    FBTest.compare(1, changes.length, msg + " Change count");
    
    changes[0] = changes[0] || {};
    if (pathOffset < 0) {
      FBTest.compare(Path.updateForRevertRemove(originalXpath, revertXpath), changes[0].xpath, msg + " Updated xpath");
    } else if (pathOffset > 0) {
      FBTest.compare(Path.updateForInsert(originalXpath, revertXpath), changes[0].xpath, msg + " Updated xpath");
    } else {
      FBTest.compare(originalXpath, changes[0].xpath, msg + " xpath");
    }
    
    reverts[0] = reverts[0] || {};
    if (revertOffset < 0) {
      FBTest.compare(Path.updateForRevertRemove(revertXpath, originalXpath), reverts[0].xpath, msg + " Updated revert xpath, remove");
    } else if (revertOffset > 0) {
      FBTest.compare(Path.updateForInsert(revertXpath, originalXpath), reverts[0].xpath, msg + " Updated revert xpath, insert");
    } else {
      FBTest.compare(revertXpath, reverts[0].xpath, msg + " revert xpath");
    }
  }
  
  var urlBase = FBTest.getHTTPURLBase();
  FBTestFirebug.openNewTab(urlBase + "event/index.htm", function(win) {
    var doc = win.document;
    
    var root = doc.createElement("div");
    var prevSibling = doc.createElement("div");
    var target = doc.createElement("div");
    var sibling = doc.createElement("div");
    var text = doc.createTextNode("left");
    target.appendChild(text);
    root.appendChild(prevSibling);
    root.appendChild(target);
    root.appendChild(sibling);
    root.appendChild(doc.createElement("div"));
    root.appendChild(doc.createElement("div"));
    root.appendChild(doc.createElement("div"));
    
    // Attr set + Attr set
    testRevert([
                new Dom.DOMAttrChangedEvent(
                    target,
                    MutationEvent.ADDITION,
                    "align",
                    "left",
                    ""),
                new Dom.DOMAttrChangedEvent(
                    target,
                    MutationEvent.MODIFICATION,
                    "align",
                    "right",
                    "left")
            ],
            "Attr set + attr set",
            1, 0);
    testRevertSingle([
                new Dom.DOMAttrChangedEvent(
                    target,
                    MutationEvent.ADDITION,
                    "align",
                    "left",
                    ""),
                new Dom.DOMAttrChangedEvent(
                    root,
                    MutationEvent.MODIFICATION,
                    "align",
                    "right",
                    "left")
            ],
            0,0,
            "Attr set + attr set root");
    
    // Attr set + Attr remove
    testRevert([
                new Dom.DOMAttrChangedEvent(
                    target,
                    MutationEvent.ADDITION,
                    "align",
                    "left",
                    ""),
                new Dom.DOMAttrChangedEvent(
                    target,
                    MutationEvent.REMOVED,
                    "align",
                    "",
                    "left")
            ],
            "Attr set + Attr remove",
            0, 0);
    
    // Attr set + Create node
    testRevertSingle([
                new Dom.DOMAttrChangedEvent(
                    target,
                    MutationEvent.ADDITION,
                    "align",
                    "left",
                    ""),
                new Dom.DOMInsertedEvent(target)
            ],
            0, 1,
            "Attr set + Create node");
    testRevertSingle([
                      new Dom.DOMAttrChangedEvent(
                          target,
                          MutationEvent.ADDITION,
                          "align",
                          "left",
                          ""),
                      new Dom.DOMInsertedEvent(sibling)
                  ],
                  0, 0,
                  "Attr set + Create node sibling");
    
    // Attr set + Delete node
    testRevert([
                new Dom.DOMAttrChangedEvent(
                    target,
                    MutationEvent.ADDITION,
                    "align",
                    "left",
                    ""),
                new Dom.DOMRemovedEvent(target)
            ],
            "Attr set + Delete node",
            2, 0);
    testRevert([
                new Dom.DOMAttrChangedEvent(
                    target,
                    MutationEvent.ADDITION,
                    "align",
                    "left",
                    ""),
                new Dom.DOMRemovedEvent(root)
            ],
            "Attr set + Delete node root",
            2, 0);
    testRevert([
                new Dom.DOMAttrChangedEvent(
                    target,
                    MutationEvent.ADDITION,
                    "align",
                    "left",
                    ""),
                new Dom.DOMRemovedEvent(target),
                new Dom.DOMRemovedEvent(root)
            ],
            "Attr set + Delete node root chain",
            3, 0);
    
    // Attr remove + Attr set
    testRevert([
                new Dom.DOMAttrChangedEvent(
                    target,
                    MutationEvent.REMOVED,
                    "align",
                    "",
                    "left"),
                new Dom.DOMAttrChangedEvent(
                    target,
                    MutationEvent.ADDITION,
                    "align",
                    "left",
                    "")
            ],
            "Attr remove + Attr set",
            0, 0);
    
    // Attr remove + Attr remove
    testRevert([
                new Dom.DOMAttrChangedEvent(
                    target,
                    MutationEvent.REMOVED,
                    "align",
                    "",
                    "left"),
                new Dom.DOMAttrChangedEvent(
                    target,
                    MutationEvent.REMOVED,
                    "align",
                    "",
                    "left")
            ],
            "Attr remove + Attr remove",
            1, 0);
    
    // Attr remove + Create node
    testRevertSingle([
                new Dom.DOMAttrChangedEvent(
                    target,
                    MutationEvent.REMOVED,
                    "align",
                    "",
                    "left"),
                new Dom.DOMInsertedEvent(target)
            ],
            0, 1,
            "Attr remove + Create node");
    
   // Attr remove + Delete node
    testRevert([
                new Dom.DOMAttrChangedEvent(
                    target,
                    MutationEvent.REMOVED,
                    "align",
                    "",
                    "left"),
                new Dom.DOMRemovedEvent(target)
            ],
            "Attr remove + Delete node",
            2, 0);
    
    // Create node + attr set
    testRevert([
                new Dom.DOMInsertedEvent(target),
                new Dom.DOMAttrChangedEvent(
                    target,
                    MutationEvent.ADDITION,
                    "align",
                    "left",
                    "")
            ],
            "Create node + Attr set",
            1, 0);
    testRevertSingle([
                new Dom.DOMInsertedEvent(target),
                new Dom.DOMAttrChangedEvent(
                    sibling,
                    MutationEvent.ADDITION,
                    "align",
                    "left",
                    "")
            ],
            -1, 0,
            "Create node + Attr set sibling");
    
    // Create node + attr remove
    testRevert([
                new Dom.DOMInsertedEvent(target),
                new Dom.DOMAttrChangedEvent(
                    target,
                    MutationEvent.REMOVED,
                    "align",
                    "",
                    "left")
            ],
            "Create node + Attr remove",
            1, 0);
    
    // Create node + char data modified
    testRevert([
                new Dom.DOMInsertedEvent(target),
                new Dom.DOMCharDataModifiedEvent(text, "before", "after")
                ],
                "Create node + char data modified",
                1, 0);
    
    // Create node + Create node
    testRevertSingle([
                new Dom.DOMInsertedEvent(target),
                new Dom.DOMInsertedEvent(target)
                ],
                0,1,
                "Create node + Create node");
    testRevertSingle([
                new Dom.DOMInsertedEvent(target),
                new Dom.DOMInsertedEvent(root)
                ],
                0,1,
                "Create node + Create node root");
    
    // Create node + Delete node
    testRevert([
                new Dom.DOMInsertedEvent(target),
                new Dom.DOMRemovedEvent(target)
                ],
                "Create node + Delete node",
                0, 0);
    testRevert([
                new Dom.DOMInsertedEvent(target),
                new Dom.DOMRemovedEvent(root)
                ],
                "Create node + Delete node root",
                2, 0);
    
    // Delete node + attr set
    testRevertSingle([
                new Dom.DOMRemovedEvent(target),
                new Dom.DOMAttrChangedEvent(
                    target,
                    MutationEvent.ADDITION,
                    "align",
                    "left",
                    "")
            ],
            1,0,
            "Delete node + Attr set");
    
    // Delete node + attr remove
    testRevertSingle([
                new Dom.DOMRemovedEvent(target),
                new Dom.DOMAttrChangedEvent(
                    target,
                    MutationEvent.REMOVED,
                    "align",
                    "",
                    "left")
            ],
            1,0,
            "Delete node + Attr remove");
    
    // Delete node + char data modified
    testRevertSingle([
                new Dom.DOMRemovedEvent(target),
                new Dom.DOMCharDataModifiedEvent(text, "before", "after")
                ],
                1,0,
                "Delete node + char data modified");
    
    // Delete node + Create node
    testRevert([
                new Dom.DOMRemovedEvent(target),
                new Dom.DOMInsertedEvent(target)
                ],
                "Delete node + Create node",
                0, 0);
    
    // Delete node + Delete node
    testRevertSingle([
                      new Dom.DOMRemovedEvent(target),
                      new Dom.DOMRemovedEvent(target)
                      ],
                      1,0,
                      "Delete node + Delete node");
    testRevert([
                new Dom.DOMRemovedEvent(target),
                new Dom.DOMRemovedEvent(root)
                ],
                "Delete node + Delete node root",
                2, 0);
    
    // Char data modified + char data modified
    testRevert([
                new Dom.DOMCharDataModifiedEvent(text, "even more before", "some other data"),
                new Dom.DOMCharDataModifiedEvent(text, "before", "after")
                ],
                "Char data modified + char data modified",
                1, 0);
    
    // Char data modified + Create node
    testRevertSingle([
                new Dom.DOMCharDataModifiedEvent(text, "even more before", "some other data"),
                new Dom.DOMInsertedEvent(target)
                ],
                0,1,
                "Char data modified + Create node");
    
    // Char data modified + Delete node
    testRevert([
                new Dom.DOMCharDataModifiedEvent(text, "even more before", "some other data"),
                new Dom.DOMRemovedEvent(target)
                ],
                "Char data modified + Delete Node",
                2,0);
    

    var changes = [
                   new Dom.DOMInsertedEvent(target),     // Revert
                   new Dom.DOMAttrChangedEvent(target, MutationEvent.ADDITION, "align", "left", ""), // Revert
                   new Dom.DOMInsertedEvent(target),     // Change
                   new Dom.DOMRemovedEvent(target),      // Change
                   new Dom.DOMRemovedEvent(target),      // Revert
                   new Dom.DOMRemovedEvent(target),      // Change
                   new Dom.DOMRemovedEvent(target),      // Change
                   new Dom.DOMInsertedEvent(target),     // Revert
                   new Dom.DOMAttrChangedEvent(target, MutationEvent.ADDITION, "align", "left", ""), // Revert
                   new Dom.DOMRemovedEvent(root)         // Revert
                   ];
    var originalXpath = changes[0].xpath,
        updateXpath = Path.updateForRevertRemove(originalXpath, originalXpath);
        rootXpath = changes[changes.length-1].xpath;
    
    var reverts = testRevert(changes, "DOM Cancellation", 2,4);
    FBTrace.sysout("DOM Cancellation Changes", changes);
    FBTest.compare(updateXpath, (changes[0] || {}).xpath, "DOM Cancellation xpath Updated xpath 1");
    FBTest.compare(updateXpath, (changes[1] || {}).xpath, "DOM Cancellation xpath Updated xpath 2");
    FBTest.compare(originalXpath, (changes[2] || {}).xpath, "DOM Cancellation xpath Updated xpath 3");
    FBTest.compare(originalXpath, (changes[3] || {}).xpath, "DOM Cancellation xpath Updated xpath 4");

    FBTest.compare(originalXpath, (reverts[0] || {}).xpath, "DOM Cancellation xpath revert xpath 1");
    FBTest.compare(rootXpath, (reverts[1] || {}).xpath, "DOM Cancellation xpath revert xpath 2");

    var changes = [
                   new Dom.DOMAttrChangedEvent(target, MutationEvent.ADDITION, "align", "left", ""),
                   new Dom.DOMInsertedEvent(target),
                   new Dom.DOMRemovedEvent(target),
                   new Dom.DOMAttrChangedEvent(target, MutationEvent.REMOVAL, "align", "", "left"),
                   new Dom.DOMAttrChangedEvent(target, MutationEvent.ADDITION, "align", "right", ""),
                   new Dom.DOMRemovedEvent(root)
                   ];
    var originalXpath = changes[0].xpath,
        rootXpath = changes[changes.length-1].xpath;
    
    var reverts = testRevert(changes, "DOM Attr Cancellation", 2,2);
    FBTest.compare(originalXpath, (changes[0] || {}).xpath, "DOM Attr Cancellation xpath Updated xpath 1");
    FBTest.compare(originalXpath, (changes[1] || {}).xpath, "DOM Attr Cancellation xpath Updated xpath 2");

    FBTest.compare(originalXpath, (reverts[0] || {}).xpath, "DOM Attr Cancellation xpath revert xpath 1");
    FBTest.compare(rootXpath, (reverts[1] || {}).xpath, "DOM Attr Cancellation xpath revert xpath 2");
    
    var style = doc.createElement("style");
    style.type = "text/css";
    style.innerHTML = ".rule1 {} .rule2 {} .rule3 {}";
    
    // Sheet is only defined if it is a part of the document
    doc.getElementsByTagName("head")[0].appendChild(style);
    
    var editStyle = doc.createElement("style");
    editStyle.type = "text/css";
    editStyle.innerHTML = ".rule1 {} .rule2 { border: none; } .rule3 {}";
    doc.getElementsByTagName("head")[0].appendChild(editStyle);
    
    var elZero = style.sheet.cssRules[0],
        elOne = style.sheet.cssRules[1],
        elTwo = style.sheet.cssRules[2];
    
    // CSS Set Prop + CSS Set Prop
    testRevert([
                new Css.CSSSetPropertyEvent(elOne, "display", "none", "", "block", "important"),
                new Css.CSSSetPropertyEvent(elOne, "display", "inline", "important", "none", "")
                ],
                "CSS Set Prop + CSS Set Prop",
                1, 0);
    
    // CSS Set Prop + CSS Remove Prop
    testRevert([
                new Css.CSSSetPropertyEvent(elOne, "display", "none", "", "block", "important"),
                new Css.CSSRemovePropertyEvent(elOne, "display", "inline", "important")
                ],
                "CSS Set Prop + CSS Remove Prop",
                1, 0);
    
    // CSS Set Prop + CSS Create Rule
    testRevertSingle([
                new Css.CSSSetPropertyEvent(elOne, "display", "none", "", "block", "important"),
                new Css.CSSInsertRuleEvent(elOne)
                ],
                0,1,
                "CSS Set Prop + CSS Create Rule");
    
    // CSS Set Prop + CSS Remove Rule
    testRevert([
                new Css.CSSSetPropertyEvent(elOne, "display", "none", "", "block", "important"),
                new Css.CSSRemoveRuleEvent(elOne)
                ],
                "CSS Set Prop + CSS Remove Rule",
                2, 0);
    
    // CSS Remove Prop + CSS Set Prop
    testRevert([
                new Css.CSSRemovePropertyEvent(elOne, "display", "inline", "important"),
                new Css.CSSSetPropertyEvent(elOne, "display", "none", "", "block", "important")
                ],
                "CSS Remove Prop + CSS Set Prop",
                1, 0);
    
    // CSS Remove Prop + CSS Remove Prop
    testRevert([
                new Css.CSSRemovePropertyEvent(elOne, "display", "inline", "important"),
                new Css.CSSRemovePropertyEvent(elOne, "display", "inline", "important")
                ],
                "CSS Remove Prop + CSS Remove Prop",
                1, 0);
    
    // CSS Remove Prop + CSS Create Rule
    testRevertSingle([
                      new Css.CSSRemovePropertyEvent(elOne, "display", "inline", "important"),
                      new Css.CSSInsertRuleEvent(elOne)
                      ],
                      0, 1,
                      "CSS Remove Prop + CSS Create Rule");
    
    // CSS Remove Prop + CSS Remove Rule
    testRevert([
                new Css.CSSRemovePropertyEvent(elOne, "display", "inline", "important"),
                new Css.CSSRemoveRuleEvent(elOne)
                ],
                "CSS Remove Prop + CSS Remove Rule",
                2, 0);
    
    // CSS Create Rule + CSS Set Prop
    testRevert([
                new Css.CSSInsertRuleEvent(elOne),
                new Css.CSSSetPropertyEvent(elOne, "display", "none", "", "block", "important")
                ],
                "CSS Insert Rule + CSS Set Prop",
                1, 0);
    
    // CSS Create Rule + CSS Remove Prop
    testRevert([
                new Css.CSSInsertRuleEvent(elOne),
                new Css.CSSRemovePropertyEvent(elOne, "display", "inline", "important")
                ],
                "CSS Insert Rule + CSS Remove Prop",
                1, 0);
    
    // CSS Create Rule + CSS Create Rule
    testRevertSingle([
                      new Css.CSSInsertRuleEvent(elOne),
                      new Css.CSSInsertRuleEvent(elOne)
                      ],
                      -1, 0,
                      "CSS Create Rule + CSS Create Rule");
    
    // CSS Create Rule + CSS Remove Rule
    testRevert([
                new Css.CSSInsertRuleEvent(elOne),
                new Css.CSSRemoveRuleEvent(elOne)
                ],
                "CSS Insert Rule + CSS Remove Rule",
                0, 0);
    
    // CSS Remove Rule + CSS Set Prop
    testRevertSingle([
                new Css.CSSRemoveRuleEvent(elOne),
                new Css.CSSSetPropertyEvent(elOne, "display", "none", "", "block", "important")
                ],
                1, 0,
                "CSS Remove Rule + CSS Set Prop");
    
    // CSS Remove Rule + CSS Remove Prop
    testRevertSingle([
                new Css.CSSRemoveRuleEvent(elOne),
                new Css.CSSRemovePropertyEvent(elOne, "display", "inline", "important")
                ],
                1, 0,
                "CSS Remove Rule + CSS Remove Prop");
    
    // CSS Remove Rule + CSS Create Rule
    testRevert([
                new Css.CSSRemoveRuleEvent(elOne),
                new Css.CSSInsertRuleEvent(elOne)
                ],
                "CSS Remove Rule + CSS Create Rule",
                0, 0);
    
    // CSS Remove Rule + CSS Remove Rule
    testRevertSingle([
                      new Css.CSSRemoveRuleEvent(elOne),
                      new Css.CSSRemoveRuleEvent(elOne)
                      ],
                      1, 0,
                      "CSS Remove Rule + CSS Remove Rule");
    
    // CSS Cancellation
    changes = [
               new Css.CSSRemoveRuleEvent(elOne),
               new Css.CSSInsertRuleEvent(elOne),
               new Css.CSSRemovePropertyEvent(elOne, "display", "inline", "important")
               ];
    originalXpath = changes[0].xpath;
    reverts = testRevert(
                changes,
                "CSS Remove Insert Cancellation",
                1, 0);
    FBTest.compare(originalXpath, (reverts[0] || {}).xpath, "CSS Remove Insert Revert xpath 1");
    FBTest.compare("removeProp", (reverts[0] || {}).subType, "CSS Remove Insert Revert type 1");

    changes = [
               new Css.CSSInsertRuleEvent(elOne),      // Revert
               new Css.CSSRemovePropertyEvent(elOne, "display", "inline", "important"),  // Revert
               new Css.CSSRemovePropertyEvent(elZero, "display", "inline", "important"),  // Change
               new Css.CSSRemovePropertyEvent(elTwo, "display", "inline", "important"),  // Change
               new Css.CSSRemoveRuleEvent(elOne),      // Revert
               new Css.CSSRemoveRuleEvent(elOne),      // Change
               new Css.CSSRemoveRuleEvent(elOne)       // Change
               ];
    originalXpath = changes[0].xpath;
    var zeroXpath = changes[2].xpath;
    reverts = testRevert(
                changes,
                "CSS Insert Remove Cancellation",
                0, 4);
    FBTest.compare(zeroXpath, (changes[0] || {}).xpath, "CSS Insert Remove Update xpath 1");
    FBTest.compare(originalXpath, (changes[1] || {}).xpath, "CSS Insert Remove Update xpath 2");
    FBTest.compare(originalXpath, (changes[2] || {}).xpath, "CSS Insert Remove Update xpath 3");
    FBTest.compare(originalXpath, (changes[3] || {}).xpath, "CSS Insert Remove Update xpath 4");
    
    FBTest.testDone();
  });
}