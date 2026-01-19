import { put } from "@vercel/blob";
import { z } from "zod";
import { authedProcedure } from "../procedures";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export const uploadRouter = {
  image: authedProcedure
    .input(
      z.object({
        file: z.instanceof(File),
      })
    )
    .handler(async ({ input, context }) => {
      const { file } = input;

      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error("Invalid file type. Allowed: JPEG, PNG, GIF, WebP");
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error("File too large. Maximum size is 5MB");
      }

      const ext = file.type.split("/")[1];
      const filename = `tokens/${context.user.id}/${crypto.randomUUID()}.${ext}`;

      const blob = await put(filename, file, {
        access: "public",
        contentType: file.type,
      });

      return { url: blob.url };
    }),
};
