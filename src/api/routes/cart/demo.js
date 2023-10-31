let crypto;
try {
  crypto = await import('crypto');
} catch (err) {
  console.log('crypto is not support');
}
let key = crypto.createHash('sha256').update(String('673q3We0s2d97C831105666rb9of970Ql4dDiQv3982')).digest('base64').substr(0, 32);
console.log(key)
