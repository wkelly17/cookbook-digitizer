import {$} from "bun";
import {readdir} from "node:fs/promises";
import {paprikaJsonExample, recipeSchema} from "./paprika-utils";
import * as v from "valibot";
import {getArgs} from "./utils";

const args = getArgs();
if (!args.in || !args.out) {
  process.exit("Need --in and --out");
}
const files = [...(await readdir(args.in))].sort((a, b) => {
  return Number(a) - Number(b);
});
const slice = files.slice(Number(args.start), Number(args.end));
for await (const file of slice) {
  console.log(`reading ${file}`);
  // These were nested when processed, so drop down one more level:
  const thatDirFiles = await readdir(`${args.in}/${file}`);

  // await enhance(thatDirFiles, file);
  // await openFilesInVsCode(thatDirFiles, file);
}

async function enhance(dir: string[], parentFolder: string) {
  const recipe = dir.find((f) => f == "recipe.json");
  if (!recipe) {
    return;
  }
  const fileName = `${args.in}/${parentFolder}/${recipe}`;
  const recipeJson = await Bun.file(fileName).json();

  // todo:
  // adjust categories or toher here if desired. bespoke logic for your paprika.

  // Insure no nulls:
  const newRecipe = {
    ...recipeJson,
    source: "The Mexican Home Kitchen",
  };
  Object.keys(newRecipe).forEach((key) => {
    newRecipe[key] = newRecipe[key] ?? "";
  });

  // Normlize ingredient fractiosn:
  Object.keys(newRecipe.ingredients).forEach((key) => {
    if (Array.isArray(newRecipe.ingredients[key])) {
      newRecipe.ingredients[key] = newRecipe.ingredients[key].map((i) => {
        return i.normalize("NFKD");
      });
    }
  });

  // Write it back out:
  await Bun.write(fileName, JSON.stringify(newRecipe, null, 2));
}

async function openFilesInVsCode(dir: string[], fileIdx: string) {
  const recipe = dir.find((f) => f.includes("recipe.json"));
  if (recipe) {
    await $`code -r ${args.out}/${fileIdx}/${recipe}`;
  }
}
