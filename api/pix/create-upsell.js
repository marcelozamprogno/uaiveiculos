import createPixHandler from "../create-pix.js";

export default async function handler(req, res) {
  return createPixHandler(req, res);
}
