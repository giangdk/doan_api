#CUSTOMER APIs
##I. Apply Vendor
###Request
```
{
  METHOD: POST
  URL: /web/customer/apply
}
```
###Body
```json
{
    "brandName": "Mang Shop",
    "phone": "0393333826",
    "fullName": "Nguyen Ba Mang",
    "detailAddress": "số 9, ngõ 3",
    "provinceCode": "01",
    "districtCode": "001",
    "wardCode": "31",
    "fullAddress" : "fullAdd"
}
```
brandName: required, than 10 characters and less 30 characters,
phone, fullName, detailAddress, provinceCode, districtCode, wardCode: required, is string
###Success Response
```json
{
    "data": null,
    "status": 200,
    "message": "Tạo kênh bán hàng thành công",
    "errors": null
}
```
###Error Response
```json
{
    "data": null,
    "status": 400,
    "message": "Tên shop không hợp lệ. Tối thiểu 10 ký tự và tối đa 30 ký tự",
    "errors": null
}
```
or
```json
{
    "data": null,
    "status": 400,
    "message": "Tạo kênh bán hàng thành công",
    "errors": null
}
```