sap.ui.define([
   'sap/ui/jsroot/GuiPanelController',
   'sap/ui/model/json/JSONModel',
   'sap/ui/unified/ColorPickerPopover',
   'sap/m/MessageBox',
   'sap/m/MessageToast',
   'sap/m/Button'
], function (GuiPanelController, JSONModel, ColorPickerPopover, MessageBox, MessageToast, Button) {
   
   "use strict";

//    return sap.ui.core.Control.extend("Button", { // call the new Control type "my.ColorBox" and let it inherit from sap.ui.core.Control

//             // the control API:
//             metadata : {
//                properties : {           // setter and getter are created behind the scenes, incl. data binding and type validation
//                   "color" : {type: "sap.ui.core.CSSColor", defaultValue: "#fff"} // you can give a default value and more
//                }
//             },

//             // the part creating the HTML:
//             renderer : function(oRm, oControl) { // static function, so use the given "oControl" instance instead of "this" in the renderer function
//                oRm.write("<div"); 
//                oRm.writeControlData(oControl);  // writes the Control ID and enables event handling - important!
//                oRm.addStyle("background-color", oControl.getColor());  // write the color property; UI5 has validated it to be a valid CSS color
//                oRm.writeStyles();
//                oRm.addClass("myColorBox");      // add a CSS class for styles common to all control instances
//                oRm.writeClasses();              // this call writes the above class plus enables support for Square.addStyleClass(...)
//                oRm.write(">"); 
//                oRm.write("</div>"); // no text content to render; close the tag
//             },
//          });

   return GuiPanelController.extend("localapp.controller.SimpleFitPanel",{

         //function called from GuiPanelController
      onPanelInit : function() {
         var id = this.getView().getId();
         this.inputId = "";
         var opText = this.getView().byId("OperationText");
         var data = {
               //fDataSet:[ { fId:"1", fSet: "----" } ],
               fSelectDataId: "2",
               fMinRange: -4,
               fMaxRange: 4,
               fStep: 0.01,
               fRange: [-4,4]
         };
         this.getView().setModel(new JSONModel(data));
         this._data = data; 
         var myControl = new Button({color:"#f00"});

         // var style = document.createElement("style");
         // document.head.appendChild(style);
         // style.type = "text/css";
         // style.innerHTML = "";
         // var oDUmmy = new sap.ui.core.Control();
         // sap.ui.core.Control.prototype.changeColor = function(oColor){
         //    style.innerHTML = style.innerHTML + '.' + oColor + '{background-color:' + oColor + ' !important;}';
         //    this.addStyleClass(oColor);
         //  }
         // sap.ui.core.Control.prototype.addCustomStyle = function(oClassName,oStyle){
         //    style.innerHTML = style.innerHTML + '.' + oClassName + '{' + oStyle + ' !important;}';
         //    this.addStyleClass(oClassName);
         // }

         // var oButton = this.getView().byId("test");
         // oButton.changeColor("red"); // change the color of the button

 
         
      },



      // Assign the new JSONModel to data      
      OnWebsocketMsg: function(handle, msg){

         if(msg.startsWith("MODEL:")){
            var json = msg.substr(6);
            var data = JSROOT.parse(json);

            if(data) {
               this.getView().setModel(new JSONModel(data));
               this._data = data;

               this.copyModel = JSROOT.extend({},data);
            }     
         }


         else {
         }
         

      },

      //Fitting Button
      doFit: function() {
         
         //Data is a new model. With getValue() we select the value of the parameter specified from id
         var data = this.getView().getModel().getData();
         var func = this.getView().byId("TypeXY").getValue();
         //We pass the value from func to C++ fRealFunc
         data.fRealFunc = func;

         var range = this.getView().byId("Slider").getRange();
         console.log("Slider " + range);

         //We pass the values from range array in JS to C++ fRange array
         data.fRange[0] = range[0];
         data.fRange[1] = range[1];

         //Refresh the model
         this.getView().getModel().refresh();

         if (this.websocket)
            this.websocket.Send('DOFIT:'+this.getView().getModel().getJSON());
      },

      onPanelExit: function(){

      },

      resetPanel: function(oEvent){

        
         if(!this.copyModel) return;

         JSROOT.extend(this._data, this.copyModel);
         this.getView().getModel().updateBindings();
         return;
      },
     
     //Change the input text field. When a function is seleced, it appears on the text input field and
     //on the text area.
       onTypeXYChange: function(){
         var data = this.getView().getModel().getData();
         var linear = this.getView().getModel().getData().fSelectXYId;
         data.fFuncChange = linear;
         this.getView().getModel().refresh();

         //updates the text area and text in selected tab, depending on the choice in TypeXY ComboBox
         var func = this.getView().byId("TypeXY").getValue();
         this.byId("OperationText").setValueLiveUpdate();
         this.byId("OperationText").setValue(func);
         this.byId("selectedOpText").setText(func);
       },


      //change the combo box in Minimization Tab --- Method depending on Radio Buttons values
      selectRB: function(){
         
         var data = this.getView().getModel().getData();
         var lib = this.getView().getModel().getData().fLibrary;
         
         // same code as initialization
         data.fMethodMin = data.fMethodMinAll[parseInt(lib)];
         
         
         // refresh all UI elements
         this.getView().getModel().refresh();
         console.log("Method = ", data.fMethodMinAll[parseInt(lib)]);
         
    },
      //Change the combobox in Type Function
      //When the Type (TypeFunc) is changed (Predef etc) then the combobox with the funtions (TypeXY), 
      //is also changed 
      selectTypeFunc: function(){

         var data = this.getView().getModel().getData();

         var typeXY = this.getView().getModel().getData().fSelectTypeId;
         var dataSet = this.getView().getModel().getData().fSelectDataId;
         console.log("typeXY = " + dataSet);

         data.fTypeXY = data.fTypeXYAll[parseInt(typeXY)];

         this.getView().getModel().refresh();
         console.log("Type = ", data.fTypeXYAll[parseInt(typeXY)]);
      },

      //Change the selected checkbox of Draw Options 
      //if Do not Store is selected then No Drawing is also selected
      storeChange: function(){
         var data = this.getView().getModel().getData();
         var fDraw = this.getView().byId("noStore").getSelected();
         console.log("fDraw = ", fDraw);
         data.fNoStore = fDraw;
         this.getView().getModel().refresh();
         console.log("fNoDrawing ", data.fNoStore);
      },

      setParametersDialog: function(){
         var oPersonalizationDialog = sap.ui.xmlfragment("localapp.view.SetParameters", this);
         this.getView().addDependent(oPersonalizationDialog);
         oPersonalizationDialog.open();
      },


      //Cancel Button on Set Parameters Dialog Box
      onCancel: function(oEvent){
         oEvent.getSource().close();
      },

      colorPicker: function (oEvent) {
         this.inputId = oEvent.getSource().getId();
         if (!this.oColorPickerPopover) {
            this.oColorPickerPopover = new sap.ui.unified.ColorPickerPopover({
               colorString: "blue",
               mode: sap.ui.unified.ColorPickerMode.HSL,
               change: this.handleChange.bind(this)
            });
         }
         this.oColorPickerPopover.openBy(oEvent.getSource());
      },

      handleChange: function (oEvent) {
         var oView = this.getView();
         //oView.byId(this.inputId).setValue(oEvent.getParameter("colorString"));
         this.inputId = "";
         var color = oEvent.getParameter("colorString");
         MessageToast.show("Chosen color string: " + color);
      },

   });

   return 
});
