import {parseArgs} from "util";
import {$} from "bun";
import {readdir, mkdir, unlink} from "node:fs/promises";
import {paprikaJsonExample, recipeSchema} from "./paprika-utils";
import {GoogleGenerativeAI} from "@google/generative-ai";

//  ------- check args -----
const {values} = parseArgs({
  args: Bun.argv,
  options: {
    in: {
      type: "string",
      short: "i",
    },
    out: {
      type: "string",
      short: "o",
    },
    start: {
      type: "string",
      default: "0",
      short: "s",
    },
    end: {
      type: "string",
      default: "10000",
      short: "e",
    },
  },
  strict: true,
  allowPositionals: true,
});
if (!values.in || !values.out) {
  process.exit("Need --in and --out");
}

const inFile = Bun.file(values.in);
const inExists = await inFile.exists();
if (!inExists) {
  process.exit(`File ${values.in} does not exist`);
}
if (!import.meta.env.GEMINI_API_KEY) {
  process.exit("Need GEMINI_API_KEY");
}

//  ------- check args -----

//  ---- set up some globals -----
await mkdir(values.out, {recursive: true});
const PDF_PAGE_COUNT =
  await $`pdfinfo ${values.in} | grep 'Pages:' | awk '{print $2}'`.text();
const foodColorsThreshold = Number(
  import.meta.env.FOOD_IMG_NUM_COLORS_THREHOLD ?? 90_000
);
const pdfPageImgType: string[] = [];
const blankIndiciesList: number[] = [];
const genAI = new GoogleGenerativeAI(import.meta.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: import.meta.env.GEMINI_MODEL ?? "models/gemini-1.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
  },
});
// ----- set up some globals -----

// --- run the loop ---
const loopSize = Math.min(
  Number(values.end) - Number(values.start),
  Number(PDF_PAGE_COUNT)
);
// First, figure out kind of every page (blank | text | image)
for (let i = 0; i < loopSize; i++) {
  // mutates globals above;
  await determinePageTypes(i);
}
const recipes = getRecipeBatches();
for await (const [loopIdx, recipe] of recipes.entries()) {
  const ocrText = await processRecipe(loopIdx, recipe);
  const asJson = await cleanUpWithML(ocrText, loopIdx);
  if (asJson) {
    const file = Bun.file(`${values.out}/${loopIdx}/recipe.json`);
    await Bun.write(file, asJson);
  }
}
// --- run the loop---

async function determinePageTypes(i: number) {
  const uniqueColors =
    await $`identify -verbose -unique "./${values.in}[${i}]" | grep -Eo "Colors:\s*[0-9]+" | grep -Eo "[0-9]+"`.text();
  const numUniqueColors = Number(uniqueColors);
  let type = "text";
  if (numUniqueColors == 1) {
    type = "blank";
  } else if (numUniqueColors > foodColorsThreshold) {
    type = "food";
  }
  pdfPageImgType.push(type);
  if (type == "blank") {
    blankIndiciesList.push(i);
  }
}

function getRecipeBatches() {
  let batches = [];
  let lastIndex = 0;

  const arrLenOfPdf = Array.from(
    {
      // length: 13,
      length: Number(PDF_PAGE_COUNT),
    },
    (v, i) => i
  );
  for (const i of blankIndiciesList) {
    // slice: inclusive first, exclusive last
    batches.push(arrLenOfPdf.slice(lastIndex, i));
    lastIndex = i + 1;
  }
  // Last one
  batches.push(arrLenOfPdf.slice(lastIndex));
  return batches;
}

async function processRecipe(loopIdx: number, recipe: number[]) {
  // --- the image ---
  console.log(`Recipe ${loopIdx}: `);
  await mkdir(`${values.out}/${loopIdx}`, {recursive: true});
  const foodPdfIdx = recipe.find((pdfIdx) => pdfPageImgType[pdfIdx] == "food");
  if (foodPdfIdx !== undefined) {
    const imgFileName = `${values.out}/${loopIdx}/thumb.png`;
    console.log(`writing ${imgFileName}`);
    await $`magick "${values.in}[${foodPdfIdx}]" ${imgFileName}`;
  }
  // --- the image ---

  // --- the text ---
  const textFiles = recipe.filter((pdfIdx) => pdfPageImgType[pdfIdx] == "text");
  let ocrText = ``;
  for await (const [recipeIdx, pdfIdx] of textFiles.entries()) {
    const fileNameIn = `${values.in}[${pdfIdx}]`;
    await $`magick ${fileNameIn} ./tmp${pdfIdx}.png`;
    // todo: ocrit or tesseract depending on platoform.
    let text = "";
    if (process.platform === "darwin") {
      text = await $`tesseract ./tmp/${pdfIdx}.png - --psm 1`.text();
    } else {
      text = await $`ocrit "./tmp/${pdfIdx}.png"`.text();
    }
    const replace = text.replace(`${pdfIdx}.png:\n`, ``);
    ocrText += `Page ${recipeIdx + 1}:
    ${replace}
    \n`;
    unlink(`./tmp/${pdfIdx}.png`);
  }
  const file = Bun.file(`${values.out}/${loopIdx}/recipe.txt`);
  await Bun.write(file, ocrText);
  return ocrText;
  // --- the text ---
}

async function cleanUpWithML(ocrText: string, loopIdx: number) {
  console.log(`Sending to ML ${loopIdx}`);
  try {
    const gemResult = await model.generateContent(prompt(ocrText));
    const gemJson = gemResult.response.text();
    return gemJson;
  } catch (error) {
    console.log(`Error with ${loopIdx}`);
    console.error(error);
  }
}

function prompt(ocrText: string) {
  return `
    I will provide you with some text extracted from an OCR image. Your task is to format this text into a structured JSON according to the given example below. Any null values in the provided JSON example should be retained as null if the OCR text does not provide corresponding information. Do not retain the \n new line separator from the ocr text in your json. Here is the JSON example for reference:  
    Here is a full example: 
    ${JSON.stringify(paprikaJsonExample)}

Cookbook-Specific Directions:
Name: The title is usually the second line (the English translation of the first line, which is in Spanish). Extract only the English title.

Description: This follows the English title and is the entire block of following text.

prep time, cook time, and servings follow the description. 

Ingredients: These are usually on the left side of the page. There may be additional subheadings mixed into the ingredients in ALL UPPERCASE. More ingredients always follow UPPERCASE LETTERS of subheadings.   There may be some ingredients in the second page as well. Ingredients on both pages are not numbered Make sure Ingredients in the json should be an objects of objects, in which the ALL UPPERCASE ingredient seciont is the key of the object. If there is no ALL uppercase section, then it should the ingredient should fall under the default ingredient section called "main".  For the amounts, normalize any unicode fractions to their long format, i.e. 1⁄2 to 1/2.

Directions: These are usually in one column on the right and are marked by being numbered;  Retain the numbers in your json for the directions. 

Categories: This is just above the page number. For now, make it an array of one item like the example. 
Notes: These are marked in a block called "notas." and go under the "notes" keyOCR text reads in a single row usually, so be aware some things may be out of order. It is your job to straighten it out.

Page Number: This is usually at the bottom of the page. Also, add the page number as the first note in the notes sections as "Page X"

Before you finish, double check that your output is complete valid json according to the schema given and that no keys are missing, and no extray keys have been created. 

OCR Text:
${ocrText}
  `;
}
