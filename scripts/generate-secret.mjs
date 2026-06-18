import { randomBytes } from "crypto";

console.log("Yeni SESSION_SECRET (Vercel'e yapıştırın):\n");
console.log(randomBytes(32).toString("hex"));
