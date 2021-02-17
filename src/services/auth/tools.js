const jwt = require("jsonwebtoken");
const User = require("../users/schema");

const authenticate = async user => {
  try {
    const newAccessToken = await generateJWT({ _id: user._id });
    //generate refresh token at same time
    const newRefreshToken = await generateRefreshJWT({ _id: user._id });

    //save new refresh token in the db (access token is not needed)
    user.refreshTokens = user.refreshTokens.concat({ token: newRefreshToken });
    await user.save();

    return { token: newAccessToken, refreshToken: newRefreshToken };
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

const generateJWT = payload =>
  new Promise((res, rej) =>
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1 week" },
      (err, token) => {
        if (err) rej(err);
        res(token);
      }
    )
  );

const verifyJWT = token =>
  new Promise((res, rej) =>
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) rej(err);
      res(decoded);
    })
  );

const generateRefreshJWT = payload =>
  new Promise((res, rej) =>
    jwt.sign(
      payload,
      process.env.REFRESH_JWT_SECRET,
      { expiresIn: "1 week" },
      (err, token) => {
        if (err) rej(err);
        res(token);
      }
    )
  );

const verifyRefreshToken = token =>
  new Promise((res, rej) =>
    jwt.verify(token, process.env.REFRESH_JWT_SECRET, (err, decoded) => {
      if (err) rej(err);
      res(decoded);
    })
  );

const refreshToken = async oldRefreshToken => {
  //verify old refresh token
  const decoded = await verifyRefreshToken(oldRefreshToken);

  //check is old efresh toeken is in db
  const user = await User.findOne({ _id: decoded._id });

  if (!user) {
    throw new Error(`Access is forbidden`);
  }

  //is the refresh token valid?
  const currentRefreshToken = user.refreshTokens.find(
    t => t.token === oldRefreshToken
  );

  if (!currentRefreshToken) {
    throw new Error(`Refresh token is wrong`);
  }
  //if everything is ok, create new access and refresh
  const newAccessToken = await generateJWT({ _id: user._id });
  const newRefreshToken = await generateRefreshJWT({ _id: user._id });

  //since we are dealing with a database, replace old refresh token with new one
  const newRefreshTokens = user.refreshTokens
    .filter(t => t.token !== oldRefreshToken)
    .concat({ token: newRefreshToken });

  user.refreshTokens = [...newRefreshTokens];
  //and save to the db
  await user.save();

  return { token: newAccessToken, refreshToken: newRefreshToken };
};

module.exports = { authenticate, verifyJWT, refreshToken };
