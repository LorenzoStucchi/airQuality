const API_URL = "https://data.sensor.community/airrohr/v1/sensor/53269/";

let lastTimestamp = null;

async function loadData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (!data.length) return;

        // Ordina per timestamp (più recente prima)
        data.sort((a, b) =>
            new Date(b.timestamp) - new Date(a.timestamp)
        );

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

        // Reset classi
        p1Element.classList.remove("good", "bad");
        p2Element.classList.remove("good", "bad");

        // Regole colore
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
  })

loadData();

setInterval(loadData, 60000);