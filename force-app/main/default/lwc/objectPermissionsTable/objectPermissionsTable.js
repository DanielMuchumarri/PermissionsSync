import { LightningElement,api } from 'lwc';

export default class ObjectPermissionsTable extends LightningElement {
    @api objInput = {};

    renderedCallback(){
        console.log('Inside connected callback****');
        console.log(JSON.stringify(this.objInput));
    }
}