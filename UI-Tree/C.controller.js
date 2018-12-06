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
	var paths = [];
	var CController = Controller.extend("sap.m.sample.SplitApp.C", {

		onInit: function(){
			this.getSplitAppObj().setHomeIcon({
				'phone':'phone-icon.png',
				'tablet':'tablet-icon.png',
				'icon':'desktop.ico'
			});

			var oModel = new JSONModel(jQuery.sap.getModulePath("sap.m.sample.SplitApp", "/Tree.json"));
			this.getView().setModel(oModel);
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

		onToggle: function(oEvent) {

			var lItem = oEvent.getParameters().itemContext.sPath;
			var nodes = this.getView().getModel().getProperty(lItem);
			//console.log(nodes);
			var sNode = this.getView().getModel().getProperty(lItem).title;
			var oBreadCrumbs = this.byId("bread");

			if(!(paths.includes(lItem))){
				arr.push(sNode);
			}
			else{
				var index = arr.indexOf(sNode);
				paths.length = index+1;
				arr.length = index+1;
			}
			
			paths.push(lItem);
			
			var test = oBreadCrumbs.getCurrentLocationText();
			oBreadCrumbs.removeAllLinks();
			for(var i=0; i<arr.length; i++){
				if(i == arr.length -1){
					oBreadCrumbs.setCurrentLocationText(arr[i]);
				}
				else{
					var link = new sap.m.Link({
						text: arr[i],
						press: this.generateLinks, sNode
					});
					oBreadCrumbs.addLink(link);
				}
				
			}

   		},

   		generateLinks : function(sNode)
   		{	
   			console.log(sNode);
   		}


	});


	return CController;

});
