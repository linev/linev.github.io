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
	var rows = [];

	var CController = Controller.extend("sap.m.sample.SplitApp.C", {

		onInit: function(){
			this.getSplitAppObj().setHomeIcon({
				'phone':'phone-icon.png',
				'tablet':'tablet-icon.png',
				'icon':'desktop.ico'
			});

			var oModel = new JSONModel(jQuery.sap.getModulePath("sap.m.sample.SplitApp", "/Tree.json"));
			var aModel = new sap.ui.model.json.JSONModel(arr);
			this.getView().setModel(oModel, "oModel");
			this.getView().setModel(aModel, "aModel");
			var oTable = this.byId("TreeTableBasic");
			//oTable.setSelectionBehavior(sap.ui.table.SelectionBehavior.RowOnly);

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

		onPressMaster2: function() {
			this.getSplitAppObj().to(this.createId("master2"));
		},

		onPressMaster3: function() {
			this.getSplitAppObj().to(this.createId("master3"));
		},

		onPressMasterBack: function() {
			console.log("This " + this)
			this.getSplitAppObj().backMaster();
		},

		hideMaster: function() {
				this.getSplitAppObj().hideMaster();
			},

		onToggle: function(oEvent) {

			var oModel = this.getView().getModel("oModel").getData();
			var lItem = oEvent.getParameters().rowContext.sPath;
			var rowIndex = oEvent.getParameters().rowIndex;

			var nodes = this.getView().getModel("oModel").getProperty(lItem);
			var sNode = this.getView().getModel("oModel").getProperty(lItem).title;
			var app = this.getView().byId("SplitAppDemo");

			//console.log("App" + app);

			if(!(paths.includes(lItem))){
				arr.push(sNode);
				rows.push(sNode, rowIndex);
			}
			else{
				var index = arr.indexOf(sNode);
				paths.length = index+1;
				arr.length = index+1;
			}

			//console.log(rowIndex)
			paths.push(lItem);
			//console.log(paths)
			this.getView().getModel("aModel").setData(arr);
			//console.log("name " + arr);
			
				var page = new sap.m.Page({
					title: sNode,
					showNavButton: true,
					navButtonPress: function(){
						app.backDetail();
					},
					headerContent: [
						new sap.m.Button({
							icon : "sap-icon://menu",
							press: function() {
								app.showMaster();
							}
						})
					]

				});
				

			app.addDetailPage(page);
			app.toDetail(page);
			

			//console.log("Page " + page);
   		},

   		tryOne: function(oEvent) {

   			var oModel = this.getView().getModel("oModel").getData();
   			var oValue = oEvent.getSource().getText();

   			for(var i = 0; i < arr.length; i++){
   				if(arr[i] == oValue){
   					arr.splice(i);
   					this.getView().getModel("aModel").setData(arr);
   				}
   			}

   			for(var i = 0; i < rows.length; i++){
   				if(rows[i] == oValue){
   					var rowIndex = rows[i+1];
   				}
   			}

   			var oTreeTable = this.byId("TreeTableBasic");
			oTreeTable.collapse(rowIndex);
   		}


	});


	return CController;

});
