/**
 * A utility function to catch errors in async/await functions and pass them to Express error handling middleware
 * @param {Function} fn - The async function to wrap
 * @returns {Function} A new function that handles errors
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

export default catchAsync;
