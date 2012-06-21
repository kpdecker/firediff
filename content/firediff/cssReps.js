/* See license.txt for terms of usage */

FBL.ns(function() { with (FBL) {

var CSSRuleCloneRep = domplate(Firebug.Rep, {

    supportsObject: function(object, type) {
        return object instanceof FireDiff.CSSModel.CSSStyleRuleClone
            || object instanceof FireDiff.CSSModel.CSSMediaRuleClone
            || object instanceof FireDiff.CSSModel.CSSFontFaceRuleClone
            || object instanceof FireDiff.CSSModel.CSSImportRuleClone
            || object instanceof FireDiff.CSSModel.CSSCharsetRuleClone
            || object instanceof FireDiff.CSSModel.CSSRuleClone
            || object instanceof CSSStyleRule
            || object instanceof CSSMediaRule
            || object instanceof CSSFontFaceRule
            || object instanceof CSSImportRule
            || object instanceof CSSCharsetRule
            || object instanceof CSSUnknownRule;
    },

    copyRuleDeclaration: function(cssSelector) {
      FireDiff.needsFireformat(function() {
        copyToClipboard(Fireformat.Formatters.getCSSFormatter().format(cssSelector));
      });
    },

    getContextMenuItems: function(object, target, context) {
        return [
             {label: "Copy Rule Declaration", command: bindFixed(this.copyRuleDeclaration, this, object) },
        ];
    }
});

Firebug.registerRep(CSSRuleCloneRep);
}});