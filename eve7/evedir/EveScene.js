/// @file EveScene.js

(function( factory ) {
   if ( typeof define === "function" && define.amd ) {
      define( ['JSRootCore'], factory );
   } else if (typeof exports === 'object' && typeof module !== 'undefined') {
      factory(require("./JSRootCore.js"));
   } else {
      if (typeof JSROOT == 'undefined')
        throw new Error('JSROOT is not defined', 'EveScene.js');

      factory(JSROOT);
   }
} (function(JSROOT) {

   "use strict";
   
   console.log("loading EveScene.js");

   /// constructor, handle for REveScene class
   
   function EveScene(mgr,scene)
   {
      this.mgr = mgr;
      this.scene = scene;
      this.id = scene.fSceneId; 
   }
   
   EveScene.prototype.hasRenderData = function(elem)
   {
      if (elem===undefined)          
         elem = this.mgr.GetElement(this.id);
      
      if (!elem) return false;
      if (elem.render_data) return true;
      if (elem.childs)
         for (var k = 0; k < elem.childs.length; ++k)
            if (this.hasRenderData(elem.childs[k])) return true;
      return false;
   },

   JSROOT.EVE.EveScene = EveScene;

   return JSROOT;

}));
