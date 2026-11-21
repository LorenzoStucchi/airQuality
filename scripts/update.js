// Aggiorna i CSV giornalieri, le medie giornaliere e data.json.
//
// Uso:
//   node scripts/update.js                 -> elabora i giorni mancanti negli ultimi LOOKBACK_DAYS giorni (fino a ieri, UTC)
//   node scripts/update.js 2026-03-31 ...  -> (ri)elabora le date indicate
//
// Per ogni giorno usa il CSV locale se valido, altrimenti lo scarica da madavi
// (file giornaliero o, se già archiviato, dallo zip mensile). Se non trova dati
// validi non scrive nulla: il giorno verrà ritentato all'esecuzione successiva.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const SENSOR = 'esp8266-2960722';
const BASE_URL = 'https://api-rrd.madavi.de/data_csv';
const LOOKBACK_DAYS = 31;
const HEADER = 'date,avg_SDS_P1,avg_SDS_P2,samples';
const ROOT = path.resolve(__dirname, '..');

const csvName = (date) => `data-${SENSOR}-${date}.csv`;
const csvPath = (date) => path.join(ROOT, date.slice(0, 4), csvName(date));
const meanPath = (year) => path.join(ROOT, year, 'medie_giornaliere.csv');

function isValidCsv(text) {
    if (!text) return false;
    const header = text.split('\n', 1)[0].split(';');
    return header.includes('SDS_P1') && header.includes('SDS_P2');
}

async function fetchText(url) {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.text();
}

async function fetchFromMonthlyZip(date) {
    const [y, m] = date.split('-');
    const res = await fetch(`${BASE_URL}/${y}/${m}/data-${SENSOR}-${y}-${m}.zip`);
    if (!res.ok) return null;
    const tmp = path.join(os.tmpdir(), `airq-${y}-${m}-${process.pid}.zip`);
    fs.writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
    try {
        return execFileSync('unzip', ['-p', tmp, csvName(date)], { encoding: 'utf8' });
    } catch {
        return null;
    } finally {
        fs.unlinkSync(tmp);
    }
}

async function getDayCsv(date) {
    const local = csvPath(date);
    if (fs.existsSync(local)) {
        const text = fs.readFileSync(local, 'utf8');
        if (isValidCsv(text)) return text;
    }
    let text = await fetchText(`${BASE_URL}/csv-files/${date}/${csvName(date)}`);
    if (!isValidCsv(text)) text = await fetchFromMonthlyZip(date);
    if (!isValidCsv(text)) return null;
    fs.mkdirSync(path.dirname(local), { recursive: true });
    fs.writeFileSync(local, text);
    return text;
}

function average(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(';');
    const p1Index = headers.indexOf('SDS_P1');
    const p2Index = headers.indexOf('SDS_P2');
    let sumP1 = 0, sumP2 = 0, count = 0;
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(';');
        const p1 = parseFloat(cols[p1Index]);
        const p2 = parseFloat(cols[p2Index]);
        if (!isNaN(p1) && !isNaN(p2)) {
            sumP1 += p1;
            sumP2 += p2;
            count++;
        }
    }
    if (!count) return null;
    return { samples: count, avgP1: sumP1 / count, avgP2: sumP2 / count };
}

// Legge medie_giornaliere.csv come Map date -> riga (elimina automaticamente i duplicati)
function readMeans(year) {
    const rows = new Map();
    const file = meanPath(year);
    if (!fs.existsSync(file)) return rows;
    for (const line of fs.readFileSync(file, 'utf8').trim().split('\n').slice(1)) {
        if (line.trim()) rows.set(line.split(',')[0], line.trim());
    }
    return rows;
}

function writeMeans(year, rows) {
    const sorted = [...rows.keys()].sort().map((d) => rows.get(d));
    fs.writeFileSync(meanPath(year), [HEADER, ...sorted].join('\n') + '\n');
}

function hasValidRow(rows, date) {
    const row = rows.get(date);
    return row && Number(row.split(',')[3]) > 0;
}

function addDays(date, n) {
    const d = new Date(date + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
}

async function main() {
    const yesterday = addDays(new Date().toISOString().slice(0, 10), -1);
    let dates = process.argv.slice(2);
    if (!dates.length) {
        for (let i = LOOKBACK_DAYS - 1; i >= 0; i--) {
            const date = addDays(yesterday, -i);
            if (!hasValidRow(readMeans(date.slice(0, 4)), date)) dates.push(date);
        }
    }

    const results = {};
    for (const date of dates) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Data non valida: ${date}`);
        const text = await getDayCsv(date);
        const avg = text && average(text);
        if (!avg) {
            console.log(`${date}: dati non disponibili, salto`);
            continue;
        }
        const year = date.slice(0, 4);
        const rows = readMeans(year);
        rows.set(date, `${date},${avg.avgP1.toFixed(2)},${avg.avgP2.toFixed(2)},${avg.samples}`);
        writeMeans(year, rows);
        results[date] = avg;
        console.log(`${date}: P1=${avg.avgP1.toFixed(2)} P2=${avg.avgP2.toFixed(2)} (${avg.samples} campioni)`);
    }

    // data.json contiene la media del giorno più recente disponibile
    const dataJson = path.join(ROOT, 'data.json');
    const current = fs.existsSync(dataJson) ? JSON.parse(fs.readFileSync(dataJson, 'utf8')) : { date: '' };
    const latest = Object.keys(results).sort().pop();
    if (latest && latest >= current.date) {
        fs.writeFileSync(dataJson, JSON.stringify({ date: latest, ...results[latest] }, null, 2));
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
