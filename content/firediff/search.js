/* See license.txt for terms of usage */
var FireDiff  = FireDiff || {};

/**
 * Classes used to search Firediff pages.
 */
FireDiff.search = FBL.ns(function() { with (FBL) {

const Events = FireDiff.events;

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


/**
 * @class Iterates over the contents of an array
 */
this.ArrayIterator = function(array) {
  var index = -1;

  /**
   * Retrieves the next element in the iteration.
   */
  this.next = function() {
    if (++index >= array.length)    $break();
    return array[index];
  };
};

/**
 * @class Iterates over the children of a given node.
 */
this.DOMIterator = function(node) {
  var curNode = node.firstChild;

  /**
   * Retrieves the next element in the iteration.
   */
  this.next = function() {
    var ret = curNode;
    if (!curNode)    $break();
    curNode = curNode.nextSibling;
    return ret;
  }
}

/**
 * @class Iterates over a child iterator and a set of removed events, merging
 *        the remove events at the proper location in the iteration.
 */
this.RemovedIterator = function(content, removed, includeFilter) {
  removed = removed || [];

  var nodeIndex = 1, removedIndex = 0,
      lastId;

  /**
   * Retrieves the next element in the iteration.
   */
  this.next = function() {
    // Check for removed at the current position
    while (true) {
      while (removedIndex < removed.length) {
        var curChange = removed[removedIndex];
        lastId = lastId || FireDiff.Path.getIdentifier(curChange.xpath);
        if (lastId.index <= nodeIndex || nodeIndex < 0) {
          removedIndex++;   lastId = undefined;
          if (!includeFilter || includeFilter(curChange)) {
            return curChange;
          }
        } else {
          break;
        }
      }

      // Read the content list
      nodeIndex++;
      if (content) {
        try {
          var ret = content.next();
          if (ret && (!includeFilter || includeFilter(ret))) {
            if (ret.nodeType == Node.TEXT_NODE && ret[Events.AnnotateAttrs.CHANGES]) {
              return ret[Events.AnnotateAttrs.CHANGES];
            } else {
              return ret;
            }
          }
        } catch (err) {
          // Assume this is StopIteration
          content = undefined;
        }
      } else if (removedIndex >= removed.length) {
        // Content and removed exhausted
        $break();
      }
    }
  };
};

}});