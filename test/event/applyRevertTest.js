function runTest() {
  var urlBase = FBTest.getHTTPURLBase();
  FBTestFirebug.openNewTab(urlBase + "event/applyRevertTest.htm", function(win) {
    var Events = FBTest.FirebugWindow.FireDiff.events,
        Path = FBTest.FirebugWindow.FireDiff.Path;
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

      event.apply(target.style);
      FBTest.compare(verify.style.cssText, target.style.cssText, msg + " test node match verify node.");
      event.revert(target.style);
      FBTest.compare(original, target.style.cssText, msg + " test node match original node.");
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
    var insertEvent = new Events.DOMInsertedEvent(newEl, newEl, "/node()[2]/node()[2]/node()[2]/node()[6]");
    testAndVerify(insertEvent, $("insertTest"), $("insertVerify"), "Insert");
    
    // DOM Node Removed
    var removeEvent = new Events.DOMRemovedEvent($("removeEl"));
    testAndVerify(removeEvent, $("removeTest"), $("removeVerify"), "Remove");
    
    // DOM Char Data Modified
    var charDataEvent = new Events.DOMCharDataModifiedEvent($("charDataTest").lastChild, "Tested", "Test");
    testAndVerify(charDataEvent, $("charDataTest"), $("charDataVerify"), "Char data");
    
    // DOM Attr Modified
    var attrInsertEvent = new Events.DOMAttrChangedEvent(
        $("attrInsertTest").firstChild,
        MutationEvent.ADDITION,
        "align",
        "left",
        "");
    testAndVerify(attrInsertEvent, $("attrInsertTest"), $("attrInsertVerify"), "Attr Insert");

    var attrRemoveEvent = new Events.DOMAttrChangedEvent(
        $("attrRemoveTest").firstChild,
        MutationEvent.REMOVAL,
        "align",
        "",
        "right");
    testAndVerify(attrRemoveEvent, $("attrRemoveTest"), $("attrRemoveVerify"), "Attr Remove");

    var attrChangeEvent = new Events.DOMAttrChangedEvent(
        $("attrChangeTest").firstChild,
        MutationEvent.MODIFICATION,
        "style",
        "display: inline",
        "display: block");
    testAndVerify(attrChangeEvent, $("attrChangeTest"), $("attrChangeVerify"), "Attr Change");

    // CSS Prop Set
    var sheet = win.document.styleSheets[0];
    var rule = sheet.cssRules[0];
    var cssSetEvent = new Events.CSSSetPropertyEvent(
        rule.style,
        "overflow",
        "hidden",
        "",
        "",
        "");
    testAndVerifyStyle(cssSetEvent, rule, sheet.cssRules[1], "CSS Set Property");
    
    // CSS Prop Reset
    rule = sheet.cssRules[2];
    var cssResetEvent = new Events.CSSSetPropertyEvent(
        rule.style,
        "padding-top",
        "16px",
        "important",
        "5px",
        "");
    testAndVerifyStyle(cssResetEvent, rule, sheet.cssRules[3], "CSS Reset Property");
    
    // CSS Prop Remove
    rule = sheet.cssRules[4];
    var cssRemoveEvent = new Events.CSSRemovePropertyEvent(
        rule.style,
        "margin-right",
        "40px",
        "");
    testAndVerifyStyle(cssRemoveEvent, rule, sheet.cssRules[5], "CSS Remove  Property");

    FBTest.FirebugWindow.Firebug.DiffModule.removeListener(listener);
    FBTestFirebug.testDone();
  });
}