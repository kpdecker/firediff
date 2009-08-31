function runTest() {
  var urlBase = FBTest.getHTTPURLBase();
  FBTestFirebug.openNewTab(urlBase + "event/applyRevertTest.htm", function(win) {
    var Events = FBTest.FirebugWindow.FireDiff.events,
        Path = FBTest.FirebugWindow.FireDiff.Path,
        CSSModel = FBTest.FirebugWindow.FireDiff.CSSModel;
    function $(id) { return win.document.getElementById(id); }
    function $c(type) { return win.document.createElement(type); }
    
    function testAndVerify(event, target, verify, msg) {
      var original = target.innerHTML;
      var xpath = Path.getElementPath(target);
      var clone = target.cloneNode(true);

      event.apply(target);
      FBTest.compare(verify.innerHTML, target.innerHTML, msg + " test node match verify node.");
      event.revert(target);
      FBTest.compare(original, target.innerHTML, msg + " test node match original node.");
      event.apply(clone, xpath);
      FBTest.compare(verify.innerHTML, clone.innerHTML, msg + " clone node match verify node.");
    }
    function testAndVerifyStyle(event, target, verify, msg) {
      var original = target.style.cssText;

      event.apply(sheet);
      FBTest.compare(verify.style.cssText, target.style.cssText, msg + " test node match verify node.");
      event.revert(sheet);
      FBTest.compare(original, target.style.cssText, msg + " test node match original node.");
    }
    function testAndVerifyRule(event, verify, cssRules, index, isRemove, msg) {
      var cssText = verify.cssText;
      var originalLength = cssRules.length;

      FBTest.compare(originalLength, cssRules.length, msg + " css original rule count");
      event.apply(sheet);
      FBTest.compare(originalLength + (isRemove ? -1 : 1), cssRules.length, msg + " css rule count");
      if (!isRemove) {
        FBTest.compare(cssText, cssRules[index].cssText, msg + " test node match verify node.");
      }
      event.revert(sheet);
      FBTest.compare(originalLength, cssRules.length, msg + " css original rule count");
      if (isRemove) {
        FBTest.compare(cssText, cssRules[index].cssText, msg + " test node match original node.");
      }
    }
    
    FBTestFirebug.openFirebug();
    
    // We want to listen for events to make sure we are not generating events
    // as a result of these actions.
    var listener = {
      onDiffChange: function(change) {
        FBTest.sysout("Recieved Event: " + change);
        FBTest.ok(false, "Recieved event on apply/revert: " + change);
      }
    };
    FBTest.FirebugWindow.Firebug.DiffModule.addListener(listener);
    
    // DOM Node Inserted
    var newEl = $c("p");
    newEl.setAttribute("align", "left");
    newEl.appendChild(win.document.createTextNode("insertData"));
    var insertEvent = new Events.dom.DOMInsertedEvent(newEl, newEl, "/node()[2]/node()[2]/node()[2]/node()[6]");
    testAndVerify(insertEvent, $("insertTest"), $("insertVerify"), "Insert");
    
    // DOM Node Removed
    var removeEvent = new Events.dom.DOMRemovedEvent($("removeEl"));
    testAndVerify(removeEvent, $("removeTest"), $("removeVerify"), "Remove");
    
    // DOM Char Data Modified
    var charDataEvent = new Events.dom.DOMCharDataModifiedEvent($("charDataTest").lastChild, "Tested", "Test");
    testAndVerify(charDataEvent, $("charDataTest"), $("charDataVerify"), "Char data");
    
    // DOM Attr Modified
    var attrInsertEvent = new Events.dom.DOMAttrChangedEvent(
        $("attrInsertTest").firstChild,
        MutationEvent.ADDITION,
        "align",
        "left",
        "");
    testAndVerify(attrInsertEvent, $("attrInsertTest"), $("attrInsertVerify"), "Attr Insert");

    var attrRemoveEvent = new Events.dom.DOMAttrChangedEvent(
        $("attrRemoveTest").firstChild,
        MutationEvent.REMOVAL,
        "align",
        "",
        "right");
    testAndVerify(attrRemoveEvent, $("attrRemoveTest"), $("attrRemoveVerify"), "Attr Remove");

    var attrChangeEvent = new Events.dom.DOMAttrChangedEvent(
        $("attrChangeTest").firstChild,
        MutationEvent.MODIFICATION,
        "style",
        "display: inline",
        "display: block");
    testAndVerify(attrChangeEvent, $("attrChangeTest"), $("attrChangeVerify"), "Attr Change");

    // CSS Prop Set
    var sheet = win.document.styleSheets[0];
    var rule = sheet.cssRules[0];
    var cssSetEvent = new Events.css.CSSSetPropertyEvent(
        rule.style,
        "overflow",
        "hidden",
        "",
        "",
        "");
    testAndVerifyStyle(cssSetEvent, rule, sheet.cssRules[1], "CSS Set Property");
    
    // CSS Prop Reset
    rule = sheet.cssRules[2];
    var cssResetEvent = new Events.css.CSSSetPropertyEvent(
        rule.style,
        "padding-top",
        "16px",
        "important",
        "5px",
        "");
    testAndVerifyStyle(cssResetEvent, rule, sheet.cssRules[3], "CSS Reset Property");
    
    // CSS Prop Remove
    rule = sheet.cssRules[4];
    var cssRemoveEvent = new Events.css.CSSRemovePropertyEvent(
        rule.style,
        "margin-right",
        "40px",
        "");
    testAndVerifyStyle(cssRemoveEvent, rule, sheet.cssRules[5], "CSS Remove  Property");
    
    // CSS Insert Rule Test
    var verifyRule = sheet.cssRules[7];
    var cssInsertRuleEvent = new Events.css.CSSInsertRuleEvent(
        {},
        Events.ChangeSource.FIREBUG_CHANGE,
        Path.getStylePath(sheet) + "/rule()[1]",
        CSSModel.cloneCSSObject(verifyRule));
    testAndVerifyRule(cssInsertRuleEvent, verifyRule, sheet.cssRules, 0, false, "CSS Insert Rule");
    
    // CSS Remove Rule Test
    var verifyRule = sheet.cssRules[6];
    var cssInsertRuleEvent = new Events.css.CSSRemoveRuleEvent(
        verifyRule,
        Events.ChangeSource.FIREBUG_CHANGE);
    testAndVerifyRule(cssInsertRuleEvent, verifyRule, sheet.cssRules, 6, true, "CSS Remove Rule");

    const MEDIA_INDEX = 8;

    // CSS @media Prop Set
    var sheet = win.document.styleSheets[0];
    var rule = sheet.cssRules[MEDIA_INDEX].cssRules[0];
    var cssSetEvent = new Events.css.CSSSetPropertyEvent(
        rule.style,
        "overflow",
        "hidden",
        "",
        "",
        "");
    testAndVerifyStyle(cssSetEvent, rule, sheet.cssRules[1], "CSS @media Set Property");
    
    // CSS @media Prop Reset
    rule = sheet.cssRules[MEDIA_INDEX].cssRules[2];
    var cssResetEvent = new Events.css.CSSSetPropertyEvent(
        rule.style,
        "padding-top",
        "16px",
        "important",
        "5px",
        "");
    testAndVerifyStyle(cssResetEvent, rule, sheet.cssRules[3], "CSS @media Reset Property");
    
    // CSS @media Prop Remove
    rule = sheet.cssRules[MEDIA_INDEX].cssRules[4];
    var cssRemoveEvent = new Events.css.CSSRemovePropertyEvent(
        rule.style,
        "margin-right",
        "40px",
        "");
    testAndVerifyStyle(cssRemoveEvent, rule, sheet.cssRules[5], "CSS @media Remove Property");
    
    // CSS @media Insert Rule Test
    var verifyRule = sheet.cssRules[7];
    var cssInsertRuleEvent = new Events.css.CSSInsertRuleEvent(
        {},
        Events.ChangeSource.FIREBUG_CHANGE,
        Path.getStylePath(sheet.cssRules[MEDIA_INDEX]) + "/rule()[1]",
        CSSModel.cloneCSSObject(verifyRule));
    testAndVerifyRule(cssInsertRuleEvent, verifyRule, sheet.cssRules[MEDIA_INDEX].cssRules, 0, false, "CSS @media Insert Rule");
    
    // CSS @media Remove Rule Test
    var verifyRule = sheet.cssRules[MEDIA_INDEX].cssRules[6];
    var cssInsertRuleEvent = new Events.css.CSSRemoveRuleEvent(
        verifyRule,
        Events.ChangeSource.FIREBUG_CHANGE);
    testAndVerifyRule(cssInsertRuleEvent, verifyRule, sheet.cssRules[MEDIA_INDEX].cssRules, 6, true, "CSS @media Insert Rule");
    
    FBTest.FirebugWindow.Firebug.DiffModule.removeListener(listener);
    FBTestFirebug.testDone();
  });
}