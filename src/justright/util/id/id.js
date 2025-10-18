import { Logger } from "coreutil_v1";
import { IdSpace } from "./idSpace";
import { UserId } from "./userId";

const LOG = new Logger("Id");

export class Id {

    constructor(idSpace = null, userId = null) {
        this.idSpace = idSpace
        this.userId = userId;
    }

    /**
     * 
     * @param {String} idString 
     * @returns {Id}
     */
    static parse(idString) {
        const idSpaceString = idString.substring(0, IdSpace.ID_SPACE_STRING_WIDTH);
        const userIdString = idString.substring(IdSpace.ID_SPACE_STRING_WIDTH);

        const idSpace = IdSpace.parse(idSpaceString);
        const userId = UserId.parse(userIdString);

        return new Id(idSpace, userId);
    }

    report() {
        const report = new Map();
        const idSpaceReport = this.idSpace.report();
        for (const [key, value] of idSpaceReport.entries()) {
            report.set(key, value);
        }
        const userIdReport = this.userId.report();
        for (const [key, value] of userIdReport.entries()) {
            report.set(key, value);
        }
        return report;
    }

    reportString() {
        const report = this.report();
        let reportString = ""
        for (const [key, value] of report.entries()) {
            reportString += "{" + key + "} {" + value + "}\n";
        }
        return reportString;
    }

    print (){
        LOG.info(this.reportString());
    }

    toString() {
        return idSpace.toString() + userId.toString();
    }

    userId() {
        return userId.toString();
    }

}