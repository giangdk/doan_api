import { nanoid } from 'nanoid';

import * as csv from 'fast-csv';
import bcrypt from 'bcryptjs';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import async from 'async';
import faker from 'faker';
import dotenv from 'dotenv-safe';
import Category from '../api/models/category.model.js';
import Shipment from '../api/models/shipment.model.js';
import Review from '../api/models/review.model.js';
import Brand from '../api/models/brand.model.js';
import Product from '../api/models/product.model.js';
import Media from '../api/models/media.model.js';
import Vendor from '../api/models/vendor.model.js';
import Account from '../api/models/account.model.js';
import Voucher from '../api/models/voucher.model.js';
import Address from '../api/models/address.model.js';
import accountTypeEnum from '../api/enums/accountType.enum.js';
import CartItem from '../api/models/cart.model.js';
import CustomPage from '../api/models/customPage.model.js';
import Order from '../api/models/order.model.js';
import ShipmentMethod from '../api/models/shipmentMethod.model.js';
import libphonenum from 'google-libphonenumber';
import PaymentMethod from '../api/models/paymentMethod.model.js';

const { PhoneNumberFormat, PhoneNumberUtil } = libphonenum;

const phoneUtil = PhoneNumberUtil.getInstance();

import mongoose from 'mongoose';
// import * as data from './data.json';
import { readFile } from 'fs/promises';
import discountTypeEnum from '../api/enums/discountType.enum.js';
import voucherTypeEnum from '../api/enums/voucherType.enum.js';
import { StockCountry } from '../api/enums/product.enum.js';
import shipmentMethodTypeEnum from '../api/enums/shipmentMethodType.enum.js';
import paymentMethodEnum from '../api/enums/paymentMethod.enum.js';
const data = JSON.parse(await readFile(new URL('./data.json', import.meta.url)));
const customPage = JSON.parse(await readFile(new URL('./customPage.json', import.meta.url)));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, '../../.env'),
  example: path.join(__dirname, '../../.env.example')
});

