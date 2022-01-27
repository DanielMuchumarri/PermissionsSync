import { LightningElement,api } from 'lwc';

export default class CustomDualListBox extends LightningElement {
    // @api permissions;
    // @api selectedValues;
    @api profileNames = [];
    @api permissionSetNames = [];
    //@api selectedProfiles = [];
    //@api selectedPermissionSets = [];
    @api isFirstOrSecond;

    connectedCallback(){
        console.log('Inside Connected Callback*********');
        console.log('data::::' + JSON.stringify(this.permissions));
    }

    handleProfChange(event){
        let selectedValues = event.detail.value;
        const cEvent = new CustomEvent('selectedprofiles',{
            detail:{env:this.isFirstOrSecond,selectedProfiles:selectedValues}
        });
        this.dispatchEvent(cEvent);        
    }

    handlePermSetChange(event){
        let selectedValues = event.detail.value;
        const cEvent = new CustomEvent('selectedpermissionsets',{
            detail:{env:this.isFirstOrSecond,selectedPermissionSets:selectedValues}
        });
        this.dispatchEvent(cEvent);
    }

    renderedCallback(){
        // let tmpProfileNames = [];
        // let tmpPermissionSetNames = [];
        // if(this.permissions != null && this.permissions !== undefined){
        //     for(let index in this.permissions){
        //         let perm = this.permissions[index];
        //         if(perm.type_x == 'Profile'){
        //             tmpProfileNames.push({'label':perm.fullName,'value':perm.id});
        //         }else if(perm.type_x == 'PermissionSet'){
        //             tmpPermissionSetNames.push({'label':perm.fullName,'value':perm.id});
        //         }
        //     }
        //     this.profileNames = [...tmpProfileNames];
        //     this.permissionSetNames = [...tmpPermissionSetNames];
        // }
    }
}