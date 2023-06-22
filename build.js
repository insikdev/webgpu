import fs from "node:fs/promises";

async function build() {
  const list = [];
  const pages = await fs.readdir("src/pages");

  for (const page of pages) {
    if (page.endsWith(".html")) {
      continue;
    }

    const html = await fs.readFile(`src/pages/${page}/index.html`, "utf-8");
    const title = html.match(/<h1>(.*?)<\/h1>/)[1];
    const el = `<li><a href="${page}/index.html">${title}</a></li>`;
    list.push(el);
  }

  const path = "src/pages/index.html";
  const mainPage = await fs.readFile(path, "utf-8");
  const updatedHTML = mainPage.replace(
    /<ul>.*?<\/ul>/s,
    `<ul>${list.join("")}</ul>`
  );

  await fs.writeFile(path, updatedHTML);
}

build();
