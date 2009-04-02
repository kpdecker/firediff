FBL.ns(function() { with (FBL) {
FireDiff.Path = {};

FireDiff.Path.updateForInsert = function(pathUpdate, pathInsert) {
  return this.updateForMutate(pathUpdate, pathInsert, 1, false);
};
FireDiff.Path.updateForRemove = function(pathUpdate, pathRemoved) {
  return this.updateForMutate(pathUpdate, pathRemoved, -1, true);
};

FireDiff.Path.updateForMutate = function(pathUpdate, pathChanged, offset, destroyAncestor) {
  var components = this.getRelativeComponents(pathUpdate, pathChanged);
  var changeParent = this.getParentPath(pathChanged);
  
  if (destroyAncestor && components.common == pathChanged) {
    // Path to update is the same or child of the one being removed
    return undefined;
  } else if (components.common == pathChanged) {
    // Parent or identity case
    return components.common.replace(
            /([^\/]+?)\[(\d+)\]$/,
            function(total, tag, index) {
              return tag + "[" + (parseInt(index)+offset) + "]";
            })
        + (components.left ? "/" : "")
        + components.left;
  } else if (components.left && components.common == changeParent) {
    // The removed path was the child of the common path element.
    // If the modified element was of the same type as our ancestor
    // at this level, then we will need to update our path
    var pathExtract = /^([^\/]+?)\[(\d+)\]/;
    var ancestor = pathExtract.exec(components.left);
    var changed = pathExtract.exec(components.right);

    if (ancestor[1] == changed[1]
        && parseInt(ancestor[2]) > parseInt(changed[2])) {
      return components.common
          + (components.common != "/" ? "/" : "")
          + components.left.replace(
              pathExtract,
              function(total, tag, index) {
                return tag + "[" + (parseInt(index)+offset) + "]";
              })
    }
  }
  
  // No effect on the path
  return pathUpdate;
};

FireDiff.Path.getIdentifier = function(path) {
  var match = path.match(/^.*\/(.+?)(?:\[(\d+)\])?$/);
  if (match) {
    return { tag: match[1], index: parseInt(match[2]) };
  }
};
FireDiff.Path.getParentPath = function(path) {
  return (path.match(/^(.+)\/.*?$/) || ["", "/"])[1];
};

FireDiff.Path.isChildOrSelf = function(parent, child) {
  return parent == child || this.isChild(parent, child);
};
FireDiff.Path.isChild = function(parent, child) {
  return child.indexOf(parent + "/") === 0;
};

FireDiff.Path.getRelativeComponents = function(path1, path2) {
  path1 = path1.split("/");
  path2 = path2.split("/");
  
  var common = [];
  for (var i = 0; i < path1.length && i < path2.length && path1[i] == path2[i]; i++) {
    common.push(path1[i]);
  }
  
  path1.splice(0, common.length);
  path2.splice(0, common.length);
  
  return {
    common: common.join("/") || (common.length == 1 ? "/" : ""),
    left: path1.join("/"),
    right: path2.join("/")
  };
};

FireDiff.Path.getElementPath = function(element, useTagNames) {
  var nameLookup = [];
  nameLookup[Node.COMMENT_NODE] = "comment()";
  nameLookup[Node.TEXT_NODE] = "text()";
  nameLookup[Node.PROCESSING_INSTRUCTION_NODE] = "processing-instruction()";

  var paths = [];
  for (; element && element.nodeType != Node.DOCUMENT_NODE; element = element.parentNode) {
    var tagName = element.localName || nameLookup[element.nodeType];
    var index = 0;
    for (var sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
      var siblingTagName = sibling.localName || nameLookup[sibling.nodeType];
      if (!useTagNames || tagName == siblingTagName) {
        ++index;
      }
    }

    var pathIndex = "[" + (index+1) + "]";
    paths.splice(0, 0, (useTagNames ? tagName.toLowerCase() : "node()") + pathIndex);
  }

  return paths.length ? "/" + paths.join("/") : null;
};

}});