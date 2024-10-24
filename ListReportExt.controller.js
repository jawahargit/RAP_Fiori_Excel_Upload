sap.ui.define(["sap/ui/core/Fragment","sap/m/MessageToast","xlsx"], 
    function (Fragment,MessageToast, xlsx){
        "use strict";
        return {
            // this variable will hold the data of excel file

        excelSheetsData: [],

        pDialog: null,

            openExcelUploadDialog: function(oEvent) {
                var oView = this.getView();
                if (!this.pDialog) {
                    Fragment.load({
                        id: "excel_upload",
                        name: "dtanfileupload.ext.fragment.ExcelUpload",
                        type: "XML",
                        controller: this
                    }).then((oDialog) => {
                        var oFileUploader = Fragment.byId("excel_upload", "uploadSet");
                        oFileUploader.removeAllItems();
                        this.pDialog = oDialog;
                        this.pDialog.open();
                    })
                        .catch(error => alert(error.message));
                } else {
                    var oFileUploader = Fragment.byId("excel_upload", "uploadSet");
                    oFileUploader.removeAllItems();
                    this.pDialog.open();
                }
            },
            onUploadSet: function(oEvent) {
                console.log("Upload Button Clicked!!!")
                /* TODO:Call to OData */
                // checking if excel file contains data or not

            if (!this.excelSheetsData.length) {

                MessageToast.show("Select file to Upload");

                return;
            }
            var that = this;

            var oSource = oEvent.getSource();

              // creating a promise as the extension api accepts odata call in form of promise only

              var fnAddMessage = function () {

                return new Promise((fnResolve, fnReject) => {

                    that.callOdata(fnResolve, fnReject);

                });

            };



            var mParameters = {

                sActionLabel: oSource.getText() // or "Your custom text" 

            };

            // calling the oData service using extension api

            this.extensionAPI.securedExecution(fnAddMessage, mParameters);



            this.pDialog.close();
           

            },
            onTempDownload: function (oEvent) {
                console.log("Template Download Button Clicked!!!")
                /* TODO: Excel file template download */
                // get the odata model binded to this application

             var oModel = this.getView().getModel();

             console.log(oModel.getServiceMetadata().dataServices.schema[0].entityType);
             // get the property list of the entity for which we need to download the template
             var oDtan = oModel.getServiceMetadata().dataServices.schema[0].entityType[0];
             //var oDtan = oModel.getServiceMetadata().dataServices.schema[0].entityType.find(x => x.name === 'customizingType');
             // set the list of entity property, that has to be present in excel file template

             var propertyList = ['Taxobject', 'GJAHR', 'FIACCRFA', 'TaxCountry',
                'LegalEntid', 'Bukrs', 'InputParameter1','InputParameter2', 'Counter' ,
                'Source', 'TradingPartner' , 'Prefix' ] ;
                var excelColumnList = [];

                var colList = {};
                // finding the property description corresponding to the property id

             propertyList.forEach((value, index) => {

                let property = oDtan.property.find(x => x.name === value);

                colList[property.extensions.find(x => x.name === 'label').value] = '';

            });

            excelColumnList.push(colList);
            // initialising the excel work sheet

            const ws = xlsx.utils.json_to_sheet(excelColumnList);

            // creating the new excel work book

            const wb = xlsx.utils.book_new();

            // set the file value

            xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');

            // download the created excel file

            xlsx.writeFile(wb, 'DTAN_Customfile.xlsx');

            MessageToast.show("Template File Downloading...");
 
            },
            onCloseDialog: function (oEvent) {
                this.pDialog.close();
            },
            onBeforeUploadStart: function (oEvent) {
                console.log("File Before Upload Event Fired!!!")
                /* TODO: check for file upload count */
            },
            onUploadSetComplete: function (oEvent) {
                console.log("File Uploaded!!!")
                /* TODO: Read excel file data*/
                // getting the UploadSet Control reference
            var oFileUploader = Fragment.byId("excel_upload", "uploadSet");
            // since we will be uploading only 1 file so reading the first file object
            var oFile = oFileUploader.getItems()[0].getFileObject();

            var reader = new FileReader();
            var that = this;
            reader.onload = (e) => {
                // getting the binary excel file content
                let xlsx_content = e.currentTarget.result;
                let workbook = xlsx.read(xlsx_content, { type: 'binary' });
                // here reading only the excel file sheet- Sheet1
                var excelData = xlsx.utils.sheet_to_row_object_array(workbook.Sheets["Sheet1"]);
                workbook.SheetNames.forEach(function (sheetName) {
                    // appending the excel file data to the global variable
                    that.excelSheetsData.push(xlsx.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]));
                });
                console.log("Excel Data", excelData);
                console.log("Excel Sheets Data", this.excelSheetsData);
            };
            reader.readAsBinaryString(oFile);

            MessageToast.show("Upload Successful");



            },
            onItemRemoved:function (oEvent) {
                console.log("File Remove/delete Event Fired!!!")  
                /* TODO: Clear the already read excel file data */          
            },

            // helper method to call OData
            callOdata: function (fnResolve, fnReject) {

                console.log(">>>>>>>>>>>>>>>>>>>>>")
    
                //  intializing the message manager for displaying the odata response messages
    
                var oModel = this.getView().getModel();
    
    
    
                // creating odata payload object for Building entity
    
                var payload = {};
    
    
    
                this.excelSheetsData[0].forEach((value, index) => {
    
                    // setting the payload data
    
                    payload = {
    
                        "Taxobject": value["Tax Object"].toString(),
    
                        "GJAHR": value["Fiscal year"].toString(),
    
                        "FIACCRFA": value["FI Account"].toString(),
    
                        "TaxCountry": value["Tax Country"].toString(),
    
                        "LegalEntid": value["Legal Entity"].toString(),
    
                        "Bukrs": value["Company Code"].toString(),
    
                        "InputParameter1": value["Input Parameter1"].toString(),
    
                        "InputParameter2": value["Input Parameter2"].toString(),

                        "Counter": value["Counter"].toString(),

                        "Source": value["Source"].toString(),

                        "TradingPartner": value["Trading Partner"].toString(),

                        "Prefix": value["Prefix"].toString()
    
                    };
    
                  
    
                    console.log("This is payload")
    
                   console.log(payload)
    
                    // setting excel file row number for identifying the exact row in case of error or success
    
                    payload.ExcelRowNumber = (index + 1);
    
                    // calling the odata service
    
                    oModel.create("/customizing", payload, {
    
                        success: (result) => {
    
                            console.log('>>>>>>>>>>>>>>>>>')
    
                            console.log(result);
    
                            var oMessageManager = sap.ui.getCore().getMessageManager();
    
                            var oMessage = new sap.ui.core.message.Message({
    
                                message: "Customizing data uploaded: ",
    
                                persistent: true, // create message as transition message
    
                                type: sap.ui.core.MessageType.Success
    
                            });
    
                            oMessageManager.addMessages(oMessage);
    
                            fnResolve();
    
                        },
    
                        error: fnReject
    
                    });
    
                });
    
            }   


        };
    });