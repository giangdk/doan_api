# 

##I. Logins API

###1. Login with password
####Request
```
URL: /auth/login
METHOD: POST
```
####Body
```json
{
"phone": "0912345678",
"password" : "123456"
}
```
phone: required, is phone
password: required, is string
####Success Response
```json
"data": {
    "auth": true,
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMTA0NWFkYTU2YTdlNmE2MjgyY2Y4MiIsImlhdCI6MTY0NTg1MDA3OSwiZXhwIjoxNjc3Mzg2MDc5fQ.CjLbca5GFbrbZaSI9VL8AdQjP3DHP1dnpQJqj_DWG2k",
        "userId": "621045ada56a7e6a6282cf82",
        "account": {
            "profile": {
                "avatar": "https://via.placeholder.com/300x300.jpg?text=mubaha.com",
                "gender": "male"
            },
            "authentication": {
                "lock": false,
                "isChanged": false,
                "status": false,
                "isCreatedPassword": true,
                "isPhoneVerified": true
            },
            "_id": "621045ada56a7e6a6282cf82",
            "phone": "+84393333826",
            "type": "customer",
            "unreadNotifications": 0,
            "username": "Q4S4XMZWUY",
            "createdAt": "2022-02-19T01:19:41.958Z",
            "updatedAt": "2022-02-26T03:20:48.555Z"
        }
    },
    "status": 200,
    "message": "success",
    "errors": null
  
}
```
####Error Response
##### Invalid Password
```json
{
    "data": null,
    "status": 400,
    "message": "Mật khẩu không chính xác",
    "errors": null
}
```
##### Phone is not register
```json
{
    "data": null,
    "status": 400,
    "message": "Số điện thoại chưa được đăng ký",
    "errors": null
}
```

###2. Login with Otp
###2.1 Verify Phone
#### Request
```
URL: /auth/login-otp
METHOD: POST
```
#### Body 
```json
{
"phone": "0912345678"
}
```
phone: required , is phone
####Success Response
```json
{
    "data": null,
    "status": 200,
    "message": "Đã gửi OTP",
    "errors": null
}
```
####Error Response
```json
{
    "data": null,
    "status": 400,
    "message": "Số điện thoại chưa được đăng ký",
    "errors": null
}
```
###2.2 Verify code
Condition: Login otp is success response

####Request
```
URL: /auth/verify-login-otp
METHOD: POST 
```
#### Body
```json
{
    "phone" : "0912345678",
    "code": "1111"
}
```
phone: required , is phone
code: required , is string
###Success Response
```json
{
    "data": {
        "auth": true,
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMGE2NzViYzZkYzg5MmMyMDcxZTM4ZSIsImlhdCI6MTY0NTg1MDk1NywiZXhwIjoxNjc3Mzg2OTU3fQ.uTu5ceEpj4nh8dob9bHbRcJYlbZuatvSAv2zbfSpbwY",
        "userId": "620a675bc6dc892c2071e38e",
        "account": {
            "profile": {
                "avatar": "https://via.placeholder.com/300x300.jpg?text=mubaha.com",
                "gender": "male"
            },
            "authentication": {
                "lock": false,
                "isChanged": false,
                "status": false,
                "isCreatedPassword": true,
                "isPhoneVerified": true
            },
            "_id": "620a675bc6dc892c2071e38e",
            "phone": "+84365637223",
            "type": "customer",
            "unreadNotifications": 0,
            "username": "ZDD1NU6T2K",
            "createdAt": "2022-02-14T14:29:47.997Z",
            "updatedAt": "2022-02-14T14:29:52.175Z"
        }
    },
    "status": 200,
    "message": "success",
    "errors": null
}
```
####Error Response
```json
{
    "data": null,
    "status": 400,
    "message": "Mã không đúng",
    "errors": null
}
```
##II. Register
###1 Verify phone number
####Request
```
URL: /auth/register-otp
METHOD: POST 
```
####Body
```json
{
    "phone": "0912345678",
    "fullName": "John"
}
```
phone: required , is phone
fullName: required , is string
####Success Response
```json
{
    "data": null,
    "status": 200,
    "message": "Đã gửi OTP",
    "errors": null
}
```

