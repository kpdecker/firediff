FBL.ns(function() { with (FBL) {

var i18n = document.getElementById("strings_firediff");
var Path = FireDiff.Path;

function DiffAllPanel() {}
FireDiff.DiffAllPanel = DiffAllPanel;
DiffAllPanel.prototype = extend(Firebug.Panel, {
    name: "diff_all",
    title: i18n.getString("title.allChanges"),
    editable: false,

    initialize: function() {
        Firebug.Panel.initialize.apply(this, arguments);
    },
    
    show: function(state) {
      try {
        var changes = Firebug.DiffModule.getChanges();
        changes = FireDiff.events.merge(changes);
        
        var doc = this.context.window.document;
        var displayTree = doc.documentElement.cloneNode(true);
        for (var i = 0; i < changes.length; i++) {
          if (changes[i].changeType == "dom") {
            var elements = FBL.getElementsByXPath(displayTree, changes[i].xpath);
            if (FBTrace.DBG_FIREDIFF)   FBTrace.sysout("Change: " + changes[i], elements);
            
            changes[i].annotateTree(displayTree, Path.getElementPath(doc.documentElement));
          }
        }
        
        this.panelNode.innerHTML = "";
        // xxxHonza: displayTree is already the <html> element.
        var html = displayTree; //.getElementsByTagName("html")[0];
        FireDiff.domplate.allChanges.CompleteElement.tag.replace({change: html}, this.panelNode);
      } catch (err) {
        FBTrace.sysout("allChanges.show: err: " + err, err);
      }
    }
});

Firebug.registerPanel(DiffAllPanel);

}});