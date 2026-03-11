const API_URL = "https://data.sensor.community/airrohr/v1/sensor/53269/";
let lastTimestamp = null;

async function loadData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        if (!data.length) return;
        data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const latest = data[0];
        if (lastTimestamp && latest.timestamp !== lastTimestamp) {
            window.location.reload();
            return;
        }
        lastTimestamp = latest.timestamp;
        let p1Value = null;
        let p2Value = null;
        latest.sensordatavalues.forEach(item => {
            if (item.value_type === "P1") p1Value = parseFloat(item.value);
            if (item.value_type === "P2") p2Value = parseFloat(item.value);
        });
        const p1Element = document.getElementById("p1");
        const p2Element = document.getElementById("p2");
        p1Element.textContent = p1Value;
        p2Element.textContent = p2Value;
        p1Element.classList.remove("good", "bad");
        p2Element.classList.remove("good", "bad");
        if (p1Value > 50) {
            p1Element.classList.add("bad");
        } else {
            if (p1Value > 40) {
                p1Element.classList.add("soso");
            } else {
                p1Element.classList.add("good");
            }
        }
        if (p2Value > 25) {
            p2Element.classList.add("bad");
        } else {
            if (p1Value > 20) {
                p2Element.classList.add("soso");
            } else {
                p2Element.classList.add("good");
            }
        }
        const utcDate = new Date(latest.timestamp.replace(" ", "T") + "Z");
        const italianTime = utcDate.toLocaleString("it-IT", {
            timeZone: "Europe/Rome",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
        document.getElementById("timestamp").textContent =
            "Ultimo aggiornamento: " + italianTime;
    } catch (error) {
        console.error("Errore nel caricamento dati:", error);
    }
}

fetch('data.json')
    .then(response => response.json())
    .then(data => {
        const p1Value = data.avgP1;
        const p2Value = data.avgP2;
        const p1Element = document.getElementById('p1_i');
        const p2Element = document.getElementById('p2_i');
        p1Element.innerHTML = `${p1Value.toFixed(2)}`;
        p2Element.innerHTML = `${p2Value.toFixed(2)}`;
        if (p1Value > 50) {
            p1Element.classList.add("bad");
        } else if (p1Value > 40) {
            p1Element.classList.add("soso");
        } else {
            p1Element.classList.add("good");
        }
        if (p2Value > 25) {
            p2Element.classList.add("bad");
        } else if (p2Value > 20) {
            p2Element.classList.add("soso");
        } else {
            p2Element.classList.add("good");
        }
    });

const year = new Date().getFullYear();
fetch(`${year}/medie_giornaliere.csv`)
    .then(response => response.text())
    .then(text => {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',');
        const p1Index = headers.indexOf('avg_SDS_P1');
        const p2Index = headers.indexOf('avg_SDS_P2');
        let p1_d = 0;
        let p2_d = 0;
        let days = lines.length - 1;
        let sumP1 = 0;
        let validP1 = 0;
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',');
            const avgP1 = parseFloat(cols[p1Index]);
            const avgP2 = parseFloat(cols[p2Index]);
            if (!isNaN(avgP1) && avgP1 > 50) p1_d++;
            if (!isNaN(avgP2) && avgP2 > 25) p2_d++;
            if (!isNaN(avgP1)) { sumP1 += avgP1; validP1++; }
        }
        const meanP1 = validP1 ? (sumP1 / validP1).toFixed(2) : 'N/A';

        const p1Element_d = document.getElementById('p1_d');
        p1Element_d.textContent = `${p1_d} su ${days} giorni (${(p1_d/days*100).toFixed(0)}%)`;
        if (p1_d > 35) {
            p1Element_d.classList.add("bad");
        } else if (p1_d > 30) {
            p1Element_d.classList.add("soso");
        } else {
            p1Element_d.classList.add("good");
        }

        const p1Element_y = document.getElementById('p1_y');
        p1Element_y.textContent = meanP1;
        if (meanP1 > 24) {
            p1Element_y.classList.add("bad");
        } else if (meanP1 > 20) {
            p1Element_y.classList.add("soso");
        } else {
            p1Element_y.classList.add("good");
        }
        // document.getElementById('p2_d').textContent = `${p2_d} su ${days} giorni (${(p2_d/days*100).toFixed(0)}%)`;
    })
    .catch(error => console.error("Errore nel caricamento medie_giornaliere.csv:", error));

loadData();
setInterval(loadData, 60000);