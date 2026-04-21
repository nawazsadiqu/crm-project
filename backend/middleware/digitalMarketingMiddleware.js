export const digitalMarketingOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }

  if (req.user.role !== "digitalMarketing") {
    return res.status(403).json({ message: "Digital Marketing access only" });
  }

  next();
};