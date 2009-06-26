function runTest() {
  var Events = FBTest.FirebugWindow.FireDiff.events;
  
  FBTest.loadScript("FBTestFireDiff.js", this);
  var tests = [
    {
      name: "textModified_innerHTML",
      execute: function(win) {
        var textModified = win.document.getElementById("textModified");
        textModified.innerHTML = "New Value";
      },
      verify: function(win, number, change) {
        FBTest.compare(change.changeSource, Events.ChangeSource.APP_CHANGE, "Change source: " + change.changeSource);
        FBTest.ok(change.changeType, "DOM", "Change type: " + change.changeType);
        FBTest.ok(change.subType == change ? "dom_inserted" : "dom_removed", "Sub type: " + change.subType);
      },
      eventCount: 2
    },
    {
      name: "textModified_appendData",
      execute: function(win) {
        var textModified = win.document.getElementById("textModified");
        textModified.firstChild.appendData("More Data");
      },
      verify: function(win, number,change) {
        FBTest.compare(change.changeSource, Events.ChangeSource.APP_CHANGE, "Change source: " + change.changeSource);
        FBTest.ok(change.changeType, "DOM", "Change type: " + change.changeType);
        FBTest.ok(change.subType == "char_data_modified", "Sub type: " + change.subType);
      },
      eventCount: 1
    },
    {
      name: "attrModified_assign",
      execute: function(win) {
        var attrModified = win.document.getElementById("attrModified");
        attrModified.align = "right";
      },
      verify: function(win, number, change) {
        FBTest.compare(change.changeSource, Events.ChangeSource.APP_CHANGE, "Change source: " + change.changeSource);
        FBTest.ok(change.changeType, "DOM", "Change type: " + change.changeType);
        FBTest.ok(change.subType == "attr_changed", "Sub type: " + change.subType);
        FBTest.ok(change.isAddition(), "change.isAddition");
        FBTest.ok(!change.isRemoval(), "!change.isRemoval");
      },
      eventCount: 1
    },
    {
      name: "attrModified_setAttr",
      execute: function(win) {
        var attrModified = win.document.getElementById("attrModified");
        attrModified.setAttribute("align", "left");
      },
      verify: function(win, number, change) {
        FBTest.compare(change.changeSource, Events.ChangeSource.APP_CHANGE, "Change source: " + change.changeSource);
        FBTest.ok(change.changeType, "DOM", "Change type: " + change.changeType);
        FBTest.ok(change.subType == "attr_changed", "Sub type: " + change.subType);
        FBTest.ok(!change.isAddition(), "!change.isAddition");
        FBTest.ok(!change.isRemoval(), "!change.isRemoval");
      },
      eventCount: 1
    },
    {
      name: "attrModified_remove",
      execute: function(win) {
        var attrModified = win.document.getElementById("attrModified");
        attrModified.removeAttribute("align");
      },
      verify: function(win, number, change) {
        FBTest.compare(change.changeSource, Events.ChangeSource.APP_CHANGE, "Change source: " + change.changeSource);
        FBTest.ok(change.changeType, "DOM", "Change type: " + change.changeType);
        FBTest.ok(change.subType == "attr_changed", "Sub type: " + change.subType);
        FBTest.ok(!change.isAddition(), "!change.isAddition");
        FBTest.ok(change.isRemoval(), "change.isRemoval");
      },
      eventCount: 1
    },
    {
      name: "insertNode",
      execute: function(win) {
        var insertNode = win.document.getElementById("insertNode");
        var p = document.createElement("p");
        p.setAttribute("align", "left");
        insertNode.appendChild(p);
      },
      verify: function(win, number, change) {
        FBTest.compare(change.changeSource, Events.ChangeSource.APP_CHANGE, "Change source: " + change.changeSource);
        FBTest.ok(change.changeType, "DOM", "Change type: " + change.changeType);
        FBTest.ok(change.subType == "dom_inserted", "Sub type: " + change.subType);
      },
      eventCount: 1
    }
    
    // TODO : Test Insert + Modify attr
    // TODO : Test Remove + Modify attr (Need to implement eventCount = 0 handler
    
  ];
  /*
  var insertNode = document.getElementById("insertNode");
  var p = document.createElement("p");
  p.setAttribute("align", "left");
  insertNode.appendChild(p);

  var insertNodeHtml = document.getElementById("insertNode_innerHTML");
  insertNodeHtml.innerHTML = "<p>test</p>";

  var removeNodeHtml = document.getElementById("removeNode_innerHTML");
  removeNodeHtml.innerHTML = "";

  var removeNode = document.getElementById("removeNode");
  removeNode.removeChild(removeNode.getElementsByTagName("p")[0]);
*/
  
  var urlBase = FBTest.getHTTPURLBase();
  FBTestFirebug.openNewTab(urlBase + "module/index.htm", function(win) {
    FBTestFirebug.openFirebug();
    FBTestFireDiff.enableDiffPanel(
        function() {
          FBTestFireDiff.executeModuleTests(tests, win);
        });
  });
}