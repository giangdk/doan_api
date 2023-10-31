import express from 'express';
import morgan from 'morgan';
import compress from 'compression';
import cors from 'cors';
import helmet from 'helmet';

import passport from 'passport';
import path from 'path';
import { fileURLToPath } from 'url';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import i18nextMiddleware from 'i18next-http-middleware';

import hbs from 'hbs';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import jwtStrategy from './passport.js';
import error from '../api/middlewares/error.js';
// import apiRoutes from '../api/routes/index.js';
import publicWebApiRoutes from '../api/routes/web/public.web.route.js';
import publicAppApiRoutes from '../api/routes/app/public.app.route.js';
import customerAppApiRoutes from '../api/routes/app/customer.app.route.js';
import authenRouters from '../api/routes/auth/authentication.route.js';
import customerWebRouters from '../api/routes/web/customer.web.route.js';
import vendorWebRouters from '../api/routes/web/vendor.web.route.js';
import { authorize } from '../api/middlewares/auth.js';
import accountTypeEnum from '../api/enums/accountType.enum.js';
import locationRouters from '../api/routes/location/location.route.js';
// eslint-disable-next-line import/namespace
import cartRouters from '../api/routes/cart/cart.router.js';
import orderRouters from '../api/routes/order/order.route.js';

import voucherRoutes from '../api/routes/voucher.route.js';
import customRouters from '../api/routes/page/customPage.router.js';
import addressRouters from '../api/routes/address.router.js';
import productRoutes from '../api/routes/v1/product.route.js';
import paymentMethodRouters from '../api/routes/order/paymentMethod.route.js';
import accountRoutes from '../api/routes/v1/account.route.js';
import reviewRoutes from '../api/routes/review.route.js';
import vendorRoutes from '../api/routes/v1/vendor.route.js';
import categoryRoutes from '../api/routes/v1/category.route.js';
import logisticsRoutes from '../api/routes/logistics/shipment.logistics.route.js';
import vars from './vars.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerDocument = YAML.load(`${__dirname}/../resources/swagger.yaml`);
// i18next
//   .use(Backend)
//   .use(i18nextMiddleware.LanguageDetector)
//   .init({
//     debug: true,
//     backend: {
//       loadPath: path.join(__dirname, '../resources/locales/{{lng}}/{{ns}}.json'),
//       addPath: path.join(__dirname, '../resources/locales/{{lng}}/{{ns}}.missing.json'),
//     },
//     lng: 'vi',
//     fallbackLng: 'en',
//     fallbackNS: 'translation',
//     preload: ['en', 'vi'],
//     cleanCode: true
//   });

i18next
  .use(i18nextMiddleware.LanguageDetector)
  .use(Backend)
  .init({
    backend: {
      loadPath: `${__dirname}/../resources/locales/{{lng}}/{{ns}}.json`,
      addPath: `${__dirname}/../resources/locales/{{lng}}/{{ns}}.missing.json`
    },
    lng: 'vi',
    debug: false,
    saveMissing: true,
    detection: {
      order: ['querystring', 'cookie'],
      caches: ['cookie']
    },
    fallbackLng: 'en',
    fallbackNS: 'translation',
    cleanCode: true,
    preload: ['en', 'vi']
  });

hbs.registerHelper('t', (...args) => {
  const options = args.pop();
  return i18next.t(args, { lng: options.data.root._locals.language });
});

hbs.registerHelper('tr', (context, options) => {
  const opts = i18next.functions.extend(options.hash, context);
  if (options.fn) opts.defaultValue = options.fn(context);

  const result = i18next.t(opts.key, opts);

  return new hbs.SafeString(result);
});

const app = express();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(
  i18nextMiddleware.handle(i18next, {
    ignoreRoutes: ['favicon.ico', 'css/', 'js/', 'images/', 'assets/', 'fonts/'],
    removeLngFromUrl: true
  })
);

app.use(express.static(path.join(__dirname, '../public')));

app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'hbs');

app.use(morgan(vars.logs));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(compress());

app.use(helmet());
app.use(cors());

app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

app.use('/auth', authenRouters);
app.use('/locations', locationRouters);
app.use('/cart', authorize(), cartRouters);
app.use('/vouchers', authorize(), voucherRoutes);
app.use('/categories', categoryRoutes);
app.use('/products', productRoutes);
app.use('/accounts', accountRoutes);
app.use('/vendors', vendorRoutes);
app.use('/order', authorize(), orderRouters);

app.use('/app', publicAppApiRoutes);
app.use('/app/customer', authorize(), customerAppApiRoutes);
app.use('/web', publicWebApiRoutes);

app.use('/web/customer', authorize(accountTypeEnum.CUSTOMER), customerWebRouters);
app.use('/web/vendor', authorize(accountTypeEnum.VENDOR), vendorWebRouters);
app.use('/address', authorize(), addressRouters);
app.use('/web/custom', customRouters);
app.use('/payment', authorize(), paymentMethodRouters);
app.use('/reviews', authorize(), reviewRoutes);
app.use('/logistics', authorize(accountTypeEnum.LOGISTICS), logisticsRoutes);

// app.use('/web/member' , authorize(accountTypeEnum.CUSTOMER) ,memberRouters);

app.use(error.converter);
app.use(error.notFound);
app.use(error.handler);

export default app;
