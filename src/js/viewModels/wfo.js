/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * backtest module
 */
define(['ojs/ojcore','knockout',
        'ojs/ojresponsiveutils',  
        'ojs/ojresponsiveknockoututils',
        'ojs/ojarraydataprovider','ojs/ojcollectiondataprovider',
        "ojs/ojradioset",
        "ojs/ojswitcher",
        "ojs/ojslider",
        'ojs/ojcollapsible',"ojs/ojdialog",'ojs/ojmessages','ojs/ojpopup', "ojs/ojavatar",
        'ojs/ojconverter-number','ojs/ojchart','ojs/ojformlayout',"ojs/ojinputnumber"], 
    
function (oj, ko, responsiveUtils, responsiveKnockoutUtils, ArrayDataProvider, CollectionDataProvider, NumberConverter) {
    /**
     * The view model for the main content view template
     */        
    function wfoViewModel(params) {
        
        var self = this;
        
        var rootViewModel = ko.dataFor(document.getElementById('globalBody'));                
        
        self.isAdmin = ko.observable(rootViewModel.isAdmin());
        
        self.baseUrl = rootViewModel.incomeServiceBaseUrl(); 
        
        /* Variables */
        self.id = ko.observable(null);
        
        self.name = ko.observable(null);
                                                    
        self.wfoModel = ko.observable();
              
        self.dataProvider = ko.observableArray();                
        
        self.tabs = ko.observableArray();        
        
        self.selectedItem = ko.observable("wfo-records-tab");  
        
        var currentYear = new Date().getFullYear();
        
        self.start = ko.observable(currentYear - 20);
        self.end = ko.observable(currentYear - 10);
        
        self.min = ko.observable(2000);
        self.max = ko.observable(currentYear);
        self.value = ko.observable({ start: self.start(), end: self.end() });
        self.transientValue = ko.observable({});
        
        self.rateIn = ko.observable(4);
        self.rateOut = ko.observable(1);
        
        self.minIn = ko.observable(0);
        self.maxIn = ko.observable(10);        
        self.valueIn = ko.observable(self.rateIn());
        self.transientValueIn = ko.observable();
        
        self.minOut = ko.observable(0);
        self.maxOut = ko.observable(10);        
        self.valueOut = ko.observable(self.rateOut());
        self.transientValueOut = ko.observable();
        
        // if the contents of the array can change, then replace the [...] with ko.observableArray([...]) 
        self.timeFrames = [
          {id: '1', name: 'MINUTE'},
          {id: '2', name: 'HOUR'},
          {id: '3', name: 'DAY'},
          {id: '4', name: 'WEEK'},
          {id: '5', name: 'MONTH'},
          {id: '6', name: 'YEAR'}
        ];
        
        // observable bound to the Buttonset:
        self.selectedTimeFrame = ko.observable('3');
                
        
        self.messages = ko.observableArray();
  
        self.messagesDataprovider = new ArrayDataProvider(self.messages);
        
        self.dataProvider = new ArrayDataProvider(self.tabs, { keyAttributes: "id" });
        
        self.removeMsgs = function (event) {            
            self.messages([]);                        
        }
        
        self.refreshWFOList = (wfo) => {  
            params.WFOList().pop();
            params.WFOList().push(wfo);            
            //$(".oj-pagingcontrol-nav-last").trigger("click");
            params.selectedWFO([wfo.id]);
        };
        
        self.removeFromWFOList = (id) => {                         
            params.WFOList().remove(id);
            params.selectedWFO([]);
            /*
            self.sleep(500).then(() => {   
                if(params.houseList().length === 0) { 
                    $("#newButton").trigger("click");  
                }
            }); 
            */
        };
       
                        
        ko.computed(function () {
            
            //self.removeMsgs();                   
            
            //alert(JSON.stringify(params.WFOModel()));
            
            var url = self.baseUrl + "wfos/new";                                                 
            
            if (params.WFOModel() && params.WFOModel().id !== -1) {
                var wfoId = params.WFOModel().get('id');    
                url = self.baseUrl + "wfos/" + wfoId;                                                 
            }     
            else {
                var currentYear = new Date().getFullYear();
        
                self.start(currentYear - 20);
                self.end(currentYear - 10);

                self.min(2000);
                self.max(currentYear);          

                self.rateIn(4);
                self.rateOut(1);

                self.minIn(0);
                self.maxIn(10);                  

                self.minOut(0);
                self.maxOut(10);                             
            }
                                    
            $.getJSON(url).then(function (wfo) {                      
                //alert("wfo = " + JSON.stringify(wfo));                
                self.wfoModel(wfo);
                
                self.start(wfo.start.split("-")[0]);
                self.end(wfo.end.split("-")[0]);
                
                self.value({ start: self.start(), end: self.end() });            

                self.valueIn(wfo.inSample * 10);
                self.valueOut(wfo.outSample * 10);                
                
                $("#abortButton").hide();
                  
                if(wfo.status !== "NEW") {                    
                    $("#deleteButton").show();
                }
                else {
                    $("#deleteButton").hide();
                }                                 
                
                if (wfo.status === "CREATED") {
                    $("#processButton").show();
                    $("#saveButton").hide();
                }
                
                if (wfo.status === "NEW") {
                    $("#processButton").hide();
                    $("#saveButton").show();
                }
                
                if (wfo.status === "PROCESSING") {
                    $("#processButton").hide();
                    $("#deleteButton").hide();
                    $("#saveButton").hide();
                    $("#abortButton").show();
                }
                
                if (wfo.status === "ABORTED") {
                    $("#processButton").show();
                    $("#saveButton").hide();
                    $("#deleteButton").hide();
                }
              
            });
                 
            self.tabs([{ name: "WFO Records", id: "wfo-records-tab" }]);                        
        });   
       
         
        self.submitWFO = function (event, data) {
                            
            var wfo = {};               

            wfo.id = self.id();
            wfo.start = self.replaceYear(self.wfoModel().start, self.value().start);            
            wfo.end = self.replaceYear(self.wfoModel().end, self.value().end);
            wfo.inSample = self.valueIn() / 10;
            wfo.outSample = self.valueOut() / 10;                
            wfo.timeFrame = self.timeFrames[self.selectedTimeFrame() - 1].name;
            wfo.iterations = self.wfoModel().iterations;
            wfo.status = self.wfoModel().status;
            wfo.wfoRecords = [];

            $.ajax({                    
                type: "POST",
                url: self.baseUrl + "wfos/save",                                        
                dataType: "json",      
                data: JSON.stringify(wfo),			  		 
                //crossDomain: true,
                contentType : "application/json",                    
                success: function(newWFO) {                     
                    self.messages([{severity: 'info', summary: 'Succesful Action', detail: "WFO saved successfuly", autoTimeout: 5000}]);
                    self.refreshWFOList(newWFO);                        
                },
                error: function (request, status, error) {
                    //alert(JSON.stringify(request));                          
                    //alert(request.responseText);     
                    self.messages([{severity: 'error', summary: 'Service Error', detail: request.responseText, autoTimeout: 5000}]);
                }                                  
            });            

                        
        }
        
        self.processWFO = function (event, data) {                            

            $.ajax({                    
                type: "POST",
                url: self.baseUrl + "wfos/process",                                        
                dataType: "json",      
                data: JSON.stringify(self.wfoModel()),			  		 
                //crossDomain: true,
                contentType : "application/json",                    
                success: function(newWFO) {                                            
                    self.messages([{severity: 'info', summary: 'Succesful Action', detail: "Process request sent successfuly", autoTimeout: 5000}]);                                         
                    self.wfoModel.status = 'PROCESSING';
                    self.refreshWFOList(newWFO);
                },
                error: function (request, status, error) {
                    //alert(JSON.stringify(request));                          
                    //alert(request.responseText);     
                    self.messages([{severity: 'error', summary: 'Service Error', detail: request.responseText, autoTimeout: 5000}]);
                }                                  
            });            
                        
        }
        
        self.abortWFO = function (event, data) {                            

            $.ajax({                    
                type: "POST",
                url: self.baseUrl + "wfos/abort",                                        
                dataType: "json",      
                data: JSON.stringify(self.wfoModel()),			  		 
                //crossDomain: true,
                contentType : "application/json",                    
                success: function(newWFO) {                                            
                    self.messages([{severity: 'info', summary: 'Succesful Action', detail: "Process request sent successfuly", autoTimeout: 5000}]);                                         
                    self.wfoModel.status = 'ABORTED';
                    self.refreshWFOList(newWFO);
                },
                error: function (request, status, error) {
                    //alert(JSON.stringify(request));                          
                    //alert(request.responseText);     
                    self.messages([{severity: 'error', summary: 'Service Error', detail: request.responseText, autoTimeout: 5000}]);
                }                                  
            });            
                        
        }
        
        self.removeWFO = function (event, data) {                         
            
            var id = self.wfoModel().id;
                
            $.ajax({                    
                type: "DELETE",
                url: self.baseUrl + "wfos/delete/" + id,                                        
                dataType: "json",      		  		 
                //crossDomain: true,
                contentType : "application/json",                    
                success: function(id) {                                        
                    self.messages([{severity: 'info', summary: 'Succesful Action', detail: "WFO removed successfuly", autoTimeout: 5000}]);
                    self.removeFromWFOList(id);                        
                },
                error: function (request, status, error) {
                    self.messages([{severity: 'error', summary: 'Service Error', detail: request.responseText, autoTimeout: 5000}]);
                    //alert(request.responseText);                          
                }                                  
            });                     
                        
        }
        
        self.closeDialog = function(event) {
            document.getElementById("dialogMsg").close();
        }
        
        self.openDialog = function(event) {
            document.getElementById("dialogMsg").open();            
        }
       
        self.sleep = (ms) => {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        
        self.replaceYear = (date, year) => {                            
            var tokens = date.split("-");
            var newDate = year + "-" + tokens[1] + "-" + tokens[2];
            return newDate;        
        }; 

                                            
    }    
       
    return wfoViewModel;
});
