import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: false, // Allow client-side access for debugging
    secure: false, // Disable secure cookies for development
    sameSite: "lax", // Relax CSRF protection for debugging
  });

  return token;
};
