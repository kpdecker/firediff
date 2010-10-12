function runTest() {
  var Events = FBTest.FirebugWindow.FireDiff.events,
      Path = FBTest.FirebugWindow.FireDiff.Path;

  var root = document.createElement("div");
  var prevSibling = document.createElement("div");
  var target = document.createElement("div");
  var sibling = document.createElement("div");
  root.appendChild(prevSibling);
  root.appendChild(target);
  root.appendChild(sibling);
  
  var attrRemoveEvent = new Events.dom.DOMAttrChangedEvent(
      target,
      MutationEvent.REMOVAL,
      "align",
      "",
      "right");
  
  // Next events
  // Attribute Change
  // - Different target
  var eventSecond = new Events.dom.DOMAttrChangedEvent(
      root,
      MutationEvent.REMOVAL,
      "align",
      "",
      "right");
  FBTestFireDiff.compareChangeList(
      [attrRemoveEvent, eventSecond],
      Events.merge([attrRemoveEvent, eventSecond]),
      "Attr different target");
  
  // - Same target, different attribute
  eventSecond = new Events.dom.DOMAttrChangedEvent(
      target,
      MutationEvent.REMOVAL,
      "style",
      "",
      "display: none");
  FBTestFireDiff.compareChangeList(
      [attrRemoveEvent, eventSecond],
      Events.merge([attrRemoveEvent, eventSecond]),
      "Attr different attribute");
  
  // - Same target and attribute
  //  - Self delete, next delete
  eventSecond = new Events.dom.DOMAttrChangedEvent(
      target,
      MutationEvent.REMOVAL,
      "align",
      "",
      "left");
  FBTestFireDiff.compareChangeList(
      [attrRemoveEvent],
      Events.merge([attrRemoveEvent, eventSecond]),
      "Attr delete delete");
  
  //  - Self delete, next modify
  // Error Case, but test it
  eventSecond = new Events.dom.DOMAttrChangedEvent(
      target,
      MutationEvent.MODIFICATION,
      "align",
      "left",
      "center");
  FBTestFireDiff.compareChangeList(
      [new Events.dom.DOMAttrChangedEvent(
          target,
          MutationEvent.MODIFICATION,
          "align",
          "left",
          "right")],
      Events.merge([attrRemoveEvent, eventSecond]),
      "Attr delete modify");
  
  //  - Self delete, next add
  eventSecond = new Events.dom.DOMAttrChangedEvent(
      target,
      MutationEvent.ADDITION,
      "align",
      "left",
      "");
  FBTestFireDiff.compareChangeList(
      [new Events.dom.DOMAttrChangedEvent(
          target,
          MutationEvent.MODIFICATION,
          "align",
          "left",
          "right")],
      Events.merge([attrRemoveEvent, eventSecond]),
      "Attr delete add");

  // Self Add
  var attrAddEvent = new Events.dom.DOMAttrChangedEvent(
      target,
      MutationEvent.ADDITION,
      "align",
      "right",
      "");
  
  //  - Self add, next delete
  eventSecond = new Events.dom.DOMAttrChangedEvent(
      target,
      MutationEvent.REMOVAL,
      "align",
      "",
      "left");
  FBTestFireDiff.compareChangeList(
      [],
      Events.merge([attrAddEvent, eventSecond]),
      "Attr add delete");
  
  //  - Self add, next modify
  eventSecond = new Events.dom.DOMAttrChangedEvent(
      target,
      MutationEvent.MODIFICATION,
      "align",
      "left",
      "right");
  FBTestFireDiff.compareChangeList(
      [new Events.dom.DOMAttrChangedEvent(
          target,
          MutationEvent.ADDITION,
          "align",
          "left",
          "")],
      Events.merge([attrAddEvent, eventSecond]),
      "Attr add modify");
  
  //  - Self add, next add
  eventSecond = new Events.dom.DOMAttrChangedEvent(
      target,
      MutationEvent.ADDITION,
      "align",
      "left",
      "");
  FBTestFireDiff.compareChangeList(
      [eventSecond],
      Events.merge([attrAddEvent, eventSecond]),
      "Attr add add");
  
  // Self Modify
  var attrModifyEvent = new Events.dom.DOMAttrChangedEvent(
      target,
      MutationEvent.MODIFICATION,
      "align",
      "right",
      "left");
  
  //  - Self modify, next delete
  eventSecond = new Events.dom.DOMAttrChangedEvent(
      target,
      MutationEvent.REMOVAL,
      "align",
      "",
      "left");
  FBTestFireDiff.compareChangeList(
      [eventSecond],
      Events.merge([attrModifyEvent, eventSecond]),
      "Attr modify delete");
  
  //  - Self modify, next modify
  eventSecond = new Events.dom.DOMAttrChangedEvent(
      target,
      MutationEvent.MODIFICATION,
      "align",
      "center",
      "right");
  FBTestFireDiff.compareChangeList(
      [new Events.dom.DOMAttrChangedEvent(
          target,
          MutationEvent.MODIFICATION,
          "align",
          "center",
          "left")],
      Events.merge([attrModifyEvent, eventSecond]),
      "Attr modify modify");

  eventSecond = new Events.dom.DOMAttrChangedEvent(
      target,
      MutationEvent.MODIFICATION,
      "align",
      "left",
      "right");
  FBTestFireDiff.compareChangeList(
      [],
      Events.merge([attrModifyEvent, eventSecond]),
      "Attr modify modify identity");
  
  //  - Self modify, next add
  eventSecond = new Events.dom.DOMAttrChangedEvent(
      target,
      MutationEvent.ADDITION,
      "align",
      "center",
      "");
  FBTestFireDiff.compareChangeList(
      [new Events.dom.DOMAttrChangedEvent(
          target,
          MutationEvent.MODIFICATION,
          "align",
          "center",
          "left")],
      Events.merge([attrModifyEvent, eventSecond]),
      "Attr modify add");
  
  eventSecond = new Events.dom.DOMAttrChangedEvent(
      target,
      MutationEvent.ADDITION,
      "align",
      "left",
      "");
  FBTestFireDiff.compareChangeList(
      [],
      Events.merge([attrModifyEvent, eventSecond]),
      "Attr modify add identity");
  
  // Char Data changed
  // This is an error case, but if this passes, others should be safe
  eventSecond = new Events.dom.DOMCharDataModifiedEvent(
      target,
      "",
      "left");
  FBTestFireDiff.compareChangeList(
      [attrRemoveEvent, eventSecond],
      Events.merge([attrRemoveEvent, eventSecond]),
      "Attr char data");
  
  // DOM Remove
  // - Same target
  eventSecond = new Events.dom.DOMRemovedEvent(target);
  FBTestFireDiff.compareChangeList(
      [eventSecond],
      Events.merge([attrRemoveEvent, eventSecond]),
      "Attr Remove target");
  
  // - Parent
  eventSecond = new Events.dom.DOMRemovedEvent(root);
  FBTestFireDiff.compareChangeList(
      [eventSecond],
      Events.merge([attrRemoveEvent, eventSecond]),
      "Attr Remove parent");
  
  // - Self not child
  //  - XPath update case
  eventSecond = new Events.dom.DOMRemovedEvent(prevSibling);
  FBTestFireDiff.compareChangeList(
      [new Events.dom.DOMAttrChangedEvent(
          target,
          MutationEvent.REMOVAL,
          "align",
          "",
          "right",
          "/node()[1]/node()[1]"),
        eventSecond],
      Events.merge([attrRemoveEvent, eventSecond]),
      "Attr Remove xpath update");
  
  //  - Non XPath update case
  eventSecond = new Events.dom.DOMRemovedEvent(sibling);
  FBTestFireDiff.compareChangeList(
      [attrRemoveEvent, eventSecond],
      Events.merge([attrRemoveEvent, eventSecond]),
      "Attr Remove no xpath update");
  
  // DOM Insert
  // - Same target
  eventSecond = new Events.dom.DOMInsertedEvent(target);
  FBTestFireDiff.compareChangeList(
      [new Events.dom.DOMAttrChangedEvent(
          target,
          MutationEvent.REMOVAL,
          "align",
          "",
          "right",
          "/node()[1]/node()[3]"),
       eventSecond],
      Events.merge([attrRemoveEvent, eventSecond]),
      "Attr Remove target");
  
  // - Parent
  eventSecond = new Events.dom.DOMInsertedEvent(root);
  FBTestFireDiff.compareChangeList(
      [new Events.dom.DOMAttrChangedEvent(
          target,
          MutationEvent.REMOVAL,
          "align",
          "",
          "right",
          "/node()[2]/node()[2]"),
       eventSecond],
      Events.merge([attrRemoveEvent, eventSecond]),
      "Attr insert parent");
  
  // - Self not child
  //  - XPath update case
  eventSecond = new Events.dom.DOMInsertedEvent(prevSibling);
  FBTestFireDiff.compareChangeList(
      [new Events.dom.DOMAttrChangedEvent(
          target,
          MutationEvent.REMOVAL,
          "align",
          "",
          "right",
          "/node()[1]/node()[3]"),
        eventSecond],
      Events.merge([attrRemoveEvent, eventSecond]),
      "Attr insert xpath update");
  
  //  - Non XPath update case
  eventSecond = new Events.dom.DOMInsertedEvent(sibling);
  FBTestFireDiff.compareChangeList(
      [attrRemoveEvent, eventSecond],
      Events.merge([attrRemoveEvent, eventSecond]),
      "Attr insert no xpath update");
  
  FBTest.testDone();
}