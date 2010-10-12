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
  
  var removeEvent = new Events.dom.DOMRemovedEvent(target);
  var eventIndependent = new Events.dom.DOMAttrChangedEvent(
      root,
      MutationEvent.ADDITION,
      "align",
      "right",
      "");
  
  // Next events
  // Attribute Change
  // - Self
  var eventSecond = new Events.dom.DOMAttrChangedEvent(
      target,
      MutationEvent.ADDITION,
      "align",
      "right",
      "");
  FBTestFireDiff.compareChangeList(
      [removeEvent, eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "Remove attr self");
  
  // - Child
  eventSecond = new Events.dom.DOMAttrChangedEvent(
      insertChild,
      MutationEvent.ADDITION,
      "align",
      "right",
      "");
  FBTestFireDiff.compareChangeList(
      [removeEvent, eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "Remove attr child");
  
  // - Parent
  var eventSecond = new Events.dom.DOMAttrChangedEvent(
      root,
      MutationEvent.REMOVAL,
      "align",
      "",
      "right");
  FBTestFireDiff.compareChangeList(
      [removeEvent, eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "Remove attr parent");
  
  // - Sibling
  var eventSecond = new Events.dom.DOMAttrChangedEvent(
      prevSibling,
      MutationEvent.REMOVAL,
      "align",
      "",
      "right");
  FBTestFireDiff.compareChangeList(
      [removeEvent, eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "Remove attr sibling");
  
  // Char Data changed
  // - Child
  eventSecond = new Events.dom.DOMCharDataModifiedEvent(
      childText,
      "tested",
      "childText");
  FBTestFireDiff.compareChangeList(
      [removeEvent, eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "Remove char data child");
  FBTestFireDiff.compareChangeList(
      [eventIndependent, removeEvent],
      Events.merge([eventSecond, eventIndependent, removeEvent]),
      "Remove char data child");
  
  // - Other
  eventSecond = new Events.dom.DOMCharDataModifiedEvent(
      prevText,
      "",
      "tested");
  FBTestFireDiff.compareChangeList(
      [removeEvent, eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "Remove char data other");
  
  // DOM Remove
  // - Self
  eventSecond = new Events.dom.DOMRemovedEvent(target);
  FBTestFireDiff.compareChangeList(
      [removeEvent, eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "Remove remove self");
  
  // - Parent
  eventSecond = new Events.dom.DOMRemovedEvent(root);
  FBTestFireDiff.compareChangeList(
      [eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "Remove remove parent");
  
  // - Child
  eventSecond = new Events.dom.DOMRemovedEvent(insertChild);
  FBTestFireDiff.compareChangeList(
      [removeEvent, eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "Remove remove child");
  FBTestFireDiff.compareChangeList(
      [eventIndependent, removeEvent],
      Events.merge([eventSecond, eventIndependent, removeEvent]),
      "Remove remove child");
  
  // - Self not child
  //  - XPath update case
  eventSecond = new Events.dom.DOMRemovedEvent(prevSibling);
  FBTestFireDiff.compareChangeList(
      [new Events.dom.DOMRemovedEvent(removeEvent.target, removeEvent.clone, "/node()[1]/node()[2]"), eventSecond ],
      Events.merge([removeEvent, eventSecond]),
      "Remove remove xpath update");
  
  //  - Non XPath update case
  eventSecond = new Events.dom.DOMRemovedEvent(sibling);
  FBTestFireDiff.compareChangeList(
      [removeEvent, eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "Remove remove no xpath update");
  
  // DOM Insert
  // - Self (equal)
  eventSecond = new Events.dom.DOMInsertedEvent(target);
  FBTestFireDiff.compareChangeList(
      [],
      Events.merge([removeEvent, eventSecond]),
      "Remove insert self - equal");
  
  // - Self (not equal)
  eventSecond = new Events.dom.DOMInsertedEvent(document.createTextNode("test"), undefined, removeEvent.xpath);
  FBTestFireDiff.compareChangeList(
      [removeEvent, eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "Remove insert self - not equal");
  
  // - Child
  eventSecond = new Events.dom.DOMInsertedEvent(insertChild);
  FBTestFireDiff.compareChangeList(
      [removeEvent, eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "Remove insert child");
  FBTestFireDiff.compareChangeList(
      [eventIndependent, removeEvent],
      Events.merge([eventSecond, eventIndependent, removeEvent]),
      "Remove insert child cancel");
  
  // - Parent
  eventSecond = new Events.dom.DOMInsertedEvent(document.createElement("div"));
  FBTestFireDiff.compareChangeList(
      [new Events.dom.DOMRemovedEvent(removeEvent.target, removeEvent.clone, "/node()[2]/node()[3]"), eventSecond ],
      Events.merge([removeEvent, eventSecond]),
      "Remove insert parent");
  
  // - Self not child
  //  - XPath update case
  eventSecond = new Events.dom.DOMInsertedEvent(prevSibling);
  FBTestFireDiff.compareChangeList(
      [new Events.dom.DOMRemovedEvent(removeEvent.target, removeEvent.clone, "/node()[1]/node()[4]"), eventSecond ],
      Events.merge([removeEvent, eventSecond]),
      "Remove insert xpath update");
  
  //  - Non XPath update case
  eventSecond = new Events.dom.DOMInsertedEvent(sibling);
  FBTestFireDiff.compareChangeList(
      [removeEvent, eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "Remove insert no xpath update");

  
  // Cancellation
  // - Update
  var removeCancel = new Events.dom.DOMRemovedEvent(prevSibling);
  var insertCancel = new Events.dom.DOMInsertedEvent(prevSibling);
  eventSecond = new Events.dom.DOMInsertedEvent(target);
  FBTestFireDiff.compareChangeList(
      [new Events.dom.DOMInsertedEvent(target, eventSecond.clone, "/node()[1]/node()[4]")],
      Events.merge([removeCancel, eventSecond, insertCancel]),
      "Remove cancellation update");
  
  // - No Update
  removeCancel = new Events.dom.DOMRemovedEvent(target);
  insertCancel = new Events.dom.DOMInsertedEvent(target, target, "/node()[1]/node()[4]");
  eventSecond = new Events.dom.DOMInsertedEvent(prevSibling);
  FBTestFireDiff.compareChangeList(
      [eventSecond],
      Events.merge([removeCancel, eventSecond, insertCancel]),
      "Remove cancellation no update");
  
  FBTest.testDone();
}