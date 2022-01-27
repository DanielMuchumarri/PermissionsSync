import { LightningElement, wire,track } from 'lwc';
import getEnvironments from '@salesforce/apex/PermissionsController.getEnvironments';
import getProfilePermissionSetFiles from '@salesforce/apex/PermissionsController.getProfilePermissionSetFiles';
import getPermissionsType from '@salesforce/apex/PermissionsController.getPermissionsType';
import getPermissions from '@salesforce/apex/PermissionsController.getPermissions';
import getPermissionsNamesAndLabels from '@salesforce/apex/PermissionsController.getPermissionsNamesAndLabels';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class PermissionsAnalyzer extends LightningElement {
profileNames1 = [];
profileNames2 = [];
selectedEnvironment1;
selectedEnvironment2;
permissionSetNames1 = [];
permissionSetNames2 = [];
segmentedData = [];
selectedProfiles1 = [];
selectedPermissionSets1 = [];
selectedProfiles2 = [];
selectedPermissionSets2 = [];
defaultPermissionsType;
allSelections = [];
envNames = [];
envDetails = [];
selectedProfiles = []; //Will have list of profiles selected by the user from multiselect on UI
selectedPermissionSets = []; //Will have list of permission sets selected by the user from multiselect on UI
permTypeOptions;
objComp1 = {}; // Used for permission values to table in UI
objComp2 = {}; // Used for permission values to table in UI
objCompAll1 = {};
objCompAll2 = {};
permTypeSelected; // Used for holding the permission comparison type that is selected by user which is either "Object Permissions" or "Field Permissions"
isFieldPermissions = false; //Used for dynamically displaying table if field permissions is selected by user for comparison
isObjectPermissions = false; //Used for dynamically displaying table if object permissions is selected by user for comparison
isUserPermissions = false;
isLoaded = true; //Used for showing spinner when loading data from Apex wire methods.
resultsOptions = [{label:'Show All',value:'Show All'},{label:'Show Differences',value:'Show Differences'}];
resultSelected = 'Show All'; //Used for holding value that is selected by user to show the results ie : "Show All" or "Show Differences"
defaultResult = 'Show All';
selectedResult = 'Show All';
isMultiple = false;
isSingle = false;
isApplicationVisibilitiesPermissions = false;
isClassAccessesPermissions = false;
isCustomMetadataPermissions = false;
isExternaDataSourcePermissions = false;
isFlowAccessesPermissions = false;
isLayoutAssignmentsPermissions = false;
isPageAccessesPermissions = false;
isRecordTypeVisibilitiesPermissions = false;
isTabVisibilitiesPermissions = false;
permissionNamesAndLabels = new Map();

@wire(getPermissionsNamesAndLabels)
wirePermissionsNamesAndLabels({error,data}){
    if(data){
        for(let index in data){
            let tmpObj = data[index];
            this.permissionNamesAndLabels.set(tmpObj.DeveloperName,tmpObj.Permissions_Label__c);
        }        
    }else if(error){
        console.log('::::::Error in fetching permission names and labels::::');
    }
}

@wire(getEnvironments)
wireEnvironments({error,data}){
    let tmpEnvNames = [];
    if(data){
        for(var index in data){
            let envLabel = data[index].Label;
            let envId = data[index].Id;
            tmpEnvNames.push({label:envLabel,value:envId});
        }
        this.envNames = [...tmpEnvNames];
        this.envDetails = data;
    } else if(error){
        console.log('::::::Error in fetching environments::::');
    }
}

@wire(getPermissionsType)
wirePermissionsType({error,data}){
    console.log('***Permissions Type******');
    console.log(JSON.stringify(data));
    let permTypeArray = [];
    for(let index in data){
        let permType = {};
        let label = data[index].Label;
        permType.label = label;
        permType.value = label;
        if(data[index].default__c == true){
            this.defaultPermissionsType = label;
            this.permTypeSelected = label;
        }
        permTypeArray.push(permType);        
    }
    this.permTypeOptions = permTypeArray;
}

handleFirstEnvChange(event){
    let firstEnvironmentId = event.detail.value;
    this.selectedEnvironment1 = firstEnvironmentId;
    this.loadProfilePermissionSets(firstEnvironmentId,'first');
}

handleSecondEnvChange(event){
    let secondEnvironmentId = event.detail.value;
    this.selectedEnvironment2 = secondEnvironmentId;
    this.loadProfilePermissionSets(secondEnvironmentId,'second');
}

handleSelectedProfiles(event){
    console.log(JSON.stringify(event.detail));
    let tmp = event.detail;
    let tmpSelectedEnviornment1 = this.selectedEnvironment1;
    let tmpSelectedEnviornment2 = this.selectedEnvironment2;
    if(tmp.env == 'first'){
        if(tmp.selectedProfiles !==  null && tmp.selectedProfiles !== undefined){
            let tmpArray = [];
            tmp.selectedProfiles.forEach(function(val){
                tmpArray.push({'env':'first','type_x':'Profile','fullName':val,'envId':tmpSelectedEnviornment1});
            });
            this.selectedProfiles1 = tmpArray;
        }
    }else if(tmp.env == 'second'){
        if(tmp.selectedProfiles !==  null && tmp.selectedProfiles !== undefined){
            let tmpArray = [];
            tmp.selectedProfiles.forEach(function(val){
                tmpArray.push({'env':'second','type_x':'Profile','fullName':val,'envId':tmpSelectedEnviornment2});
            });
            this.selectedProfiles2 = tmpArray;
        }
    }    
}

handleSelectedPermissionSets(event){
    console.log(JSON.stringify(event.detail));
    let tmp = event.detail;
    let tmpSelectedEnviornment1 = this.selectedEnvironment1;
    let tmpSelectedEnviornment2 = this.selectedEnvironment2;
    if(tmp.env == 'first'){
        if(tmp.selectedPermissionSets !==  null && tmp.selectedPermissionSets !== undefined){
            let tmpArray = [];
            tmp.selectedPermissionSets.forEach(function(val){
                tmpArray.push({'env':'first','type_x':'PermissionSet','fullName':val,'envId':tmpSelectedEnviornment1});
            });
            this.selectedPermissionSets1 = tmpArray;
        }
    }else if(tmp.env == 'second'){
        if(tmp.selectedPermissionSets !==  null && tmp.selectedPermissionSets !== undefined){
            let tmpArray = [];
            tmp.selectedPermissionSets.forEach(function(val){
                tmpArray.push({'env':'second','type_x':'PermissionSet','fullName':val,'envId':tmpSelectedEnviornment2});
            });
            this.selectedPermissionSets2 = tmpArray;
        }
    } 
}

get noRecordsFound(){
    return (this.objComp1.hasOwnProperty('envId') && this.objComp1.records !== null && this.objComp1.records !== undefined &&
    this.objComp1.records.length == 0 && this.objComp2.hasOwnProperty('envId') && this.objComp2.records !== null && this.objComp2.records !== undefined && 
    this.objComp2.records.length == 0 )?true:false;
}

get noRecordsFoundSingular(){
    return (this.objComp1.hasOwnProperty('envId') && this.objComp1.records !== null && this.objComp1.records !== undefined &&
    this.objComp1.records.length == 0 )?true:false;
}

loadProfilePermissionSets(EnvironmentId,isFirstOrSecond){
    let tmpProfilePermissions1;
    this.isLoaded = false;
    getProfilePermissionSetFiles({envId:EnvironmentId})
    .then(data=>{
        if(data !== null && data !== undefined && data.length > 0 ){
            console.log('Load ProfilePermission Sets ****');
            console.log(JSON.stringify(data));
            if(isFirstOrSecond == 'first'){
                this.populateProfilePermissionSets(data,'first');
            }else if(isFirstOrSecond == 'second'){
                this.populateProfilePermissionSets(data,'second');
            }
        }else{
            this.showToast('Error!!','Connection might have expired, Please reselect environment to create new connection','sticky','warning');
        }
        this.isLoaded = true;
    })
    .catch(error => {
        this.showToast('Error!!','Error in Loading Profile,PermissionSets:::'+error,'sticky','error');
    });
}

populateProfilePermissionSets(profilePermissions,isFirstOrSecond)
{
    let tmpProfileNames = [];
    let tmpPermissionSetNames = [];
    if(profilePermissions != null && profilePermissions !== undefined){
        for(let index in profilePermissions){
            let perm = profilePermissions[index];
            if(perm.type_x == 'Profile'){
                tmpProfileNames.push({'label':perm.fullName,'value':perm.fullName});
            }else if(perm.type_x == 'PermissionSet'){
                tmpPermissionSetNames.push({'label':perm.fullName,'value':perm.fullName});
            }
        }
        if(isFirstOrSecond == 'first'){
            this.capitalizeFirstLetter(tmpProfileNames);
            this.sortProfilePermissionSetNames(tmpProfileNames);
            this.profileNames1 = [...tmpProfileNames];
            this.capitalizeFirstLetter(tmpPermissionSetNames);
            this.sortProfilePermissionSetNames(tmpPermissionSetNames)
            this.permissionSetNames1 = [...tmpPermissionSetNames];
        }else if(isFirstOrSecond == 'second'){
            this.capitalizeFirstLetter(tmpProfileNames);
            this.sortProfilePermissionSetNames(tmpProfileNames);
            this.profileNames2 = [...tmpProfileNames];
            this.capitalizeFirstLetter(tmpPermissionSetNames);
            this.sortProfilePermissionSetNames(tmpPermissionSetNames);
            this.permissionSetNames2 = [...tmpPermissionSetNames];
        }
    }
}

get objComp1Expression(){
    return (this.objComp1 !== null && this.objComp1 !== undefined && this.objComp1.records !== null && 
        this.objComp1.records !== undefined && this.objComp1.records.length >0)?true:false;
}

get objComp2Expression(){
    return (this.objComp2 !== null && this.objComp2 !== undefined && this.objComp2.records !== null && 
        this.objComp2.records !== undefined && this.objComp2.records.length >0)?true:false;
}


capitalizeFirstLetter(objArray){
    objArray.forEach(function(obj){
        obj.value = obj.value.charAt(0).toUpperCase() + obj.value.slice(1);
    });
}

sortProfilePermissionSetNames(objArray){
    objArray.sort((a,b)=> (a.value > b.value ? 1 : -1));
}


/** Show results handler method, called when user selected Show All or Show Differences */
handleResultsChange(event){
    let result = event.detail.value; 
    this.selectedResult = result;
    this.resultsChangeProcessing(result);
}

resultsChangeProcessing(result){
    if(result === 'Show Differences'){
        let objArray1 = {};
        objArray1 = this.objComp1;
        if(objArray1 !== null && objArray1 !== undefined && objArray1.records !== null && objArray1.records !== undefined && objArray1.records.length >0){
            let filteredObjArray = this.filterDifferences(objArray1.records);
            if(!this.objCompAll1.hasOwnProperty('envId')){
                let tmpObjComp = {};
                tmpObjComp = this.objComp1;
                this.objCompAll1 =  this.copyObject(this.objComp1); //JSON.parse(JSON.stringify(this.objComp1)); //Object.assign({}, this.objComp1); //{...tmpObjComp};
            }            
            objArray1.records = [];
            objArray1.records = filteredObjArray;
            this.objComp1 = {};
            this.objComp1 = {...objArray1};
        }
        let objArray2 = {};
        objArray2 = this.objComp2;
        if(objArray2 !== null && objArray2 !== undefined && objArray2.records !== null && objArray2.records !== undefined && objArray2.records.length >0){
            let filteredObjArray = this.filterDifferences(objArray2.records);
            if(!this.objCompAll2.hasOwnProperty('envId')){
                let tmpObjComp = {};
                tmpObjComp = this.objComp2;
                this.objCompAll2 =  this.copyObject(this.objComp2);//JSON.parse(JSON.stringify(this.objComp2)); //Object.assign({}, this.objComp2); //{...tmpObjComp};
            }
            objArray2.records = [];
            objArray2.records = [...filteredObjArray];
            this.objComp2 = {};
            this.objComp2 = {...objArray2};
        }         
    }else if(result === 'Show All'){
        if(this.objCompAll1.hasOwnProperty('envId')){
            this.objComp1 = {};
            this.objComp1 = this.copyObject(this.objCompAll1);
        }
        if(this.objCompAll2.hasOwnProperty('envId')){
            this.objComp2 = {};
            this.objComp2 = this.copyObject(this.objCompAll2);
        }
    }
}

copyObject(obj){
    let copy = Object.create(obj);
    for(let prop in obj){
        if(obj.hasOwnProperty(prop)){
            copy[prop] = obj[prop];
        }
    }
    return copy;
}

filterDifferences(objArray){
    let filteredObjArray = [];   
    for(let index in objArray) {
        let obj = objArray[index];
        if(obj.difference == "true"){
            filteredObjArray.push(obj);
        }
    }
    return filteredObjArray;
}

get isFieldPermissions(){
    return (this.permTypeSelected !== null && this.permTypeSelected !== undefined && this.permTypeSelected == 'Field Permissions'?true:false);
}

get isObjectPermissions(){
    return (this.permTypeSelected !== null && this.permTypeSelected !== undefined && this.permTypeSelected == 'Object Permissions'?true:false);
}


/** Called when user selects a object permission or field permission for comparison  */
handlePermTypeChange(event){

    console.log('****handlePermTypeChange******');
    console.log(JSON.stringify(this.selectedProfiles1));
    console.log(JSON.stringify(this.selectedProfiles2));
    console.log(JSON.stringify(this.selectedPermissionSets1));
    console.log(JSON.stringify(this.selectedPermissionSets2));

    /***Reset values */
    this.objComp1 = [];
    this.objComp2 = [];
    //this.resultSelected = 'Show All';
    //let tmpResultsOptions = this.resultsOptions;
     //this.resultsOptions = []; //JSON.parse(JSON.stringify(this.resultsOptions));
     //this.resultsOptions = [...tmpResultsOptions];
    // this.resultsOptions = [{label:'Show All',value:'Show All'},{label:'Show Differences',value:'Show Differences'}];
    // this.defaultResult = undefined;
    //this.defaultResult = 'Show All';
    //this.selectedResult = 'Show All';
    

    let permType =  event.detail.value;
    this.permTypeSelected = permType;
    //Call method to start comparison based on permission type change.
    let tmpSegmentedData = [];
    tmpSegmentedData = JSON.parse(JSON.stringify(this.segmentedData));
    this.isLoaded = false;
    this.permissionsComparisonInit(tmpSegmentedData);
    this.resultsChangeProcessing(this.selectedResult);
    
}

/***handler method which is invoked when user selects a value in dual list box  */
handleProfileChange(event){
    let selectedValues = event.detail.value;
    this.selectedProfiles = selectedValues;
}

/***handler method which is invoked when user selects a value in dual list box  */
handlePermissionSetChange(event){
    this.selectedPermissionSets = event.detail.value;
}

invokeComparison(event){
    this.isLoaded = false;
    let allSelections = this.sanityCheckNumberOfProfilesPermissionSets();
    this.allSelections = allSelections;
    if(allSelections !== null && allSelections !== undefined){
        if(allSelections.length >2){
            this.showToast('Error!!','More than two profiles or permission sets or combination is not allowed','sticky','error');
            return;
        }else if(allSelections.length == 1 || allSelections.length ==2){
            console.log(JSON.stringify(allSelections)); 
            this.getPermissions(allSelections);
        }
    }else{
        this.showToast('Error!!','Select atleast 2 profiles or permission sets or combination for comparison','sticky','error');
        return;
    }
}

getPermissions(allSelections){
    console.log('inside get permissions');
    let segmentedDataArray = [];
    getPermissions({'wrapper':allSelections})
    .then(data=>{
        console.log('Object Selections are successful');
        console.log(JSON.stringify(data));
        segmentedDataArray = this.dataSegmentation(data);
        if(segmentedDataArray !== null && segmentedDataArray !== undefined){
            if(segmentedDataArray.length == 2){
                console.log('**segmentedDataArray********');
                console.log(JSON.stringify(segmentedDataArray));
                this.segmentedData = [];
                this.segmentedData = JSON.parse(JSON.stringify(segmentedDataArray)); //[...segmentedDataArray];
                this.permissionsComparisonInit(segmentedDataArray);                
            } else if(segmentedDataArray.length == 1){
                console.log('**segmentedDataArray********');
                console.log(JSON.stringify(segmentedDataArray));
                this.segmentedData = [];
                this.segmentedData = JSON.parse(JSON.stringify(segmentedDataArray)); //[...segmentedDataArray];
                this.permissionsComparisonInit(segmentedDataArray);

            }
        }        
    })
    .catch(error => {
        this.showToast('Error!!',error,'sticky','error');
    });    
}

permissionsComparisonInit(segmentedDataArray){
    //Restting variables
    this.objCompAll1 = {};
    this.objCompAll2 = {};

    let tmpObj1;
    let tmpObj2;
    let tmpObjArray1 = [];
    let tmpObjArray2 = [];
    let map1 = new Map();
    let map2 = new Map();

    if(segmentedDataArray.length == 2){
        tmpObj1 = segmentedDataArray[0];
        tmpObj2 = segmentedDataArray[1];
        this.permissionsComparisonExecution(tmpObj1,tmpObj2,this.permTypeSelected,'LTR',map1,map2);
        this.permissionsComparisonExecution(tmpObj1,tmpObj2,this.permTypeSelected,'RTL',map1,map2);
       if(tmpObj1 != null && tmpObj1 !== undefined && tmpObj2 !== null && tmpObj2 !== undefined ){
           if(this.permTypeSelected == 'Object Permissions'){
               tmpObjArray1 = [...map1.values()];
               tmpObjArray2 = [...map2.values()];
               this.permissionsSorting(tmpObjArray1,tmpObjArray2,this.permTypeSelected);
               this.keyGeneration(tmpObjArray1,tmpObjArray2);            
               tmpObj1.records = tmpObjArray1;
               tmpObj2.records = tmpObjArray2;
               this.objComp1 = tmpObj1;
               this.objComp2 = tmpObj2;
           }else if(this.permTypeSelected == 'Field Permissions'){
               tmpObjArray1 = [...map1.values()];
               tmpObjArray2 = [...map2.values()];
               this.permissionsSorting(tmpObjArray1,tmpObjArray2,this.permTypeSelected);
               this.keyGeneration(tmpObjArray1,tmpObjArray2);            
               tmpObj1.records = tmpObjArray1;
               tmpObj2.records = tmpObjArray2;
               this.objComp1 = tmpObj1;
               this.objComp2 = tmpObj2;
           }else if(this.permTypeSelected == 'User Permissions'){
               tmpObjArray1 = [...map1.values()];
               tmpObjArray2 = [...map2.values()];
               this.permissionsSorting(tmpObjArray1,tmpObjArray2,this.permTypeSelected);
               this.keyGeneration(tmpObjArray1,tmpObjArray2);            
               this.updatePermissionsNameWithLabel(tmpObjArray1);
               this.updatePermissionsNameWithLabel(tmpObjArray2);
               tmpObj1.records = tmpObjArray1;
               tmpObj2.records = tmpObjArray2;
               this.objComp1 = tmpObj1;
               this.objComp2 = tmpObj2;               
           }else if(this.permTypeSelected == 'Application Visibilities'){
            tmpObjArray1 = [...map1.values()];
            tmpObjArray2 = [...map2.values()];
            this.permissionsSorting(tmpObjArray1,tmpObjArray2,this.permTypeSelected);
            this.keyGeneration(tmpObjArray1,tmpObjArray2);            
            tmpObj1.records = tmpObjArray1;
            tmpObj2.records = tmpObjArray2;
            this.objComp1 = tmpObj1;
            this.objComp2 = tmpObj2;
        }else if(this.permTypeSelected == 'Class Accesses'){
            tmpObjArray1 = [...map1.values()];
            tmpObjArray2 = [...map2.values()];
            this.permissionsSorting(tmpObjArray1,tmpObjArray2,this.permTypeSelected);
            this.keyGeneration(tmpObjArray1,tmpObjArray2);            
            tmpObj1.records = tmpObjArray1;
            tmpObj2.records = tmpObjArray2;
            this.objComp1 = tmpObj1;
            this.objComp2 = tmpObj2;
        }else if(this.permTypeSelected == 'Custom Metadata Type Accesses'){
            tmpObjArray1 = [...map1.values()];
            tmpObjArray2 = [...map2.values()];
            this.permissionsSorting(tmpObjArray1,tmpObjArray2,this.permTypeSelected);
            this.keyGeneration(tmpObjArray1,tmpObjArray2);            
            tmpObj1.records = tmpObjArray1;
            tmpObj2.records = tmpObjArray2;
            this.objComp1 = tmpObj1;
            this.objComp2 = tmpObj2;
        }else if(this.permTypeSelected == 'External DataSource Accesses'){
            tmpObjArray1 = [...map1.values()];
            tmpObjArray2 = [...map2.values()];
            this.permissionsSorting(tmpObjArray1,tmpObjArray2,this.permTypeSelected);
            this.keyGeneration(tmpObjArray1,tmpObjArray2);            
            tmpObj1.records = tmpObjArray1;
            tmpObj2.records = tmpObjArray2;
            this.objComp1 = tmpObj1;
            this.objComp2 = tmpObj2;
        }else if(this.permTypeSelected == 'Flow Accesses'){
            tmpObjArray1 = [...map1.values()];
            tmpObjArray2 = [...map2.values()];
            this.permissionsSorting(tmpObjArray1,tmpObjArray2,this.permTypeSelected);
            this.keyGeneration(tmpObjArray1,tmpObjArray2);            
            tmpObj1.records = tmpObjArray1;
            tmpObj2.records = tmpObjArray2;
            this.objComp1 = tmpObj1;
            this.objComp2 = tmpObj2;
        }else if(this.permTypeSelected == 'Layout Assignments'){
            tmpObjArray1 = [...map1.values()];
            tmpObjArray2 = [...map2.values()];
            this.permissionsSorting(tmpObjArray1,tmpObjArray2,this.permTypeSelected);
            this.keyGeneration(tmpObjArray1,tmpObjArray2);            
            tmpObj1.records = tmpObjArray1;
            tmpObj2.records = tmpObjArray2;
            this.objComp1 = tmpObj1;
            this.objComp2 = tmpObj2;            
        }else if(this.permTypeSelected == 'Page Accesses'){
            tmpObjArray1 = [...map1.values()];
            tmpObjArray2 = [...map2.values()];
            this.permissionsSorting(tmpObjArray1,tmpObjArray2,this.permTypeSelected);
            this.keyGeneration(tmpObjArray1,tmpObjArray2);            
            tmpObj1.records = tmpObjArray1;
            tmpObj2.records = tmpObjArray2;
            this.objComp1 = tmpObj1;
            this.objComp2 = tmpObj2;
        }else if(this.permTypeSelected == 'RecordType Visibilities'){
            tmpObjArray1 = [...map1.values()];
            tmpObjArray2 = [...map2.values()];
            this.permissionsSorting(tmpObjArray1,tmpObjArray2,this.permTypeSelected);
            this.keyGeneration(tmpObjArray1,tmpObjArray2);            
            tmpObj1.records = tmpObjArray1;
            tmpObj2.records = tmpObjArray2;
            this.objComp1 = tmpObj1;
            this.objComp2 = tmpObj2;
        }else if(this.permTypeSelected == 'Tab Visibilities'){
            tmpObjArray1 = [...map1.values()];
            tmpObjArray2 = [...map2.values()];
            this.permissionsSorting(tmpObjArray1,tmpObjArray2,this.permTypeSelected);
            this.keyGeneration(tmpObjArray1,tmpObjArray2);            
            tmpObj1.records = tmpObjArray1;
            tmpObj2.records = tmpObjArray2;
            this.objComp1 = tmpObj1;
            this.objComp2 = tmpObj2;
        }
       }
       this.isSingle = false;
       this.isMultiple = true;       
    }else if(segmentedDataArray.length == 1){
        let tmpObj1 = segmentedDataArray[0];
        if(this.permTypeSelected == 'Object Permissions'){
            map1 = this.ConvertToMap(this.permTypeSelected,tmpObj1.records.objectPermissions);
            tmpObjArray1 = [...map1.values()];
            this.permissionsSorting(tmpObjArray1,null,this.permTypeSelected);
            this.keyGeneration(tmpObjArray1,null);
            tmpObj1.records = tmpObjArray1;
            this.objComp1 = tmpObj1;
        }else if(this.permTypeSelected == 'Field Permissions'){
            map1 = this.ConvertToMap(this.permTypeSelected,tmpObj1.records.fieldPermissions);
            tmpObjArray1 = [...map1.values()];
            this.permissionsSorting(tmpObjArray1,null,this.permTypeSelected);
            this.keyGeneration(tmpObjArray1,null);
            tmpObj1.records = tmpObjArray1;
            this.objComp1 = tmpObj1;
        }else if(this.permTypeSelected == 'User Permissions'){
            map1 = this.ConvertToMap(this.permTypeSelected,tmpObj1.records.userPermissions);
            tmpObjArray1 = [...map1.values()];
            this.permissionsSorting(tmpObjArray1,null,this.permTypeSelected);
            this.keyGeneration(tmpObjArray1,null);
            this.updatePermissionsNameWithLabel(tmpObjArray1);
            tmpObj1.records = tmpObjArray1;
            this.objComp1 = tmpObj1;
        }else if(this.permTypeSelected == 'Application Visibilities'){
            map1 = this.ConvertToMap(this.permTypeSelected,tmpObj1.records.applicationVisibilities);
            tmpObjArray1 = [...map1.values()];
            this.permissionsSorting(tmpObjArray1,null,this.permTypeSelected);
            this.keyGeneration(tmpObjArray1,null);   
            tmpObj1.records = tmpObjArray1;
            this.objComp1 = tmpObj1;
        }else if(this.permTypeSelected == 'Class Accesses'){
            map1 = this.ConvertToMap(this.permTypeSelected,tmpObj1.records.classAccesses);
            tmpObjArray1 = [...map1.values()];
            this.permissionsSorting(tmpObjArray1,null,this.permTypeSelected);
            this.keyGeneration(tmpObjArray1,null);   
            tmpObj1.records = tmpObjArray1;
            this.objComp1 = tmpObj1;
        }else if(this.permTypeSelected == 'Custom Metadata Type Accesses'){
            map1 = this.ConvertToMap(this.permTypeSelected,tmpObj1.records.customMetadataTypeAccesses);
            tmpObjArray1 = [...map1.values()];
            this.permissionsSorting(tmpObjArray1,null,this.permTypeSelected);
            this.keyGeneration(tmpObjArray1,null);   
            tmpObj1.records = tmpObjArray1;
            this.objComp1 = tmpObj1;
        }else if(this.permTypeSelected == 'External DataSource Accesses'){
            map1 = this.ConvertToMap(this.permTypeSelected,tmpObj1.records.externalDataSourceAccesses);
            tmpObjArray1 = [...map1.values()];
            this.permissionsSorting(tmpObjArray1,null,this.permTypeSelected);
            this.keyGeneration(tmpObjArray1,null);   
            tmpObj1.records = tmpObjArray1;
            this.objComp1 = tmpObj1;
        }else if(this.permTypeSelected == 'Flow Accesses'){
            map1 = this.ConvertToMap(this.permTypeSelected,tmpObj1.records.flowAccesses);
            tmpObjArray1 = [...map1.values()];
            this.permissionsSorting(tmpObjArray1,null,this.permTypeSelected);
            this.keyGeneration(tmpObjArray1,null);   
            tmpObj1.records = tmpObjArray1;
            this.objComp1 = tmpObj1;
        }else if(this.permTypeSelected == 'Layout Assignments'){
            map1 = this.ConvertToMap(this.permTypeSelected,tmpObj1.records.layoutAssignments);
            tmpObjArray1 = [...map1.values()];
            this.permissionsSorting(tmpObjArray1,null,this.permTypeSelected);
            this.keyGeneration(tmpObjArray1,null);   
            tmpObj1.records = tmpObjArray1;
            this.objComp1 = tmpObj1;
        }else if(this.permTypeSelected == 'Page Accesses'){
            map1 = this.ConvertToMap(this.permTypeSelected,tmpObj1.records.pageAccesses);
            tmpObjArray1 = [...map1.values()];
            this.permissionsSorting(tmpObjArray1,null,this.permTypeSelected);
            this.keyGeneration(tmpObjArray1,null);   
            tmpObj1.records = tmpObjArray1;
            this.objComp1 = tmpObj1;            
        }else if(this.permTypeSelected == 'RecordType Visibilities'){
            map1 = this.ConvertToMap(this.permTypeSelected,tmpObj1.records.recordTypeVisibilities);
            tmpObjArray1 = [...map1.values()];
            this.permissionsSorting(tmpObjArray1,null,this.permTypeSelected);
            this.keyGeneration(tmpObjArray1,null);   
            tmpObj1.records = tmpObjArray1;
            this.objComp1 = tmpObj1;
        }else if(this.permTypeSelected == 'Tab Visibilities'){
            map1 = this.ConvertToMap(this.permTypeSelected,tmpObj1.records.tabVisibilities);
            tmpObjArray1 = [...map1.values()];
            this.permissionsSorting(tmpObjArray1,null,this.permTypeSelected);
            this.keyGeneration(tmpObjArray1,null);   
            tmpObj1.records = tmpObjArray1;
            this.objComp1 = tmpObj1;
        }
        this.isMultiple = false;
        this.isSingle = true;
    }
    this.setPermissionsVisiblity(this.permTypeSelected);
    this.resultsChangeProcessing(this.selectedResult);
    this.isLoaded = true;

}

updatePermissionsNameWithLabel(objArray){
    for(let index in objArray){
        let obj = objArray[index];
        if(this.permissionNamesAndLabels.has(obj.name)){
            if(obj.name_display != 'N/A'){
                obj.name_display = this.permissionNamesAndLabels.get(obj.name);
            }
        }
    }
}

setPermissionsVisiblity(permTypeSelected){
    this.isObjectPermissions = false;
    this.isFieldPermissions = false;
    this.isUserPermissions = false;
    this.isApplicationVisibilitiesPermissions = false;
    this.isClassAccessesPermissions = false;
    this.isCustomMetadataPermissions = false;
    this.isExternaDataSourcePermissions = false;
    this.isFlowAccessesPermissions = false;
    this.isLayoutAssignmentsPermissions = false;
    this.isPageAccessesPermissions = false;
    this.isRecordTypeVisibilitiesPermissions = false;
    this.isTabVisibilitiesPermissions = false;

    if(permTypeSelected == 'Object Permissions'){
        this.isObjectPermissions = true;
    }else if(permTypeSelected == 'Field Permissions'){
        this.isFieldPermissions = true;
    }else if(permTypeSelected == 'User Permissions'){
        this.isUserPermissions = true;
    }else if(permTypeSelected == 'Application Visibilities'){
        this.isApplicationVisibilitiesPermissions = true;
    }else if(permTypeSelected == 'Class Accesses'){
        this.isClassAccessesPermissions = true;
    }else if(permTypeSelected == 'Custom Metadata Type Accesses'){
        this.isCustomMetadataPermissions = true;
    }else if(permTypeSelected == 'External DataSource Accesses'){
        this.isExternaDataSourcePermissions = true;
    }else if(permTypeSelected == 'Flow Accesses'){
        this.isFlowAccessesPermissions = true;
    }else if(permTypeSelected == 'Layout Assignments'){
        this.isLayoutAssignmentsPermissions = true;
    }else if(permTypeSelected == 'Page Accesses'){
        this.isPageAccessesPermissions = true;
    }else if(permTypeSelected == 'RecordType Visibilities'){
        this.isRecordTypeVisibilitiesPermissions = true;
    }else if(permTypeSelected == 'Tab Visibilities'){
        this.isTabVisibilitiesPermissions = true;
    }
}

keyGeneration(objArray1,objArray2){
    let rowId = 1;
    if(objArray1 !== null && objArray1 !== undefined && objArray1.length >0 ){
        objArray1.forEach(function(obj){
            obj.key = rowId;
            rowId++;        
        });
    }
    if(objArray2 !== null && objArray2 !== undefined && objArray2.length >0 ){
        objArray2.forEach(function(obj){
            obj.key =rowId;
            rowId++;
        });
    }    
}

permissionsSorting(objArray1,objArray2,permTypeSelected){
    if(objArray1 !== null && objArray1 !== undefined && objArray1.length >0 ){
		if(permTypeSelected == 'Object Permissions'){
			objArray1.sort((a,b)=> (a.object_x > b.object_x ? 1 : -1));
		}else if(permTypeSelected == 'Field Permissions'){
			objArray1.sort((a,b)=> (a.field > b.field ? 1 : -1));
		}else if(permTypeSelected == 'User Permissions'){
			objArray1.sort((a,b)=> (a.name > b.name ? 1 : -1));
		}else if(permTypeSelected == 'Application Visibilities'){
			objArray1.sort((a,b)=> (a.application > b.application ? 1 : -1));
		}else if(permTypeSelected == 'Class Accesses'){
			objArray1.sort((a,b)=> (a.apexClass > b.apexClass ? 1 : -1));
		}else if(permTypeSelected == 'Custom Metadata Type Accesses'){
			objArray1.sort((a,b)=> (a.name > b.name ? 1 : -1));
		}else if(permTypeSelected == 'External DataSource Accesses'){
			objArray1.sort((a,b)=> (a.externalDataSource > b.externalDataSource ? 1 : -1));
		}else if(permTypeSelected == 'Flow Accesses'){
			objArray1.sort((a,b)=> (a.flow > b.flow ? 1 : -1));
		}else if(permTypeSelected == 'Layout Assignments'){
			objArray1.sort((a,b)=> (a.layout > b.layout ? 1 : -1));
		}else if(permTypeSelected == 'Page Accesses'){
			objArray1.sort((a,b)=> (a.apexPage > b.apexPage ? 1 : -1));
		}else if(permTypeSelected == 'RecordType Visibilities'){
			objArray1.sort((a,b)=> (a.recordType > b.recordType ? 1 : -1));
		}else if(permTypeSelected == 'Tab Visibilities'){
			objArray1.sort((a,b)=> (a.tab > b.tab ? 1 : -1));
		}
        
    }
    if(objArray2 !== null && objArray2 !== undefined && objArray2.length >0 ){
        if(permTypeSelected == 'Object Permissions'){
			objArray2.sort((a,b)=> (a.object_x > b.object_x ? 1 : -1));
		}else if(permTypeSelected == 'Field Permissions'){
			objArray2.sort((a,b)=> (a.field > b.field ? 1 : -1));
		}else if(permTypeSelected == 'User Permissions'){
			objArray2.sort((a,b)=> (a.name > b.name ? 1 : -1));
		}else if(permTypeSelected == 'Application Visibilities'){
			objArray2.sort((a,b)=> (a.application > b.application ? 1 : -1));
		}else if(permTypeSelected == 'Class Accesses'){
			objArray2.sort((a,b)=> (a.apexClass > b.apexClass ? 1 : -1));
		}else if(permTypeSelected == 'Custom Metadata Type Accesses'){
			objArray2.sort((a,b)=> (a.name > b.name ? 1 : -1));
		}else if(permTypeSelected == 'External DataSource Accesses'){
			objArray2.sort((a,b)=> (a.externalDataSource > b.externalDataSource ? 1 : -1));
		}else if(permTypeSelected == 'Flow Accesses'){
			objArray2.sort((a,b)=> (a.flow > b.flow ? 1 : -1));
		}else if(permTypeSelected == 'Layout Assignments'){
			objArray2.sort((a,b)=> (a.layout > b.layout ? 1 : -1));
		}else if(permTypeSelected == 'Page Accesses'){
			objArray2.sort((a,b)=> (a.apexPage > b.apexPage ? 1 : -1));
		}else if(permTypeSelected == 'RecordType Visibilities'){
			objArray2.sort((a,b)=> (a.recordType > b.recordType ? 1 : -1));
		}else if(permTypeSelected == 'Tab Visibilities'){
			objArray2.sort((a,b)=> (a.tab > b.tab ? 1 : -1));
		}
    }
}



permissionsComparisonExecution(tmpObj1,tmpObj2,permTypeSelected,direction,map1,map2){
    let permissions1 = [];
    let permissions2 = [];
    let tmpMap1 = new Map();
    let tmpMap2 = new Map();

    if(tmpObj1 !== null && tmpObj1 !== undefined && tmpObj2 !== null && tmpObj2 !== undefined){
        if(tmpObj1.records !== null && tmpObj1.records !== undefined && tmpObj2.records !== null && tmpObj2.records !== undefined){
            if(permTypeSelected == 'Object Permissions'){
                if(tmpObj1.records.objectPermissions !== null && tmpObj1.records.objectPermissions !== undefined){                    
                    tmpMap1 = this.ConvertToMap(permTypeSelected,tmpObj1.records.objectPermissions);
                }
                if(tmpObj2.records.objectPermissions !== null && tmpObj2.records.objectPermissions !== undefined){                    
                    tmpMap2 = this.ConvertToMap(permTypeSelected,tmpObj2.records.objectPermissions);
                }                
                if(direction == 'LTR'){
                    if(tmpMap1 !== null && tmpMap1 !== undefined){
                        this.permissionsComparison(tmpMap1,tmpMap2,map1,map2,permTypeSelected);
                    }
                }else if(direction == 'RTL'){
                    if(tmpMap2 !== null && tmpMap2 !== undefined){
                        this.permissionsComparison(tmpMap2,tmpMap1,map2,map1,permTypeSelected);
                    }
                }
            } else if(permTypeSelected == 'Field Permissions'){
                if(tmpObj1.records.fieldPermissions !== null && tmpObj1.records.fieldPermissions !== undefined){                    
                    tmpMap1 = this.ConvertToMap(permTypeSelected,tmpObj1.records.fieldPermissions);
                }
                if(tmpObj2.records.fieldPermissions !== null && tmpObj2.records.fieldPermissions !== undefined){                    
                    tmpMap2 = this.ConvertToMap(permTypeSelected,tmpObj2.records.fieldPermissions);
                }                
                if(direction == 'LTR'){
                    if(tmpMap1 !== null && tmpMap1 !== undefined){
                        this.permissionsComparison(tmpMap1,tmpMap2,map1,map2,permTypeSelected);
                    }
                }else if(direction == 'RTL'){
                    if(tmpMap2 !== null && tmpMap2 !== undefined){
                        this.permissionsComparison(tmpMap2,tmpMap1,map2,map1,permTypeSelected);
                    }
                }
            } else if(permTypeSelected == 'User Permissions'){
                if(tmpObj1.records.userPermissions !== null && tmpObj1.records.userPermissions !== undefined){                    
                    tmpMap1 = this.ConvertToMap(permTypeSelected,tmpObj1.records.userPermissions);
                }
                if(tmpObj2.records.userPermissions !== null && tmpObj2.records.userPermissions !== undefined){                    
                    tmpMap2 = this.ConvertToMap(permTypeSelected,tmpObj2.records.userPermissions);
                }                
                if(direction == 'LTR'){
                    if(tmpMap1 !== null && tmpMap1 !== undefined){
                        this.permissionsComparison(tmpMap1,tmpMap2,map1,map2,permTypeSelected);
                    }
                }else if(direction == 'RTL'){
                    if(tmpMap2 !== null && tmpMap2 !== undefined){
                        this.permissionsComparison(tmpMap2,tmpMap1,map2,map1,permTypeSelected);
                    }
                }
            } else if(permTypeSelected == 'Application Visibilities'){
                if(tmpObj1.records.applicationVisibilities !== null && tmpObj1.records.applicationVisibilities !== undefined){                    
                    tmpMap1 = this.ConvertToMap(permTypeSelected,tmpObj1.records.applicationVisibilities);
                }
                if(tmpObj2.records.applicationVisibilities !== null && tmpObj2.records.applicationVisibilities !== undefined){                    
                    tmpMap2 = this.ConvertToMap(permTypeSelected,tmpObj2.records.applicationVisibilities);
                }                
                if(direction == 'LTR'){
                    if(tmpMap1 !== null && tmpMap1 !== undefined){
                        this.permissionsComparison(tmpMap1,tmpMap2,map1,map2,permTypeSelected);
                    }
                }else if(direction == 'RTL'){
                    if(tmpMap2 !== null && tmpMap2 !== undefined){
                        this.permissionsComparison(tmpMap2,tmpMap1,map2,map1,permTypeSelected);
                    }
                }
            }else if(permTypeSelected == 'Class Accesses'){
                if(tmpObj1.records.classAccesses !== null && tmpObj1.records.classAccesses !== undefined){                    
                    tmpMap1 = this.ConvertToMap(permTypeSelected,tmpObj1.records.classAccesses);
                }
                if(tmpObj2.records.classAccesses !== null && tmpObj2.records.classAccesses !== undefined){                    
                    tmpMap2 = this.ConvertToMap(permTypeSelected,tmpObj2.records.classAccesses);
                }                
                if(direction == 'LTR'){
                    if(tmpMap1 !== null && tmpMap1 !== undefined){
                        this.permissionsComparison(tmpMap1,tmpMap2,map1,map2,permTypeSelected);
                    }
                }else if(direction == 'RTL'){
                    if(tmpMap2 !== null && tmpMap2 !== undefined){
                        this.permissionsComparison(tmpMap2,tmpMap1,map2,map1,permTypeSelected);
                    }
                }
            }else if(permTypeSelected == 'Custom Metadata Type Accesses'){
                if(tmpObj1.records.customMetadataTypeAccesses !== null && tmpObj1.records.customMetadataTypeAccesses !== undefined){                    
                    tmpMap1 = this.ConvertToMap(permTypeSelected,tmpObj1.records.customMetadataTypeAccesses);
                }
                if(tmpObj2.records.customMetadataTypeAccesses !== null && tmpObj2.records.customMetadataTypeAccesses !== undefined){                    
                    tmpMap2 = this.ConvertToMap(permTypeSelected,tmpObj2.records.customMetadataTypeAccesses);
                }                
                if(direction == 'LTR'){
                    if(tmpMap1 !== null && tmpMap1 !== undefined){
                        this.permissionsComparison(tmpMap1,tmpMap2,map1,map2,permTypeSelected);
                    }
                }else if(direction == 'RTL'){
                    if(tmpMap2 !== null && tmpMap2 !== undefined){
                        this.permissionsComparison(tmpMap2,tmpMap1,map2,map1,permTypeSelected);
                    }
                }
            }else if(permTypeSelected == 'External DataSource Accesses'){
                if(tmpObj1.records.externalDataSourceAccesses !== null && tmpObj1.records.externalDataSourceAccesses !== undefined){                    
                    tmpMap1 = this.ConvertToMap(permTypeSelected,tmpObj1.records.externalDataSourceAccesses);
                }
                if(tmpObj2.records.externalDataSourceAccesses !== null && tmpObj2.records.externalDataSourceAccesses !== undefined){                    
                    tmpMap2 = this.ConvertToMap(permTypeSelected,tmpObj2.records.externalDataSourceAccesses);
                }                
                if(direction == 'LTR'){
                    if(tmpMap1 !== null && tmpMap1 !== undefined){
                        this.permissionsComparison(tmpMap1,tmpMap2,map1,map2,permTypeSelected);
                    }
                }else if(direction == 'RTL'){
                    if(tmpMap2 !== null && tmpMap2 !== undefined){
                        this.permissionsComparison(tmpMap2,tmpMap1,map2,map1,permTypeSelected);
                    }
                }
            }else if(permTypeSelected == 'Flow Accesses'){
                if(tmpObj1.records.flowAccesses !== null && tmpObj1.records.flowAccesses !== undefined){                    
                    tmpMap1 = this.ConvertToMap(permTypeSelected,tmpObj1.records.flowAccesses);
                }
                if(tmpObj2.records.flowAccesses !== null && tmpObj2.records.flowAccesses !== undefined){                    
                    tmpMap2 = this.ConvertToMap(permTypeSelected,tmpObj2.records.flowAccesses);
                }                
                if(direction == 'LTR'){
                    if(tmpMap1 !== null && tmpMap1 !== undefined){
                        this.permissionsComparison(tmpMap1,tmpMap2,map1,map2,permTypeSelected);
                    }
                }else if(direction == 'RTL'){
                    if(tmpMap2 !== null && tmpMap2 !== undefined){
                        this.permissionsComparison(tmpMap2,tmpMap1,map2,map1,permTypeSelected);
                    }
                }
            }else if(permTypeSelected == 'Layout Assignments'){
                if(tmpObj1.records.layoutAssignments !== null && tmpObj1.records.layoutAssignments !== undefined){                    
                    tmpMap1 = this.ConvertToMap(permTypeSelected,tmpObj1.records.layoutAssignments);
                }
                if(tmpObj2.records.layoutAssignments !== null && tmpObj2.records.layoutAssignments !== undefined){                    
                    tmpMap2 = this.ConvertToMap(permTypeSelected,tmpObj2.records.layoutAssignments);
                }                
                if(direction == 'LTR'){
                    if(tmpMap1 !== null && tmpMap1 !== undefined){
                        this.permissionsComparison(tmpMap1,tmpMap2,map1,map2,permTypeSelected);
                    }
                }else if(direction == 'RTL'){
                    if(tmpMap2 !== null && tmpMap2 !== undefined){
                        this.permissionsComparison(tmpMap2,tmpMap1,map2,map1,permTypeSelected);
                    }
                }
            }else if(permTypeSelected == 'Page Accesses'){
                if(tmpObj1.records.pageAccesses !== null && tmpObj1.records.pageAccesses !== undefined){                    
                    tmpMap1 = this.ConvertToMap(permTypeSelected,tmpObj1.records.pageAccesses);
                }
                if(tmpObj2.records.pageAccesses !== null && tmpObj2.records.pageAccesses !== undefined){                    
                    tmpMap2 = this.ConvertToMap(permTypeSelected,tmpObj2.records.pageAccesses);
                }                
                if(direction == 'LTR'){
                    if(tmpMap1 !== null && tmpMap1 !== undefined){
                        this.permissionsComparison(tmpMap1,tmpMap2,map1,map2,permTypeSelected);
                    }
                }else if(direction == 'RTL'){
                    if(tmpMap2 !== null && tmpMap2 !== undefined){
                        this.permissionsComparison(tmpMap2,tmpMap1,map2,map1,permTypeSelected);
                    }
                }
            }else if(permTypeSelected == 'RecordType Visibilities'){
                if(tmpObj1.records.recordTypeVisibilities !== null && tmpObj1.records.recordTypeVisibilities !== undefined){                    
                    tmpMap1 = this.ConvertToMap(permTypeSelected,tmpObj1.records.recordTypeVisibilities);
                }
                if(tmpObj2.records.recordTypeVisibilities !== null && tmpObj2.records.recordTypeVisibilities !== undefined){                    
                    tmpMap2 = this.ConvertToMap(permTypeSelected,tmpObj2.records.recordTypeVisibilities);
                }                
                if(direction == 'LTR'){
                    if(tmpMap1 !== null && tmpMap1 !== undefined){
                        this.permissionsComparison(tmpMap1,tmpMap2,map1,map2,permTypeSelected);
                    }
                }else if(direction == 'RTL'){
                    if(tmpMap2 !== null && tmpMap2 !== undefined){
                        this.permissionsComparison(tmpMap2,tmpMap1,map2,map1,permTypeSelected);
                    }
                }
            }else if(permTypeSelected == 'Tab Visibilities'){
                if(tmpObj1.records.tabVisibilities !== null && tmpObj1.records.tabVisibilities !== undefined){                    
                    tmpMap1 = this.ConvertToMap(permTypeSelected,tmpObj1.records.tabVisibilities);
                }
                if(tmpObj2.records.tabVisibilities !== null && tmpObj2.records.tabVisibilities !== undefined){                    
                    tmpMap2 = this.ConvertToMap(permTypeSelected,tmpObj2.records.tabVisibilities);
                }                
                if(direction == 'LTR'){
                    if(tmpMap1 !== null && tmpMap1 !== undefined){
                        this.permissionsComparison(tmpMap1,tmpMap2,map1,map2,permTypeSelected);
                    }
                }else if(direction == 'RTL'){
                    if(tmpMap2 !== null && tmpMap2 !== undefined){
                        this.permissionsComparison(tmpMap2,tmpMap1,map2,map1,permTypeSelected);
                    }
                }
            }
        }
    }    
}

permissionsComparison(tmpMap1,tmpMap2,map1,map2,permissionsType){
    let permissions1 = [];
    let permissions2 = [];
    tmpMap1.forEach(function(objPerm1,key){
        if(!map1.has(key)){
            map1.set(key,objPerm1);
        }
        if(tmpMap2.has(key)){
            let objPerm2 = tmpMap2.get(key);
            if(permissionsType == 'Object Permissions' && objPerm1.allowCreate == objPerm2.allowCreate && objPerm1.allowDelete == objPerm2.allowDelete && 
                objPerm1.allowEdit == objPerm2.allowEdit && objPerm1.allowRead == objPerm2.allowRead && objPerm1.modifyAllRecords == objPerm2.modifyAllRecords 
                && objPerm1.object_x == objPerm2.object_x && objPerm1.viewAllRecords == objPerm2.viewAllRecords){
                map2.set(key,objPerm2);                
            }else if(permissionsType == 'Field Permissions' && objPerm1.editable == objPerm2.editable && objPerm1.readable == objPerm2.readable){
				map2.set(key,objPerm2);    
			}else if(permissionsType == 'User Permissions' && objPerm1.enabled == objPerm2.enabled){
				map2.set(key,objPerm2);    
			}else if(permissionsType == 'Application Visibilities' && objPerm1.default_x == objPerm2.default_x && objPerm1.visible == objPerm2.visible){
				map2.set(key,objPerm2);    
			}else if(permissionsType == 'Class Accesses' && objPerm1.enabled == objPerm2.enabled){
				map2.set(key,objPerm2);    
			}else if(permissionsType == 'Custom Metadata Type Accesses' && objPerm1.enabled == objPerm2.enabled){
				map2.set(key,objPerm2);    
			}else if(permissionsType == 'External DataSource Accesses' && objPerm1.enabled == objPerm2.enabled ){
				map2.set(key,objPerm2);    
			}else if(permissionsType == 'Flow Accesses' && objPerm1.enabled == objPerm2.enabled){
				map2.set(key,objPerm2);    
			}else if(permissionsType == 'Layout Assignments' && objPerm1.layout == objPerm2.layout && objPerm1.recordType == objPerm2.recordType){
				map2.set(key,objPerm2);    
			}else if(permissionsType == 'Page Accesses' && objPerm1.enabled == objPerm2.enabled){
				map2.set(key,objPerm2);    
			}else if(permissionsType == 'RecordType Visibilities' && objPerm1.default_x == objPerm2.default_x && objPerm1.visible == objPerm2.visible){
				map2.set(key,objPerm2);    
			}else if(permissionsType == 'Tab Visibilities' && objPerm1.visibility == objPerm2.visibility){
				map2.set(key,objPerm2);
			}else{
                objPerm2.difference = 'true';
                objPerm2.class = 'difference';
                map2.set(key,objPerm2);                
            }
        }else{
            let permissions = {};
			if(permissionsType == 'Object Permissions'){
				permissions.allowCreate = null;
				permissions.allowDelete = null;
				permissions.allowEdit = null;
				permissions.allowRead = null;
				permissions.modifyAllRecords = null;
				permissions.object_x = objPerm1.object_x; 
				permissions.object_display = 'N/A';
				permissions.viewAllRecords = null;
            }else if(permissionsType == 'Field Permissions'){
				permissions.editable = null;
				permissions.readable = null;
				permissions.field = key;
				permissions.field_display = 'N/A';    
			}else if(permissionsType == 'User Permissions'){
			    permissions.enabled = null;
				permissions.name = key;
				permissions.name_display = 'N/A';	 
			}else if(permissionsType == 'Application Visibilities'){
			    permissions.default_x = null;
				permissions.visible = null;
				permissions.application = key;
				permissions.application_display = 'N/A';	   
			}else if(permissionsType == 'Class Accesses'){
				permissions.enabled = null;
				permissions.apexClass = key;
				permissions.apexClass_display = 'N/A';
			}else if(permissionsType == 'Custom Metadata Type Accesses'){
				permissions.enabled = null;
				permissions.name = key;
				permissions.name_display = 'N/A';				
			}else if(permissionsType == 'External DataSource Accesses'){
				permissions.enabled = null;
				permissions.externalDataSource = key;
				permissions.externalDataSource_display = 'N/A';				
			}else if(permissionsType == 'Flow Accesses'){
				permissions.enabled = null;
				permissions.flow = key;
				permissions.flow_display = 'N/A';				
			}else if(permissionsType == 'Layout Assignments'){
				permissions.recordType = null;
				permissions.layout = objPerm1.layout;
				permissions.layout_display = 'N/A';				
			}else if(permissionsType == 'Page Accesses'){
				permissions.enabled = null;
				permissions.apexPage = key;
				permissions.apexPage_display = 'N/A';				
			}else if(permissionsType == 'RecordType Visibilities'){
				permissions.default_x = null;
				permissions.visible = null;
				permissions.recordType = key;
				permissions.recordType_display = 'N/A';				
			}else if(permissionsType == 'Tab Visibilities'){
				permissions.visibility = null;
				permissions.tab = key;
				permissions.tab_display = 'N/A';				
			}			
			if(!map2.has(key)){
                map2.set(key,permissions);
            } 
        }
    });    
}

ConvertToMap(permTypeSelected,records){
    let tmpMap = new Map();
    if(records !== null && records !== undefined){
        records.forEach(function(rec){
            if(permTypeSelected == 'Object Permissions'){
                console.log(rec.object_x);
                console.log(JSON.stringify(rec));
                rec.object_display = rec.object_x;
                tmpMap.set(rec.object_x,rec);
            }else if(permTypeSelected == 'Field Permissions'){
                rec.field_display = rec.field;
                tmpMap.set(rec.field,rec);
            }else if(permTypeSelected == 'User Permissions'){
                rec.name_display = rec.name;
                tmpMap.set(rec.name,rec);
            }else if(permTypeSelected == 'Application Visibilities'){
                rec.application_display = rec.application;
                tmpMap.set(rec.application,rec);
            }else if(permTypeSelected == 'Class Accesses'){
                rec.apexClass_display = rec.apexClass;
                tmpMap.set(rec.apexClass,rec);
            }else if(permTypeSelected == 'Custom Metadata Type Accesses'){
                rec.name_display = rec.name;
                tmpMap.set(rec.name,rec);
            }else if(permTypeSelected == 'External DataSource Accesses'){
                rec.externalDataSource_display = rec.externalDataSource;
                tmpMap.set(rec.externalDataSource,rec);
            }else if(permTypeSelected == 'Flow Accesses'){
                rec.flow_display = rec.flow;
                tmpMap.set(rec.flow,rec);
            }else if(permTypeSelected == 'Layout Assignments'){
                rec.layout_display = rec.layout;
                tmpMap.set(rec.layout+rec.recordType,rec);
            }else if(permTypeSelected == 'Page Accesses'){
                rec.apexPage_display = rec.apexPage;
                tmpMap.set(rec.apexPage,rec);
            }else if(permTypeSelected == 'RecordType Visibilities'){
                rec.recordType_display = rec.recordType;
                tmpMap.set(rec.recordType,rec);
            }else if(permTypeSelected == 'Tab Visibilities'){
                rec.tab_display = rec.tab;
                tmpMap.set(rec.tab,rec);
            }
        });
    }
    return tmpMap;
}


dataSegmentation(data){
    let tmpObjArray = [];
    let tmpObj = {};
    if(data !== null && data !== undefined && data.length >0){
        if(data.length  == 1){
            let envId = data[0].envId;
            if(data[0].type_x == 'Profile'){
                if(data[0].profileResult !== null && data[0].profileResult !== undefined){
                    if(data[0].profileResult.records !==null && data[0].profileResult.records !== undefined){
                        let profilePermissions = data[0].profileResult.records;
                        if(profilePermissions.length == 1){
                            tmpObj.envId = envId;
                            tmpObj.custom = profilePermissions[0].custom;
                            tmpObj.fullName = profilePermissions[0].fullName;
                            tmpObj.userLicense = profilePermissions[0].userLicense;
                            tmpObj.records = profilePermissions[0];
                            tmpObjArray.push(tmpObj);
                            tmpObj = {};
                        }else if(profilePermissions.length == 2){
                            tmpObjArray = this.dataSegmentationPopulateMultiplePermissions(this.allSelections,envId,profilePermissions);
                        }
                    }
                }
            }else if(data[0].type_x =='PermissionSet'){
                if(data[0].permissionSetResult !== null && data[0].permissionSetResult !== undefined){
                    if(data[0].permissionSetResult.records !==null && data[0].permissionSetResult.records !== undefined){
                        let permissionSetPermissions = data[0].permissionSetResult.records;
                        if(permissionSetPermissions.length == 1){
                            tmpObj.envId = envId;
                            tmpObj.custom = permissionSetPermissions[0].custom;
                            tmpObj.fullName = permissionSetPermissions[0].fullName;
                            tmpObj.userLicense = permissionSetPermissions[0].userLicense;
                            tmpObj.records = permissionSetPermissions[0];
                            tmpObjArray.push(tmpObj);
                            tmpObj = {};
                        }else if(permissionSetPermissions.length == 2){
                            tmpObjArray = this.dataSegmentationPopulateMultiplePermissions(this.allSelections,envId,permissionSetPermissions);
                        }
                    }
                }
            }
        }else if(data.length == 2){
            for(let index in data){
                if(data[index].type_x == 'Profile'){
                    let envId = data[index].envId;
                    if(data[index].profileResult !== null && data[index].profileResult !== undefined){
                        if(data[index].profileResult.records !==null && data[index].profileResult.records !== undefined){
                            let profilePermissions = data[index].profileResult.records;
                            if(profilePermissions.length == 1){
                                tmpObj.envId = envId;
                                tmpObj.custom = profilePermissions[0].custom;
                                tmpObj.fullName = profilePermissions[0].fullName;
                                tmpObj.userLicense = profilePermissions[0].userLicense;
                                tmpObj.records = profilePermissions[0];
                            }
                        }
                    }
                }else if(data[index].type_x == 'PermissionSet'){
                    let envId = data[index].envId;
                    if(data[index].permissionSetResult !== null && data[index].permissionSetResult !== undefined){
                        if(data[index].permissionSetResult.records !==null && data[index].permissionSetResult.records !== undefined){
                            let permissionSetPermissions = data[index].permissionSetResult.records;
                            if(permissionSetPermissions.length == 1){
                                tmpObj.envId = envId;
                                tmpObj.custom = permissionSetPermissions[0].custom;
                                tmpObj.fullName = permissionSetPermissions[0].fullName;
                                tmpObj.userLicense = permissionSetPermissions[0].userLicense;
                                tmpObj.records = permissionSetPermissions[0];
                            }
                        }
                    }
                }
                tmpObjArray.push(tmpObj);
                tmpObj = {};
            }
        }
    }
    return tmpObjArray;
}

dataSegmentationPopulateMultiplePermissions(selectedObjArray,envId,permissions){
    let tmpObj = {};
    let tmpObjArray = [];    
    if(selectedObjArray !== null && selectedObjArray !== undefined){
        for(let index1 in selectedObjArray){
            console.log('1:::::' + selectedObjArray[index1]);
            for(let index in permissions){
                let permObj = permissions[index];                                            
                if(selectedObjArray[index1].fullName == permObj.fullName){
                    console.log('2::::' + permObj.fullName);
                    tmpObj.envId = envId;
                    tmpObj.custom = permObj.custom;
                    tmpObj.fullName = permObj.fullName;
                    tmpObj.userLicense = permObj.userLicense;
                    tmpObj.records = permObj;
                }
            }
            tmpObjArray.push(tmpObj);
            tmpObj = {};
        }
    }
    return tmpObjArray;
}

sanityCheckNumberOfProfilesPermissionSets(){
    let allSelections = [];
    if(this.selectedProfiles1 !== null && this.selectedProfiles1 !== undefined){
        Array.prototype.push.apply(allSelections, this.selectedProfiles1);
    }
    if(this.selectedProfiles2 !== null && this.selectedProfiles2 !== undefined){
        Array.prototype.push.apply(allSelections, this.selectedProfiles2);
    }
    if(this.selectedPermissionSets1 !== null && this.selectedPermissionSets1 !== undefined){
        Array.prototype.push.apply(allSelections, this.selectedPermissionSets1);
    }
    if(this.selectedPermissionSets2 !== null && this.selectedPermissionSets2 !== undefined){
        Array.prototype.push.apply(allSelections, this.selectedPermissionSets2);
    }
    return allSelections;
}

/***
 * fire show toast
 */
showToast(titleVar,msgVar,modeVar,variantVar){
    console.log('inside show toast method:::');
    const event = new ShowToastEvent({
        title: titleVar,
        message: msgVar,
        mode: modeVar,
        variant: variantVar
    });
    this.dispatchEvent(event);
}

}