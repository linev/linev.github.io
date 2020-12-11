sap.ui.define(['sap/ui/core/mvc/Controller',
               'sap/m/Link',
               'sap/ui/core/Fragment',
               'rootui5/browser/model/BrowserModel',
               'sap/ui/model/json/JSONModel',
               'sap/ui/table/Column',
               'sap/ui/layout/HorizontalLayout',
               'sap/m/TabContainerItem',
               'sap/m/MessageToast',
               'sap/m/MessageBox',
               'sap/m/Text',
               'sap/ui/core/mvc/XMLView',
               'sap/ui/core/Icon',
               'sap/m/Button',
               'sap/ui/codeeditor/CodeEditor',
               'sap/m/Image',
               'sap/tnt/ToolHeader',
               'sap/m/ToolbarSpacer',
               'sap/m/OverflowToolbarLayoutData',
               'rootui5/browser/controller/FileDialog.controller'
],function(Controller,
           Link,
           Fragment,
           BrowserModel,
           JSONModel,
           tableColumn,
           HorizontalLayout,
           TabContainerItem,
           MessageToast,
           MessageBox,
           mText,
           XMLView,
           CoreIcon,
           Button,
           CodeEditor,
           Image,
           ToolHeader,
           ToolbarSpacer,
           OverflowToolbarLayoutData,
           FileDialogController) {

   "use strict";

   /** Central ROOT RBrowser controller
    * All Browser functionality is loaded after main ui5 rendering is performed */

   return Controller.extend("rootui5.browser.controller.Browser", {
      onInit: async function () {

         let pthis = this;
         let burgerMenu = pthis.getView().byId("burgerMenu");

         sap.ui.Device.orientation.attachHandler((mParams) => {
            burgerMenu.detachPress(pthis.onFullScreenPressLandscape, pthis);
            burgerMenu.detachPress(pthis.onFullScreenPressPortrait, pthis);

            if (mParams.landscape) {
               burgerMenu.attachPress(pthis.onFullScreenPressLandscape, pthis);
               this.getView().byId('expandMaster').setVisible(true);
            } else {
               burgerMenu.attachPress(pthis.onFullScreenPressPortrait, pthis);

               this.getView().byId('masterPage').getParent().removeStyleClass('masterExpanded');
               this.getView().byId('expandMaster').setVisible(false);
               this.getView().byId('shrinkMaster').setVisible(false);
            }
         });

         if(sap.ui.Device.orientation.landscape) {
            burgerMenu.attachPress(pthis.onFullScreenPressLandscape, pthis);
         } else {
            burgerMenu.attachPress(pthis.onFullScreenPressPortrait, pthis);
            this.getView().byId('expandMaster').setVisible(false);
         }

        this.globalId = 1;
        this.nextElem = "";
        this.DBLCLKRun = false;

         this.websocket = this.getView().getViewData().conn_handle;

         // this is code for the Components.js
         // this.websocket = Component.getOwnerComponentFor(this.getView()).getComponentData().conn_handle;

         this.websocket.SetReceiver(this);
         this.websocket.Connect();

         // if true, most operations are performed locally without involving server
         this.standalone = this.websocket.kind == "file";

         // create model only for browser - no need for anybody else
         this.model = new BrowserModel();

         // copy extra attributes from element to node in the browser
         // later can be done automatically
         this.model.addNodeAttributes = function(node, elem) {
            node.icon = elem.icon;
            node.fsize = elem.fsize;
            node.mtime = elem.mtime;
            node.ftype = elem.ftype;
            node.fuid = elem.fuid;
            node.fgid = elem.fgid;
            node.className = elem.className
         };

         var t = this.getView().byId("treeTable");
         t.setModel(this.model);

         this.model.assignTreeTable(t);
         t.addColumn(new tableColumn({
            label: "Name",
            autoResizable: true,
            visible: true,
            template: new HorizontalLayout({
               content: [
                         new CoreIcon({src:"{icon}"}),
                         new mText({text:" {name}", renderWhitespace: true, wrapping: false })
                         ]
            })
         }));
         t.addColumn(new tableColumn({
            label: "Size",
            autoResizable: true,
            visible: true,
            template: new HorizontalLayout({
               content: [
                         new mText({text:"{fsize}", wrapping: false })
                         ]
            })
         }));
         t.addColumn(new tableColumn({
            label: "Time",
            autoResizable: true,
            visible: false,
            template: new HorizontalLayout({
               content: [
                         new mText({text:"{mtime}", wrapping: false })
                         ]
            })
         }));
         t.addColumn(new tableColumn({
            label: "Type",
            autoResizable: true,
            visible: false,
            template: new HorizontalLayout({
               content: [
                         new mText({text:"{ftype}", wrapping: false })
                         ]
            })
         }));
         t.addColumn(new tableColumn({
            label: "UID",
            autoResizable: true,
            visible: false,
            template: new HorizontalLayout({
               content: [
                         new mText({text:"{fuid}", wrapping: false })
                         ]
            })
         }));
         t.addColumn(new tableColumn({
            label: "GID",
            autoResizable: true,
            visible: false,
            template: new HorizontalLayout({
               content: [
                         new mText({text:"{fgid}", wrapping: false })
                         ]
            })
         }));
         t.addColumn(new tableColumn({
            label: "ClassName",
            autoResizable: true,
            visible: false,
            template: new HorizontalLayout({
               content: [
                         new mText({text:"{className}", wrapping: false })
                         ]
            })
         }));

         // catch re-rendering of the table to assign handlers
         t.addEventDelegate({
            onAfterRendering: function() { this.assignRowHandlers(); }
         }, this);

         this.newCodeEditor();

         this.drawingOptions = { TH1: 'hist', TH2: 'COL', TProfile: 'E0'};
      },

      /* ========================================================= */
      /* =============== Generic factory functions =============== */
      /* ========================================================= */

      getElementFromCurrentTab: function (element) {
         const currentTabID = this.getView().byId("myTabContainer").getSelectedItem();
         return sap.ui.getCore().byId(currentTabID + element);
      },

      /* ========================================================= */
      /* =============== Generic factory functions =============== */
      /* ========================================================= */

      /* =========================================== */
      /* =============== Code Editor =============== */
      /* =========================================== */

      newCodeEditor: async function () {
         const oTabContainer = this.getView().byId("myTabContainer");

         const ID = "CodeEditor" + this.globalId;
         this.globalId++;

         const oTabContainerItem = new TabContainerItem(ID, {
            icon: "sap-icon://write-new-document",
            name: "Code Editor",
            additionalText: "untitled",
            content: this.newCodeEditorFragment(ID)
         });

         oTabContainer.addItem(oTabContainerItem);
         oTabContainer.setSelectedItem(oTabContainerItem);
      },

      newCodeEditorFragment: function (ID) {
         return [
               new ToolHeader({
                  height: "40px",
                  content: [
                     new Button(ID + "Run", {
                        text: "Run",
                        tooltip: "Run Current Macro",
                        icon: "sap-icon://play",
                        type: "Transparent",
                        enabled: false,
                        press: [this.onRunMacro, this]
                     }),
                     new ToolbarSpacer({
                        layoutData: new OverflowToolbarLayoutData({
                           priority:"NeverOverflow",
                           minWidth: "16px"
                        })
                     }),
                     new Button(ID + "SaveAs", {
                        text: "Save as...",
                        tooltip: "Save current file as...",
                        type: "Transparent",
                        press: [this.onSaveAs, this]
                     }),
                     new Button(ID + "Save", {
                        text: "Save",
                        tooltip: "Save current file",
                        type: "Transparent",
                        press: [this.onSaveFile, this]
                     })
                  ]
               }),
               new CodeEditor(ID + "Editor", {
                  // height: 'auto',
                  colorTheme: "default",
                  type: "c_cpp",
                  value: "{/code}",
                  height: "calc(100% - 40px)",
                  change: function () {
                     this.getModel().setProperty("/modified", true);
                  }
               }).setModel(new JSONModel({
                  code: "",
                  ext: "",
                  filename: "",
                  fullpath: "",
                  modified: false
               }))
            ];
      },

      /** @brief Invoke dialog with server side code */
      onSaveAs: function() {

         const oEditor = this.getSelectedCodeEditor();

         FileDialogController.SaveAs({
            websocket: this.websocket,
            filename: oEditor.getModel().getProperty("/fullpath"),
            title: "Select file name to save",
            filter: "Any files",
            filters: ["Text files (*.txt)", "C++ files (*.cxx *.cpp *.c)", "Any files (*)"],
            onOk: function(fname) {
               this.setFileNameType(oEditor, fname);
               const sText = oEditor.getModel().getProperty("/code");
               oEditor.getModel().setProperty("/modified", false);
               this.websocket.Send("SAVEFILE:" + JSON.stringify([fname, sText]));
            }.bind(this),
            onCancel: function() { },
            onFailure: function() { }
         });
      },

      /** @brief Handle the "Save" button press event */
      onSaveFile: function () {
         const oEditor = this.getSelectedCodeEditor();
         const oModel = oEditor.getModel();
         const sText = oModel.getProperty("/code");
         const fullpath = oModel.getProperty("/fullpath");
         if (!fullpath)
            return onSaveAs();
         oModel.setProperty("/modified", false);
         return this.websocket.Send("SAVEFILE:" + JSON.stringify([fullpath, sText]));
      },

      reallyRunMacro: function () {
         const oEditor = this.getSelectedCodeEditor();
         const oModel = oEditor.getModel();
         const fullpath = oModel.getProperty("/fullpath");
         if (fullpath === undefined)
            return this.onSaveAs();
         return this.websocket.Send("RUNMACRO:" + fullpath);
      },

      /** @brief Handle the "Run" button press event */
      onRunMacro: function () {
         this.saveCheck(this.reallyRunMacro.bind(this));
      },

      saveCheck: function(functionToRunAfter) {
         const oEditor = this.getSelectedCodeEditor();
         const oModel = oEditor.getModel();
         if (oModel.getProperty("/modified") === true) {
            MessageBox.confirm('The text has been modified! Do you want to save it?', {
               title: 'Unsaved file',
               icon: sap.m.MessageBox.Icon.QUESTION,
               onClose: (oAction) => {
                  if (oAction === MessageBox.Action.YES) {
                     this.onSaveFile();
                  } else if (oAction === MessageBox.Action.CANCEL) {
                     return;
                  }
                  return functionToRunAfter();
               },
               actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO, sap.m.MessageBox.Action.CANCEL]
            });
         } else {
            return functionToRunAfter();
         }
      },

      getSelectedCodeEditor: function (no_warning) {
         let oTabItemString = this.getView().byId("myTabContainer").getSelectedItem();

         if (oTabItemString.indexOf("CodeEditor") !== -1) {
            return sap.ui.getCore().byId(oTabItemString + "Editor");
         } else {
            if (!no_warning) MessageToast.show("Sorry, you need to select a code editor tab", {duration: 1500});
         }
      },

      /** @brief Extract the file name and extension
       * @desc Used to set the editor's model properties and display the file name on the tab element  */
      setFileNameType: function (oEditor, fullname) {
         let oModel = oEditor.getModel();
         let oTabElement = oEditor.getParent();
         let ext = "txt";
         let runButton = this.getElementFromCurrentTab("Run");
         runButton.setEnabled(false);

         let filename = fullname;
         let p = Math.max(filename.lastIndexOf("/"), filename.lastIndexOf("\\"));
         if (p>0) filename = filename.substr(p+1);

         if (filename.lastIndexOf('.') > 0)
            ext = filename.substr(filename.lastIndexOf('.') + 1);

         switch (ext.toLowerCase()) {
            case "c":
            case "cc":
            case "cpp":
            case "cxx":
               runButton.setEnabled(true);
               oEditor.setType('c_cpp');
               break;
            case "h":
            case "hh":
            case "hxx":
               oEditor.setType('c_cpp');
               break;
            case "f":
               oEditor.setType('fortran');
               break;
            case "htm":
            case "html":
               oEditor.setType('html');
               break;
            case "js":
               oEditor.setType('javascript');
               break;
            case "json":
               oEditor.setType('json');
               break;
            case "md":
               oEditor.setType('markdown');
               break;
            case "py":
               oEditor.setType('python');
               break;
            case "tex":
               oEditor.setType('latex');
               break;
            case "cmake":
            case "log":
            case "txt":
               oEditor.setType('plain_text');
               break;
            case "css":
               oEditor.setType('css');
               break;
            case "csh":
            case "sh":
               oEditor.setType('sh');
               break;
            case "xml":
               oEditor.setType('xml');
               break;
            default: // unsupported type
               if (filename.lastIndexOf('README') >= 0)
                  oEditor.setType('plain_text');
               else
                  return false;
               break;

         }
         oTabElement.setAdditionalText(filename);

         if (filename.lastIndexOf('.') > 0)
            filename = filename.substr(0, filename.lastIndexOf('.'));

         oModel.setProperty("/fullpath", fullname);
         oModel.setProperty("/filename", filename);
         oModel.setProperty("/ext", ext);
         return true;
      },

      /** @brief Handle the "Browse..." button press event */
      onChangeFile: function (oEvent) {
         let oEditor = this.getSelectedCodeEditor();
         if (!oEditor) return;

         let oReader = new FileReader();
         oReader.onload = function () {
            oEditor.getModel().setProperty("/code", oReader.result);
         };
         let file = oEvent.getParameter("files")[0];
         if (this.setFileNameType(oEditor, file.name))
            oReader.readAsText(file);
      },

      /* =========================================== */
      /* =============== Code Editor =============== */
      /* =========================================== */

      /* ============================================ */
      /* =============== Image viewer =============== */
      /* ============================================ */

      newImageViewerFragment: function (ID) {
         return new sap.m.Page({
            showNavButton: false,
            showFooter: false,
            showSubHeader: false,
            showHeader: false,
            content: new Image(ID + "Image", {
               src: "",
               densityAware: false
            })
         });
      },

      newImageViewer: async function () {
         let oTabContainer = this.getView().byId("myTabContainer");

         const ID = "ImageViewer" + this.globalId;
         this.globalId++;

         let tabContainerItem = new TabContainerItem(ID, {
            icon: "sap-icon://background",
            name: "Image Viewer",
            additionalText: "untitled",
            content: this.newImageViewerFragment(ID)
         });

         oTabContainer.addItem(tabContainerItem);
         oTabContainer.setSelectedItem(tabContainerItem);

         sap.ui.getCore().byId(ID + 'Image').addStyleClass("imageViewer");
      },

      getSelectedImageViewer: function (no_warning) {
         let oTabItemString = this.getView().byId("myTabContainer").getSelectedItem();

         if (oTabItemString.indexOf("ImageViewer") !== -1)
            return sap.ui.getCore().byId(oTabItemString + "Image");

         if (!no_warning) MessageToast.show("Sorry, you need to select an image viewer tab", {duration: 1500});
      },

      /* ============================================ */
      /* =============== Image viewer =============== */
      /* ============================================ */

      /* ============================================= */
      /* =============== Settings menu =============== */
      /* ============================================= */

      _getSettingsMenu: async function () {
         if (!this._oSettingsMenu) {
            let fragment;
            await Fragment.load({name: "rootui5.browser.view.settingsmenu", controller: this}).then(function (oSettingsMenu) {
               fragment = oSettingsMenu;
            });
            if (fragment) {
               let oModel = new JSONModel({
                  "TH1": [
                     {"name": "hist"},
                     {"name": "P"},
                     {"name": "P0"},
                     {"name": "E"},
                     {"name": "E1"},
                     {"name": "E2"},
                     {"name": "E3"},
                     {"name": "E4"},
                     {"name": "E1X0"},
                     {"name": "L"},
                     {"name": "LF2"},
                     {"name": "B"},
                     {"name": "B1"},
                     {"name": "A"},
                     {"name": "TEXT"},
                     {"name": "LEGO"},
                     {"name": "same"}
                  ],
                  "TH2": [
                     {"name": "COL"},
                     {"name": "COLZ"},
                     {"name": "COL0"},
                     {"name": "COL1"},
                     {"name": "COL0Z"},
                     {"name": "COL1Z"},
                     {"name": "COLA"},
                     {"name": "BOX"},
                     {"name": "BOX1"},
                     {"name": "PROJ"},
                     {"name": "PROJX1"},
                     {"name": "PROJX2"},
                     {"name": "PROJX3"},
                     {"name": "PROJY1"},
                     {"name": "PROJY2"},
                     {"name": "PROJY3"},
                     {"name": "SCAT"},
                     {"name": "TEXT"},
                     {"name": "TEXTE"},
                     {"name": "TEXTE0"},
                     {"name": "CONT"},
                     {"name": "CONT1"},
                     {"name": "CONT2"},
                     {"name": "CONT3"},
                     {"name": "CONT4"},
                     {"name": "ARR"},
                     {"name": "SURF"},
                     {"name": "SURF1"},
                     {"name": "SURF2"},
                     {"name": "SURF4"},
                     {"name": "SURF6"},
                     {"name": "E"},
                     {"name": "A"},
                     {"name": "LEGO"},
                     {"name": "LEGO0"},
                     {"name": "LEGO1"},
                     {"name": "LEGO2"},
                     {"name": "LEGO3"},
                     {"name": "LEGO4"},
                     {"name": "same"}
                  ],
                  "TProfile": [
                     {"name": "E0"},
                     {"name": "E1"},
                     {"name": "E2"},
                     {"name": "p"},
                     {"name": "AH"},
                     {"name": "hist"}
                  ]
               });
               fragment.setModel(oModel);
               this.getView().addDependent(fragment);
               this._oSettingsMenu = fragment;
            }
         }
         return this._oSettingsMenu;
      },

      onSettingPress: async function () {
         await this._getSettingsMenu();
         this._oSettingsMenu.open();
      },

      handleSettingsChange: function (oEvent) {
         let graphType = oEvent.getSource().sId.split("-")[1];
         this.drawingOptions[graphType] = oEvent.getSource().mProperties.value;
      },

      settingsDBLCLKRun: function(oEvent) {
         this.DBLCLKRun = oEvent.getSource().getSelected();
      },

      /* ============================================= */
      /* =============== Settings menu =============== */
      /* ============================================= */

      /* ========================================= */
      /* =============== Tabs menu =============== */
      /* ========================================= */

      /** @brief Add Tab event handler */
      addNewButtonPressHandler: async function (oEvent) {
         //TODO: Change to some UI5 function (unknown for now)
         let oButton = oEvent.getSource().mAggregations._tabStrip.mAggregations.addButton;

         // create action sheet only once
         if (!this._tabMenu) {
            let fragment;
            await Fragment.load({name: "rootui5.browser.view.tabsmenu", controller: this}).then(function (oFragment) {
               fragment = oFragment;
            });
            if (fragment) {
               this.getView().addDependent(fragment);
               this._tabMenu = fragment;
            }
         }
         this._tabMenu.openBy(oButton);
      },

      newRootXCanvas: function (oEvent) {
         let msg;
         if (oEvent.getSource().getText().indexOf("6") !== -1) {
            msg = "NEWTCANVAS";
         } else {
            msg = "NEWRCANVAS";
         }
         if (this.isConnected) {
            this.websocket.Send(msg);
         }
      },

      /* ========================================= */
      /* =============== Tabs menu =============== */
      /* ========================================= */

      /* =========================================== */
      /* =============== Breadcrumbs =============== */
      /* =========================================== */

      updateBReadcrumbs: function(split) {
         // already array with all items inside
         let oBreadcrumbs = this.getView().byId("breadcrumbs");
         oBreadcrumbs.removeAllLinks();
         for (let i=-1; i<split.length; i++) {
            let txt = i<0 ? "/": split[i];
            if (i === split.length-1) {
               oBreadcrumbs.setCurrentLocationText(txt);
            } else {
               let link = new Link({text: txt});
               link.attachPress(this, this.onBreadcrumbsPress, this);
               oBreadcrumbs.addLink(link);
            }
         }
      },

      onBreadcrumbsPress: function(oEvent) {
         let sId = oEvent.getSource().getId();
         let oBreadcrumbs = oEvent.getSource().getParent();
         let oLinks = oBreadcrumbs.getLinks();
         let path = [];
         for (let i = 0; i < oLinks.length; i++) {
            if (i>0) path.push(oLinks[i].getText());
            if (oLinks[i].getId() === sId ) break;
         }
         this.websocket.Send('CHPATH:' + JSON.stringify(path));
         this.doReload(true);
      },

      /* =========================================== */
      /* =============== Breadcrumbs =============== */
      /* =========================================== */

      /* ============================================ */
      /* =============== TabContainer =============== */
      /* ============================================ */

      tabSelectItem: function(oEvent) {
         var oItemSelected = oEvent.getParameter('item');

         if (oItemSelected.getName() !== "ROOT Canvas") return;

         console.log("Canvas selected:", oItemSelected.getAdditionalText());

         this.websocket.Send("SELECT_CANVAS:" + oItemSelected.getAdditionalText());

      },

      /** @brief Close Tab event handler */
      tabCloseHandler: function(oEvent) {
         // prevent the tab being closed by default
         oEvent.preventDefault();

         let oTabContainer = this.byId("myTabContainer");
         let oItemToClose = oEvent.getParameter('item');


         if (oItemToClose.getName() === "Code Editor") {

            let count = 0;
            const items = oTabContainer.getItems();
            for (let i=0; i< items.length; i++) {
               if (items[i].getId().indexOf("CodeEditor") !== -1) {
                  count++
               }
            }
            if (count <= 1) {
               MessageToast.show("Sorry, you cannot close the Code Editor", {duration: 1500});
            } else {
               this.saveCheck(function ()  {oTabContainer.removeItem(oItemToClose);});
            }
         } else {
            let pthis = this;
            MessageBox.confirm('Do you really want to close the "' + oItemToClose.getName() + '" tab?', {
               onClose: function (oAction) {
                  if (oAction === MessageBox.Action.OK) {
                     if (oItemToClose.getName() === "ROOT Canvas")
                        pthis.websocket.Send("CLOSE_CANVAS:" + oItemToClose.getAdditionalText());

                     oTabContainer.removeItem(oItemToClose);

                     MessageToast.show('Closed the "' + oItemToClose.getName() + '" tab', {duration: 1500});
                  }
               }
            });

         }
      },

      /* ============================================ */
      /* =============== TabContainer =============== */
      /* ============================================ */

      /* ======================================== */
      /* =============== Terminal =============== */
      /* ======================================== */

      onTerminalSubmit: function(oEvent) {
         let command = oEvent.getSource().getValue();
         this.websocket.Send("CMD:" + command);
         oEvent.getSource().setValue("");
         this.requestRootHist();
         this.requestLogs();
      },

      requestRootHist: function() {
         return this.websocket.Send("ROOTHIST:");
      },

      updateRootHist: function (hist) {
         let pos = hist.lastIndexOf(',');
         hist = hist.substring(0,pos) + "" + hist.substring(pos+1);
         hist = hist.split(",");
         let json = {hist:[]};

         for(let i=0; i<hist.length; i++) {
            json.hist.push({name: hist[i] });

         }
         this.getView().byId("terminal-input").setModel(new JSONModel(json));
      },

      requestLogs: function() {
         return this.websocket.Send("LOGS:");
      },

      updateLogs: function(logs) {
         this.getView().byId("output_log").setValue(logs);
      },

      /* ======================================== */
      /* =============== Terminal =============== */
      /* ======================================== */

      /* ========================================== */
      /* =============== ToolHeader =============== */
      /* ========================================== */

      onFullScreenPressLandscape: function () {
         let splitApp = this.getView().byId("SplitAppBrowser");
         let mode = splitApp.getMode();
         if(mode === "ShowHideMode") {
            splitApp.setMode("HideMode");
         } else {
            splitApp.setMode("ShowHideMode");
         }
      },

      onFullScreenPressPortrait: function () {
         let splitApp = this.getView().byId("SplitAppBrowser");
         if(splitApp.isMasterShown()) {
            splitApp.hideMaster();
         } else {
            splitApp.showMaster();
         }
      },

      onExpandMaster: function () {
         this.getView().byId('expandMaster').setVisible(false);
         this.getView().byId('shrinkMaster').setVisible(true);
         this.getView().byId('masterPage').getParent().addStyleClass('masterExpanded');
      },

      onShrinkMaster: function () {
         this.getView().byId('expandMaster').setVisible(true);
         this.getView().byId('shrinkMaster').setVisible(false);
         this.getView().byId('masterPage').getParent().removeStyleClass('masterExpanded');
      },

      /* ========================================== */
      /* =============== ToolHeader =============== */
      /* ========================================== */

      /** @brief Assign the "double click" event handler to each row */
      assignRowHandlers: function () {
         var rows = this.byId("treeTable").getRows();
         for (var k = 0; k < rows.length; ++k) {
            rows[k].$().dblclick(this.onRowDblClick.bind(this, rows[k]));
         }
      },

      sendDblClick: function (fullpath, opt) {
         if(this.DBLCLKRun) {
            if(opt !== '$$$editor$$$') {
               opt = '$$$execute$$$';
               console.log(fullpath);
            }
         }
         this.websocket.Send('DBLCLK: ["' + fullpath + '","' + (opt || "") + '"]');
      },

      /** @brief Double-click event handler */
      onRowDblClick: function (row) {
         let ctxt = row.getBindingContext(),
            prop = ctxt ? ctxt.getProperty(ctxt.getPath()) : null,
            fullpath = (prop && prop.fullpath) ? prop.fullpath.substr(1, prop.fullpath.length - 2) : "";

         if (!fullpath) return;

         // do not use row._bHasChildren while it is not documented member of m.Row object
         if (!prop.isLeaf) {
            if (!prop.fullpath.endsWith(".root/")) {

               let oBreadcrumbs = this.getView().byId("breadcrumbs");
               let links = oBreadcrumbs.getLinks();
               let currentText = oBreadcrumbs.getCurrentLocationText();

               let path = "";
               if ((currentText == "/") || (links.length < 1)) {
                  path = prop.fullpath;
               } else {
                  path = "/";
                  for (let i = 1; i < links.length; i++)
                     path += links[i].getText() + "/";
                  path += currentText + prop.fullpath;
               }

               // TODO: use plain array also here to avoid any possible confusion
               this.websocket.Send('CHDIR:' + path);
               return this.doReload(true);
            }
         }

         // first try to activate editor
         let codeEditor = this.getSelectedCodeEditor(true);
         if (codeEditor) {
            if (this.setFileNameType(codeEditor, fullpath))
               return this.sendDblClick(fullpath, "$$$editor$$$");
         }

         let viewerTab = this.getSelectedImageViewer(true);
         if (viewerTab) {
            return this.sendDblClick(fullpath, "$$$image$$$");
         }

         let className = this.getBaseClass(prop ? prop.className : "");
         let drawingOptions = "";
         if (className && this.drawingOptions[className])
            drawingOptions = this.drawingOptions[className];

         return this.sendDblClick(fullpath, drawingOptions);
      },

      getBaseClass: function(className) {
         if (typeof className !== 'string')
            className = "";
         if (className.match(/^TH1/)) {
            return "TH1";
         } else if (className.match(/^TH2/)) {
            return "TH2";
         }
         return className;
      },

      OnWebsocketOpened: function(handle) {
         this.isConnected = true;

         if (this.model)
            this.model.sendFirstRequest(this.websocket);

      },

      OnWebsocketClosed: function() {
         // when connection closed, close panel as well
         console.log('CLOSE WINDOW WHEN CONNECTION CLOSED');

         if (window) window.close();

         this.isConnected = false;
      },

     /** Entry point for all data from server */
     OnWebsocketMsg: function(handle, msg, offset) {

         if (typeof msg != "string")
            return console.error("Browser do not uses binary messages len = " + mgs.byteLength);

         let mhdr = msg.split(":")[0];
         msg = msg.substr(mhdr.length+1);

         switch (mhdr) {
         case "INMSG":
            this.processInitMsg(msg);
            break;
         case "FREAD":  // text file read
            var oEditor = this.getSelectedCodeEditor();

            if (oEditor) {
               var arr = JSON.parse(msg);

               this.setFileNameType(oEditor, arr[0]);

               oEditor.getModel().setProperty("/code", arr[1]);

               this.getElementFromCurrentTab("Save").setEnabled(true);
            }
            break;
         case "FIMG":  // image file read
            const oViewer = this.getSelectedImageViewer(true);
            if(oViewer) {
               var arr = JSON.parse(msg);
               var filename = arr[0];
               let p = Math.max(filename.lastIndexOf("/"), filename.lastIndexOf("\\"));
               if (p>0) filename = filename.substr(p+1);
               oViewer.getParent().getParent().setAdditionalText(filename);
               oViewer.setSrc(arr[1]);
            }
            break;
         case "CANVS":  // canvas created by server, need to establish connection
            var arr = JSON.parse(msg);
            this.createCanvas(arr[0], arr[1], arr[2]);
            break;
         case "WORKPATH":
            this.updateBReadcrumbs(JSON.parse(msg));
            break;
         case "SLCTCANV": // Selected the back selected canvas
           let oTabContainer = this.byId("myTabContainer");
           let oTabContainerItems = oTabContainer.getItems();
           for(let i=0; i<oTabContainerItems.length; i++) {
             if (oTabContainerItems[i].getAdditionalText() === msg) {
               oTabContainer.setSelectedItem(oTabContainerItems[i]);
               break;
             }
           }
           break;
         case "BREPL":   // browser reply
            if (this.model) {
               var bresp = JSON.parse(msg);
               this.model.processResponse(bresp);

               if (bresp.path === '/') {
                  var tt = this.getView().byId("treeTable");
                  var cols = tt.getColumns();
                  tt.autoResizeColumn(2);
                  tt.autoResizeColumn(1);
                  // for (var k=0;k<cols.length;++k)
                  //    tt.autoResizeColumn(k);
               }
            }
            break;
            case "HIST":
               this.updateRootHist(msg);
               break;
            case "LOGS":
               this.updateLogs(msg);
               break;
         default:
            console.error('Non recognized msg ' + mhdr + ' len=' + msg.length);
         }
      },

      /** Get the ID of the currently selected tab of given tab container */
      getSelectedtabFromtabContainer: function(divid) {
         var  tabContainer = this.getView().byId('myTabContainer').getSelectedItem();
         return tabContainer.slice(6, tabContainer.length);
      },

      /** Show special message instead of nodes hierarchy */
      showTextInBrowser: function(text) {
         var br = this.byId("treeTable");
         br.collapseAll();
         if (!text || (text === "RESET")) {
            br.setNoData("");
            br.setShowNoData(false);

            this.model.setNoData(false);
            this.model.refresh();

         } else {
            br.setNoData(text);
            br.setShowNoData(true);
            this.model.setNoData(true);
            this.model.refresh();
         }
      },

      onBeforeRendering: function() {
         this.renderingDone = false;
      },

      onAfterRendering: function() {
         this.renderingDone = true;

         // this is how master width can be changed, may be extra control can be provided
         // var oSplitApp = this.getView().byId("SplitAppBrowser");
         // oSplitApp.getAggregation("_navMaster").$().css("width", "400px");
      },

      /** Reload (refresh) file tree browser */
      onRealoadPress: function (oEvent) {
         this.doReload(true);
      },

      doReload: function(force) {
         if (this.standalone) {
            this.showTextInBrowser();
            this.paintFoundNodes(null);
            this.model.setFullModel(this.fullModel);
         } else {
            this.model.reloadMainModel(force);
         }
      },

      /** Quit ROOT session */
      onQuitRootPress: function(oEvent) {
         this.websocket.Send("QUIT_ROOT");
      },

      onSearch : function(oEvt) {
         this.changeItemsFilter(oEvt.getSource().getValue());
      },

      /** Submit node search query to server, ignore in offline case */
      changeItemsFilter: function(query, from_handler) {

         if (!from_handler) {
            // do not submit immediately, but after very short timeout
            // if user types very fast - only last selection will be shown
            if (this.search_handler) clearTimeout(this.search_handler);
            this.search_handler = setTimeout(this.changeItemsFilter.bind(this, query, true), 1000);
            return;
         }

         delete this.search_handler;

         this.model.changeItemsFilter(query);
      },

      /** process initial message, now it is list of existing canvases */
      processInitMsg: function(msg) {
         var arr = JSROOT.parse(msg);
         if (!arr) return;

         this.updateBReadcrumbs(arr[0]);
         this.requestRootHist();
         this.requestLogs();

         for (var k=1; k<arr.length; ++k)
            this.createCanvas(arr[k][0], arr[k][1], arr[k][2]);
      },

      createCanvas: function(kind, url, name) {
         console.log("Create canvas ", url, name);
         if (!url || !name) return;

         var oTabContainer = this.byId("myTabContainer");
         var oTabContainerItem = new TabContainerItem({
            name: "ROOT Canvas",
            icon: "sap-icon://column-chart-dual-axis"
         });

         oTabContainerItem.setAdditionalText(name); // name can be used to set active canvas or close canvas

         oTabContainer.addItem(oTabContainerItem);

         // Change the selected tabs, only if it is new one, not the basic one
         if(name !== "rcanv1") {
           oTabContainer.setSelectedItem(oTabContainerItem);
         }

         var conn = new JSROOT.WebWindowHandle(this.websocket.kind);

         // this is producing
         var addr = this.websocket.href, relative_path = url;
         if (relative_path.indexOf("../")==0) {
            var ddd = addr.lastIndexOf("/",addr.length-2);
            addr = addr.substr(0,ddd) + relative_path.substr(2);
         } else {
            addr += relative_path;
         }

         var painter = null;

         if (kind == "root7") {
            painter = new JSROOT.v7.RCanvasPainter(null, null);
         } else {
            painter = new JSROOT.TCanvasPainter(null, null);
         }

         painter.online_canvas = true;
         painter.use_openui = true;
         painter.batch_mode = false;
         painter._window_handle = conn;
         painter._window_handle_href = addr; // argument for connect

         XMLView.create({
            viewName: "rootui5.canv.view.Canvas",
            viewData: { canvas_painter: painter },
            height: "100%"
         }).then(oView => oTabContainerItem.addContent(oView));
      },

   });

});
