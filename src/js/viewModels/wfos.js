/**
 * @license
 * Copyright (c) 2014, 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
/*
 * Your customer ViewModel code goes here
 */
define(['knockout',     
        'ojs/ojpagingdataproviderview',
        'ojs/ojcollectiondataprovider',                
        'ojs/ojarraydataprovider',
        'ojs/ojarraytabledatasource',
        'ojs/ojpagingcontrol',        
        'ojs/ojinputtext','ojs/ojlistview',
        'ojs/ojlabel','ojs/ojlabelvalue','ojs/ojbutton','ojs/ojselectcombobox',
        'ojs/ojconveyorbelt'],

 function(ko, PagingDataProviderView, CollectionDataProvider) {
     
    function wfosViewModel() {
        
        var self = this;
       
        var rootViewModel = ko.dataFor(document.getElementById('globalBody'));                
        
        self.isAdmin = ko.observable(rootViewModel.isAdmin());
        
        self.baseUrl = rootViewModel.incomeServiceBaseUrl(); 
        
        self.selectedTabItem = ko.observable();
        
        self.scrollPos = ko.observable({ y: 0 });
        self.scrollPosDetail = ko.observable();
        
        self.handleScrollPositionChanged = function (event) {
            var value = event.detail.value;
            self.scrollPosDetail('x: ' + Math.round(value.x) + ' y: ' + Math.round(value.y) + ' key: ' + value.key + ' index: ' + value.index + ' offsetX: ' + Math.round(value.offsetX) + ' offsetY: ' + Math.round(value.offsetY));
        }.bind(self);
        
        /* Variables */        
        //self.selectedTabItem = ko.observable("settings");
        //self.backTestListDataSource = ko.observable();
        self.selectedWFO = ko.observable();
        self.selectedWFOModel = ko.observable();
        self.WFOList = ko.observable();        
        
        self.selectionRequired = ko.observable(false);
        
        self.pagingLayout = { layout: ['nav'], maxPageLinks: 5 };
        
        /* Tab Component */
        self.tabData = ko.observableArray([]);
        self.tabBarDataSource = new oj.ArrayTableDataSource(self.tabData, { idAttribute: 'id' });
        
        self.sleep = (ms) => {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        
        /* List selection listener */        
        self.WFOListSelectionChanged = function () { 
            
            //alert("self.selectedHouse() = " + self.selectedHouse());
            
            //alert("self.houseList() = '" +  JSON.stringify(self.houseList()) + "'");
                        
            self.selectedWFOModel(self.WFOList().get(self.selectedWFO()));                        
                                                              
            // Check if the selected ticket exists within the tab data
            var match = ko.utils.arrayFirst(self.tabData(), function (item) {
              return item.id === self.selectedWFO();
            });
            
            console.log(JSON.stringify(self.WFOList()));

            if (!match) { 
                
                while(self.tabData().length > 0) {                    
                    self.tabData.pop();
                }                    

                var name = "New WFO";
                    
                console.log(self.WFOList().get(self.selectedWFO()));
                
                if(self.selectedWFO() && self.selectedWFO() !== -1) {     
                    try {
                        name = self.WFOList().get(self.selectedWFO()).get("name");
                    }                    
                    catch(ex) {
                        console.log(ex);
                    }
                }
                
                self.tabData.push({
                  "wfo": name,
                  "id": self.selectedWFO()
                });
                                
            }
            
            self.selectedTabItem(self.selectedWFO());                        
        }; 
        
        self.WFOListDataSource = ko.computed(function () {            
            
           /* List View Collection and Model */
            var WFOModelItem = oj.Model.extend({
                idAttribute: 'id'
            });

            var WFOListCollection = new oj.Collection(null, {
                url: self.baseUrl + "wfos/",
                model: WFOModelItem
            });                        

            self.WFOList = ko.observable(WFOListCollection);  
            
            self.sleep(500).then(() => {
                if(self.WFOList().length === 0) {  
                    $("#newButton").trigger("click");
                }
            });            

            //self.backTestListDataSource(new oj.CollectionTableDataSource(self.backTestList()));   
            return new PagingDataProviderView(new CollectionDataProvider(self.WFOList()));
            //return new CollectionDataProvider(self.houseList());
        });  
        
        
        /* New WFO listener */        
        self.newWFO = function () {
            
            //alert("newWFO");
            
            self.sleep(3000).then(() => {                
                $(".oj-pagingcontrol-nav-last").removeClass("oj-disabled");
                self.sleep(3000).then(() => {                    
                    $(".oj-pagingcontrol-nav-last").trigger("click");  
                });                
            });
            
            var wfo = {};                        
            
            wfo.id = -1;
            wfo.name = "WFO_New";
            wfo.status = "NEW";
            wfo.debts = [];
            wfo.wfoRecords = [];       
            
            self.WFOList().push(wfo)
            
            //console.log(self.c());                                    
             
            self.selectedWFOModel(wfo);                        
            
            self.selectedWFO([-1]);                            
                                                                              
        };                         

        self.deleteTab = function (id) {                        
            
            // Prevent the first item in the list being removed
            //if(id != self.houseList().at(0).id){          
            if(self.tabData.length > 1) {

              var hnavlist = document.getElementById('ticket-tab-bar'),
                items = self.tabData();
              for (var i = 0; i < items.length; i++) {
                if (items[i].id === id) {
                  self.tabData.splice(i, 1);

                 /* Check if the current selected list item matches the open tab,
                    if so, reset to the first index in the list
                  */
                  if(id === self.selectedWFO() || self.selectedWFO() !== self.selectedTabItem()){                         
                        self.selectedTabItem(self.tabData()[0].id);
                  }

                  oj.Context.getContext(hnavlist)
                    .getBusyContext()
                    .whenReady()
                    .then(function () {
                      hnavlist.focus();
                    });
                  break;
                }
              }
            }
        };

        self.onTabRemove = function (event) {
            self.deleteTab(event.detail.key);
            event.preventDefault();
            event.stopPropagation();
        };

        self.tabSelectionChanged = function () {               
            self.selectedWFOModel(self.WFOList().get(self.selectedTabItem())); 
            self.tabBarDataSource.reset();
        } 
        

                
    }
        
    /*
     * Returns an instance of the ViewModel providing one instance of the ViewModel. If needed,
     * return a constructor for the ViewModel so that the ViewModel is constructed
     * each time the view is displayed.
     */
    return wfosViewModel;
        
});
