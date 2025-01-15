export default class Ducts {
    constructor(innerDuctDimensions, ductsDictionary, primaryColor) {
        this.innerDuctDimensions = innerDuctDimensions;
        this.ductsDictionary = ductsDictionary;
        this.primaryColor = primaryColor;
    }

    getPrimaryKey() {
        for(const key in this.ductsDictionary) {
            if(this.ductsDictionary[key].length == 1) {
                return key;
            }
        }
    }
}