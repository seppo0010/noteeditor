import fetch from 'node-fetch';
import TurndownService from 'turndown';

const turndownService = new TurndownService()
const laws = {
  'cn': {
    url: 'http://servicios.infoleg.gob.ar/infolegInternet/anexos/0-4999/804/norma.htm',
    title: 'CONSTITUCION DE LA NACION ARGENTINA',
  },
  'ccyc': {
    url: 'http://servicios.infoleg.gob.ar/infolegInternet/anexos/235000-239999/235975/norma.htm',
  },
  'cpa': {
    url: 'http://servicios.infoleg.gob.ar/infolegInternet/anexos/15000-19999/16546/texact.htm',
    title: 'CODIGO PENAL DE LA NACION ARGENTINA',
  },
};

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const textToArticles = async (law, html, { title }) => {
  let text = turndownService.turndown(html);
  if (title) {
    const match = text.match(new RegExp(`\n${escapeRegExp(title)}\n`, 'ig'));
    if (!match) {
      console.log(text);
      throw new Error(`could not find ${title}`);
    }
    text = text.substring(match.index);
  }
  return Object.fromEntries(text.split(/\n[\*\_\s]+art[íi]culo/ig).slice(1).map((article) => {
    const parts = article.match(/^\s*([0-9]+\s*(?:bis|ter|qu[aá]ter|quinquies)?)[_\.\*\\\-º\s]+([\s\S]*)/)
    if (!parts) {
      return;
    }
    let key = `${law}:${parts[1]}`;
    let value = parts[2].trim();
    // TODO: stop on titles
    // TODO: break into incisos/párrafos
    return [key, value];
  }).filter((x) => !!x));
};

Promise.all(Object.entries(laws).map(async ([law, params]) => {
  const req = await fetch(params.url);
  const text = new TextDecoder("windows-1252").decode(new Uint8Array(await req.arrayBuffer()));
  return await textToArticles(law, text, params)
})).then((data) => {
  console.log(JSON.stringify(data.reduce((prev, x) => Object.assign({}, prev, x), {})));
});
