function runTest() {
  var Events = FBTest.FirebugWindow.FireDiff.events,
  Path = FBTest.FirebugWindow.FireDiff.Path;

  FBTest.loadScript("FBTestFireDiff.js", this);
  
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
  
  var removeEvent = new Events.DOMRemovedEvent(target);
  
  // Next events
  // Attribute Change
  // - Self
  var eventSecond = new Events.DOMAttrChangedEvent(
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
  eventSecond = new Events.DOMAttrChangedEvent(
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
  var eventSecond = new Events.DOMAttrChangedEvent(
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
  var eventSecond = new Events.DOMAttrChangedEvent(
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
  eventSecond = new Events.DOMCharDataModifiedEvent(
      childText,
      "tested",
      "childText");
  FBTestFireDiff.compareChangeList(
      [removeEvent, eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "Remove char data child");
  
  // - Other
  eventSecond = new Events.DOMCharDataModifiedEvent(
      prevText,
      "",
      "tested");
  FBTestFireDiff.compareChangeList(
      [removeEvent, eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "Remove char data other");
  
  // DOM Remove
  // - Self
  eventSecond = new Events.DOMRemovedEvent(target);
  FBTestFireDiff.compareChangeList(
      [removeEvent, eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "Remove remove self");
  
  // - Parent
  eventSecond = new Events.DOMRemovedEvent(root);
  FBTestFireDiff.compareChangeList(
      [eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "Remove remove parent");
  
  // - Child
  eventSecond = new Events.DOMRemovedEvent(insertChild);
  FBTestFireDiff.compareChangeList(
      [removeEvent, eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "Remove remove child");
  
  // - Self not child
  //  - XPath update case
  eventSecond = new Events.DOMRemovedEvent(prevSibling);
  FBTestFireDiff.compareChangeList(
      [new Events.DOMRemovedEvent(removeEvent.target, removeEvent.clone, "/node()[1]/node()[2]"), eventSecond ],
      Events.merge([removeEvent, eventSecond]),
      "Remove remove xpath update");
  
  //  - Non XPath update case
  eventSecond = new Events.DOMRemovedEvent(sibling);
  FBTestFireDiff.compareChangeList(
      [removeEvent, eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "Remove remove no xpath update");
  
  // DOM Insert
  // - Self (equal)
  eventSecond = new Events.DOMInsertedEvent(target);
  FBTestFireDiff.compareChangeList(
      [],
      Events.merge([removeEvent, eventSecond]),
      "Remove insert self - equal");
  
  // - Self (not equal)
  eventSecond = new Events.DOMInsertedEvent(document.createTextNode("test"), undefined, removeEvent.xpath);
  FBTestFireDiff.compareChangeList(
      [removeEvent, eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "Remove insert self - not equal");
  
  // - Child
  eventSecond = new Events.DOMInsertedEvent(insertChild);
  FBTestFireDiff.compareChangeList(
      [removeEvent, eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "Remove insert child");
  
  // - Parent
  eventSecond = new Events.DOMInsertedEvent(document.createElement("div"));
  FBTestFireDiff.compareChangeList(
      [new Events.DOMRemovedEvent(removeEvent.target, removeEvent.clone, "/node()[2]/node()[3]"), eventSecond ],
      Events.merge([removeEvent, eventSecond]),
      "Remove insert parent");
  
  // - Self not child
  //  - XPath update case
  eventSecond = new Events.DOMInsertedEvent(prevSibling);
  FBTestFireDiff.compareChangeList(
      [new Events.DOMRemovedEvent(removeEvent.target, removeEvent.clone, "/node()[1]/node()[4]"), eventSecond ],
      Events.merge([removeEvent, eventSecond]),
      "Remove insert xpath update");
  
  //  - Non XPath update case
  eventSecond = new Events.DOMInsertedEvent(sibling);
  FBTestFireDiff.compareChangeList(
      [removeEvent, eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "Remove insert no xpath update");
  
  FBTest.testDone();
}