function runTest() {
  var Events = FBTest.FirebugWindow.FireDiff.events,
    Firebug = FBTest.FirebugWindow.Firebug,
    FBTrace = FBTest.FirebugWindow.FBTrace;
  var htmlPanel;
  
  function verifyAppChange(change) {
    FBTest.compare(change.changeSource, Events.ChangeSource.APP_CHANGE, "Change source: " + change.changeSource);
    FBTest.compare(change.changeType, "DOM", "Change type: " + change.changeType);
    FBTest.compare(change.subType, "attr_changed", "Sub type: " + change.subType);
    FBTest.compare(change.attrName, "align", "Attribute Name: " + change.attrName);
    FBTest.compare(change.value, "left", "Value: " + change.value);
    FBTest.compare(change.previousValue, "center", "Prev Value: " + change.previousValue);
    FBTest.compare(change.isAddition(), false, "Is Addition: " + change.isAddition());
    FBTest.compare(change.isRemoval(), false, "Is Removal: " + change.isRemoval());
  }
  function getEditor(htmlPanel, editNode) {
    return htmlPanel.localEditors[FBTest.FirebugWindow.FBL.getElementType(editNode)];
  }
  function setEditorValue(editor, value) {
    var editorInput = editor.input;
    editorInput.value = value;
    Firebug.Editor.update(true);
  }
  
  var tests = [
    {
      name: "newAttribute",
      setup: function(win) {
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "center");
      },
      execute: function(win) {
        var attrMod = win.document.getElementById("attrModified");
        htmlPanel.select(attrMod);
        htmlPanel.editNewAttribute(attrMod);
        
        var attrEditor = htmlPanel.attrEditor;
        setEditorValue(attrEditor, "style");
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "left");
        
        setEditorValue(attrEditor, "align");
        Firebug.Editor.tabNextEditor();
        
        setEditorValue(attrEditor, "left");
        setEditorValue(attrEditor, "right");
        Firebug.Editor.stopEditing();
      },
      verify: function(win, number, change) {
        if (number == 0) {
          verifyAppChange(change);
          return;
        }
        
        FBTest.compare(change.changeSource, Events.ChangeSource.FIREBUG_CHANGE, "Change source: " + change.changeSource);
        FBTest.compare(change.changeType, "DOM", "Change type: " + change.changeType);
        FBTest.compare(change.subType, "attr_changed", "Sub type: " + change.subType);
        FBTest.compare(change.attrName, "align", "Attribute Name: " + change.attrName);
        FBTest.compare(change.value, number==2 ? "right" : "", "Value: " + change.value);
        FBTest.compare(change.previousValue, "", "Prev Value: " + change.previousValue);
        FBTest.compare(change.isAddition(), number==1, "Is Addition: " + change.isAddition());
        FBTest.compare(change.isRemoval(), false, "Is Removal: " + change.isRemoval());
      },
      eventCount: 3
    },
    {
      name: "editAttribute",
      setup: function(win) {
        var attrMod = win.document.getElementById("attrModified");
        attrMod.setAttribute("align", "right");
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "center");
      },
      execute: function(win) {
        var attrMod = win.document.getElementById("attrModified");
        htmlPanel.select(attrMod);
        htmlPanel.editAttribute(attrMod, "align");
        
        var attrEditor = htmlPanel.attrEditor;
        
        setEditorValue(attrEditor, "left");
        
        var removeAttrMod = win.document.getElementById("removeNode");
        removeAttrMod.setAttribute("align", "left");
        
        setEditorValue(attrEditor, "center");
        Firebug.Editor.stopEditing();
      },
      verify: function(win, number, change) {
        if (number == 1) {
          verifyAppChange(change);
          return;
        }
        
        FBTest.compare(change.changeSource, Events.ChangeSource.FIREBUG_CHANGE, "Change source: " + change.changeSource);
        FBTest.compare(change.changeType, "DOM", "Change type: " + change.changeType);
        FBTest.compare(change.subType, "attr_changed", "Sub type: " + change.subType);
        FBTest.compare(change.attrName, "align", "Attribute Name: " + change.attrName);
        FBTest.compare(change.value, "center", "Value: " + change.value);
        FBTest.compare(change.previousValue, "right", "Prev Value: " + change.previousValue);
        FBTest.compare(change.isAddition(), false, "Is Addition: " + change.isAddition());
        FBTest.compare(change.isRemoval(), false, "Is Removal: " + change.isRemoval());
      },
      eventCount: 2
    },
    {
      name: "styleAttribute",
      setup: function(win) {
        var attrMod = win.document.getElementById("attrModified");
        attrMod.setAttribute("style", "background-color: red;");
      },
      execute: function(win) {
        // Force a page refresh as the style attribute change is not always picked up
        htmlPanel.select(document.createElement("div"));

        var attrMod = win.document.getElementById("attrModified");
        htmlPanel.select(attrMod, true);
        htmlPanel.editAttribute(attrMod, "style");
        
        var attrEditor = htmlPanel.attrEditor;
        FBTrace.sysout("styleAttr attrEditor", attrEditor);
        setEditorValue(attrEditor, "background-color: green;");
        Firebug.Editor.stopEditing();
      },
      verify: function(win, number, change) {
        FBTest.compare(change.changeSource, Events.ChangeSource.FIREBUG_CHANGE, "Change source: " + change.changeSource);
        FBTest.compare(change.changeType, "DOM", "Change type: " + change.changeType);
        FBTest.compare(change.subType, "attr_changed", "Sub type: " + change.subType);
        FBTest.compare(change.attrName, "style", "Attribute Name: " + change.attrName);
        FBTest.compare(change.value, "background-color: green;", "Value: " + change.value);
        FBTest.compare(change.previousValue, "background-color: red;", "Prev Value: " + change.previousValue);
        FBTest.compare(change.isAddition(), false, "Is Addition: " + change.isAddition());
        FBTest.compare(change.isRemoval(), false, "Is Removal: " + change.isRemoval());
      },
      eventCount: 1
    },
    {
      name: "deleteAttributeValue",
      setup: function(win) {
        var attrMod = win.document.getElementById("attrModified");
        attrMod.setAttribute("align", "right");
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "center");
      },
      execute: function(win) {
        // Force a page refresh as the style attribute change is not always picked up
        htmlPanel.select(document.createElement("div"));

        var attrMod = win.document.getElementById("attrModified");
        htmlPanel.select(attrMod);
        htmlPanel.editAttribute(attrMod, "align");
        
        var attrEditor = htmlPanel.attrEditor;
        
        setEditorValue(attrEditor, "left");
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "left");
        
        setEditorValue(attrEditor, "");
        Firebug.Editor.stopEditing();
      },
      verify: function(win, number, change) {
        if (number === 1) {
          verifyAppChange(change);
          return;
        }
        
        FBTest.compare(change.changeSource, Events.ChangeSource.FIREBUG_CHANGE, "Change source: " + change.changeSource);
        FBTest.compare(change.changeType, "DOM", "Change type: " + change.changeType);
        FBTest.compare(change.subType, "attr_changed", "Sub type: " + change.subType);
        FBTest.compare(change.attrName, "align", "Attribute Name: " + change.attrName);
        FBTest.compare(change.value, "", "Value: " + change.value);
        FBTest.compare(change.previousValue, "right", "Prev Value: " + change.previousValue);
        FBTest.compare(change.isAddition(), false, "Is Addition: " + change.isAddition());
        FBTest.compare(change.isRemoval(), false, "Is Removal: " + change.isRemoval());   // This is the behavior of Firebug. Doesn't match the UI
      },
      eventCount: 2
    },
    {
      name: "deleteAttributeName",
      setup: function(win) {
        var attrMod = win.document.getElementById("attrModified");
        attrMod.setAttribute("align", "right");
        attrMod.removeAttribute("style");
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "center");
      },
      execute: function(win) {
        var attrMod = win.document.getElementById("attrModified");
        htmlPanel.select(attrMod);
        htmlPanel.editAttribute(attrMod, "align");
        
        Firebug.Editor.tabPreviousEditor();
        var attrEditor = htmlPanel.attrEditor;
        setEditorValue(attrEditor, "style");
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "left");
        
        setEditorValue(attrEditor, "");
        Firebug.Editor.stopEditing();
      },
      verify: function(win, number, change) {
        if (number === 1) {
          verifyAppChange(change);
          return;
        }
        
        FBTest.compare(change.changeSource, Events.ChangeSource.FIREBUG_CHANGE, "Change source: " + change.changeSource);
        FBTest.compare(change.changeType, "DOM", "Change type: " + change.changeType);
        FBTest.compare(change.subType, "attr_changed", "Sub type: " + change.subType);
        FBTest.compare(change.attrName, "align", "Attribute Name: " + change.attrName);
        FBTest.compare(change.value, "", "Value: " + change.value);
        FBTest.compare(change.previousValue, "right", "Prev Value: " + change.previousValue);
        FBTest.compare(change.isAddition(), false, "Is Addition: " + change.isAddition());
        FBTest.compare(change.isRemoval(), true, "Is Removal: " + change.isRemoval());
      },
      eventCount: 2
    },
    {
      name: "deleteAttributeMethod",
      setup: function(win) {
        var attrMod = win.document.getElementById("attrModified");
        attrMod.setAttribute("align", "right");
      },
      execute: function(win) {
        var attrMod = win.document.getElementById("attrModified");
        htmlPanel.select(attrMod);
        htmlPanel.deleteAttribute(attrMod, "align");
      },
      verify: function(win, number, change) {
        FBTest.compare(change.changeSource, Events.ChangeSource.FIREBUG_CHANGE, "Change source: " + change.changeSource);
        FBTest.compare(change.changeType, "DOM", "Change type: " + change.changeType);
        FBTest.compare(change.subType, "attr_changed", "Sub type: " + change.subType);
        FBTest.compare(change.attrName, "align", "Attribute Name: " + change.attrName);
        FBTest.compare(change.value, "", "Value: " + change.value);
        FBTest.compare(change.previousValue, "right", "Prev Value: " + change.previousValue);
        FBTest.compare(change.isAddition(), false, "Is Addition: " + change.isAddition());
        FBTest.compare(change.isRemoval(), true, "Is Removal: " + change.isRemoval());
      },
      eventCount: 1
    },
    {
      name: "deleteNode",
      execute: function(win) {
        var attrMod = win.document.getElementById("attrModified");
        htmlPanel.select(attrMod);
        htmlPanel.deleteNode(attrMod);
      },
      verify: function(win, number, change) {
        FBTest.compare(change.changeSource, Events.ChangeSource.FIREBUG_CHANGE, "Change source: " + change.changeSource);
        FBTest.compare(change.changeType, "DOM", "Change type: " + change.changeType);
        FBTest.compare(change.subType, "dom_removed", "Sub type: " + change.subType);
        FBTest.compare(change.isElementAdded(), false, "Is Addition: " + change.isElementAdded());
        FBTest.compare(change.isElementRemoved(), true, "Is Removal: " + change.isElementRemoved());
      },
      eventCount: 1
    },
    {
      name: "editTextNode",
      setup: function(win) {
        var textMod = win.document.getElementById("textModified");
        textMod.innerHTML = "Text Value";
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "center");
      },
      execute: function(win) {
        var textMod = win.document.getElementById("textModified");
        htmlPanel.select(textMod);
        
        var nodeBox = htmlPanel.ioBox.findObjectBox(textMod);
        var textNodeBox = nodeBox.getElementsByClassName("nodeText")[0];
        
        Firebug.Editor.startEditing(textNodeBox, textNodeBox.textContent);
        var textEditor = htmlPanel.textNodeEditor;
        setEditorValue(textEditor, "test");
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "left");
        
        setEditorValue(textEditor, "test2");
        Firebug.Editor.stopEditing();
      },
      verify: function(win, number, change) {
        if (number == 1) {
          verifyAppChange(change);
          return;
        }
        
        FBTest.compare(change.changeSource, Events.ChangeSource.FIREBUG_CHANGE, "Change source: " + change.changeSource);
        FBTest.compare(change.changeType, "DOM", "Change type: " + change.changeType);
        FBTest.compare(change.subType, number>1 ? "dom_inserted" : "dom_removed", "Sub type: " + change.subType);
        FBTest.compare(change.value, number>1 ? "test2" : "", "Value: " + change.value);
        FBTest.compare(change.previousValue, number>1 ? "" : "Text Value", "Prev Value: " + change.previousValue);
        FBTest.compare(change.isElementAdded(), number!==0, "Is Addition: " + change.isElementAdded());
        FBTest.compare(change.isElementRemoved(), number===0, "Is Removal: " + change.isElementRemoved());
      },
      eventCount: 3
    },
    {
      name: "editTextNode_remove",
      setup: function(win) {
        var textMod = win.document.getElementById("textModified");
        textMod.innerHTML = "Text Value";
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "center");
      },
      execute: function(win) {
        var textMod = win.document.getElementById("textModified");
        htmlPanel.select(textMod);
        
        var nodeBox = htmlPanel.ioBox.findObjectBox(textMod);
        var textNodeBox = nodeBox.getElementsByClassName("nodeText")[0];
        
        Firebug.Editor.startEditing(textNodeBox, textNodeBox.textContent);
        var textEditor = htmlPanel.textNodeEditor;
        setEditorValue(textEditor, "test");
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "left");
        
        setEditorValue(textEditor, "");
        Firebug.Editor.stopEditing();
      },
      verify: function(win, number, change) {
        if (number === 1) {
          verifyAppChange(change);
          return;
        }
        
        FBTest.compare(change.changeSource, Events.ChangeSource.FIREBUG_CHANGE, "Change source: " + change.changeSource);
        FBTest.compare(change.changeType, "DOM", "Change type: " + change.changeType);
        FBTest.compare(change.subType, "dom_removed", "Sub type: " + change.subType);
        FBTest.compare(change.value, "", "Value: " + change.value);
        FBTest.compare(change.previousValue, "Text Value", "Prev Value: " + change.previousValue);
        FBTest.compare(change.isElementAdded(), false, "Is Addition: " + change.isElementAdded());
        FBTest.compare(change.isElementRemoved(), true, "Is Removal: " + change.isElementRemoved());
      },
      eventCount: 2
    },
    {
      name: "editNode_self",
      setup: function(win) {
        var editNode = win.document.getElementById("insertNode");
        editNode.innerHTML = "<p>test</p>";
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "center");
      },
      execute: function(win) {
        var editNode = win.document.getElementById("insertNode");
        htmlPanel.select(editNode);
        htmlPanel.toggleEditing();
        
        var textEditor = getEditor(htmlPanel, editNode);
        setEditorValue(textEditor, "<div id=\"insertNode\"><p>test2</p></div>");
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "left");
        
        setEditorValue(textEditor, "<div id=\"insertNode\"><p>test3</p></div>");
        Firebug.Editor.stopEditing();
      },
      verify: function(win, number, change) {
        if (number === 1) {
          verifyAppChange(change);
          return;
        }
        
        FBTest.compare(change.changeSource, Events.ChangeSource.FIREBUG_CHANGE, "Change source: " + change.changeSource);
        FBTest.compare(change.changeType, "DOM", "Change type: " + change.changeType);
        FBTest.compare(change.subType, number>1 ? "dom_inserted" : "dom_removed", "Sub type: " + change.subType);
        FBTest.compare(change.isElementAdded(), number!==0, "Is Addition: " + change.isElementAdded());
        FBTest.compare(change.isElementRemoved(), number===0, "Is Removal: " + change.isElementRemoved());
      },
      eventCount: 3
    },
    {
      name: "editNode_sibling",
      setup: function(win) {
        var editNode = win.document.getElementById("insertNode");
        editNode.innerHTML = "<p>test</p>";
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "center");
      },
      execute: function(win) {
        var editNode = win.document.getElementById("insertNode");
        htmlPanel.select(editNode);
        htmlPanel.toggleEditing();
        
        var textEditor = getEditor(htmlPanel, editNode);
        setEditorValue(textEditor, "<p>before</p><div id=\"insertNode\"><p>test2</p></div><p>after</p>");
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "left");
        
        setEditorValue(textEditor, "<p>before</p><div id=\"insertNode\"><p>test3</p></div><p>after</p>");
        Firebug.Editor.stopEditing();
      },
      verify: function(win, number, change) {
        if (number === 1) {
          verifyAppChange(change);
          return;
        }
        
        FBTest.compare(change.changeSource, Events.ChangeSource.FIREBUG_CHANGE, "Change source: " + change.changeSource);
        FBTest.compare(change.changeType, "DOM", "Change type: " + change.changeType);
        FBTest.compare(change.subType, number>1 ? "dom_inserted" : "dom_removed", "Sub type: " + change.subType);
        FBTest.compare(change.isElementAdded(), number!==0, "Is Addition: " + change.isElementAdded());
        FBTest.compare(change.isElementRemoved(), number===0, "Is Removal: " + change.isElementRemoved());
      },
      eventCount: 5
    },
    {
      name: "editNode_delete",
      setup: function(win) {
        var editNode = win.document.getElementById("insertNode");
        editNode.innerHTML = "<p>test</p>";
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "center");
      },
      execute: function(win) {
        var editNode = win.document.getElementById("insertNode");
        htmlPanel.select(editNode);
        htmlPanel.toggleEditing();
        
        var textEditor = getEditor(htmlPanel, editNode);
        setEditorValue(textEditor, "<p>before</p><div id=\"insertNode\"><p>test2</p></div>");
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "left");
        
        setEditorValue(textEditor, "");
        Firebug.Editor.stopEditing();
      },
      verify: function(win, number, change) {
        if (number === 1) {
          verifyAppChange(change);
          return;
        }
        
        FBTest.compare(change.changeSource, Events.ChangeSource.FIREBUG_CHANGE, "Change source: " + change.changeSource);
        FBTest.compare(change.changeType, "DOM", "Change type: " + change.changeType);
        FBTest.compare(change.subType, number>1 ? "dom_inserted" : "dom_removed", "Sub type: " + change.subType);
        FBTest.compare(change.isElementAdded(), number!==0, "Is Addition: " + change.isElementAdded());
        FBTest.compare(change.isElementRemoved(), number===0, "Is Removal: " + change.isElementRemoved());
      },
      eventCount: 3
    },
  ];
  
  var urlBase = FBTest.getHTTPURLBase();
  FBTestFirebug.openNewTab(urlBase + "module/index.htm", function(win) {
    FBTestFirebug.openFirebug();

    FBTestFireDiff.enableDiffPanel(
        function() {
          FBTestFirebug.selectPanel("html");
          htmlPanel = FBTestFirebug.getSelectedPanel();

          FBTestFireDiff.executeModuleTests(tests, win);
        });
  });
}