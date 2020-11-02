sap.ui.define([
   'sap/ui/core/mvc/Controller',
   'sap/ui/core/ResizeHandler'
], function (Controller, ResizeHandler) {
   "use strict";

   return Controller.extend("rootui5.canv.controller.Panel", {

      onBeforeRendering: function() {
         console.log("Cleanup Panel", this.getView().getId());
         if (this.object_painter) {
            this.object_painter.Cleanup();
            delete this.object_painter;
         }
         this.rendering_perfromed = false;
      },

      drawObject: function(obj, options, call_back) {

         if (call_back) this.get_callbacks.push(call_back);

         if (!this.rendering_perfromed) {
            this.panel_data = { object: obj, opt: options };
            return;
         }

         var oController = this;
         oController.object = obj;
         d3.select(oController.getView().getDomRef()).style('overflow','hidden');

         JSROOT.draw(oController.getView().getDomRef(), oController.object, options).then(painter => {
            console.log("object painting finished");
            oController.object_painter = painter;
            oController.get_callbacks.forEach(cb => JSROOT.CallBack(cb,painter));
            oController.get_callbacks = [];
         });
      },

      drawModel: function(model) {
         if (!model) return;
         if (!this.rendering_perfromed) {
            this.panel_data = model;
            return;
         }

         if (model.object) {
            this.drawObject(model.object, model.opt);
         } else if (model.jsonfilename) {
            JSROOT.httpRequest(model.jsonfilename, 'object')
                  .then(obj => this.drawObject(obj, model.opt));
         } else if (model.filename) {
            JSROOT.openFile(model.filename)
                  .then(file => file.ReadObject(model.itemname))
                  .then(obj => this.drawObject(obj, model.opt));
         }
      },

      /** method to access object painter
         if object already painted and exists, it will be returned as result
         but it may take time to complete object drawing, therefore callback function should be used like
            var panel = sap.ui.getCore().byId("YourPanelId");
            var object_painter = null;
            panel.getController().getPainter(funciton(painter) {
               object_painter = painter;
            });
      */
      getPainter: function(call_back) {

         if (this.object_painter) {
            JSROOT.CallBack(call_back, this.object_painter);
         } else if (call_back) {
            this.get_callbacks.push(call_back);
         }
         return this.object_painter;
      },

      getRenderPromise: function() {
         if (this.rendering_perfromed)
            return Promise.resolve(true);

         return new Promise(resolve => {
            if (!this.funcs) this.funcs = [];
            this.funcs.push(resolve);
         });
      },

      onAfterRendering: function() {
         this.rendering_perfromed = true;

         if (this.funcs) {
            let arr = this.funcs;
            delete this.funcs;
            arr.forEach(func => func(true));
         }

         if (this.panel_data) this.drawModel(this.panel_data);
      },

      onResize: function(event) {
         // use timeout
         if (this.resize_tmout) clearTimeout(this.resize_tmout);
         this.resize_tmout = setTimeout(this.onResizeTimeout.bind(this), 300); // minimal latency
      },

      onResizeTimeout: function() {
         delete this.resize_tmout;
         if (this.object_painter)
            this.object_painter.CheckResize();
      },

      onInit: function() {

         this.get_callbacks = []; // list of callbacks

         this.rendering_perfromed = false;

         var id = this.getView().getId();

         console.log("Initialization of JSROOT Panel", id);

         var oModel = sap.ui.getCore().getModel(id);
         if (!oModel && (id.indexOf("__xmlview0--")==0)) oModel = sap.ui.getCore().getModel(id.substr(12));

         if (oModel)
            this.panel_data = oModel.getData();

         ResizeHandler.register(this.getView(), this.onResize.bind(this));
      },

      onExit: function() {
         console.log("Exit from JSROOT Panel", this.getView().getId());

         if (this.object_painter) {
            this.object_painter.Cleanup();
            delete this.object_painter;
         }
      }
   });

});
