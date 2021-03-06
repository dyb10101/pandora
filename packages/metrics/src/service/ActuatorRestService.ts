import {ActuatorService} from '../domain';

const KOA = require('koa');
const Router = require('koa-router');
const debug = require('debug')('pandora:metrics:rest');

export class ActuatorRestService implements ActuatorService {

  endPointService;
  server;

  constructor(endPointService) {
    this.endPointService = endPointService;
  }

  start(actuatorConfig?: {
    http,
    endPoint
  }) {
    const httpConfig = actuatorConfig['http'];
    const endPointConfig = actuatorConfig['endPoint'];

    let app = new KOA();
    let homeRouter = new Router();
    homeRouter.get('/', async (ctx) => {
      ctx.body = 'Pandora restful service start successful';
    });

    app.use(homeRouter.routes());

    app.use(async (ctx, next) => {
      ctx.ok = (data) => {
        ctx.body = {
          data,
          timestamp: Date.now(),
          success: true,
          message: ''
        };
      };

      ctx.fail = (message) => {
        ctx.body = {
          success: false,
          timestamp: Date.now(),
          message
        };
      };

      await next();

      // if(ctx.result) {
      //   ctx.body = ctx.result;
      // } else {
      //   ctx.body = ctx.fail('data not found');
      // }
    });

    for(let endPointObjKey in endPointConfig) {
      debug(`loop endPoints Config key = ${endPointObjKey}`);
      if(endPointConfig[endPointObjKey].resource) {
        debug(`find resource in endPoints Config key = ${endPointObjKey}`);
        let resource = new endPointConfig[endPointObjKey].resource(this.endPointService);
        let router = new Router();

        debug(`prefix = ${resource.prefix}`);
        router.prefix(resource.prefix);
        resource.route(router);

        app.use(router.routes())
          .use(router.allowedMethods());
      }
    }

    if(httpConfig.enabled) {
      this.server = app.listen(httpConfig.port, () => {
        console.log(`Pandora restful service start at http://127.1:${httpConfig.port}`);
      });
    } else {
      return app;
    }
  }

  stop() {
    if(this.server) {
      this.server.close();
    }
  }
}
