/* See license.txt for terms of usage */
var FireDiff  = FireDiff || {};

/**
 * Classes used to search Firediff pages.
 */
FireDiff.search = FBL.ns(function() { with (FBL) {

/**
 * @class Search for use in pages where all content is available and visible at all times.
 */
this.PageSearch = function() {
  var currentSearch;

  /**
   * Execute the search
   * 
   * @param {String} text Search text
   * @param {boolean} reverse true to perform a reverse search
   * @param {Element} panel Panel to search
   */
  this.search = function(text, reverse, panel) {
    var panelNode = panel.panelNode;
    if (!text) {
      currentSearch = undefined;
      return false;
    }

    var row;
    if (currentSearch && text == currentSearch.text) {
      row = currentSearch.findNext(true, false, reverse, Firebug.searchCaseSensitive);
    } else {
      function findRow(node) { return node.nodeType == 1 ? node : node.parentNode; }
      currentSearch = new TextSearch(panelNode, findRow);
      row = currentSearch.find(text, reverse, Firebug.searchCaseSensitive);
    }

    // TODO : What a11y events should this produce?
    if (row) {
      panel.document.defaultView.getSelection().selectAllChildren(row);
      scrollIntoCenterView(row, panelNode);
      return true;
    } else {
      return false;
    }
  };
};

}});