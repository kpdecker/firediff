function runTest() {
  var Events = FBTest.FirebugWindow.FireDiff.events,
      Path = FBTest.FirebugWindow.FireDiff.Path,
      CSSModel = FBTest.FirebugWindow.FireDiff.CSSModel,
      FBTrace = FBTest.FirebugWindow.FBTrace;
  
  var urlBase = FBTest.getHTTPURLBase();
  FBTestFirebug.openNewTab(urlBase + "event/index.htm", function(win) {
    var doc = win.document;
    
    var style = doc.createElement("style");
    style.type = "text/css";
    style.innerHTML = ".rule1 {} .rule2 {} .rule3 {}";
    
    // Sheet is only defined if it is a part of the document
    doc.getElementsByTagName("head")[0].appendChild(style);
    
    var editStyle = doc.createElement("style");
    editStyle.type = "text/css";
    editStyle.innerHTML = ".rule1 {} .rule2 { border: none; } .rule3 {}";
    doc.getElementsByTagName("head")[0].appendChild(editStyle);
    
    var sheet = style.sheet;
    var elOne = sheet.cssRules[1], elTwo = sheet.cssRules[2], elZero = sheet.cssRules[0];
  
  // Events (Self, next)
  // (Set, Set) same property
  var setProperty = new Events.css.CSSSetPropertyEvent(elOne, "display", "none", "", "block", "important");
  FBTrace.sysout(setProperty.xpath, setProperty);
  var eventSecond = new Events.css.CSSSetPropertyEvent(elOne, "display", "inline", "important", "none", "");
  FBTestFireDiff.compareChangeList(
      [new Events.css.CSSSetPropertyEvent(elOne, "display", "inline", "important", "block", "important")],
      Events.merge([setProperty, eventSecond]),
      "CSS set set same prop");
  
  eventSecond = new Events.css.CSSSetPropertyEvent(elOne, "display", "block", "important", "none", "");
  FBTestFireDiff.compareChangeList(
      [],
      Events.merge([setProperty, eventSecond]),
      "CSS set set same prop identity");
  
  // (Set, Set) different property
  eventSecond = new Events.css.CSSSetPropertyEvent(elTwo, "margin", "inline", "important", "none", "");
  FBTestFireDiff.compareChangeList(
      [setProperty, eventSecond],
      Events.merge([setProperty, eventSecond]),
      "CSS set set different prop");
  
  // (Set, Set) same property different rule
  eventSecond = new Events.css.CSSSetPropertyEvent(elTwo, "display", "inline", "important", "none", "");
  FBTestFireDiff.compareChangeList(
      [setProperty, eventSecond],
      Events.merge([setProperty, eventSecond]),
      "CSS set set different rule");
  
  // (Set, Remove) same property
  var setProperty = new Events.css.CSSSetPropertyEvent(elOne, "display", "none", "", "block", "important");
  var eventSecond = new Events.css.CSSRemovePropertyEvent(elOne, "display", "inline", "important");
  FBTestFireDiff.compareChangeList(
      [new Events.css.CSSRemovePropertyEvent(elOne, "display", "block", "important")],
      Events.merge([setProperty, eventSecond]),
      "CSS set remove same property");
  
  // (Set, Remove) same new property
  var setNewProperty = new Events.css.CSSSetPropertyEvent(elOne, "display", "none", "", "", "");
  var eventSecond = new Events.css.CSSRemovePropertyEvent(elOne, "display", "inline", "important");
  FBTestFireDiff.compareChangeList(
      [],
      Events.merge([setNewProperty, eventSecond]),
      "CSS set remove same new property");
  
  // (Set, Remove) different property
  eventSecond = new Events.css.CSSSetPropertyEvent(elTwo, "margin", "inline", "important");
  FBTestFireDiff.compareChangeList(
      [setProperty, eventSecond],
      Events.merge([setProperty, eventSecond]),
      "CSS set remove different property");
  
  // (Set, Remove) same property different rule
  eventSecond = new Events.css.CSSRemovePropertyEvent(elTwo, "display", "inline", "important");
  FBTestFireDiff.compareChangeList(
      [setProperty, eventSecond],
      Events.merge([setProperty, eventSecond]),
      "CSS set remove different rule");
  
  // (Set Prop, Insert Rule Before)
  eventSecond = new Events.css.CSSInsertRuleEvent(elOne);
  FBTestFireDiff.compareChangeList(
      [
       new Events.css.CSSSetPropertyEvent(
           elOne, "display", "none", "", "block", "important", Events.ChangeSource.APP_CHANGE, "/style()[1]/rule()[3]"),
       eventSecond
      ],
      Events.merge([setProperty, eventSecond]),
      "CSS set insert rule before");
  
  // (Set Prop, Insert Rule After)
  eventSecond = new Events.css.CSSInsertRuleEvent(elTwo);
  FBTestFireDiff.compareChangeList(
      [ setProperty, eventSecond ],
      Events.merge([setProperty, eventSecond]),
      "CSS set insert rule after");
  
  // (Set Prop, Remove Rule Same)
  eventSecond = new Events.css.CSSRemoveRuleEvent(elOne);
  FBTestFireDiff.compareChangeList(
      [eventSecond],
      Events.merge([setProperty, eventSecond]),
      "CSS set remove rule same");
  
  // (Set Prop, Remove Rule Before)
  eventSecond = new Events.css.CSSRemoveRuleEvent(elZero);
  FBTestFireDiff.compareChangeList(
      [
       new Events.css.CSSSetPropertyEvent(
           elOne, "display", "none", "", "block", "important", Events.ChangeSource.APP_CHANGE, "/style()[1]/rule()[1]"),
       eventSecond
      ],
      Events.merge([setProperty, eventSecond]),
      "CSS set remove rule before");
  
  // (Set Prop, Remove Rule After)
  eventSecond = new Events.css.CSSRemoveRuleEvent(elTwo);
  FBTestFireDiff.compareChangeList(
      [setProperty, eventSecond],
      Events.merge([setProperty, eventSecond]),
      "CSS set remove rule after");
  
  // (Remove, Set) same property
  removeProperty = new Events.css.CSSRemovePropertyEvent(elOne, "display", "none", "important");
  eventSecond = new Events.css.CSSSetPropertyEvent(elOne, "display", "inline", "", "block", "");
  FBTestFireDiff.compareChangeList(
      [new Events.css.CSSSetPropertyEvent(elOne, "display", "inline", "", "none", "important")],
      Events.merge([removeProperty, eventSecond]),
      "CSS remove set same property");
  
  // (Remove, Set) different property
  eventSecond = new Events.css.CSSSetPropertyEvent(elOne, "margin", "inline", "important", "none", "");
  FBTestFireDiff.compareChangeList(
      [removeProperty, eventSecond],
      Events.merge([removeProperty, eventSecond]),
      "CSS remove set different property");
  
  // (Remove, Set) different rule
  eventSecond = new Events.css.CSSSetPropertyEvent(elTwo, "display", "inline", "important", "none", "");
  FBTestFireDiff.compareChangeList(
      [removeProperty, eventSecond],
      Events.merge([removeProperty, eventSecond]),
      "CSS remove set different rule");
  
  // (Remove, Remove) same property
  eventSecond = new Events.css.CSSRemovePropertyEvent(elOne, "display", "block", "");
  FBTestFireDiff.compareChangeList(
      [removeProperty],
      Events.merge([removeProperty, eventSecond]),
      "CSS remove remove same property");
  
  // (Remove, Remove) different property
  eventSecond = new Events.css.CSSRemovePropertyEvent(elOne, "margin", "block", "");
  FBTestFireDiff.compareChangeList(
      [removeProperty, eventSecond],
      Events.merge([removeProperty, eventSecond]),
      "CSS remove remove different property");
  
  // (Remove, Remove) different rule
  eventSecond = new Events.css.CSSRemovePropertyEvent(elTwo, "display", "block", "");
  FBTestFireDiff.compareChangeList(
      [removeProperty, eventSecond],
      Events.merge([removeProperty, eventSecond]),
      "CSS remove remove different rule");
  
  // (Remove Prop, Insert Before)
  eventSecond = new Events.css.CSSInsertRuleEvent(elZero);
  FBTestFireDiff.compareChangeList(
      [
       new Events.css.CSSRemovePropertyEvent(
           elOne, "display", "none", "important", Events.ChangeSource.APP_CHANGE, "/style()[1]/rule()[3]"),
       eventSecond
      ],
      Events.merge([removeProperty, eventSecond]),
      "CSS remove prop insert rule before");
  
  // (Remove Prop, Insert After)
  eventSecond = new Events.css.CSSInsertRuleEvent(elTwo);
  FBTestFireDiff.compareChangeList(
      [removeProperty, eventSecond],
      Events.merge([removeProperty, eventSecond]),
      "CSS remove prop insert rule after");
  
  // (Remove Prop, Remove Same)
  eventSecond = new Events.css.CSSRemoveRuleEvent(elOne);
  FBTestFireDiff.compareChangeList(
      [eventSecond],
      Events.merge([removeProperty, eventSecond]),
      "CSS remove prop remove rule same");
  
  // (Remove Prop, Remove Before)
  eventSecond = new Events.css.CSSRemoveRuleEvent(elZero);
  FBTestFireDiff.compareChangeList(
      [
       new Events.css.CSSRemovePropertyEvent(
           elOne, "display", "none", "important", Events.ChangeSource.APP_CHANGE, "/style()[1]/rule()[1]"),
       eventSecond
      ],
      Events.merge([removeProperty, eventSecond]),
      "CSS remove prop remove rule before");
  
  // (Remove Prop, Remove After)
  eventSecond = new Events.css.CSSRemoveRuleEvent(elTwo);
  FBTestFireDiff.compareChangeList(
      [removeProperty, eventSecond],
      Events.merge([removeProperty, eventSecond]),
      "CSS remove prop insert rule before");
  
  // (Insert Same, Set Prop)
  var insertEvent = new Events.css.CSSInsertRuleEvent(elOne);
  eventSecond = new Events.css.CSSSetPropertyEvent(elOne, "border", "medium none", "");
  var cloneValue = CSSModel.cloneCSSObject(elOne);
  cloneValue.style.setProperty("border", "medium none", "");
  FBTestFireDiff.compareChangeList(
      [ new Events.css.CSSInsertRuleEvent(elOne, Events.ChangeSource.APP_CHANGE, insertEvent.xpath, cloneValue) ],
      Events.merge([insertEvent, eventSecond]),
      "CSS insert rule set prop same");
  
  // (Insert Before, Set Prop)
  eventSecond = new Events.css.CSSSetPropertyEvent(elZero, "border", "none", "");
  FBTestFireDiff.compareChangeList(
      [insertEvent, eventSecond],
      Events.merge([insertEvent, eventSecond]),
      "CSS insert rule set prop before");
  
  // (Insert After, Set Prop)
  eventSecond = new Events.css.CSSSetPropertyEvent(elTwo, "border", "none", "");
  FBTestFireDiff.compareChangeList(
      [insertEvent, eventSecond],
      Events.merge([insertEvent, eventSecond]),
      "CSS insert rule set prop after");
  
  // (Insert Same, Remove Prop)
  var insertEvent = new Events.css.CSSInsertRuleEvent(elOne);
  eventSecond = new Events.css.CSSRemovePropertyEvent(elOne, "border", "none", "");
  cloneValue = CSSModel.cloneCSSObject(elOne);
  cloneValue.style.removeProperty("border");
  FBTestFireDiff.compareChangeList(
      [ new Events.css.CSSInsertRuleEvent(elOne, Events.ChangeSource.APP_CHANGE, insertEvent.xpath, cloneValue)],
      Events.merge([insertEvent, eventSecond]),
      "CSS insert rule remove prop same");
  
  // (Insert Before, Remove Prop)
  eventSecond = new Events.css.CSSRemovePropertyEvent(elZero, "border", "none", "");
  FBTestFireDiff.compareChangeList(
      [insertEvent, eventSecond],
      Events.merge([insertEvent, eventSecond]),
      "CSS insert rule remove prop before");
  
  // (Insert After, Remove Prop)
  eventSecond = new Events.css.CSSRemovePropertyEvent(elTwo, "border", "none", "");
  FBTestFireDiff.compareChangeList(
      [insertEvent, eventSecond],
      Events.merge([insertEvent, eventSecond]),
      "CSS insert rule remove prop after");
  
  // (Insert Same, Remove Rule)
  eventSecond = new Events.css.CSSRemoveRuleEvent(elOne);
  FBTestFireDiff.compareChangeList(
      [],
      Events.merge([insertEvent, eventSecond]),
      "CSS insert rule remove rule same");
  
  // (Insert Before, Remove Rule)
  eventSecond =  new Events.css.CSSRemoveRuleEvent(elZero);
  FBTestFireDiff.compareChangeList(
      [new Events.css.CSSInsertRuleEvent(elOne, Events.ChangeSource.APP_CHANGE, "/style()[1]/rule()[1]"), eventSecond],
      Events.merge([insertEvent, eventSecond]),
      "CSS insert rule remove rule before");
  
  // (Insert After, Remove Rule)
  eventSecond = new Events.css.CSSRemoveRuleEvent(elTwo);
  FBTestFireDiff.compareChangeList(
      [insertEvent, eventSecond],
      Events.merge([insertEvent, eventSecond]),
      "CSS insert rule remove rule after");
  
  // (Insert Before, Insert)
  eventSecond = new Events.css.CSSInsertRuleEvent(elOne);
  FBTestFireDiff.compareChangeList(
      [new Events.css.CSSInsertRuleEvent(elOne, Events.ChangeSource.APP_CHANGE, "/style()[1]/rule()[3]"), eventSecond],
      Events.merge([insertEvent, eventSecond]),
      "CSS insert rule insert rule before");
  
  // (Insert After, Insert)
  eventSecond = new Events.css.CSSInsertRuleEvent(elTwo);
  FBTestFireDiff.compareChangeList(
      [insertEvent, eventSecond],
      Events.merge([insertEvent, eventSecond]),
      "CSS insert rule insert rule after");
  
  // (Remove Rule Before, Set Prop)
  var removeEvent = new Events.css.CSSRemoveRuleEvent(elOne);
  eventSecond = new Events.css.CSSSetPropertyEvent(elZero, "border", "none", "");
  FBTestFireDiff.compareChangeList(
      [removeEvent, eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "CSS remove rule set prop before");
  
  // (Remove Rule After, Set Prop)
  eventSecond = new Events.css.CSSSetPropertyEvent(elTwo, "border", "none", "");
  FBTestFireDiff.compareChangeList(
      [removeEvent, eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "CSS remove rule set prop after");
  
  // (Remove Rule Before, Remove Prop)
  eventSecond = new Events.css.CSSRemovePropertyEvent(elZero, "border", "none", "");
  FBTestFireDiff.compareChangeList(
      [removeEvent, eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "CSS remove rule remove prop before");
  
  // (Remove Rule After, Remove Prop)
  eventSecond = new Events.css.CSSRemovePropertyEvent(elTwo, "border", "none", "");
  FBTestFireDiff.compareChangeList(
      [removeEvent, eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "CSS remove rule remove prop before");
  
  // (Remove Rule Before, Remove Rule)
  eventSecond = new Events.css.CSSRemoveRuleEvent(elZero);
  FBTestFireDiff.compareChangeList(
      [new Events.css.CSSRemoveRuleEvent(elOne, Events.ChangeSource.APP_CHANGE, "/style()[1]/rule()[1]"), eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "CSS remove rule remove rule before");
  
  // (Remove Rule Same, Remove Rule)
  eventSecond = new Events.css.CSSRemoveRuleEvent(elOne);
  FBTestFireDiff.compareChangeList(
      [removeEvent, eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "CSS remove rule remove rule same");
  
  // (Remove Rule After, Remove Rule)
  eventSecond = new Events.css.CSSRemoveRuleEvent(elTwo);
  FBTestFireDiff.compareChangeList(
      [removeEvent, eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "CSS remove rule remove rule after");
  
  // (Remove Rule Same, Insert) identity
  eventSecond = new Events.css.CSSInsertRuleEvent(elOne);
  FBTestFireDiff.compareChangeList(
      [],
      Events.merge([removeEvent, eventSecond]),
      "CSS remove rule insert rule same identity");
  
  // (Remove Rule Same, Insert) distinct
  cloneValue = CSSModel.cloneCSSObject(elOne);
  cloneValue.style.setProperty("border", "green");
  eventSecond = new Events.css.CSSInsertRuleEvent(elOne, Events.ChangeSource.APP_CHANGE, undefined, cloneValue);
  FBTestFireDiff.compareChangeList(
      [removeEvent, eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "CSS remove rule insert rule same distinct");
  
  // (Remove Rule Before, Insert)
  eventSecond = new Events.css.CSSInsertRuleEvent(elZero);
  FBTestFireDiff.compareChangeList(
      [new Events.css.CSSRemoveRuleEvent(elOne, Events.ChangeSource.APP_CHANGE, "/style()[1]/rule()[3]"), eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "CSS remove rule insert rule before");
  
  // (Remove Rule After, Insert)
  eventSecond = new Events.css.CSSInsertRuleEvent(elTwo);
  FBTestFireDiff.compareChangeList(
      [removeEvent, eventSecond],
      Events.merge([removeEvent, eventSecond]),
      "CSS remove rule insert rule after");
  
  // Cancellation
  // - Update
  var insertCancel = new Events.css.CSSInsertRuleEvent(elZero);
  var removeCancel = new Events.css.CSSRemoveRuleEvent(elZero);
  eventSecond = new Events.css.CSSInsertRuleEvent(elOne);
  FBTestFireDiff.compareChangeList(
      [new Events.css.CSSInsertRuleEvent(elOne, Events.ChangeSource.APP_CHANGE, "/style()[1]/rule()[1]")],
      Events.merge([insertCancel, eventSecond, removeCancel]),
      "Insert cancellation update");
  
  // - No Update
  insertCancel = new Events.css.CSSInsertRuleEvent(elOne);
  removeCancel = new Events.css.CSSRemoveRuleEvent(elOne, Events.ChangeSource.APP_CHANGE, "/style()[1]/rule()[3]");   // This will cancel the first insert after the first step
  eventSecond = new Events.css.CSSInsertRuleEvent(elZero);
  FBTestFireDiff.compareChangeList(
      [eventSecond],
      Events.merge([insertCancel, eventSecond, removeCancel]),
      "Insert cancellation no update");

  // - Update
  removeCancel = new Events.css.CSSRemoveRuleEvent(elZero);
  insertCancel = new Events.css.CSSInsertRuleEvent(elZero);
  eventSecond = new Events.css.CSSInsertRuleEvent(elOne);
  FBTestFireDiff.compareChangeList(
      [new Events.css.CSSInsertRuleEvent(elOne, Events.ChangeSource.APP_CHANGE, "/style()[1]/rule()[3]")],
      Events.merge([removeCancel, eventSecond, insertCancel]),
      "Remove cancellation update");

  // - No Update
  removeCancel = new Events.css.CSSRemoveRuleEvent(elOne);
  insertCancel = new Events.css.CSSInsertRuleEvent(elOne, Events.ChangeSource.APP_CHANGE, "/style()[1]/rule()[3]");
  eventSecond = new Events.css.CSSInsertRuleEvent(elZero);
  FBTestFireDiff.compareChangeList(
      [eventSecond],
      Events.merge([removeCancel, eventSecond, insertCancel]),
      "Remove cancellation no update");

    FBTestFirebug.testDone();
  });
}