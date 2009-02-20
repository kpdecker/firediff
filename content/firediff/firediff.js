FBL.ns(function() { with (FBL) {
	
	
	
var ListeningModule = extend(Firebug.Module, new Firebug.Listener());
Firebug.DiffModule = extend(ListeningModule,
{
	showContext: function(browser, context)
	{
		// after a showContext the user may edit, so we need to prepare for it.
		if (context)
			var panel = context.getPanel("diff");  //initialize panel for this context
	}
});
	
var DiffPanelCommon = extend(Firebug.Panel, 
{
	initialize: function()
	{
		this.panelBoxes = {}, // snapshots of changed panels indexed by change object
		this.selectedPanelBox = null,  // currently viewed panelBox for this panel
        Firebug.Panel.initialize.apply(this, arguments);
	},
	
	addPanelBox: function(key, node)
	{
		if (node)
		{
			var panelBox = node;  // createPanelBox(node)
			this.panelBoxes[key] = panelBox;
			this.panelNode.appendChild(panelBox);
			this.showPanelBox(panelBox)
			FBTrace.sysout("Diff.addPanelBox "+this.name+" "+key, panelBox);
		}
		else
			FBTrace.sysout("DiffPanelCommon.addPanelBox null node");
	},
	
    showPanelBox: function(panelBox)
    {
		if (panelBox)
			FBTrace.sysout("diff.showPanelBox "+this.name+" "+panelBox.getAttribute("class"), panelBox);
		else
			FBTrace.sysout("diff.showPanelBox no panelBox");
			
        if (this.selectedPanelBox)
            this.selectedPanelBox.setAttribute("active", false);

        this.selectedPanelBox = panelBox;

        if (panelBox)
        {
            this.updatePanelBox(panelBox);
            this.selectedPanelBox.setAttribute("active", true);
        }
    },
    
    updatePanelBox: function(panelBox)
    {
    	// prep box for viewing
    },
    
    getPanelBox: function(key)
    {
    	if (this.panelBoxes.hasOwnProperty(key))
    		return this.panelBoxes[key];
    	else
    		FBTrace.sysout("diff.getPanelBox no panelBox for "+key);
    },
    
    reKeyPanelBox: function(oldKey, newKey)
    {
    	var entry = this.panelBoxes[oldKey];
    	if (entry)
    	{
    		this.panelBoxes[newKey] = entry;
    		delete this.panelBoxes[oldKey];
    	}
    },
    
    showChange: function(change)
    {
    	var panelBox = this.getPanelBox(change.getKey());
    	this.showPanelBox(panelBox);
    },
});
	
function DiffPanel() {}
Firebug.DiffPanel = DiffPanel;
DiffPanel.prototype = extend(DiffPanelCommon,
{
    name: "diff",
    title: "Diff",

    initialize: function() {
    	//this.onMouseDown = bind(this.onMouseDown, this);
    	//this.onContextMenu = bind(this.onContextMenu, this);
    	//this.onMouseOver = bind(this.onMouseOver, this);
    	//this.onMouseOut = bind(this.onMouseOut, this);
    	//this.onScroll = bind(this.onScroll, this);

    	this.panelSplitter = $("fbPanelSplitter");
    	this.sidePanelDeck = $("fbSidePanelDeck");
	
    	var enabled = true;
    	this.panelSplitter.collapsed = !enabled;
        this.sidePanelDeck.collapsed = !enabled;
	
        this.changes = [];
        
        DiffPanelCommon.initialize.apply(this, arguments);
        Firebug.Editor.addListener(this);
    },
    
    // *******************************************************************************************
    
    onBeginEditing: function(panel, editor, target, value)
    {
    	if (panel.context != this.context)
    		return;
    	
    	FBTrace.sysout("Diff onBeginEditing", [panel, editor, target, value]);
    	
    	var previousPanel = this.context.getPanel("previous", true);
    	if (previousPanel)
    	{
    		var xpath = getElementXPath(target);
    		this.copyPanelNode(xpath, previousPanel, panel);
    	}
    }, 
    
    onSaveEdit: function(panel, editor, target, value, previousValue)
    {
    	if (panel.context != this.context)
    		return;
    	
    	FBTrace.sysout("Diff onSaveEdit", [panel, editor, target, value, previousValue]);
    	
    	var xpath = getElementXPath(target);
    	var change = new Change(xpath, panel, editor, target, value, previousValue);
    	this.changes.push(change);
    	
    	this.location = change;
		
    	this.copyPanelNode(change.getKey(), this, panel);
    	var previousPanel = this.context.getPanel("previous", true);
    	if (previousPanel)
    		previousPanel.reKeyPanelBox(xpath, change.getKey());
    },
    
    copyPanelNode: function(key, toPanel, fromPanel)
    {
    	if (toPanel.panelNode.ownerDocument == fromPanel.panelNode.ownerDocument)
			toPanel.addPanelBox(key, fromPanel.panelNode.cloneNode(true));
		else
			toPanel.addPanelBox(key, toPanel.panelNode.ownerDocument.importNode(fromPanel.panelNode, true));
    },
    // *******************************************************************************************

    // An array of objects that can be passed to getObjectLocation.
    // The list of things a panel can show, eg sourceFiles.
    // Only shown if panel.location defined and supportsObject true
    getLocationList: function()
    {
        return this.changes;
    },

    getDefaultLocation: function(context)
    {
        return this.changes[0];
    },

    getObjectLocation: function(object)
    {
        return object.panel.name;
    },

    // Text for the location list menu eg script panel source file list
    // return.path: group/category label, return.name: item label
    getObjectDescription: function(object)
    {
        return {path: object.panel.name, name: object.summary};
    },
    
    updateLocation: function(change)  // if the module can return null from getDefaultLocation, then it must handle it here.
    {
    	if (!change)
    		return;
    	
    	this.showChange(change);
    	var previousPanel = this.context.getPanel("previous", true);
    	if (previousPanel)
    		previousPanel.showChange(change);
    	
    	FBTrace.sysout("diff.updateLocation "+this.name+" key:"+change.getKey(), change);
    },
    
    supportsObject: function(object)
    { 
    	if ( (object instanceof Change) || (object instanceof Firebug.StringCompare) )
    	    return 10;
    	return 0;
    },
    
    updateSelection: function(object)
    {
      if (object instanceof Firebug.StringCompare)
          this.showStringCompare(object);
    },
    
    showStringCompare: function(compare)
    {
        this.panelNode.innerHTML = diffString(compare.left, compare.right);
    },
});

function PreviousPanel() {}

PreviousPanel.prototype = extend(DiffPanelCommon,
{

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // extends Panel

    name: "previous",
    parentPanel: "diff",
    order: 2,

    initialize: function()
    {
		DiffPanelCommon.initialize.apply(this, arguments);
    },

    destroy: function(state)
    {
        Firebug.Panel.destroy.apply(this, arguments);
    },

    show: function(state)
    {
        this.refresh();
    },

    refresh: function()
    {
    },
    
    getOptionsMenuItems: function()
    {
        var items = [];

        return items;
    },

});

Firebug.StringCompare = function(left, right)
{
    this.left = left;
    this.right = right;
}

function Change(xpath, panel, editor, target, value, previousValue)
{
	this.xpath = xpath;
	this.panel = panel;
	this.editor = editor;
	this.target = target;
	this.value = value;
	this.previousValue = previousValue;
	this.summary = FBL.cropString(previousValue, 39) +"->" + FBL.cropString(value, 39); 
}
Change.prototype.getKey = function()
{
	return this.summary;
}


// see also 
// http://snowtide.com/jsdifflib

Firebug.registerModule(Firebug.DiffModule);
Firebug.registerPanel(DiffPanel);
Firebug.registerPanel(PreviousPanel);

}});