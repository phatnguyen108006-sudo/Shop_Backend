const validate = (schema, property = "body") => (req, res, next) => {
  try {
    const parsed = schema.parse(req[property]);
    req[property] = parsed;
    next();
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Dữ liệu không hợp lệ",
        details: error.errors,
      },
    });
  }
};

module.exports = { validate };