sap.ui.define(function() {
	"use strict";

	var Formatter = {

		// Returns a list item type depending on whether we're on
		// a branch or a leaf node of the hierarchy. We determine
		// that we're on a leaf if there's a ProductId
		listItemType : function (sProductId) {
			return sProductId ? "Inactive" : "Navigation";
		}
	};

	return Formatter;

}, /* bExport= */ true);
