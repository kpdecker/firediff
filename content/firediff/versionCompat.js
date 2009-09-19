/* See license.txt for terms of usage */
var FireDiff  = FireDiff || {};

FBL.ns(function() { with (FBL) {

const HTMLLib = Firebug.HTMLLib || {};

//From Firebug.HTMLLib, Firebug version 1.5
function isWhitespaceText(node) {
    if (node instanceof HTMLAppletElement)
        return false;
    return node.nodeType == 3 && isWhitespace(node.nodeValue);
}

//From Firebug.HTMLLib, Firebug version 1.5
function isSourceElement(element) {
  var tag = element.localName.toLowerCase();
  return tag == "script" || tag == "link" || tag == "style"
      || (tag == "link" && element.getAttribute("rel") == "stylesheet");
}

/**
 * Defines lib routes that are supported in one version of Firebug but not
 * another. Methods defined in here should be pruned as the minimum Firebug
 * version is updated.
 */
FireDiff.VersionCompat = {
    /**
     * @see Firebug.HTMLLib.isWhitespaceText
     * @version Firebug 1.5
     */
    isWhitespaceText: HTMLLib.isWhitespaceText || isWhitespaceText,
    
    /**
     * @see Firebug.HTMLLib.isSourceElement
     * @version Firebug 1.5
     */
    isSourceElement: HTMLLib.isSourceElement || isSourceElement
};

}});