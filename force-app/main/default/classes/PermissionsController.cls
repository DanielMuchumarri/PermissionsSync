public with sharing class PermissionsController {
   
    @AuraEnabled(cacheable=true)
    public static List<Environment__mdt> getEnvironments(){
        List<Environment__mdt> envList = [SELECT Id,DeveloperName,Label FROM Environment__mdt];
        return envList;
    }

    @AuraEnabled
    public static List<soapSforceCom200604Metadata.PermissionsResponseWrapper> getPermissions(List<soapSforceCom200604Metadata.ObjectWrapper> wrapper){
        List<soapSforceCom200604Metadata.PermissionsResponseWrapper> respListWrapper = new List<soapSforceCom200604Metadata.PermissionsResponseWrapper>();
        Map<String,Map<String, List<soapSforceCom200604Metadata.ObjectWrapper>>> requestMap = new Map<String,Map<String, List<soapSforceCom200604Metadata.ObjectWrapper>>>();
        if(wrapper != null){
            for(soapSforceCom200604Metadata.ObjectWrapper rw:wrapper){
                if(requestMap.get(rw.type_x) != null){
                    if(requestMap.get(rw.type_x).get(rw.envId) != null){
                        requestMap.get(rw.type_x).get(rw.envId).add(rw);
                    }else{
                        requestMap.get(rw.type_x).put(rw.envId,new List<soapSforceCom200604Metadata.ObjectWrapper>{rw});
                    }                    
                }else{
                    Map<String,List<soapSforceCom200604Metadata.ObjectWrapper>> tmpMap = new Map<String,List<soapSforceCom200604Metadata.ObjectWrapper>>();
                    tmpMap.put(rw.envId,new List<soapSforceCom200604Metadata.ObjectWrapper>{rw});
                    requestMap.put(rw.type_x,new Map<String,List<soapSforceCom200604Metadata.ObjectWrapper>>(tmpMap));
                }
            }
        }

        if(requestMap.keySet().size() == 1){
            List<String> type_x = new List<String>(requestMap.keySet());
            Map<String, List<soapSforceCom200604Metadata.ObjectWrapper>> subReqMap = requestMap.get(type_x[0]);
            if(subReqMap != null && subReqMap.keySet().size() == 1){
                List<String> envId = new List<String>(subReqMap.keySet());
                respListWrapper.addAll(PermissionsController.getPermissionsServiceCall(type_x[0],envId[0],subReqMap.get(envId[0])));
            }else if(subReqMap.keySet().size()>1){
                for(String envId:subReqMap.keySet()){
                    respListWrapper.addAll(PermissionsController.getPermissionsServiceCall(type_x[0],envId,subReqMap.get(envId)));
                }
            }            
        }else if(requestMap.keySet().size() > 1){
            for(String type_x:requestMap.keySet()){
                Map<String, List<soapSforceCom200604Metadata.ObjectWrapper>> subReqMap = new Map<String, List<soapSforceCom200604Metadata.ObjectWrapper>>();
                subReqMap = requestMap.get(type_x);
                if(subReqMap.keySet().size() == 1){
                    List<String> envId = new List<String>(subReqMap.keySet());
                    respListWrapper.addAll(PermissionsController.getPermissionsServiceCall(type_x,envId[0],subReqMap.get(envId[0])));
                }else if(subReqMap.keySet().size()>1){
                    for(String envId:subReqMap.keySet()){
                        respListWrapper.addAll(PermissionsController.getPermissionsServiceCall(type_x,envId,subReqMap.get(envId)));
                    }
                }
            }
        }
        System.debug('Permissions Response Wrapper');
        System.debug(respListWrapper);
        return respListWrapper;
    }

    public static List<soapSforceCom200604Metadata.PermissionsResponseWrapper> getPermissionsServiceCall(String type_x,String envId,List<soapSforceCom200604Metadata.ObjectWrapper> objRecs){
        System.debug('type_x :::' + type_x + ' ::: envId :::' + envId + 'objRecs :::' + objRecs);
        System.debug('Inside Get Permissions Service Call');
        System.debug(type_x);      
        List<String> fullNames = new List<String>();
        List<soapSforceCom200604Metadata.PermissionsResponseWrapper> respListWrapper = new List<soapSforceCom200604Metadata.PermissionsResponseWrapper>();
        String namedCredential;
        try{
            if(objRecs != null){
                for(soapSforceCom200604Metadata.ObjectWrapper rec:objRecs){
                    fullNames.add(rec.fullName);
                }
                if(fullNames != null && fullNames.size()>0){
                    namedCredential = PermissionsController.getNamedCredential(envId);
                    soapSforceCom200604Metadata.Metadata12 metadata = new soapSforceCom200604Metadata.Metadata12();
                    metadata.endpoint_x = 'callout:'+namedCredential+metadata.endpoint_x;
                    System.debug(metadata.endpoint_x);
                    
                    soapSforceCom200604Metadata.SessionHeader_element sHeader = new soapSforceCom200604Metadata.SessionHeader_element();
                    sHeader.sessionId = '{!$Credential.OAuthToken}';
                    metadata.SessionHeader = sHeader;
                    
                    double asOfVersion = PermissionsController.getAPIVersion(envId);
                    if(type_x == 'Profile'){
                        soapSforceCom200604Metadata.ReadProfileResult rpResult = metadata.readProfileMetadata(type_x,fullNames);
                        if(rpResult != null){
                            soapSforceCom200604Metadata.PermissionsResponseWrapper tmpProfResult = new soapSforceCom200604Metadata.PermissionsResponseWrapper();
                            tmpProfResult.profileResult = rpResult;
                            tmpProfResult.type_x = type_x;
                            tmpProfResult.envId = envId;
                            respListWrapper.add(tmpProfResult);
                        }
                    }else if(type_x == 'PermissionSet'){
                        soapSforceCom200604Metadata.ReadPermissionSetResult rpResult = metadata.readPermissionSetMetadata(type_x,fullNames);
                        if(rpResult != null){
                            soapSforceCom200604Metadata.PermissionsResponseWrapper tmpProfResult = new soapSforceCom200604Metadata.PermissionsResponseWrapper();
                            tmpProfResult.permissionSetResult = rpResult;
                            tmpProfResult.type_x = type_x;
                            tmpProfResult.envId = envId;
                            respListWrapper.add(tmpProfResult);
                        }
                    }
                }
            }
        }catch(Exception e){
            System.debug(e);
        }
        return respListWrapper;
    }

    @AuraEnabled
    public static List<soapSforceCom200604Metadata.FileProperties> getProfilePermissionSetFiles(String envId){
        List<soapSforceCom200604Metadata.FileProperties> fileNames = new List<soapSforceCom200604Metadata.FileProperties>();
        String namedCredential;
        if(envId != null){        
            try{
                namedCredential = PermissionsController.getNamedCredential(envId);
                soapSforceCom200604Metadata.Metadata12 metadata = new soapSforceCom200604Metadata.Metadata12();
                metadata.endpoint_x = 'callout:'+namedCredential+metadata.endpoint_x;
                System.debug(metadata.endpoint_x);
                
                soapSforceCom200604Metadata.SessionHeader_element sHeader = new soapSforceCom200604Metadata.SessionHeader_element();
                sHeader.sessionId = '{!$Credential.OAuthToken}';
                metadata.SessionHeader = sHeader;
                
                double asOfVersion = PermissionsController.getAPIVersion(envId);
                soapSforceCom200604Metadata.ListMetadataQuery query = new soapSforceCom200604Metadata.ListMetadataQuery();
                //Get Profiles
                query.type_x = 'Profile';            
                fileNames.addAll(PermissionsController.getFileProperties(metadata,query,asOfVersion));
                //Get Permission Sets
                query.type_x = 'PermissionSet';
                fileNames.addAll(PermissionsController.getFileProperties(metadata,query,asOfVersion));

            }catch(Exception e){
                System.debug('Exception ::::' + e);
                Http http = new Http();
                HttpRequest req = new HttpRequest();
                req.setEndpoint('callout:'+namedCredential+'/services/data/v53.0');
                req.setMethod('GET');
                req.setTimeout(30000);
                HttpResponse res = http.send(req);                     
            }
        }
        System.debug('**********fileNames*********');
        System.debug(fileNames);
        // Map<String,List<soapSforceComWrapper.FileProperties>> mapFileNames = new Map<String,List<soapSforceComWrapper.FileProperties>>();
        // mapFileNames.put('hello',fileNames);
        return fileNames;
    }

    public static List<soapSforceCom200604Metadata.FileProperties> getFileProperties(soapSforceCom200604Metadata.Metadata12 metadata,soapSforceCom200604Metadata.ListMetadataQuery query,double asOfVersion){
            soapSforceCom200604Metadata.FileProperties[] lmr = metadata.listMetadata(
                new soapSforceCom200604Metadata.ListMetadataQuery[] {query}, asOfVersion);
        return lmr;            
    }

    public static String getNamedCredential(String Id){
        return [SELECT Named_Credential__c FROM Environment__mdt WHERE Id = :Id].Named_Credential__c;
    }

    public static Double getAPIVersion(String Id){
        return [SELECT API_Version__c FROM Environment__mdt WHERE Id = :Id].API_Version__c;
    }

    @AuraEnabled(cacheable=true)
    public static List<Permissions_Type__mdt> getPermissionsType(){
        return [SELECT Id,Label,Default__C FROM Permissions_Type__mdt Order By Label];
    }

    @AuraEnabled(cacheable=true)
    public static List<PermissionNamesAndLabels__mdt> getPermissionsNamesAndLabels(){
        return [SELECT DeveloperName,Permissions_Label__c FROM PermissionNamesAndLabels__mdt];
    }

}