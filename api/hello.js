// api/hello.js (Vercel Serverless Function)
export default function handler(req, res) {
  const name =
    (req.query && req.query.name) ||
    (req.body && req.body.name) ||
    "world";

  res.status(200).json({ message: `hello ${name}` });
}