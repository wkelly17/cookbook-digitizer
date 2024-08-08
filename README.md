# bunrecipereader-v2

To install dependencies:

```bash
bun install
```

## Running

There are 3 main scripts for this project. 

`bun run index.ts` - is the main script that reads a PDF and uses imagemagick to determine what each page of pdf is.  Recipes are assumed to all be in one pdf, and each recipe is separate by a *blank page* (i.e. imagemagick histogram produces 1 color). Just insert a blank page in your pdf software  between recipes.  From there, it will OCR the text images, and then send that text to gemini to get rid of cruft and try to shape it into a json schema appropriate for paprika. 

Next, 
`bun run review.ts` -> This script is intended to read all the generated files and give you a spot to write any bespoke logic. There are two functions. 
  A. Maybe you want to normalize and hardcode the source, or you want to normalize the ingredients. Maybe you never eat cabbage, and just want to always remove it if the ingredient contains it.  Maybe as a rule you always double the garlic. This is also a good spot to hard to write to hardwire any categories uids up (you can get your category ids with paprika/token.ts)
  B. Open in Vs code.  - This assumes vs code, but I open up the pdf I scanned on one side, and all the recipe.json files split on the other.  This is for taking some time to manually review and tweak anything before saving (especially the ingredients. I find OCR has a hard time with the fractions sometimes)

`bun run paprika/ingest.ts` - this reads paprika credentials from the .env files, and uploads them to your paprika account over api. 

## Deps:
This script shells out to several subprocesses. 
- Reading pdfs
  - Imagemagick - https://github.com/ImageMagick/ImageMagick.  Used to read pdfs by index page
- OCR 
  - For mac, it uses this simple wrapper around apple vision framework. https://github.com/insidegui/ocrit
  - For Everything else, it currently uses tesseract. 
- AI 
  - The gemini free tier right now is pretty good, so it uses a gemini api key for cleaning up the ocr text. 


  <!-- todo: link to ocrit and mentioned tesseract.  -->