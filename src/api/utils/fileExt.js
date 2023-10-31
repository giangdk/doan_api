const imageExts = ['jpg', 'png', 'jpeg'];

const videoExts = ['webm', 'mkv', 'flv', 'mp4', 'mpeg', 'mpg', 'avi', 'wmv', '3gpp', 'mov'];

const validFileTypeForPost = (fileType) => {
  if (!imageExts.includes(fileType) && !videoExts.includes(fileType)) return false;

  return true;
};

const validFileTypeForImage = (fileType) => {
  if (!imageExts.includes(fileType)) return false;
  return true;
};

const getContentTypeForFileType = (fileType) => {
  let contentType;
  if (imageExts.includes(fileType)) contentType = `image/${fileType}`;
  if (videoExts.includes(fileType)) contentType = `video/${fileType}`;
  return contentType;
};

export { validFileTypeForPost, getContentTypeForFileType, validFileTypeForImage };
