# User APIs

## I. Payment method

### Create Request

```json
{
  "METHOD": "POST",
  "URL": "/payment"
}
```

#### Body

```json
{
  "cardNumber": "string",
  "cardName": "sttring",
  "expirationDate": "12/20",
  "cardCode": "string",
  "type": "visa",
  "isDefault": true
}
```

**Requirement**

- type: String | enum: visa, credit_card, atm

### Success Response

```json
{
  "data": {
    "cardNumber": "string",
    "cardName": "sttring",
    "expirationDate": "12/20",
    "cardCode": "string",
    "type": "visa",
    "isDefault": true,
    "isDeleted": false,
    "owner": "623d36e4a2f173cec33bde73",
    "_id": "6243dd4110785366ae9bca38",
    "createdAt": "2022-03-30T04:32:01.024Z",
    "updatedAt": "2022-03-30T04:32:01.024Z"
  },
  "status": 200,
  "message": "Tạo phương thức thanh toán thành công",
  "errors": null
}
```

### Update

```json
{
  "METHOD": "PUT",
  "URL": "/payment/:id"
}
```

#### param

**id**: `6243d00c4514ebd994902f13`

#### Body

```json
{
  "cardNumber": "string",
  "cardName": "sttring",
  "expirationDate": "12/20",
  "cardCode": "string",
  "type": "visa",
  "isDefault": true
}
```

**Requirement**

- param: mongoId

### Success Response

```json
{
  "data": {
    "cardNumber": "string",
    "cardName": "sttring",
    "expirationDate": "12/20",
    "cardCode": "string",
    "type": "visa",
    "isDefault": true,
    "isDeleted": false,
    "owner": "623d36e4a2f173cec33bde73",
    "_id": "6243dd4110785366ae9bca38",
    "createdAt": "2022-03-30T04:32:01.024Z",
    "updatedAt": "2022-03-30T04:32:01.024Z"
  },
  "status": 200,
  "message": "Sửa phương thức thanh toán thành công",
  "errors": null
}
```

### Delete

```json
{
  "METHOD": "DELETE",
  "URL": "/payment/:id"
}
```

#### param

**id**: `6243d00c4514ebd994902f13`

**Requirement**

- param: mongoId

### Success Response

```json
{
  "data": null,
  "status": 200,
  "message": "Xóa phương thức thanh toán thành công",
  "errors": null
}
```

### Error Response

```json
{
  "data": null,
  "status": 400,
  "message": "Phương thức thanh toán không tồn tại",
  "errors": null
}
```

### Set Default

```json
{
  "METHOD": "PUT",
  "URL": "/payment/default/:id"
}
```

#### param

**id**: `6243d00c4514ebd994902f13`

**Requirement**

- param: mongoId

### Success Response

```json
{
  "data": {
    "_id": "6243c8db7b6678d33a727e3d",
    "cardNumber": "string",
    "cardName": "sttring",
    "expirationDate": "Sat Dec 22 2001 00:00:00 GMT+0700 (Indochina Time)",
    "cardCode": "string",
    "type": "visa",
    "isDefault": true,
    "isDeleted": false,
    "owner": "623d36e4a2f173cec33bde73",
    "createdAt": "2022-03-30T03:04:59.564Z",
    "updatedAt": "2022-03-30T07:25:40.303Z"
  },
  "status": 200,
  "message": "Cài đặt phương thức thanh toán mặc định thành công",
  "errors": null
}
```

### GET DETAIL

```json
{
  "METHOD": "GET",
  "URL": "/payment/:id"
}
```

#### param

**id**: `6243d00c4514ebd994902f13`

**Requirement**

- param: mongoId

### Success Response

```json
{
  "data": {
    "_id": "6243c8397b6678d33a727e37",
    "cardNumber": "string",
    "cardName": "sttring",
    "expirationDate": "12/20",
    "cardCode": "string",
    "type": "visa",
    "isDefault": false,
    "isDeleted": false,
    "createdAt": "2022-03-30T03:02:17.850Z",
    "updatedAt": "2022-03-30T07:22:35.608Z"
  },
  "status": 200,
  "message": "success",
  "errors": null
}
```

### GET LIST

```json
{
  "METHOD": "GET",
  "URL": "/payment"
}
```

#### param

### Success Response

```json
{
  "data": [
    {
      "_id": "6243dd4110785366ae9bca38",
      "cardNumber": "string",
      "cardName": "sttring",
      "expirationDate": "12/20",
      "cardCode": "string",
      "type": "visa",
      "isDefault": false,
      "isDeleted": false,
      "createdAt": "2022-03-30T04:32:01.024Z",
      "updatedAt": "2022-03-30T06:51:55.026Z"
    },
    {
      "_id": "6243d00c4514ebd994902f13",
      "cardNumber": "string",
      "cardName": "sttring",
      "expirationDate": "12/20",
      "cardCode": "string",
      "type": "visa",
      "isDefault": false,
      "isDeleted": false,
      "createdAt": "2022-03-30T03:35:40.165Z",
      "updatedAt": "2022-03-30T07:25:40.281Z"
    },
    {
      "_id": "6243cf32dc2402c88b43aa9a",
      "cardNumber": "string",
      "cardName": "sttring",
      "expirationDate": "12/20",
      "cardCode": "string",
      "type": "visa",
      "isDefault": false,
      "isDeleted": false,
      "createdAt": "2022-03-30T03:32:02.577Z",
      "updatedAt": "2022-03-30T03:32:09.460Z"
    },
    {
      "_id": "6243c9a17b6678d33a727e45",
      "cardNumber": "string",
      "cardName": "sttring",
      "expirationDate": "Thu Dec 20 2001 00:00:00 GMT+0700 (Indochina Time)",
      "cardCode": "string",
      "type": "visa",
      "isDefault": false,
      "isDeleted": false,
      "createdAt": "2022-03-30T03:08:17.874Z",
      "updatedAt": "2022-03-30T03:10:42.774Z"
    },
    {
      "_id": "6243c8db7b6678d33a727e3d",
      "cardNumber": "string",
      "cardName": "sttring",
      "expirationDate": "Sat Dec 22 2001 00:00:00 GMT+0700 (Indochina Time)",
      "cardCode": "string",
      "type": "visa",
      "isDefault": true,
      "isDeleted": false,
      "createdAt": "2022-03-30T03:04:59.564Z",
      "updatedAt": "2022-03-30T07:27:04.494Z"
    },
    {
      "_id": "6243c8397b6678d33a727e37",
      "cardNumber": "string",
      "cardName": "sttring",
      "expirationDate": "12/20",
      "cardCode": "string",
      "type": "visa",
      "isDefault": false,
      "isDeleted": false,
      "createdAt": "2022-03-30T03:02:17.850Z",
      "updatedAt": "2022-03-30T07:22:35.608Z"
    }
  ],
  "status": 200,
  "message": "success",
  "errors": null
}
```

### GET LISTING ORDER

```json
{
  "METHOD": "GET",
  "URL": "/order/listing"
}
```

#### query params

**page**: `1`
**limit**: `10`
**status** || **enum** :

| status          | translate         |
| --------------- | :---------------- |
| pending         | Đơn chờ xác nhận  |
| done            | Đã giao           |
| confirm         | Đã xác nhận       |
| shipping        | Đang giao         |
| shipmentPending | Đang đợi lấy hàng |
| cancel          | Đã hủy            |
| export          | Đã xuất kho       |
| Tất cả          |                   |

**text**: `String`
