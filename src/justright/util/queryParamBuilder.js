export class QueryParamBuilder {

    constructor() {
        this.params = new Map();
    }

    /**
     * 
     * @returns {QueryParamBuilder}
     */
    static create() {
        return new QueryParamBuilder();
    }

    /**
     * 
     * @param {string} key 
     * @param {string} value 
     * @returns {QueryParamBuilder}
     */
    withString(key, value) {
        this.params.set(key, value);
        return this;
    }

    /**
     * 
     * @param {string} key 
     * @param {Array} valueArray 
     * @returns {QueryParamBuilder}
     */
    withArray(key, valueArray) {
        this.params.set(key, valueArray);
        return this;
    }

    /**
     * 
     * @returns {String}
     */
    build() {
        let queryParam = "";
        let firstParam = true;
        this.params.forEach((value, key) => {
            
            if (!firstParam) {
                queryParam += "&";
            } else {
                firstParam = false;
            }

            if (Array.isArray(value)) {
                value.forEach((item) => {
                    queryParam += encodeURIComponent(key) + "=" + encodeURIComponent(item);
                });
            } else {
                queryParam += encodeURIComponent(key) + "=" + encodeURIComponent(value);
            }
        });
        return queryParam;
    }
}