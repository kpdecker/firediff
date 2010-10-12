function runTest() {
  var Events = FBTest.FirebugWindow.FireDiff.events,
    Firebug = FBTest.FirebugWindow.Firebug,
    FBTrace = FBTest.FirebugWindow.FBTrace;
  var cssPanel;

  function setEditorValue(editor, value) {
    var editorInput = editor.input;
    editorInput.value = value;
    Firebug.Editor.update(true);
  }

  var tests = [
    {
      name: "newProperty",
      execute: function(win) {
        cssPanel.editElementStyle();
        
        var editor = cssPanel.editor;
        setEditorValue(editor, "whitespace");
        setEditorValue(editor, "background-color");
        Firebug.Editor.tabNextEditor();
        
        setEditorValue(editor, "orange");
        setEditorValue(editor, "red");
        Firebug.Editor.stopEditing();
      },
      verify: function(win, number, change) {
        FBTest.compare(change.changeSource, Events.ChangeSource.FIREBUG_CHANGE, "Change source: " + change.changeSource);
        FBTest.compare(change.changeType, "DOM", "Change type: " + change.changeType);
        FBTest.compare(change.subType, "attr_changed", "Sub type: " + change.subType);
        FBTest.compare(change.attrName, "style", "Attribute Name: " + change.attrName);
        FBTest.compare(change.value, "background-color: red;", "Value: " + change.value);
        FBTest.compare(change.previousValue, "", "Prev Value: " + change.previousValue);
        FBTest.compare(change.isAddition(), false, "Is Addition: " + change.isAddition());
        FBTest.compare(change.isRemoval(), false, "Is Removal: " + change.isRemoval());
      },
      eventCount: 1
    },
    {
      name: "editProperty",
      execute: function(win) {
        var panelNode = cssPanel.panelNode;
        var rule = panelNode.getElementsByClassName("cssPropValue")[0];
        
        Firebug.Editor.startEditing(rule, rule.textContent);
        
        var editor = cssPanel.editor;
        setEditorValue(editor, "yellow");
        setEditorValue(editor, "green !important");
        Firebug.Editor.stopEditing();
      },
      verify: function(win, number, change) {
        FBTest.compare(change.changeSource, Events.ChangeSource.FIREBUG_CHANGE, "Change source: " + change.changeSource);
        FBTest.compare(change.changeType, "DOM", "Change type: " + change.changeType);
        FBTest.compare(change.subType, "attr_changed", "Sub type: " + change.subType);
        FBTest.compare(change.attrName, "style", "Attribute Name: " + change.attrName);
        FBTest.compare(change.value, "background-color: green ! important;", "Value: " + change.value);
        FBTest.compare(change.previousValue, "background-color: red;", "Prev Value: " + change.previousValue);
        FBTest.compare(change.isAddition(), false, "Is Addition: " + change.isAddition());
        FBTest.compare(change.isRemoval(), false, "Is Removal: " + change.isRemoval());
      },
      eventCount: 1
    },
    {
      name: "renameProperty",
      execute: function(win) {
        FBTrace.sysout("renameProperty");
        var panelNode = cssPanel.panelNode;
        var rule = panelNode.getElementsByClassName("cssPropName")[0];
        FBTrace.sysout("renameProperty: " + rule, rule.cloneNode(true));
        
        Firebug.Editor.startEditing(rule, rule.textContent);
        
        var editor = cssPanel.editor;
        setEditorValue(editor, "border-color");
        setEditorValue(editor, "color");
        Firebug.Editor.stopEditing();
      },
      verify: function(win, number, change) {
        FBTest.compare(change.changeSource, Events.ChangeSource.FIREBUG_CHANGE, "Change source: " + change.changeSource);
        FBTest.compare(change.changeType, "DOM", "Change type: " + change.changeType);
        FBTest.compare(change.subType, "attr_changed", "Sub type: " + change.subType);
        FBTest.compare(change.attrName, "style", "Attribute Name: " + change.attrName);
        FBTest.compare(change.value, "color: green ! important;", "Value: " + change.value);
        FBTest.compare(change.previousValue, "background-color: green ! important;", "Prev Value: " + change.previousValue);
        FBTest.compare(change.isAddition(), false, "Is Addition: " + change.isAddition());
        FBTest.compare(change.isRemoval(), false, "Is Removal: " + change.isRemoval());
      },
      eventCount: 1
    },
    {
      name: "disableProperty",
      execute: function(win) {
        FBTrace.sysout("disableProperty");
        var panelNode = cssPanel.panelNode;
        var rule = panelNode.getElementsByClassName("cssProp")[0];
        FBTrace.sysout("disableProperty: " + rule, rule.cloneNode(true));
        
        cssPanel.disablePropertyRow(rule);
        cssPanel.disablePropertyRow(rule);
      },
      verify: function(win, number, change) {
        FBTest.compare(change.changeSource, Events.ChangeSource.FIREBUG_CHANGE, "Change source: " + change.changeSource);
        FBTest.compare(change.changeType, "DOM", "Change type: " + change.changeType);
        FBTest.compare(change.subType, "attr_changed", "Sub type: " + change.subType);
        FBTest.compare(change.attrName, "style", "Attribute Name: " + change.attrName);
        FBTest.compare(change.value, number ? "color: green ! important;" : "", "Value: " + change.value);
        FBTest.compare(change.previousValue, number ? "" : "color: green ! important;", "Prev Value: " + change.previousValue);
        FBTest.compare(change.isAddition(), false, "Is Addition: " + change.isAddition());
        FBTest.compare(change.isRemoval(), false, "Is Removal: " + change.isRemoval());
      },
      eventCount: 2
    },
    {
      name: "deleteProperty",
      execute: function(win) {
        var panelNode = cssPanel.panelNode;
        var rule = panelNode.getElementsByClassName("cssPropName")[0];
        
        Firebug.Editor.startEditing(rule, rule.textContent);
        
        var editor = cssPanel.editor;
        setEditorValue(editor, "border-color");
        setEditorValue(editor, "");
        Firebug.Editor.stopEditing();
      },
      verify: function(win, number, change) {
        FBTest.compare(change.changeSource, Events.ChangeSource.FIREBUG_CHANGE, "Change source: " + change.changeSource);
        FBTest.compare(change.changeType, "DOM", "Change type: " + change.changeType);
        FBTest.compare(change.subType, "attr_changed", "Sub type: " + change.subType);
        FBTest.compare(change.attrName, "style", "Attribute Name: " + change.attrName);
        FBTest.compare(change.value, "", "Value: " + change.value);
        FBTest.compare(change.previousValue, "color: green ! important;", "Prev Value: " + change.previousValue);
        FBTest.compare(change.isAddition(), false, "Is Addition: " + change.isAddition());
        FBTest.compare(change.isRemoval(), false, "Is Removal: " + change.isRemoval());
      },
      eventCount: 1
    },
  ];
  
  var urlBase = FBTest.getHTTPURLBase();
  FBTestFirebug.openNewTab(urlBase + "module/index.htm", function(win) {
    FBTestFirebug.openFirebug();

    FBTestFireDiff.enableDiffPanel(
        function() {
          FBTestFirebug.selectPanel("html");
          cssPanel = FW.FirebugChrome.selectSidePanel("css");
          //FBTestFirebug.selectPanel("css");
          //cssPanel = FBTestFirebug.getSelectedPanel();
          FW.FBTrace.sysout("cssPanel", cssPanel);
          cssPanel.select(win.document.getElementById("attrModified"));
          
          FBTestFireDiff.executeModuleTests(tests, win);
        });
  });
}