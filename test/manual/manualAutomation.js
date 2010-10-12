function runTest() {
  var Events = FBTest.FirebugWindow.FireDiff.events,
    Firebug = FBTest.FirebugWindow.Firebug,
    FBTrace = FBTest.FirebugWindow.FBTrace;
  var htmlPanel, cssPanel;

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
      execute: function(win) {
        var attrMod = win.document.getElementById("insertNode");
        FBTrace.sysout(attrMod, attrMod);
        htmlPanel.select(attrMod);
        htmlPanel.editNewAttribute(attrMod);
        
        var attrEditor = htmlPanel.attrEditor;
        setEditorValue(attrEditor, "align");
        Firebug.Editor.tabNextEditor();
        
        setEditorValue(attrEditor, "left");
        Firebug.Editor.stopEditing();
      },
      verify: function(win, number, change) {
        FBTest.compare(change.changeSource, Events.ChangeSource.FIREBUG_CHANGE, "Change source: " + change.changeSource);
        FBTest.compare(change.changeType, "DOM", "Change type: " + change.changeType);
        FBTest.compare(change.subType, "attr_changed", "Sub type: " + change.subType);
        FBTest.compare(change.attrName, "align", "Attribute Name: " + change.attrName);
        FBTest.compare(change.value, number ? "left" : "", "Value: " + change.value);
        FBTest.compare(change.previousValue, "", "Prev Value: " + change.previousValue);
        FBTest.compare(change.isAddition(), !number, "Is Addition: " + change.isAddition());
        FBTest.compare(change.isRemoval(), false, "Is Removal: " + change.isRemoval());
      },
      eventCount: 2
    },
    {
      name: "editAttribute",
      execute: function(win) {
        var attrMod = win.document.getElementById("insertNode");
        htmlPanel.select(attrMod);
        htmlPanel.editAttribute(attrMod, "align");
        
        var attrEditor = htmlPanel.attrEditor;
        
        setEditorValue(attrEditor, "right");
        Firebug.Editor.stopEditing();
      },
      verify: function(win, number, change) {
        FBTest.compare(change.changeSource, Events.ChangeSource.FIREBUG_CHANGE, "Change source: " + change.changeSource);
        FBTest.compare(change.changeType, "DOM", "Change type: " + change.changeType);
        FBTest.compare(change.subType, "attr_changed", "Sub type: " + change.subType);
        FBTest.compare(change.attrName, "align", "Attribute Name: " + change.attrName);
        FBTest.compare(change.value, "right", "Value: " + change.value);
        FBTest.compare(change.previousValue, "left", "Prev Value: " + change.previousValue);
        FBTest.compare(change.isAddition(), false, "Is Addition: " + change.isAddition());
        FBTest.compare(change.isRemoval(), false, "Is Removal: " + change.isRemoval());
      },
      eventCount: 1
    },
    {
      name: "deleteAttributeValue",
      execute: function(win) {
        var attrMod = win.document.getElementById("insertNode");
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
        FBTest.compare(change.isRemoval(), true, "Is Removal: " + change.isRemoval());   // This is the behavior of Firebug. Doesn't match the UI
      },
      eventCount: 1
    },
    {
      name: "deleteNode",
      execute: function(win) {
        var attrMod = win.document.getElementById("removeNode");
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
      name: "editNode_sibling",
      execute: function(win) {
        var editNode = win.document.getElementById("textModified");
        htmlPanel.select(editNode);
        htmlPanel.toggleEditing();

        var textEditor = getEditor(htmlPanel, editNode);
        setEditorValue(textEditor, "<div id=\"textModified\">New ValueMoreData</div>\n<p>edit</p>");
        Firebug.Editor.stopEditing();
      },
      verify: function(win, number, change) {
        FBTest.compare(change.changeSource, Events.ChangeSource.FIREBUG_CHANGE, "Change source: " + change.changeSource);
        FBTest.compare(change.changeType, "DOM", "Change type: " + change.changeType);
        FBTest.compare(change.subType, number ? "dom_inserted" : "dom_removed", "Sub type: " + change.subType);
        FBTest.compare(change.isElementAdded(), !!number, "Is Addition: " + change.isElementAdded());
        FBTest.compare(change.isElementRemoved(), !number, "Is Removal: " + change.isElementRemoved());
      },
      eventCount: 4
    },

    {
      name: "newProperty",
      setup: function(win) {
        // This test must be the first CSS test
        FBTestFirebug.selectPanel("stylesheet");
        cssPanel = FBTestFirebug.getSelectedPanel();
      },
      execute: function(win) {
        var panelNode = cssPanel.panelNode;
        var rule = panelNode.getElementsByClassName("cssRule")[0];
        
        cssPanel.insertPropertyRow(rule);
        
        var editor = cssPanel.editor;
        setEditorValue(editor, "float");
        Firebug.Editor.tabNextEditor();
        
        setEditorValue(editor, "left");
        Firebug.Editor.stopEditing();
        
        FBTrace.sysout("cssPanel", cssPanel.panelNode);
      },
      verify: function(win, number, change) {
        FBTest.compare(change.changeSource, Events.ChangeSource.FIREBUG_CHANGE, "Change source: " + change.changeSource);
        FBTest.compare(change.changeType, "CSS", "Change type: " + change.changeType);
        FBTest.compare(change.subType, "setProp", "Sub type: " + change.subType);
        FBTest.compare(change.propName, "float", "Prop Name: " + change.propName);
        FBTest.compare(change.propValue, "left", "Prop Value: " + change.propValue);
        FBTest.compare(change.propPriority, "", "Prop Priority: " + change.propPriority);
        FBTest.compare(change.prevValue, "", "Prev Value: " + change.prevValue);
        FBTest.compare(change.prevPriority, "", "Prev Priority: " + change.prevPriority);
      },
      eventCount: 1
    },
    {
      name: "editProperty",
      execute: function(win) {
        var panelNode = cssPanel.panelNode;
        var rules = panelNode.getElementsByClassName("cssPropValue");
        var rule = rules[rules.length-1];
        
        Firebug.Editor.startEditing(rule, rule.textContent);
        
        var editor = cssPanel.editor;
        setEditorValue(editor, "green !important");
        Firebug.Editor.stopEditing();
      },
      verify: function(win, number, change) {
        FBTest.compare(change.changeSource, Events.ChangeSource.FIREBUG_CHANGE, "Change source: " + change.changeSource);
        FBTest.compare(change.changeType, "CSS", "Change type: " + change.changeType);
        FBTest.compare(change.subType, "setProp", "Sub type: " + change.subType);
        FBTest.compare(change.propName, "background-color", "Prop Name: " + change.propName);
        FBTest.compare(change.propValue, "green", "Prop Value: " + change.propValue);
        FBTest.compare(change.propPriority, "important", "Prop Priority: " + change.propPriority);
        FBTest.compare(change.prevValue, "yellow", "Prev Value: " + change.prevValue);
        FBTest.compare(change.prevPriority, "", "Prev Priority: " + change.prevPriority);
      },
      eventCount: 1
    },
    {
      name: "disableProperty",
      execute: function(win) {
        var panelNode = cssPanel.panelNode;
        var rule = panelNode.getElementsByClassName("cssProp")[0];
        
        cssPanel.disablePropertyRow(rule);
        cssPanel.disablePropertyRow(rule);
      },
      verify: function(win, number, change) {
        FBTest.compare(change.changeSource, Events.ChangeSource.FIREBUG_CHANGE, "Change source: " + change.changeSource);
        FBTest.compare(change.changeType, "CSS", "Change type: " + change.changeType);
        FBTest.compare(change.subType, number ? "setProp" : "removeProp", "Sub type: " + change.subType);
        FBTest.compare(change.propName, "background-color", "Prop Name: " + change.propName);
        FBTest.compare(change.propValue, number ? "red" : "", "Prop Value: " + change.propValue);
        FBTest.compare(change.propPriority, "", "Prop Priority: " + change.propPriority);
        FBTest.compare(change.prevValue, number ? "" : "red", "Prev Value: " + change.prevValue);
        FBTest.compare(change.prevPriority, "", "Prev Priority: " + change.prevPriority);
      },
      eventCount: 2
    },
    {
      name: "deleteProperty_menu",
      execute: function(win) {
        var panelNode = cssPanel.panelNode;
        var rule = panelNode.getElementsByClassName("cssProp")[0];
        
        cssPanel.deletePropertyRow(rule);
      },
      verify: function(win, number, change) {
        FBTest.compare(change.changeSource, Events.ChangeSource.FIREBUG_CHANGE, "Change source: " + change.changeSource);
        FBTest.compare(change.changeType, "CSS", "Change type: " + change.changeType);
        FBTest.compare(change.subType, "removeProp", "Sub type: " + change.subType);
        FBTest.compare(change.propName, "background-color", "Prop Name: " + change.propName);
        FBTest.compare(change.propValue, "", "Prop Value: " + change.propValue);
        FBTest.compare(change.propPriority, "", "Prop Priority: " + change.propPriority);
        FBTest.compare(change.prevValue, "red", "Prev Value: " + change.prevValue);
        FBTest.compare(change.prevPriority, "", "Prev Priority: " + change.prevPriority);
      },
      eventCount: 1
    },

    {
      name: "newRule",
      execute: function(win) {
        var panelNode = cssPanel.panelNode;
        var sheet = panelNode.getElementsByClassName("cssSheet")[0];
        
        cssPanel.insertRule(sheet);
        
        var editor = cssPanel.ruleEditor;
        setEditorValue(editor, "*");
        Firebug.Editor.stopEditing();
      },
      verify: function(win, number, change) {
        FBTest.compare(change.changeSource, Events.ChangeSource.FIREBUG_CHANGE, "Change source: " + change.changeSource);
        FBTest.compare(change.changeType, "CSS", "Change type: " + change.changeType);
        FBTest.compare(change.subType, "insertRule", "Sub type: " + change.subType);
        FBTest.compare(change.clone.cssText, "* { }", "CSS Text: " + change.clone.cssText);
        FBTest.compare(change.xpath, "/style()[1]/rule()[10]", "XPath: " + change.xpath);
      },
      eventCount: 1
    },
    {
      name: "editRule",
      execute: function(win) {
        var panelNode = cssPanel.panelNode;
        var rule = panelNode.getElementsByClassName("cssSelector")[0];
        
        Firebug.Editor.startEditing(rule, rule.textContent);
        
        var editor = cssPanel.ruleEditor;
        setEditorValue(editor, "#yellow");
        Firebug.Editor.stopEditing();
      },
      verify: function(win, number, change) {
        var rules = win.document.styleSheets[0].cssRules;
        FBTrace.sysout("Sheet: " + rules.length, rules);
        for (var i = 0; i < rules.length; i++) {
          FBTrace.sysout("Sheet: rule " + i, rules[1]);
        }
        FBTest.compare(change.changeSource, Events.ChangeSource.FIREBUG_CHANGE, "Change source: " + change.changeSource);
        FBTest.compare(change.changeType, "CSS", "Change type: " + change.changeType);
        FBTest.compare(change.subType, number ? "insertRule" : "removeRule", "Sub type: " + change.subType);
        FBTest.compare(change.xpath, "/style()[1]/rule()[1]", "XPath: " + change.xpath);
      },
      eventCount: 2
    },
    {
      name: "deleteRule",
      execute: function(win) {
        var panelNode = cssPanel.panelNode;
        var rule = panelNode.getElementsByClassName("cssSelector")[1];
        
        Firebug.Editor.startEditing(rule, rule.textContent);
        
        var editor = cssPanel.ruleEditor;
        setEditorValue(editor, "");
        Firebug.Editor.stopEditing();
      },
      verify: function(win, number, change) {
        FBTest.compare(change.changeSource, Events.ChangeSource.FIREBUG_CHANGE, "Change source: " + change.changeSource);
        FBTest.compare(change.changeType, "CSS", "Change type: " + change.changeType);
        FBTest.compare(change.subType, "removeRule", "Sub type: " + change.subType);
        FBTest.compare(change.xpath, "/style()[1]/rule()[2]", "XPath: " + change.xpath);
      },
      eventCount: 1
    }
  ];

  FBTestFirebug.enableAllPanels();
  
  var urlBase = FBTest.getHTTPURLBase();
  FBTestFirebug.openNewTab(urlBase + "manual/index.htm", function(win) {
    FBTestFirebug.openFirebug();
    
    setTimeout(function() {
      FBTestFirebug.selectPanel("html");
      htmlPanel = FBTestFirebug.getSelectedPanel();
      
      FBTestFireDiff.executeModuleTests(tests, win,
          function() {
            FBTestFirebug.selectPanel("firediff");
            
            var manualCases = [
              {
                name: "Verify events list",
                instructions:
                  "Verify the following entries in the event list:\n"
                  + "1. Application changes listed in the page are displayed.\n"
                  + "2. Firebug changes listed in the page are displayed."
              },
              {
                name: "Verify DOM snapshot 1",
                instructions: "Test defined in Snapshot Changes, test 1"
              },
              {
                name: "Verify DOM snapshot 2",
                instructions: "Test defined in Snapshot Changes, test 2"
              },
              {
                name: "Verify CSS snapshot 1",
                instructions: "Test defined in Snapshot Changes, test 3"
              },
              {
                name: "Verify CSS snapshot 2",
                instructions: "Test defined in Snapshot Changes, test 4"
              }
            ];
            var index = 0;
            (function verifyCase() {
              if (index < manualCases.length) {
                FBTest.manualVerify(
                    manualCases[index].name,
                    manualCases[index].instructions,
                    function (passes) {
                      FBTest.ok(passes, manualCases[index].name);
                      index++;
                      verifyCase();
                    });
              } else {
                FBTestFirebug.testDone();
              }
            })();
          });
    }, 2000);
  });
}
