# Vendor Detail Api

* Sử dụng để lấy dữ liệu trang vendor

**URL**: `/web/vendor/:username`

**Method**: `GET`

**Auth required** : NO

**Param required** : username

## Success Response

**Code** : `200 OK`

**Content example**

```json
{
    "data": {
        "vendorProfile": {
            "socialLinks": {
                "facebook": "https://www.facebook.com/mia.la.1257",
                "youtube": "https://www.youtube.com/channel/UCPXeoTnDKOGPk9rwBTEtj9A",
                "tiktok": "https://www.tiktok.com/tag/lamia?lang=vi-VN",
                "instagram": "https://www.instagram.com/accounts/login/"
            },
            "_id": "6215127dd754461047189032",
            "details": "Lamia thay lời muốn nói của các cô nàng bằng bản tuyên ngôn thời trang nữ quyền cá tính. Thấu hiểu được vai trò của người phụ nữ trong xã hội hiện đại.",
            "owner": "6215127dd75446104718902e",
            "cover": "https://mubaha.hn.ss.bfcplatform.vn/data/store.jpeg",
            "active": true,
            "brandName": "Lumia Store",
            "gallery": [],
            "createdAt": "2022-02-22T16:42:37.688Z",
            "updatedAt": "2022-02-22T16:42:37.688Z"
        },
        "products": {
            "docs": [
                {
                    "stock": {
                        "quantity": 1,
                        "status": "available",
                        "country": "VN"
                    },
                    "media": {
                        "featuredImage": "https://salt.tikicdn.com/cache/400x400/ts/product/a5/31/4b/a6b50b155bff50437c6fe03ee9036b5f.jpg.webp",
                        "data": [
                            {
                                "path": "https://salt.tikicdn.com/cache/400x400/ts/product/6c/37/92/dbf0041e5c8333babad2f0a431a42004.png.webp",
                                "type": "image",
                                "_id": "6215127ed754461047189038"
                            },
                            {
                                "path": "https://salt.tikicdn.com/cache/400x400/ts/product/da/0c/18/0299d7752d97b2be9d3dadae6ff6286f.png.webp",
                                "type": "image",
                                "_id": "6215127ed754461047189039"
                            }
                        ]
                    },
                    "shortDescription": "",
                    "_id": "6215127ed75446104718903a",
                    "name": "Ergonomic Concrete Keyboard",
                    "price": 757021,
                    "currencySymbol": "₫",
                    "discount": 0.14,
                    "vendor": "6215127dd754461047189032",
                    "category": "6215127cd754461047188aa1",
                    "brand": "620cb2368c6baffdb1c2be4f",
                    "description": "The Apollotech B340 is an affordable wireless mouse with reliable connectivity, 12 months battery life and modern design",
                    "isDeleted": false,
                    "variants": [],
                    "slug": "Ergonomic-Concrete-Keyboard-X0MDPv",
                    "link": "/products/Ergonomic-Concrete-Keyboard-X0MDPv",
                    "createdAt": "2022-02-22T16:42:41.083Z",
                    "updatedAt": "2022-02-22T16:42:41.083Z"
                },
            ]
        }
    }
}
```

## Error Response

**Condition** : Nếu username sai.

**Code** : `404`

**Message**: `UserNotFound`

**Content** :

```json
{
    "data": null,
    "status": 404,
    "message": "UserNotFound",
    "errors": null
}
```

`Nếu vendor sai`

**Code**: `404`

**Message**: `VendorNotFound`

**Content** :

```json
{
    "data": null,
    "status": 404,
    "message": "VendorNotFound",
    "errors": null
}
```

# Created Product Api

Sử dụng để tạo dữ liệu Product

**URL**: `/web/vendor/:username`

**Method**: `GET`

**Auth required** : NO

**Param required** : username

## Success Response

**Code** : `200 OK`

**Content example**