import axios from 'axios';
import Fuse from 'fuse.js';
import vars from '../../config/vars.js';

function nonAccentVietnamese(string) {
  let str = string;
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  // Some system encode vietnamese combining accent as individual utf-8 characters
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ''); // Huyền sắc hỏi ngã nặng
  str = str.replace(/\u02C6|\u0306|\u031B/g, ''); // Â, Ê, Ă, Ơ, Ư
  return str;
}

const GetAddressFromLattlng = async (coords) => {
  try {
    const { lat, lng } = coords;
    const url = `https://rsapi.goong.io/Geocode?latlng=${lat},${lng}&api_key=${vars.goong}`;
    const response = await axios.get(url);

    return response.data.results[0].formatted_address;
  } catch (err) {
    console.error(err);
    return null;
  }
};

const GetGeoLattLngFromAddress = async (addr) => {
  try {
    let address = addr;
    address = nonAccentVietnamese(address);
    const url = `https://rsapi.goong.io/Geocode?address=${address}&api_key=${vars.goong}`;
    const response = await axios.get(url);

    return response.data.results[0].geometry.location;
  } catch (err) {
    console.error(err);
    return null;
  }
};

const GetFormattedAddressFromGeoLattLng = async (geometry) => {
  try {
    const response = await axios.get(
      `https://rsapi.goong.io/Geocode?latlng=${geometry.lat},${geometry.lng}&api_key=${vars.goong}`
    );
    let result = response.data.results[0].formatted_address;

    if (result) {
      const options = {
        keys: ['formatted_address']
      };

      const fuse = new Fuse(response.data.results, options);
      result = fuse.search(result)[0].item.formatted_address;
    }

    return result;
  } catch (err) {
    console.error(err);
    return null;
  }
};

const GetGeoLattLngAndFormatedAddress = async (addr) => {
  try {
    let address = addr;
    address = nonAccentVietnamese(address);
    const responseGeo = await axios.get(
      `https://rsapi.goong.io/Geocode?address=${address}&api_key=${vars.goong}`
    );

    const { lat, lng } = responseGeo.data.results[0].geometry.location;
    const response = await axios.get(
      `https://rsapi.goong.io/Geocode?latlng=${lat},${lng}&api_key=${vars.goong}`
    );
    let result = response.data.results[0].formatted_address;

    if (addr) {
      const options = {
        keys: ['formatted_address']
      };

      const fuse = new Fuse(response.data.results, options);
      result = fuse.search(addr)[0].item.formatted_address;
    }

    return {
      location: responseGeo.data.results[0].geometry.location,
      formatted_address: result
    };
  } catch (err) {
    console.error(err);
    return null;
  }
};

// GetGeoLattLngFromAddress('39D Hàng Chiếu, P, Hoàn Kiếm, Hà Nội 100000, Vietnam');
// GetAddressFromLattlng({ lat: 10.770531395583733, lng: 106.70442809728458 })

export {
  GetAddressFromLattlng,
  GetGeoLattLngFromAddress,
  GetGeoLattLngAndFormatedAddress,
  GetFormattedAddressFromGeoLattLng
};
