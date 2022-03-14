import { Logger } from "coreutil_v1"

const LOG = new Logger("LoaderInterceptor");

export class LoaderInterceptor {

    /**
     * @returns {Boolean}
     */
    process() {
        LOG.info("Unimplemented Loader Interceptor breaks by default");
        return false;
    }

}