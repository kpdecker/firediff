function runTest() {
  var Events = FBTest.FirebugWindow.FireDiff.events,
  Path = FBTest.FirebugWindow.FireDiff.Path;
  
  FBTest.loadScript("FBTestFireDiff.js", this);
  
  var elOne = {}, elTwo = {};
  
  // Events (Self, next)
  // (Set, Set) same property
  var setProperty = new Events.CSSSetPropertyEvent(elOne, "display", "none", "", "block", "important");
  var eventSecond = new Events.CSSSetPropertyEvent(elOne, "display", "inline", "important", "none", "");
  FBTestFireDiff.compareChangeList(
      [new Events.CSSSetPropertyEvent(elOne, "display", "inline", "important", "block", "important")],
      Events.merge([setProperty, eventSecond]),
      "CSS set set same prop");
  
  eventSecond = new Events.CSSSetPropertyEvent(elOne, "display", "block", "important", "none", "");
  FBTestFireDiff.compareChangeList(
      [],
      Events.merge([setProperty, eventSecond]),
      "CSS set set same prop identity");
  
  // (Set, Set) different property
  eventSecond = new Events.CSSSetPropertyEvent(elTwo, "margin", "inline", "important", "none", "");
  FBTestFireDiff.compareChangeList(
      [setProperty, eventSecond],
      Events.merge([setProperty, eventSecond]),
      "CSS set set different prop");
  
  // (Set, Set) same property different rule
  eventSecond = new Events.CSSSetPropertyEvent(elTwo, "display", "inline", "important", "none", "");
  FBTestFireDiff.compareChangeList(
      [setProperty, eventSecond],
      Events.merge([setProperty, eventSecond]),
      "CSS set set different rule");
  
  // (Set, Remove) same property
  var eventSecond = new Events.CSSRemovePropertyEvent(elOne, "display", "inline", "important");
  FBTestFireDiff.compareChangeList(
      [],
      Events.merge([setProperty, eventSecond]),
      "CSS set remove same property");
  
  // (Set, Remove) different property
  eventSecond = new Events.CSSSetPropertyEvent(elTwo, "margin", "inline", "important");
  FBTestFireDiff.compareChangeList(
      [setProperty, eventSecond],
      Events.merge([setProperty, eventSecond]),
      "CSS set remove different property");
  
  // (Set, Remove) same property different rule
  eventSecond = new Events.CSSRemovePropertyEvent(elTwo, "display", "inline", "important");
  FBTestFireDiff.compareChangeList(
      [setProperty, eventSecond],
      Events.merge([setProperty, eventSecond]),
      "CSS set remove different rule");
  
  // (Remove, Set) same property
  removeProperty = new Events.CSSRemovePropertyEvent(elOne, "display", "none", "important");
  eventSecond = new Events.CSSSetPropertyEvent(elOne, "display", "inline", "", "block", "");
  FBTestFireDiff.compareChangeList(
      [new Events.CSSSetPropertyEvent(elOne, "display", "inline", "", "none", "important")],
      Events.merge([removeProperty, eventSecond]),
      "CSS remove set same property");
  
  // (Remove, Set) different property
  eventSecond = new Events.CSSSetPropertyEvent(elOne, "margin", "inline", "important", "none", "");
  FBTestFireDiff.compareChangeList(
      [removeProperty, eventSecond],
      Events.merge([removeProperty, eventSecond]),
      "CSS remove set different property");
  
  // (Remove, Set) different rule
  eventSecond = new Events.CSSSetPropertyEvent(elTwo, "display", "inline", "important", "none", "");
  FBTestFireDiff.compareChangeList(
      [removeProperty, eventSecond],
      Events.merge([removeProperty, eventSecond]),
      "CSS remove set different rule");
  
  // (Remove, Remove) same property
  eventSecond = new Events.CSSRemovePropertyEvent(elOne, "display", "block", "");
  FBTestFireDiff.compareChangeList(
      [removeProperty],
      Events.merge([removeProperty, eventSecond]),
      "CSS remove remove same property");
  
  // (Remove, Remove) different property
  eventSecond = new Events.CSSRemovePropertyEvent(elOne, "margin", "block", "");
  FBTestFireDiff.compareChangeList(
      [removeProperty, eventSecond],
      Events.merge([removeProperty, eventSecond]),
      "CSS remove remove different property");
  
  // (Remove, Remove) different rule
  eventSecond = new Events.CSSRemovePropertyEvent(elTwo, "display", "block", "");
  FBTestFireDiff.compareChangeList(
      [removeProperty, eventSecond],
      Events.merge([removeProperty, eventSecond]),
      "CSS remove remove different rule");
  
  FBTest.testDone();
}