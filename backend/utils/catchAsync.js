// 📁 backend/utils/catchAsync.js
// Utility function to catch async errors and pass them to error handler

export default (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};