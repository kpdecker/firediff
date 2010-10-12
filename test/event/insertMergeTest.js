function runTest() {
  var Events = FBTest.FirebugWindow.FireDiff.events,
      Path = FBTest.FirebugWindow.FireDiff.Path;
  
  var root = document.createElement("div");
  var prevText = document.createTextNode("prevText");
  var prevSibling = document.createElement("div");
  var target = document.createElement("div");
  var childText = document.createTextNode("childText");
  var insertChild = document.createElement("div");
  var sibling = document.createElement("div");
  root.appendChild(prevText);
  root.appendChild(prevSibling);
  root.appendChild(target);
  target.appendChild(childText);
  target.appendChild(insertChild);
  root.appendChild(sibling);
  
  var insertEvent = new Events.dom.DOMInsertedEvent(target);
  
  // Next events
  // Attribute Change
  // - Self
  var verifyTarget = document.createElement("div");
  verifyTarget.setAttribute("align", "right");
  var verifyText = document.createTextNode("childText");
  var verifyChild = document.createElement("div");
  verifyTarget.appendChild(verifyText);
  verifyTarget.appendChild(verifyChild);
  
  var eventSecond = new Events.dom.DOMAttrChangedEvent(
      target,
      MutationEvent.ADDITION,
      "align",
      "right",
      "");
  FBTestFireDiff.compareChangeList(
      [new Events.dom.DOMInsertedEvent(target, verifyTarget, insertEvent.xpath) ],
      Events.merge([insertEvent, eventSecond]),
      "Insert attr self");
  
  // - Child
  verifyTarget = document.createElement("div");
  verifyText = document.createTextNode("childText");
  verifyChild = document.createElement("div");
  verifyChild.setAttribute("align", "right");
  verifyTarget.appendChild(verifyText);
  verifyTarget.appendChild(verifyChild);
  
  eventSecond = new Events.dom.DOMAttrChangedEvent(
      insertChild,
      MutationEvent.ADDITION,
      "align",
      "right",
      "");
  FBTestFireDiff.compareChangeList(
      [new Events.dom.DOMInsertedEvent(target, verifyTarget, insertEvent.xpath) ],
      Events.merge([insertEvent, eventSecond]),
      "Insert attr child");
  
  // - Parent
  var eventSecond = new Events.dom.DOMAttrChangedEvent(
      root,
      MutationEvent.REMOVAL,
      "align",
      "",
      "right");
  FBTestFireDiff.compareChangeList(
      [insertEvent, eventSecond],
      Events.merge([insertEvent, eventSecond]),
      "Insert attr parent");
  
  // - Sibling
  var eventSecond = new Events.dom.DOMAttrChangedEvent(
      prevSibling,
      MutationEvent.REMOVAL,
      "align",
      "",
      "right");
  FBTestFireDiff.compareChangeList(
      [insertEvent, eventSecond],
      Events.merge([insertEvent, eventSecond]),
      "Insert attr sibling");
  
  // Char Data changed
  // - Child
  verifyTarget = document.createElement("div");
  verifyText = document.createTextNode("tested");
  verifyChild = document.createElement("div");
  verifyTarget.appendChild(verifyText);
  verifyTarget.appendChild(verifyChild);
  
  eventSecond = new Events.dom.DOMCharDataModifiedEvent(
      childText,
      "tested",
      "childText");
  FBTestFireDiff.compareChangeList(
      [new Events.dom.DOMInsertedEvent(target, verifyTarget, insertEvent.xpath) ],
      Events.merge([insertEvent, eventSecond]),
      "Insert char data child");
  
  // - Other
  eventSecond = new Events.dom.DOMCharDataModifiedEvent(
      prevText,
      "",
      "tested");
  FBTestFireDiff.compareChangeList(
      [insertEvent, eventSecond],
      Events.merge([insertEvent, eventSecond]),
      "Insert char data other");
  
  // DOM Remove
  // - Self
  eventSecond = new Events.dom.DOMRemovedEvent(target);
  FBTestFireDiff.compareChangeList(
      [],
      Events.merge([insertEvent, eventSecond]),
      "Insert remove target");
  
  // - Parent
  eventSecond = new Events.dom.DOMRemovedEvent(root);
  FBTestFireDiff.compareChangeList(
      [eventSecond],
      Events.merge([insertEvent, eventSecond]),
      "Insert remove parent");
  
  // - Child
  verifyTarget = document.createElement("div");
  verifyText = document.createTextNode("childText");
  verifyTarget.appendChild(verifyText);
  
  eventSecond = new Events.dom.DOMRemovedEvent(insertChild);
  FBTestFireDiff.compareChangeList(
      [new Events.dom.DOMInsertedEvent(target, verifyTarget, insertEvent.xpath) ],
      Events.merge([insertEvent, eventSecond]),
      "Insert remove child");
  
  // - Self not child
  //  - XPath update case
  eventSecond = new Events.dom.DOMRemovedEvent(prevSibling);
  FBTestFireDiff.compareChangeList(
      [new Events.dom.DOMInsertedEvent(target, insertEvent.clone, "/node()[1]/node()[2]"), eventSecond ],
      Events.merge([insertEvent, eventSecond]),
      "Insert remove xpath update");
  
  //  - Non XPath update case
  eventSecond = new Events.dom.DOMRemovedEvent(sibling);
  FBTestFireDiff.compareChangeList(
      [insertEvent, eventSecond],
      Events.merge([insertEvent, eventSecond]),
      "Insert remove no xpath update");
  
  // DOM Insert
  // - Self
  FBTestFireDiff.compareChangeList(
      [new Events.dom.DOMInsertedEvent(target, insertEvent.clone, "/node()[1]/node()[4]"), insertEvent ],
      Events.merge([insertEvent, insertEvent]),
      "Insert insert self");
  
  // - Child
  verifyTarget = document.createElement("div");
  verifyTarget.appendChild(document.createTextNode("childText"));
  verifyTarget.appendChild(document.createElement("div"));
  verifyTarget.appendChild(document.createElement("div"));

  eventSecond = new Events.dom.DOMInsertedEvent(insertChild);
  FBTestFireDiff.compareChangeList(
      [new Events.dom.DOMInsertedEvent(target, verifyTarget, insertEvent.xpath) ],
      Events.merge([insertEvent, eventSecond]),
      "Insert insert child");
  
  // - Parent
  eventSecond = new Events.dom.DOMInsertedEvent(document.createElement("div"));
  FBTestFireDiff.compareChangeList(
      [new Events.dom.DOMInsertedEvent(target, insertEvent.clone, "/node()[2]/node()[3]"), eventSecond ],
      Events.merge([insertEvent, eventSecond]),
      "Insert insert parent");
  
  // - Self not child
  //  - XPath update case
  eventSecond = new Events.dom.DOMInsertedEvent(prevSibling);
  FBTestFireDiff.compareChangeList(
      [new Events.dom.DOMInsertedEvent(target, insertEvent.clone, "/node()[1]/node()[4]"), eventSecond ],
      Events.merge([insertEvent, eventSecond]),
      "Insert insert xpath update");
  
  //  - Non XPath update case
  eventSecond = new Events.dom.DOMInsertedEvent(sibling);
  FBTestFireDiff.compareChangeList(
      [insertEvent, eventSecond],
      Events.merge([insertEvent, eventSecond]),
      "Insert insert xpath no update");
  

  var root = document.createElement("div");
  var prevText = document.createTextNode("prevText");
  var prevSibling = document.createElement("div");
  var target = document.createElement("div");
  var childText = document.createTextNode("childText");
  var insertChild = document.createElement("div");
  var sibling = document.createElement("div");
  root.appendChild(prevText);
  root.appendChild(prevSibling);
  root.appendChild(target);
  target.appendChild(childText);
  target.appendChild(insertChild);
  root.appendChild(sibling);
  
  // Cancellation
  // - Update
  var insertCancel = new Events.dom.DOMInsertedEvent(prevSibling);
  var removeCancel = new Events.dom.DOMRemovedEvent(prevSibling);
  eventSecond = new Events.dom.DOMInsertedEvent(target);
  FBTestFireDiff.compareChangeList(
      [new Events.dom.DOMInsertedEvent(target, insertEvent.clone, "/node()[1]/node()[2]")],
      Events.merge([insertCancel, eventSecond, removeCancel]),
      "Insert cancellation update");
  
  // - No Update
  insertCancel = new Events.dom.DOMInsertedEvent(target);
  removeCancel = new Events.dom.DOMRemovedEvent(sibling);   // This will cancel the first insert after the first step
  eventSecond = new Events.dom.DOMInsertedEvent(prevSibling);
  FBTestFireDiff.compareChangeList(
      [eventSecond],
      Events.merge([insertCancel, eventSecond, removeCancel]),
      "Insert cancellation no update");
  
  FBTest.testDone();
}