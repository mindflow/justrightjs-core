import {Url} from "../../../main/justright/util/url.mjs";
import {Logger} from "../../../../es_module/coreutil.mjs";

const LOG = new Logger("XmlTestSpec");

export class XmlTestSpec{
  testXmlParser() {
    var url = new Url("http://www.vg.no:8080/test.html?val=blabla#bookmark1/bookmark2");
    LOG.info(url.getProtocol());
    LOG.info(url.getHost());
    LOG.info(url.getPort());
    url.getPathList().forEach(function (value,parent){
      LOG.info(value);
      return true;
    },this);
    url.getParameterMap().forEach(function (key,value,parent){
      LOG.info(key + "=" + value);
      return true;
    },this);
    LOG.info(url.getBookmark());
    
    LOG.info(url.toString());
  }

}
new XmlTestSpec().testXmlParser();