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
            console.log("Nuovo dato rilevato, ricarico pagina...");
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
            p1Element.classList.add("good");
        }

        if (p2Value > 25) {
            p2Element.classList.add("bad");
        } else {
            p2Element.classList.add("good");
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

loadData();

setInterval(loadData, 60000);