/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2017 Alibaba Group.
 */

import { RunUtil } from '../../RunUtil';
import * as assert from 'assert';
import * as url from 'url';
import { HttpServerPatcher } from '../../../src/patch/HttpServer';
import { SLOW_TRACE } from 'pandora-metrics';

HttpServerPatcher.prototype.requestFilter = function(req) {
  const urlParsed = url.parse(req.url, true);
  return urlParsed.pathname.indexOf('ignore') > -1;
};
const httpServerPatcher = new HttpServerPatcher({
  slowThreshold: 2 * 1000
});

RunUtil.run(function(done) {
  httpServerPatcher.run();
  const http = require('http');
  const urllib = require('urllib');

  process.on(<any> 'PANDORA_PROCESS_MESSAGE_TRACE', (report: any) => {

    assert(report.name === 'HTTP-GET:/');
    assert(report.spans.length > 0);
    assert(report.status & SLOW_TRACE);

    done();
  });

  const server = http.createServer((req, res) => {

    setTimeout(function() {
      res.end('hello');
    }, 3 * 1000);
  });

  server.listen(0, () => {
    const port = server.address().port;

    setTimeout(function() {
      urllib.request(`http://localhost:${port}`);
    }, 1000);
  });
});
