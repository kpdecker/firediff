function runTest() {
  
  var Events = FBTest.FirebugWindow.FireDiff.events,
      Path = FBTest.FirebugWindow.FireDiff.Path;
  
  var root = document.createElement("div");
  var prevText = document.createTextNode("prevText");
  var prevSibling = document.createElement("div");
  var target = document.createTextNode("test");
  var sibling = document.createElement("div");
  root.appendChild(prevText);
  root.appendChild(prevSibling);
  root.appendChild(target);
  root.appendChild(sibling);
  
  var charDataEvent = new Events.dom.DOMCharDataModifiedEvent(
      target,
      "tested",
      "test");
  
  // Next events
  // Char Data changed
  // - Self
  eventSecond = new Events.dom.DOMCharDataModifiedEvent(
      target,
      "",
      "tested");
  FBTestFireDiff.compareChangeList(
      [new Events.dom.DOMCharDataModifiedEvent(
          target,
          "",
          "test")],
      Events.merge([charDataEvent, eventSecond]),
      "Char data self");
  
  // - Other
  eventSecond = new Events.dom.DOMCharDataModifiedEvent(
      prevText,
      "",
      "tested");
  FBTestFireDiff.compareChangeList(
      [charDataEvent, eventSecond],
      Events.merge([charDataEvent, eventSecond]),
      "Char data other");
  
  // Attribute Change
  // - Parent
  var eventSecond = new Events.dom.DOMAttrChangedEvent(
      root,
      MutationEvent.REMOVAL,
      "align",
      "",
      "right");
  FBTestFireDiff.compareChangeList(
      [charDataEvent, eventSecond],
      Events.merge([charDataEvent, eventSecond]),
      "Char data attr parent");
  
  // - Sibling
  var eventSecond = new Events.dom.DOMAttrChangedEvent(
      prevSibling,
      MutationEvent.REMOVAL,
      "align",
      "",
      "right");
  FBTestFireDiff.compareChangeList(
      [charDataEvent, eventSecond],
      Events.merge([charDataEvent, eventSecond]),
      "Char data attr sibling");
  
  // DOM Remove
  // - Same target
  eventSecond = new Events.dom.DOMRemovedEvent(target);
  FBTestFireDiff.compareChangeList(
      [eventSecond],
      Events.merge([charDataEvent, eventSecond]),
      "Char data remove target");
  
  // - Parent
  eventSecond = new Events.dom.DOMRemovedEvent(root);
  FBTestFireDiff.compareChangeList(
      [eventSecond],
      Events.merge([charDataEvent, eventSecond]),
      "Char data remove parent");
  
  // - Self not child
  //  - XPath update case
  eventSecond = new Events.dom.DOMRemovedEvent(prevSibling);
  FBTestFireDiff.compareChangeList(
      [new Events.dom.DOMCharDataModifiedEvent(
          target,
          "tested",
          "test",
          "/node()[1]/node()[2]"),
       eventSecond],
      Events.merge([charDataEvent, eventSecond]),
      "Char data remove xpath update");
  
  //  - Non XPath update case
  eventSecond = new Events.dom.DOMRemovedEvent(sibling);
  FBTestFireDiff.compareChangeList(
      [charDataEvent, eventSecond],
      Events.merge([charDataEvent, eventSecond]),
      "Char data remove no xpath update");
  
  // DOM Insert
  // - Same target
  eventSecond = new Events.dom.DOMInsertedEvent(target);
  FBTestFireDiff.compareChangeList(
      [new Events.dom.DOMCharDataModifiedEvent(
          target,
          "tested",
          "test",
          "/node()[1]/node()[4]"),
       eventSecond],
      Events.merge([charDataEvent, eventSecond]),
      "Char data insert target");
  
  // - Parent
  eventSecond = new Events.dom.DOMInsertedEvent(root);
  FBTestFireDiff.compareChangeList(
      [new Events.dom.DOMCharDataModifiedEvent(
          target,
          "tested",
          "test",
          "/node()[2]/node()[3]"),
       eventSecond],
      Events.merge([charDataEvent, eventSecond]),
      "Char data insert parent");
  
  // - Self not child
  //  - XPath update case
  eventSecond = new Events.dom.DOMInsertedEvent(prevSibling);
  FBTestFireDiff.compareChangeList(
      [new Events.dom.DOMCharDataModifiedEvent(
          target,
          "tested",
          "test",
          "/node()[1]/node()[4]"),
       eventSecond],
      Events.merge([charDataEvent, eventSecond]),
      "Char data insert xpath update");
  
  //  - Non XPath update case
  eventSecond = new Events.dom.DOMInsertedEvent(sibling);
  FBTestFireDiff.compareChangeList(
      [charDataEvent, eventSecond],
      Events.merge([charDataEvent, eventSecond]),
      "Char data insert no xpath update");
  
  FBTest.testDone();
}