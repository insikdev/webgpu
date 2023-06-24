import fs from "node:fs/promises";

async function updateList() {
  const list = [];
  const pages = await fs.readdir("pages");

  for (const page of pages) {
    const html = await fs.readFile(`pages/${page}/index.html`, "utf-8");
    const title = html.match(/<h1>(.*?)<\/h1>/)[1];
    const el = " "
      .repeat(6)
      .concat(`<li><a href="pages/${page}/index.html">${title}</a></li>`);
    list.push(el);
  }

  const path = "index.html";
  const mainPage = await fs.readFile(path, "utf-8");
  const updatedHTML = mainPage.replace(
    /<ul>.*?<\/ul>/s,
    `<ul>
${list.join("\n")}
    </ul>`
  );

  await fs.writeFile(path, updatedHTML);
}

updateList();