####Error Response
```json
{
    "data": null,
    "status": 400,
    "message": "Số điện thoại đã tồn tại",
    "errors": null
}  
```
###2 Verify code
condition: Phone is verified
### Request
```
URL: /auth/verify-register-otp
METHOD: POST
```
#### Body
```json
{
    "phone": "0912345678",
    "code": "1111"
}
```
phone: required , is phone
code: required , is string
###Success Response
```json
{
    "data": {
        "auth": true,
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMGE2NzViYzZkYzg5MmMyMDcxZTM4ZSIsImlhdCI6MTY0NTg1MDk1NywiZXhwIjoxNjc3Mzg2OTU3fQ.uTu5ceEpj4nh8dob9bHbRcJYlbZuatvSAv2zbfSpbwY",
        "userId": "620a675bc6dc892c2071e38e",
        "account": {
            "profile": {
                "avatar": "https://via.placeholder.com/300x300.jpg?text=mubaha.com",
                "gender": "male"
            },
            "authentication": {
                "lock": false,
                "isChanged": false,
                "status": false,
                "isCreatedPassword": true,
                "isPhoneVerified": true
            },
            "_id": "620a675bc6dc892c2071e38e",
            "phone": "+84365637223",
            "type": "customer",
            "unreadNotifications": 0,
            "username": "ZDD1NU6T2K",
            "createdAt": "2022-02-14T14:29:47.997Z",
            "updatedAt": "2022-02-14T14:29:52.175Z"
        }
    },
    "status": 200,
    "message": "success",
    "errors": null
}
```
####Error Response
```json
{
    "data": null,
    "status": 400,
    "message": "Mã không đúng",
    "errors": null
}
```
##III. Create Password
Condition: account is not created password, authorize
####Request
```
URL: /auth/create-password
METHOD: POST
```
#### Body
```json
{"password": "password"}
```
password: required , is string
#### Response
```json
{
    "data": null,
    "status": 200,
    "message": "Tạo mật khẩu thành công",
    "errors": null
}
```
###IV. Recover Password
###1 Verify phone number
####Request
```
URL: /auth/recover-password
METHOD: POST 
```
####Body
```json
{
    "phone": "0912345678"
}
```
phone: required , is phone
####Success Response
```json
{
    "data": null,
    "status": 200,
    "message": "Đã gửi OTP",
    "errors": null
}
```

####Error Response
```json
{
    "data": null,
    "status": 400,
    "message": "Số điện thoại đã tồn tại",
    "errors": null
}  
```
###2 Verify code
condition: Phone is verified
### Request
```
URL: /auth/verify-otp-recover-password
METHOD: POST
```
#### Body
```json
{
    "phone": "0912345678",
    "code": "1111"
}
```
phone: required , is phone
code: required , is string
###Success Response
```json
{
    "data": {
        "auth": true,
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMGE2NzViYzZkYzg5MmMyMDcxZTM4ZSIsImlhdCI6MTY0NTg1MDk1NywiZXhwIjoxNjc3Mzg2OTU3fQ.uTu5ceEpj4nh8dob9bHbRcJYlbZuatvSAv2zbfSpbwY",
        "userId": "620a675bc6dc892c2071e38e",
        "account": {
            "profile": {
                "avatar": "https://via.placeholder.com/300x300.jpg?text=mubaha.com",
                "gender": "male"
            },
            "authentication": {
                "lock": false,
                "isChanged": false,
                "status": false,
                "isCreatedPassword": true,
                "isPhoneVerified": true
            },
            "_id": "620a675bc6dc892c2071e38e",
            "phone": "+84365637223",
            "type": "customer",
            "unreadNotifications": 0,
            "username": "ZDD1NU6T2K",
            "createdAt": "2022-02-14T14:29:47.997Z",
            "updatedAt": "2022-02-14T14:29:52.175Z"
        }
    },
    "status": 200,
    "message": "success",
    "errors": null
}
```
####Error Response
```json
{
    "data": null,
    "status": 400,
    "message": "Mã không đúng",
    "errors": null
}
```
###3. Update password
Condition: account is created password, authorize
####Request
```
URL: /auth/recover-password
METHOD: PUT
```
#### Body
```json
{"password": "password"}
```
password: required , is string
#### Response
```json
{
    "data": null,
    "status": 200,
    "message": "Cập nhật mật khẩu thành công",
    "errors": null
}
```





