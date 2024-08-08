import {v4 as uuidv4} from "uuid";
import {readdir, mkdir, unlink} from "node:fs/promises";
import {
  blankRecipe,
  recipePayloadSchema,
  recipeSchema,
  type Recipe,
} from "../paprika-utils";
import slugify from "@sindresorhus/slugify";
import {paprikaArgs} from "../utils";
import * as v from "valibot";
import {$} from "bun";

const args = paprikaArgs();
if (args.in) {
  process.exit("Need --in folder of recipes to send to paprika");
}
async function ingest() {
  const files = [...(await readdir(args.in!))].sort((a, b) => {
    return Number(a) - Number(b);
  });
  const slice = files.slice(Number(args.start), Number(args.end));
  console.log(`${slice.length} files to process`);
  for await (const [idx, file] of slice.entries()) {
    console.log(`---- DOING ${file}: ${idx} of ${slice.length} ----`);
    const thatDirFiles = await readdir(`${args.in}/${file}`);
    const thumb = thatDirFiles.find((f) => f.includes("thumb"));
    const recipeFile = thatDirFiles.find((f) => f.includes("recipe.json"));
    const recipeJson = await Bun.file(
      `${args.in}/${file}/${recipeFile}`
    ).json();
    const validated = v.parse(recipeSchema, recipeJson);
    const reshaped: Partial<Recipe> = Object.entries(validated).reduce(
      (acc: Partial<Recipe>, [key, value]) => {
        if (key === "directions") {
          acc[key] = validated[key].join("\n");
        } else if (key === "ingredients") {
          acc[key] = Object.entries(validated[key]).reduce(
            (acc, [key, value]) => {
              acc = `${acc} 
          ${key.toUpperCase() == "MAIN" ? "" : `\n**${key}**\n`}
          ${value
            .filter((v) => !!v)
            .map((v) => {
              return postFixIngredient(key, v);
            })
            .join("\n")}`;
              return acc;
            },
            ""
          );
        } else if (key === "notes") {
          acc[key] = validated[key].join("\n");
        } else {
          // @ts-ignore
          acc[key] = validated[key];
        }
        return acc;
      },
      {}
    );
    const recipePayload = {
      ...blankRecipe,
      ...reshaped,
      uid: uuidv4().toUpperCase(),
      created: new Date().toISOString().substring(0, 19).replace("T", " "),
      ingredients: reshaped.ingredients
        ?.trim()
        .split("\n")
        .map((l) => l.trim())
        .join("\n")!,
    };
    const validatedRecipePayload = v.parse(recipePayloadSchema, recipePayload);
    const posted = await postRecipe(recipePayload);
    if (thumb && posted) {
      const fileName = `./tmp/paprika-sq-thumb-${recipePayload.uid}.png`;
      await $`magick ${`${args.in}/${file}/${thumb}`} -gravity center -extent "%[fx:h<w?h:w]x%[fx:h<w?h:w]" ${fileName}`;
      const updated = await postPhoto({
        name: slugify(validatedRecipePayload.name),
        fileName,
        recipeUid: recipePayload.uid,
      });
      // console.log({updated});
      if (updated) {
        await updateThumbnail({
          recipe: recipePayload,
          photoLargeDesc: validatedRecipePayload.name,
          photoUrl: fileName,
        });
        await unlink(fileName);
      }
    }
    // RESUME IT HERE
  }
}

function postFixIngredient(header: string, ingredient: string) {
  const casing = header.toLowerCase();
  if (
    casing.includes("optional") &&
    casing.includes("garnish") &&
    !ingredient.includes("optional")
  ) {
    return `${ingredient} (g/o)`.trim();
  } else if (
    casing.includes("garnish") &&
    !casing.includes("optional") &&
    !ingredient.includes("garnish") &&
    !ingredient.includes("optional")
  ) {
    return `${ingredient} (garnish)`.trim();
  } else if (
    casing.includes("optional") &&
    !casing.includes("garnish") &&
    !ingredient.includes("optional")
  ) {
    return `${ingredient} (optional)`.trim();
  } else {
    return `${ingredient}`.trim();
  }
}

async function postRecipe(recipe: Recipe, existingFormData?: FormData) {
  // With your recipe in a multipart/form-data, in the a param called data:
  const hash = new Bun.CryptoHasher("sha256")
    .update(JSON.stringify(recipe))
    .digest()
    .toString("hex");
  recipe.hash = hash;
  const asGzip = Bun.gzipSync(JSON.stringify(recipe));
  // !important, the post will not work if their is not a fileName! It doesn't matter what it isn, but you can't just send a regular blob.
  const asFile = new File([asGzip], "data.gz");
  const formData = existingFormData || new FormData();
  formData.append("data", asFile);

  try {
    const res = await fetch(
      `https://www.paprikaapp.com/api/v2/sync/recipe/${recipe.uid}/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.PAPRIKA_V2_TOKEN}`,
        },
        body: formData,
      }
    );
    // console.log({res});
    if (res.ok) {
      const data = (await res.json()) as Recipe;
      console.log({data});
      return data;
    }
  } catch (error) {
    console.error(error);
    process.exit(JSON.stringify(error));
  }
}

type postPhotoArgs = {
  name: string;
  fileName: string;
  recipeUid: string;
};
async function postPhoto(args: postPhotoArgs) {
  const uid = uuidv4();
  const payload = {
    uid: uid,
    filename: args.fileName,
    name: args.name,
    order_flag: 1,
    recipe_uid: args.recipeUid,
    hash: "",
    photo_url: "",
    deleted: false,
  };
  const {hash, ...rest} = payload;
  const calculatedHash = new Bun.CryptoHasher("sha256")
    .update(JSON.stringify(rest))
    .digest()
    .toString("hex");
  payload.hash = calculatedHash;
  const payloadAsGzip = Bun.gzipSync(JSON.stringify(payload));
  const asFile = new File([payloadAsGzip], "data.gz");
  const formData = new FormData();
  formData.append("data", asFile);
  const photoBlob = Bun.file(args.fileName);
  formData.append("photo_upload", photoBlob);

  const res = await fetch(
    `https://www.paprikaapp.com/api/v2/sync/photo/${uid}/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${import.meta.env.PAPRIKA_V2_TOKEN}`,
      },
      body: formData,
    }
  );
  // console.log({photoRes: res});
  const body = (await res.json()) as Recipe;
  return body;
}

type updateThumbnailArgs = {
  recipe: Recipe;
  photoLargeDesc: string;
  photoUrl: string;
};
async function updateThumbnail({
  photoLargeDesc,
  photoUrl,
  recipe,
}: updateThumbnailArgs) {
  const copy = {...recipe};
  copy.photo_large = photoLargeDesc;
  copy.photo_url = photoUrl;
  copy.photo = uuidv4() + "." + photoUrl;
  copy.photo_hash = new Bun.CryptoHasher("sha256")
    .update(JSON.stringify(recipe))
    .digest()
    .toString("hex");
  const formData = new FormData();
  formData.append("photo_upload", Bun.file(photoUrl));
  await postRecipe(copy, formData);
}

await ingest();
