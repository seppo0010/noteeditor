import fetch from "node-fetch";
import TurndownService from "turndown";

const turndownService = new TurndownService();
const laws = {
  cn: {
    name: "Constitución Nacional",
    url:
      "http://servicios.infoleg.gob.ar/infolegInternet/anexos/0-4999/804/norma.htm",
    title: "CONSTITUCION DE LA NACION ARGENTINA",
  },
  ccyc: {
    name: "Código Civil y Comercial de la Nación",
    url:
      "http://servicios.infoleg.gob.ar/infolegInternet/anexos/235000-239999/235975/norma.htm",
  },
  cpa: {
    name: "Código Penal de la Nación Argentina",
    url:
      "http://servicios.infoleg.gob.ar/infolegInternet/anexos/15000-19999/16546/texact.htm",
    title: "CODIGO PENAL DE LA NACION ARGENTINA",
  },
};

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const textToArticles = async (law, html, { title, name }) => {
  let text = turndownService.turndown(html);
  if (title) {
    const match = text.match(new RegExp(`\n${escapeRegExp(title)}\n`, "ig"));
    if (!match) {
      console.log(text);
      throw new Error(`could not find ${title}`);
    }
    text = text.substring(match.index);
  }
  return Object.fromEntries(
    text
      .split(/\n[\*\_\s]+art[íi]culo/gi)
      .slice(1)
      .flatMap((article) => {
        const parts = article.match(
          /^\s*([0-9]+\s*(?:bis|ter|qu[aá]ter|quinquies)?)[_\.\*\\\-º\s]+([\s\S]*)$/
        );
        if (!parts) {
          return [];
        }
        let key = `${law}:${parts[1]}`;
        let value = parts[2]
          .split(/^[_\.\*\\\-\s]*[A-ZÁÉÍÓÚ]+[_\.\*\\\-\s]*$/m)[0]
          .trim();
        const res = [
          [
            key,
            {
              title: `${name} - Artículo ${parts[1]}`,
              text: value,
            },
          ],
        ];
        const incisos = value.split(
          /^(?:[_\.\*\\\-º\s]+)([0-9]+)(?:[_\.\*\\\-º\s]+)/im
        );
        if (incisos.length > 1) {
          for (let i = 1; i < incisos.length; i += 2) {
            res.push([
              `${key}.${incisos[i]}`,
              {
                title: `${name} - Artículo ${parts[1]} - Inciso ${incisos[i]}`,
                text: incisos[i + 1].trim(),
              },
            ]);
          }
        } else {
          const paragraphs = value
            .split("\n")
            .filter((v) => v.match(/[a-zA-Z]/));
          if (paragraphs.length > 1) {
            for (let i = 0; i < paragraphs.length; i++) {
              res.push([
                `${key}.${i + 1}`,
                {
                  title: `${name} - Artículo ${parts[1]} - Párrafo ${i + 1}`,
                  text: paragraphs[i].trim(),
                },
              ]);
            }
          }
        }
        return res;
      })
  );
};

Promise.all(
  Object.entries(laws).map(async ([law, params]) => {
    const req = await fetch(params.url);
    const text = new TextDecoder("windows-1252").decode(
      new Uint8Array(await req.arrayBuffer())
    );
    return await textToArticles(law, text, params);
  })
).then((data) => {
  console.log(
    JSON.stringify(data.reduce((prev, x) => Object.assign({}, prev, x), {}))
  );
});
