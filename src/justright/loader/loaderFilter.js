import { Logger } from "coreutil_v1"

const LOG = new Logger("LoaderFilter");

export class LoaderFilter {

    /**
     * @returns {Boolean}
     */
    process() {
        LOG.info("Inumplemented Loader Filter breaks by default");
        return false;
    }

}