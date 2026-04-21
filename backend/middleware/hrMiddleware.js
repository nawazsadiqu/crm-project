export const hrOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }

  if (req.user.role !== "hr") {
    return res.status(403).json({ message: "HR access only" });
  }

  next();
};