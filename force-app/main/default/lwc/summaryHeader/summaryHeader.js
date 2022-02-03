import { LightningElement,api } from 'lwc';

export default class SummaryHeader extends LightningElement {

@api fullName;
@api custom;
@api userLicense;
@api envName;


}