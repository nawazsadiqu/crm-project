export const websiteDeveloperOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }

  if (req.user.role !== "websiteDeveloper") {
    return res.status(403).json({ message: "Website Developer access only" });
  }

  next();
};