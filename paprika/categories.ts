async function getCats() {
  try {
    const res = await fetch(
      "https://www.paprikaapp.com/api/v2/sync/categories",
      {
        headers: {
          Authorization: `Bearer ${import.meta.env.PAPRIKA_V2_TOKEN}`,
        },
      }
    );
    const data = await res.json();
    const cats = data.result as Array<any>;
    await Bun.write("./paprika/paprika_categories.json", JSON.stringify(cats));

    console.log({cats});
  } catch (error) {
    console.log({error});
  }
}
getCats();
