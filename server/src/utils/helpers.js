const { v4: uuidv4 } = require('uuid');

function generateUUID() {
  return uuidv4();
}

function generateOrderNo() {
  const now = new Date();
  const dateStr = now.getFullYear().toString()
    + String(now.getMonth() + 1).padStart(2, '0')
    + String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${dateStr}${random}`;
}

function successResponse(data, message = 'success') {
  return {
    code: 200,
    message,
    data,
  };
}

function errorResponse(code, message, error = null) {
  const response = {
    code,
    message,
  };
  if (error) {
    response.error = error;
  }
  return response;
}

function paginate(page = 1, pageSize = 20) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const ps = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
  return {
    page: p,
    pageSize: ps,
    offset: (p - 1) * ps,
  };
}

function paginationResponse(page, pageSize, total) {
  return {
    page,
    page_size: pageSize,
    total,
    total_pages: Math.ceil(total / pageSize),
  };
}

module.exports = {
  generateUUID,
  generateOrderNo,
  successResponse,
  errorResponse,
  paginate,
  paginationResponse,
};
