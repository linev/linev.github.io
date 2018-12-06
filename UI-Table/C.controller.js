sap.ui.define([
		'jquery.sap.global',
		'sap/m/MessageToast',
		'sap/ui/core/Fragment',
		'sap/ui/core/mvc/Controller',
		'sap/ui/model/Filter',
		'sap/ui/model/json/JSONModel'
	], function(jQuery, MessageToast, Fragment, Controller, Filter, JSONModel) {
	"use strict";
	var arr = [];
	var CController = Controller.extend("sap.m.sample.SplitApp.C", {

		sCollection: "/ProductHierarchy",
		aCrumbs: ["Suppliers", "Categories", "Products", "Level1", "Level2", "Level3", "Level4"],
		mInitialOrderState: {
			products: {},
			count: 0,
			hasCounts: false
		},

		onInit: function(){
			this.getSplitAppObj().setHomeIcon({
				'phone':'phone-icon.png',
				'tablet':'tablet-icon.png',
				'icon':'desktop.ico'
			});

			var sPath = jQuery.sap.getModulePath("sap.m.sample.SplitApp", "/productHierarchy.json");
			var oModel = new JSONModel(sPath);
			this.getView().setModel(oModel);
			//this.getView().setModel(new JSONModel(this.mInitialOrderState), "Order");

			if (!this.oTemplate) {
				this.oTemplate = sap.ui.xmlfragment("sap.m.sample.SplitApp.Row");
			}
			this._oTable = this.byId("idProductsTable");

			sPath = this._getInitialPath();
			this._setAggregation(sPath);
		},

		_getInitialPath: function () {
			return [this.sCollection, this.aCrumbs[0]].join("/");
		},

		onOrientationChange: function(oEvent) {
			var bLandscapeOrientation = oEvent.getParameter("landscape"),
				sMsg = "Orientation now is: " + (bLandscapeOrientation ? "Landscape" : "Portrait");
			MessageToast.show(sMsg, {duration: 5000});
		},

		onPressNavToDetail : function(oEvent) {
			this.getSplitAppObj().to(this.createId("detailDetail"));
		},

		onPressDetailBack : function() {
			this.getSplitAppObj().backDetail();
		},

		onPressModeBtn : function(oEvent) {
			var sSplitAppMode = oEvent.getSource().getSelectedButton().getCustomData()[0].getValue();

			this.getSplitAppObj().setMode(sSplitAppMode);
			MessageToast.show("Split Container mode is changed to: " + sSplitAppMode, {duration: 5000});
		},

		getSplitAppObj : function() {
			var result = this.byId("SplitAppDemo");
			if (!result) {
				jQuery.sap.log.info("SplitApp object can't be found");
			}
			return result;
		},

		handleSelectionChange: function (oEvent) {
			// Determine where we are right now
			var sPath = oEvent.getParameter("listItem").getBindingContext().getPath();
			
			var bread = this.byId("bread1");
			var table = this.byId("idProductsTable");
			var sPath1 = table.getModel();
			var sNode = sPath1.getProperty(sPath).Name;
			console.log(sNode)

			arr.push(sNode);
			
			bread.removeAllLinks();

			for(var i=0; i<arr.length; i++){
				if(i == arr.length -1){
					bread.setCurrentLocationText(arr[i]);
				}
				else{
					var link = new sap.m.Link({
						text: arr[i]
					});
					bread.addLink(link);
				}
				
			}


			var aPath = sPath.split("/");
			var sCurrentCrumb = aPath[aPath.length - 2];

			// If we're on a leaf, remember the selections;
			// otherwise navigate
			if (sCurrentCrumb === this.aCrumbs[this.aCrumbs.length - 1]) {
				var oSelectionInfo = {};
				var bSelected = oEvent.getParameter("selected");
				oEvent.getParameter("listItems").forEach(function (oItem) {
					oSelectionInfo[oItem.getBindingContext().getPath()] = bSelected;
				});
			} else {
				var sNewPath = [sPath, this._nextCrumb(sCurrentCrumb)].join("/");
				this._setAggregation(sNewPath);
			}
		},

		_nextCrumb: function (sCrumb) {
			for (var i = 0, ii = this.aCrumbs.length; i < ii; i++) {
				if (this.aCrumbs[i] === sCrumb) {
					return this.aCrumbs[i + 1];
				}
			}
		},

		_setAggregation: function (sPath) {
			// If we're at the leaf end, turn off navigation
			var sPathEnd = sPath.split("/").reverse()[0];
			if (sPathEnd === this.aCrumbs[this.aCrumbs.length - 1]) {
			} else {
				this._oTable.setMode("SingleSelectMaster");
			}

			// Set the new aggregation
			this._oTable.bindAggregation("items", sPath, this.oTemplate);

			// this._maintainCrumbLinks(sPath);
			// var bread = this.byId("bread");
			// bread.setCurrentLocationText(sPathEnd);
			// console.log("sPathEnd" + sPathEnd);
		},

	});


	return CController;

});
