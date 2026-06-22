const checkRole = (...allowedRoles) => {
  const roles =
    allowedRoles.length === 1 && Array.isArray(allowedRoles[0])
      ? allowedRoles[0]
      : allowedRoles;

  return (req, res, next) => {
    if (!req.userInfo) {
      return res.status(401).json({ message: "Unauthorized: No user found" });
    }
    if (!roles.includes(req.userInfo.role)) {
      return res.status(403).json({
        message: `Forbidden: Requires one of [${roles.join(", ")}] role`,
      });
    }
    next();
  };
};

module.exports = { checkRole };