const vars = {
  env: process.env.NODE_ENV,
  port: process.env.PORT || 3000,
  mongo: {
    uri:
      process.env.NODE_ENV === 'development' ? process.env.MONGO_URI_TESTS : process.env.MONGO_URI
  },
  logs: process.env.NODE_ENV === 'production' ? 'combined' : 'dev'
};

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error: ${err}`);
  process.exit(-1);
});

if (vars.env === 'development') {
  mongoose.set('debug', false);
}

const reviews = ['Sản phẩm tốt, đúng như ảnh', 'Chất lượng, ủng hộ', 'Tốt'];

const productImages = [
  'https://salt.tikicdn.com/cache/400x400/ts/product/36/a2/d7/52f290c2506abdc9033d121aa3cfc2e4.jpg.webp',
  'https://salt.tikicdn.com/cache/400x400/ts/product/da/0c/18/0299d7752d97b2be9d3dadae6ff6286f.png.webp',
  'https://salt.tikicdn.com/cache/400x400/media/catalog/producttmp/e9/c6/22/7f7151da225bf818e826c228ebd8854e.jpg.webp',
  'https://salt.tikicdn.com/cache/400x400/ts/product/0e/04/3b/4df0ad98fcd91200623bcc2a5816d5e6.PNG.webp',
  'https://salt.tikicdn.com/cache/400x400/ts/product/8a/bf/25/7dc09cae0b02083ec02870a1ff2aca3e.png.webp',
  'https://salt.tikicdn.com/cache/400x400/ts/product/a5/31/4b/a6b50b155bff50437c6fe03ee9036b5f.jpg.webp',
  'https://mubaha.hn.ss.bfcplatform.vn/data/images/products/25.jpeg',
  'https://mubaha.hn.ss.bfcplatform.vn/data/images/products/6.jpeg',
  'https://mubaha.hn.ss.bfcplatform.vn/data/images/products/39.jpeg',
  'https://mubaha.hn.ss.bfcplatform.vn/data/images/products/2.jpeg',
  'https://salt.tikicdn.com/cache/400x400/ts/product/6c/37/92/dbf0041e5c8333babad2f0a431a42004.png.webp',
  'https://mubaha.hn.ss.bfcplatform.vn/data/images/products/7.jpeg',
  'https://salt.tikicdn.com/cache/400x400/ts/product/cf/23/a1/500f25b0a69cf1be3039837916efb9c1.png.webp',
  'https://salt.tikicdn.com/cache/400x400/ts/product/b2/2c/59/3c5ac1daa2a0b7ac6063758c160a02a5.jpg.webp',
  'https://salt.tikicdn.com/cache/400x400/ts/product/66/a8/13/912869850ed5af45d33f1026026d450f.jpg.webp',
  'https://salt.tikicdn.com/cache/400x400/ts/product/ad/7b/71/c1ac3899042817f124931fe3a59c176b.jpg.webp',
  'https://mubaha.hn.ss.bfcplatform.vn/data/images/products/10.jpeg',
  'https://mubaha.hn.ss.bfcplatform.vn/data/images/products/12.jpeg',
  'https://salt.tikicdn.com/cache/400x400/ts/product/bc/2c/f8/a564875cf42c74c6ce660a8415314975.jpg.webp',
  'https://salt.tikicdn.com/cache/400x400/ts/product/df/68/12/f806529c9655952c10cf7b5db52bd5b5.jpg.webp'
];

const launchVendorSeed = async () => {
  await Vendor.deleteMany();
  await Account.deleteMany();
  await Brand.deleteMany();
  await Address.deleteMany();
  await Shipment.deleteMany();
  async
    .parallel({
      createdBrand: (cb) => {
        Brand.insertMany(
          [
            {
              name: 'Mubaha',
              'media.featuredImage': 'https://mubaha.hn.ss.bfcplatform.vn/data/locknlock.jpeg'
            }
          ],
          cb
        );
      },
      createdCustomerAccount4: (cb) => {
        const hashedPassword = bcrypt.hashSync('123456', 8);

        const phone = '0911111110';

        const number = phoneUtil.parse(phone, 'VN');

        const phoneNumber = phoneUtil.format(number, PhoneNumberFormat.E164);

        Account.create(
          {
            profile: {
              fullName: 'Nguyen Minh Quan',
              email: 'quan.logistics@gmail.com'
            },
            phone: phoneNumber,
            password: hashedPassword,
            type: accountTypeEnum.LOGISTICS,
            authentication: {
              isCreatedPassword: true,
              isPhoneVerified: true
            }
          },
          cb
        );
      },

      createdCustomerAccount2: (cb) => {
        const hashedPassword = bcrypt.hashSync('123456', 8);

        const phone = '0911111114';

        const number = phoneUtil.parse(phone, 'VN');

        const phoneNumber = phoneUtil.format(number, PhoneNumberFormat.E164);

        Account.create(
          {
            profile: {
              fullName: 'Nguyen Van B',
              email: 'nguyenvanb@gmail.com'
            },
            phone: phoneNumber,
            password: hashedPassword,
            type: accountTypeEnum.CUSTOMER,
            authentication: {
              isCreatedPassword: true,
              isPhoneVerified: true
            }
          },
          cb
        );
      },

      createdCustomerAccount: (cb) => {
        const hashedPassword = bcrypt.hashSync('123456', 8);

        const phone = '0911111112';

        const number = phoneUtil.parse(phone, 'VN');

        const phoneNumber = phoneUtil.format(number, PhoneNumberFormat.E164);

        Account.create(
          {
            profile: {
              fullName: 'Nguyen Van A',
              email: 'nguyenvana@gmail.com'
            },
            phone: phoneNumber,
            password: hashedPassword,
            type: accountTypeEnum.CUSTOMER,
            authentication: {
              isCreatedPassword: true,
              isPhoneVerified: true
            }
          },
          cb
        );
      },
      createdAccount2: (cb) => {
        const hashedPassword = bcrypt.hashSync('123456', 8);

        const phone = '0911111113';

        const number = phoneUtil.parse(phone, 'VN');

        const phoneNumber = phoneUtil.format(number, PhoneNumberFormat.E164);

        Account.create(
          {
            profile: {
              fullName: 'Mubaha Store',
              avatar: 'https://mubaha.hn.ss.bfcplatform.vn/data/locknlock.jpeg',
              email: 'mubaha222.fashion@gmail.com'
            },
            phone: phoneNumber,
            password: hashedPassword,
            type: accountTypeEnum.VENDOR,
            authentication: {
              isCreatedPassword: true,
              isPhoneVerified: true
            }
          },
          cb
        );
      },
      createdAccount: (cb) => {
        const hashedPassword = bcrypt.hashSync('123456', 8);

        const phone = '0911111111';

        const number = phoneUtil.parse(phone, 'VN');

        const phoneNumber = phoneUtil.format(number, PhoneNumberFormat.E164);

        Account.create(
          {
            profile: {
              fullName: 'LocknLock Store',
              avatar: 'https://mubaha.hn.ss.bfcplatform.vn/data/locknlock.jpeg',
              email: 'mubaha.fashion@gmail.com'
            },
            phone: phoneNumber,
            password: hashedPassword,
            type: accountTypeEnum.VENDOR,
            authentication: {
              isCreatedPassword: true,
              isPhoneVerified: true
            }
          },
          cb
        );
      }
    })
    .then(async (result) => {
      const { createdCustomerAccount, createdAccount, createdAccount2 } = result;
      await Address.create(
        {
          owner: createdCustomerAccount._id,
          phone: '+84911111112',
          fullName: 'Nguyen Van A',
          codes: {
            province: '01',
            district: '004',
            ward: '00115'
          },
          details: '108888',
          fullAddress: 'Phường Thượng Thanh, Quận Long Biên, Thành phố Hà Nội',
          isDefault: true
        },
        {
          owner: createdAccount._id,
          phone: '+84911111111',
          fullName: 'Nguyen Van B',
          codes: {
            province: '01',
            district: '004',
            ward: '00115'
          },
          details: '108888',
          fullAddress: 'Phường Thượng Thanh, Quận Long Biên, Thành phố Hà Nội',
          isDefault: true,
          isPickup: true
        },
        {
          owner: createdAccount2._id,
          phone: '+84911111113',
          fullName: 'Nguyễn Minh Tú',
          codes: {
            province: '01',
            district: '004',
            ward: '00115'
          },
          details: '108888',
          fullAddress: 'Phường Thượng Thanh, Quận Long Biên, Thành phố Hà Nội',
          isDefault: true,
          isPickup: true
        },
        {
          owner: createdAccount2._id,
          phone: '+84911111113',
          fullName: 'Nguyen Văn Chiến',
          codes: {
            province: '01',
            district: '004',
            ward: '00115'
          },
          details: '108888',
          fullAddress: 'Phường Thượng Thanh, Quận Long Biên, Thành phố Hà Nội',
          isDefault: false,
          isPickup: false
        },
        {
          owner: createdAccount2._id,
          phone: '+84911111113',
          fullName: 'Chư Bát Giới',
          codes: {
            province: '01',
            district: '004',
            ward: '00115'
          },
          details: '108888',
          fullAddress: 'Phường Thượng Thanh, Quận Long Biên, Thành phố Hà Nội',
          isDefault: false,
          isPickup: false
        }
      );

      const vendor2 = await Vendor.create({
        owner: createdAccount2._id,
        details:
          'Fanpage chính thức của thương hiệu LOCK&LOCK tại Việt Nam.\nOfficial Fanpage of LOCK&LOCK in Vietnam.\n- Youtube channel: goo.gl/5HCCCE\n- Instagram: https://www.instagram.com/locknlockvietnam/',
        socialLinks: {
          facebook: 'https://www.facebook.com/locknlockvietnam',
          youtube: 'https://www.youtube.com/channel/UCPXeoTnDKOGPk9rwBTEtj9A',
          tiktok: 'https://www.tiktok.com/tag/lamia?lang=vi-VN',
          instagram: 'https://www.instagram.com/accounts/login/'
        },
        cover: 'https://mubaha.hn.ss.bfcplatform.vn/data/locknlockcover.png',
        avatar: 'https://mubaha.hn.ss.bfcplatform.vn/data/locknlock.jpeg',
        brandName: 'Mubaha Store'
      });
      const vendor = await Vendor.create({
        owner: createdAccount._id,
        details:
          'Fanpage chính thức của thương hiệu LOCK&LOCK tại Việt Nam.\nOfficial Fanpage of LOCK&LOCK in Vietnam.\n- Youtube channel: goo.gl/5HCCCE\n- Instagram: https://www.instagram.com/locknlockvietnam/',
        socialLinks: {
          facebook: 'https://www.facebook.com/locknlockvietnam',
          youtube: 'https://www.youtube.com/channel/UCPXeoTnDKOGPk9rwBTEtj9A',
          tiktok: 'https://www.tiktok.com/tag/lamia?lang=vi-VN',
          instagram: 'https://www.instagram.com/accounts/login/'
        },
        cover: 'https://mubaha.hn.ss.bfcplatform.vn/data/locknlockcover.png',
        avatar: 'https://mubaha.hn.ss.bfcplatform.vn/data/locknlock.jpeg',
        brandName: 'LocknLock Store'
      });

      if (vendor) {
        console.log(`✨ Inserted 2 vendors`);
        await migrateRealProducts();
      }
    });
};

const launchProductsSeed = async () => {
  await Product.deleteMany();
  await Review.deleteMany();
  const insertData = [];

  const insertReviews = [];
  const brand = await Brand.find();
  const brandIds = brand.map((x) => x._id);
  const mubaha = await Vendor.findOne({ brandName: 'Mubaha Store' });
  const vendor = await Vendor.findOne({ brandName: 'LocknLock Store' });
  const categories = await Category.find({ parents: { $exists: false } }).limit(30);
  const categoryIds = categories.map((x) => x._id);
  for (let i = 0; i < 500; i++) {
    const mediaImages = faker.random.arrayElements(productImages);
    const mediaArray = [];
    mediaImages.forEach((x) => {
      mediaArray.push(
        new Media({
          path: x
        })
      );
    });

    const attrPrice1 = faker.commerce.price(200000, 1000000);
    const attrDiscount1 = faker.datatype.float({ min: 0, max: 0.7, precision: 0.01 });
    const attrDiscounted1 = attrPrice1 * (1 - attrDiscount1);
    const attrPrice2 = faker.commerce.price(300000, 1500000);
    const attrDiscount2 = faker.datatype.float({ min: 0, max: 0.3, precision: 0.01 });
    const attrDiscounted2 = attrPrice2 * (1 - attrDiscount2);
    const attrPrice3 = faker.commerce.price(500000, 2000000);
    const attrDiscount3 = faker.datatype.float({ min: 0, max: 0.2, precision: 0.01 });
    const attrDiscounted3 = attrPrice3 * (1 - attrDiscount3);

    const attributes =
      Math.floor(Math.random() * 2) < 1
        ? [
          {
            name: 'S',
            price: attrPrice1,
            stock: {
              quantity: 100
            },
            discount: attrDiscount1,
            discountedPrice: attrDiscounted1
          },
          {
            name: 'M',
            price: attrPrice2,
            stock: {
              quantity: 100
            },
            discount: attrDiscount2,
            discountedPrice: attrDiscounted2
          },
          {
            name: 'L',
            price: attrPrice3,
            stock: {
              quantity: 100
            },
            discount: attrDiscount3,
            discountedPrice: attrDiscounted3
          }
        ]
        : [];

    const price1 = faker.commerce.price(200000, 1000000);
    const discount1 = faker.datatype.float({ min: 0, max: 0.7, precision: 0.01 });
    const discounted1 = price1 * (1 - discount1);
    const price2 = faker.commerce.price(500000, 3000000);
    const discount2 = faker.datatype.float({ min: 0, max: 0.3, precision: 0.01 });
    const discounted2 = price2 * (1 - discount2);
    const variants =
      Math.floor(Math.random() * 2) < 1
        ? [
          {
            name: 'Trắng',
            image: faker.random.arrayElement(productImages),
            attributes: attributes,
            price: price1,
            stock: {
              quantity: 100
            },
            discount: discount1,
            discountedPrice: discounted1
          },
          {
            name: 'Đỏ',
            image: faker.random.arrayElement(productImages),
            attributes: Math.floor(Math.random() * 2) < 1 ? attributes : attributes.pop(),
            price: price2,
            stock: {
              quantity: 100
            },
            discount: discount2,
            discountedPrice: discounted2
          }
        ]
        : [];

    let minPrice = 9999999999;
    let minDiscount = 0;
    let maxPrice = 0;
    if (variants && variants.length > 0) {
      const _minPrice = Math.min(...variants.map((v) => v.price));
      if (_minPrice > 0 && _minPrice < minPrice) {
        minPrice = _minPrice;
        const _discount = variants.find((v) => v.price == _minPrice).discount;
        minDiscount = _discount || 0;
      }
      const _maxPrice = Math.max(...variants.map((v) => v.price));
      if (maxPrice < _maxPrice) maxPrice = _maxPrice;

      variants.forEach((x) => {
        if (x.attributes && x.attributes.length > 0) {
          const _minAttributePrice = Math.min(...x.attributes.map((a) => a.price));
          if (_minAttributePrice > 0 && _minAttributePrice < minPrice) {
            minPrice = _minAttributePrice;
            const _discount = x.attributes.find((j) => j.price == _minAttributePrice).discount;
            minDiscount = _discount || 0;
          }

          const _maxAttributePrice = Math.max(...x.attributes.map((a) => a.price));
          if (maxPrice < _maxAttributePrice) maxPrice = _maxAttributePrice;
        }
      });
    }
    const priceRange = {
      min: minPrice,
      max: maxPrice
    };

    const _price = faker.commerce.price(200000, 2000000);
    const prodDiscount = faker.datatype.float({ min: 0, max: 0.7, precision: 0.01 });

    const insertPrice = variants.length > 0 ? priceRange.min : _price;
    const insertDiscounted = variants.length > 0 ? minDiscount : prodDiscount;
    const _discountedPrice = insertPrice * (1 - insertDiscounted);

    const product = new Product({
      _id: new mongoose.Types.ObjectId(),
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      shortDescription: faker.commerce.productDescription(),
      price: variants.length > 0 ? priceRange.min : _price,
      discount: prodDiscount,
      discountedPrice: _discountedPrice,
      stock: {
        quantity: 100,
        country: faker.random.arrayElement(Object.values(StockCountry))
      },
      category: faker.random.arrayElement(categoryIds),
      brand: faker.random.arrayElement(brandIds),
      vendor: Math.floor(Math.random() * 2) < 1 ? vendor._id : mubaha._id,
      priceRange: variants.length > 0 ? priceRange : { min: _price, max: _price },
      media: {
        featuredImage: faker.random.arrayElement(productImages),
        data: mediaArray
      },
      variantLabel: 'Màu Sắc',
      attributeLabel: 'Kích Cỡ',
      variants,
      ratings: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      }
    });

    const customerAccounts = await Account.find({ type: accountTypeEnum.CUSTOMER }).select('_id');
    customerAccounts.forEach((c) => {
      const rating = faker.datatype.number({ min: 1, max: 5 });
      const review = new Review({
        content: faker.lorem.sentence(),
        product: product._id,
        vendor: product.vendor,
        reviewer: c._id,
        rating: rating
      });
      insertReviews.push(review);
      Object.entries(product.ratings).forEach(([key]) => {
        if (key == rating) {
          product.ratings[key] += 1;
        }
      });
    });
    let totalRating = 0;
    let totalReview = 0;

    Object.entries(product.ratings).forEach(([key, value]) => {
      totalRating += key * value;
      totalReview += value;
    });

    const avgRating = totalRating / totalReview;
    product.avgRating = avgRating;

    insertData.push(product);
  }
  const result = await Product.insertMany(insertData);
  await Review.insertMany(insertReviews);
  console.log(`✨ Inserted ${result.length} products`);
  launchCartSeed();
};

const launchCartSeed = async () => {
  await CartItem.deleteMany({});
  await Order.deleteMany({});
  const customer = await Account.findOne({ phone: '+84911111112' });
  let products = await Product.find().limit(30);

  const insertData = [];
  products.forEach((i) => {
    let price = i.price,
      discount = i.discount;
    if (i.variants.length > 0) {
      price = i.variants[0].price;
      discount = i.variants[0].discount;
    }
    if (i.variants.length > 0 && i.variants[0].attributes.length > 0) {
      price = i.variants[0].attributes[0].price;
      discount = i.variants[0].attributes[0].discount;
    }

    const cart = {
      product: i._id,
      owner: customer._id,
      selectedVariant: i.variants.length > 0 ? i.variants[0] : null,
      selectedAttribute:
        i.variants.length > 0 && i.variants[0].attributes.length > 0
          ? i.variants[0].attributes[0]
          : null,
      amount: 1,
      vendor: i.vendor,
      price,
      discount,
      discountedPrice: price * (1 - discount)
    };
    insertData.push(cart);
  });
  const result = await CartItem.insertMany(insertData);
  console.log(`✨ Inserted ${result.length} cart items`);
  await voucherSeed();
};

const voucherSeed = async () => {
  await Voucher.deleteMany({});
  const array = [];
  for (let i = 0; i < 5; i++) {
    const discount =
      Math.floor(Math.random() * 2) < 1
        ? {
          amount: faker.commerce.price(5000, 15000),
          type: discountTypeEnum.PRICE
        }
        : {
          amount: faker.commerce.price(5, 20),
          type: discountTypeEnum.PERCENTAGE
        };
    const voucher = {
      title: 'MUBAHA' + i,
      discount: discount,
      minBasketPrice: faker.commerce.price(100000, 500000),
      usageLimitQuantity: 99999,
      maxVoucherAmount: 20000,
      active: true,
      code: 'MUBAHA' + nanoid(5),
      startDate: Date.now(),
      endDate: new Date('2022-05-10'),
      type: voucherTypeEnum.SYSTEM
    };
    array.push(voucher);
  }
  const mubaha = await Vendor.findOne({ brandName: 'Mubaha Store' });

  for (let i = 0; i < 10; i++) {
    const discount =
      Math.floor(Math.random() * 2) < 1
        ? {
          amount: faker.commerce.price(5000, 15000),
          type: discountTypeEnum.PRICE
        }
        : {
          amount: faker.commerce.price(5, 20),
          type: discountTypeEnum.PERCENTAGE
        };
    const voucher = {
      title: 'VENDOR' + i,
      discount: discount,
      minBasketPrice: faker.commerce.price(100000, 500000),
      usageLimitQuantity: 99999,
      maxVoucherAmount: 20000,
      vendor: mubaha._id,
      active: true,
      code: 'MUBAHA' + nanoid(5),
      startDate: Date.now(),
      endDate: new Date('2022-05-10'),
      type: voucherTypeEnum.VENDOR
    };
    array.push(voucher);
  }

  await Voucher.insertMany(array);
  console.log(`✨ Inserted 5 vouchers`);

  await migrateCategoriesFromCsv();
};

const launchCategoriesSeeds = async () => {
  await Category.deleteMany({});
  const categories = [];
  data.forEach((i) => {
    const id = new mongoose.Types.ObjectId();
    categories.push({
      _id: id,
      name: i.name
    });

    if (i.children?.length > 0) {
      i.children.forEach((j) => {
        const childId = new mongoose.Types.ObjectId();
        categories.push({
          _id: childId,
          name: j.name,
          parents: {
            firstLevel: id
          }
        });

        if (j.children?.length > 0) {
          j.children.forEach((m) => {
            categories.push({
              name: m.name,
              // parent: childId,
              parents: {
                firstLevel: childId,
                secondLevel: id
              }
            });
          });
        }
      });
    }
  });
  const result = await Category.insertMany(categories);
  console.log(`✨ Inserted ${result.length} categories`);
  await launchVendorSeed();
};

const handleCategoryData = async (row) => {
  const category = await Category.findOne({ name: row.Name });
  if (!category) return console.log(`${row.Name} is not found`);
  category.featuredImage = row.Image;
  await category.save();
};

const handleRealProduct = async (row) => {
  // console.log(row.media.data || null);
  // console.log(JSON.parse(row['media.data']));

  const insertReviews = [];
  const brand = await Brand.find();
  const brandIds = brand.map((x) => x._id);
  const mubaha = await Vendor.findOne({ brandName: 'Mubaha Store' });

  const categories = await Category.find({ parents: { $exists: false } }).limit(30);
  const categoryIds = categories.map((x) => x._id);
  const category = await Category.findOne({ name: row.categoryName });
  let firstCategory = null;
  let secondCategory = null;
  if (row.parentCategoriesFirstName) {
    firstCategory = await Category.findOne({ name: row.parentCategoriesFirstName }).select('_id');
  }
  if (row.parentCategoriesSecondName) {
    secondCategory = await Category.findOne({ name: row.parentCategoriesSecondName }).select('_id');
  }

  const _price = row.price;
  const prodDiscount = faker.datatype.float({ min: 0, max: 0.7, precision: 0.01 });

  const insertPrice = _price;
  const insertDiscounted = prodDiscount;
  const _discountedPrice = insertPrice * (1 - insertDiscounted);

  const mediaData = JSON.parse(row['media.data']).map((x) => {
    if (x.type === 'img') x.type = 'image';
    else if (x.type === 'vid') x.type = 'video';

    return {
      path: x.path,
      type: x.type
    };
  });

  const priceRange = {
    min: _price,
    max: _price
  };

  const product = new Product({
    _id: new mongoose.Types.ObjectId(),
    name: row.name,
    description: row.description,
    shortDescription: '',
    price: _price,
    discount: prodDiscount,
    discountedPrice: _discountedPrice,
    stock: {
      quantity: 100,
      country: faker.random.arrayElement(Object.values(StockCountry))
    },
    parentCategories: {
      firstLevel: firstCategory != null ? firstCategory._id : null,
      secondLevel: secondCategory != null ? secondCategory._id : null
    },
    category: category != null ? category._id : faker.random.arrayElement(categoryIds),
    brand: faker.random.arrayElement(brandIds),
    vendor: mubaha._id,
    priceRange,
    media: {
      featuredImage: row['media.featuredImage'],
      data: mediaData
    },
    variantLabel: 'Màu Sắc',
    attributeLabel: 'Kích Cỡ',
    ratings: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    }
  });

  const customerAccounts = await Account.find({ type: accountTypeEnum.CUSTOMER }).select('_id');
  customerAccounts.forEach((c) => {
    const rating = faker.datatype.number({ min: 1, max: 5 });
    const review = new Review({
      content: faker.random.arrayElement(reviews),
      product: product._id,
      vendor: product.vendor,
      reviewer: c._id,
      rating: rating
    });
    insertReviews.push(review);
    Object.entries(product.ratings).forEach(([key]) => {
      if (key == rating) {
        product.ratings[key] += 1;
      }
    });
  });
  let totalRating = 0;
  let totalReview = 0;

  Object.entries(product.ratings).forEach(([key, value]) => {
    totalRating += key * value;
    totalReview += value;
  });

  const avgRating = totalRating / totalReview;
  product.avgRating = avgRating;
  product.totalReviews = totalReview

  await product.save();
  await Review.insertMany(insertReviews);
};

const migrateRealProducts = async () => {
  const array = [];
  fs.createReadStream(path.resolve(__dirname, './', 'products.csv'))
    .pipe(csv.parse({ headers: true }))
    .on('error', (error) => console.error(error))
    .on('data', (row) => array.push(row))
    .on('end', async (rowCount) => {
      try {
        await Product.deleteMany();
        await Review.deleteMany();
        await async.each(array, handleRealProduct);

        console.log(`✨ Created ${rowCount} products ✔`);

        // await migrateShipmentMethod();
        await launchCartSeed();
      } catch (err) {
        console.error(err);
        process.exit(-1);
      }
    });
};

const handleOldAccount = async (row) => {
  const account = new Account({
    profile: {
      fullName: row['profile.fullName'],
      email: row['profile.email']
    },
    phone: row.phone,
    password: row.password,
    type: accountTypeEnum.CUSTOMER,
    authentication: {
      isCreatedPassword: true,
      isPhoneVerified: true
    },
    username: row.username
  });
  await account.save();
};

const migrateMubahaAccounts = async () => {
  const array = [];
  fs.createReadStream(path.resolve(__dirname, './', 'accounts.csv'))
    .pipe(csv.parse({ headers: true }))
    .on('error', (error) => console.error(error))
    .on('data', (row) => array.push(row))
    .on('end', async (rowCount) => {
      try {
        await async.each(array, handleOldAccount);

        console.log(`✨ Created ${rowCount} accounts ✔`);
        process.exit(0);
      } catch (err) {
        console.error(err);
        process.exit(-1);
      }
    });
};

const migrateCategoriesFromCsv = async () => {
  const array = [];
  fs.createReadStream(path.resolve(__dirname, './', 'categories.csv'))
    .pipe(csv.parse({ headers: true }))
    .on('error', (error) => console.error(error))
    .on('data', (row) => array.push(row))
    .on('end', async (rowCount) => {
      try {
        await async.each(array, handleCategoryData);

        console.log(`✨  Updated ${rowCount} rows ✔`);

        await migrateShipmentMethod();
      } catch (err) {
        console.error(err);
        process.exit(-1);
      }
    });
};

const migrateCustomPageFromJson = async () => {
  try {
    await CustomPage.deleteMany({});
    const pages = await CustomPage.insertMany(customPage);

    console.log(`✨  Insert ${pages.length} page success`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(-1);
  }
};

const migrateShipmentMethod = async () => {
  try {
    await ShipmentMethod.deleteMany({});
    const shipment = await ShipmentMethod.create({
      name: 'TMP Express',
      type: shipmentMethodTypeEnum.EXPRESS
    });

    console.log(`✨  Insert ${shipment.name} method success`);

    await migratePaymentMethod();
    // process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(-1);
  }
};

const migratePaymentMethod = async () => {
  try {
    await PaymentMethod.deleteMany({});
    const payment = await PaymentMethod.insertMany([
      {
        name: 'Thanh toán khi nhận hàng',
        type: paymentMethodEnum.COD,
        isDefault: true
      },
      {
        name: 'Đặt cọc',
        type: paymentMethodEnum.DEPOSIT
      }
    ]);

    console.log(`✨  Insert ${payment.length} method success`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(-1);
  }
};

mongoose
  .connect(vars.mongo.uri, {
    keepAlive: 1
  })
  .then(() => {
    console.log('MongoDB connected...');

    console.log('[/] Waiting for migration begin...');
    setTimeout(() => {
      // launchProductsSeed();
      // migrateCategoriesFromCsv();
      launchCategoriesSeeds();
      // migrateMubahaAccounts();
      // migrateCustomPageFromJson();,
      // migrateShipmentMethod();
      // migratePaymentMethod();
      // migrateRealProducts();
    }, 3000);
  });
